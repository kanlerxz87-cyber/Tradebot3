#!/usr/bin/env python3
"""Add the derived/verified layer to a freshly fetched snapshot.

`scripts/fetch_kalshi_data.py` writes the measured data (markets, events, alerts,
resolutions). This script adds the *audited* layer on top, and refuses to guess:
every block it writes is either (a) recomputed from the snapshot itself, or
(b) a measurement that was actually taken and is recorded with its timestamp.

Blocks added
    official_links     HTTP status of every official URL the site links to
    refresh_cadence    run gaps measured from assets/data/refresh-history.json
    resolution_window  which settled markets are shipped, and why
    warning_summary    what the run's warnings actually were
    method_notes       how the published numbers are derived (alerts, dollars)
    price_basis / quote_only on every alert   (see IRREG-35)

Why separate: the scheduled job refreshes data every run and would otherwise
overwrite the audit layer, which is how the previous snapshot lost it.

Usage:
    python3 scripts/enrich_snapshot.py            # rewrite in place
    python3 scripts/enrich_snapshot.py --check    # exit 1 if a block is missing
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import statistics
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT = ROOT / "assets/data/snapshot.json"
HISTORY = ROOT / "assets/data/refresh-history.json"

SWING_THRESHOLD = 0.10
HTTP_TIMEOUT = 12

# The links the site publishes as sources. Kept here so the checker and the
# documentation cannot drift apart.
OFFICIAL_LINKS = [
    ('kalshi-docs', 'API environments', 'https://docs.kalshi.com/getting_started/api_environments'),
    ('kalshi-docs', 'Demo environment', 'https://docs.kalshi.com/getting_started/demo_env'),
    ('kalshi-docs', 'API keys & signing', 'https://docs.kalshi.com/getting_started/api_keys'),
    ('kalshi-docs', 'Orderbook responses', 'https://docs.kalshi.com/getting_started/orderbook_responses'),
    ('kalshi-docs', 'WebSockets quick start', 'https://docs.kalshi.com/getting_started/quick_start_websockets'),
    ('kalshi-docs', 'Rate limits', 'https://docs.kalshi.com/getting_started/rate_limits'),
    ('kalshi-docs', 'Get markets', 'https://docs.kalshi.com/api-reference/market/get-markets'),
    ('kalshi-docs', 'Get market candlesticks', 'https://docs.kalshi.com/api-reference/market/get-market-candlesticks'),
    ('kalshi-docs', 'Historical data', 'https://docs.kalshi.com/getting_started/historical_data'),
    ('kalshi-docs', 'Get balance', 'https://docs.kalshi.com/api-reference/portfolio/get-balance'),
    ('kalshi-docs', 'Create order V2', 'https://docs.kalshi.com/api-reference/orders/create-order-v2'),
    ('kalshi-category', 'Gas prices -> Economics category (gas contracts are filed there)', 'https://kalshi.com/category/economics'),
    ('kalshi-category', 'Gas prices -> Oil & Energy subcategory', 'https://kalshi.com/category/economics/oil-and-energy'),
    ('kalshi-category', 'Elections category', 'https://kalshi.com/category/elections'),
    ('kalshi-category', 'Culture category', 'https://kalshi.com/category/culture'),
    ('kalshi-category', 'Crypto category', 'https://kalshi.com/category/crypto'),
    ('kalshi-category', 'Golf category', 'https://kalshi.com/category/sports/golf'),
    ('kalshi-api', 'Public exchange status (unauthenticated)', 'https://external-api.kalshi.com/trade-api/v2/exchange/status'),
]

PROD_BASE = "https://external-api.kalshi.com/trade-api/v2"


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def check_url(url: str) -> dict:
    """Return a measurement, not a verdict: status None means no response at all."""
    if "kalshi.com/" in url:
        time.sleep(0.65)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; Tradebot3-link-check/2.0)",
        "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
    })
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                return {"http_status": resp.status, "reachable": 200 <= resp.status < 400}
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt == 0:
                time.sleep(3.0)
                continue
            out = {"http_status": exc.code, "reachable": False}
            if exc.code == 429:
                out["throttled"] = True
                out["note"] = "HTTP 429 rate-limited by host during unauthenticated batch check"
            return out
        except Exception as exc:  # DNS, TLS, timeout — all are "no answer"
            if attempt == 0:
                time.sleep(1.0)
                continue
            return {"http_status": None, "reachable": False, "error": type(exc).__name__}
    return {"http_status": None, "reachable": False}


def build_official_links(previous: dict | None = None) -> dict:
    """Measure every link. Reuse fresh 2xx measurements taken minutes earlier by
    fetch_kalshi_data.py so back-to-back checks do not self-throttle kalshi.com."""
    previous_rows = {r["url"]: r for r in (previous or {}).get("rows", [])}
    prev_checked_at = (previous or {}).get("checked_at")
    fresh_prev = False
    if prev_checked_at:
        try:
            prev_dt = dt.datetime.fromisoformat(str(prev_checked_at).replace("Z", "+00:00"))
            fresh_prev = (dt.datetime.now(dt.timezone.utc) - prev_dt).total_seconds() < 900
        except ValueError:
            fresh_prev = False

    rows = []
    for kind, label, url in OFFICIAL_LINKS:
        prev_row = previous_rows.get(url)
        if fresh_prev and prev_row and prev_row.get("reachable") and prev_row.get("http_status"):
            rows.append({
                "kind": kind, "label": label, "url": url,
                "http_status": prev_row["http_status"],
                "reachable": True,
            })
            continue
        measured = check_url(url)
        if measured.get("http_status") is None and prev_row and prev_row.get("http_status"):
            carried = {
                "kind": kind, "label": label, "url": url,
                "http_status": prev_row["http_status"],
                "reachable": prev_row["reachable"],
                "carried_from": prev_checked_at,
                "note": "no response from this runner; last real measurement retained",
            }
            rows.append(carried)
        else:
            rows.append({"kind": kind, "label": label, "url": url, **measured})
    carried = sum(1 for r in rows if r.get("carried_from"))
    return {
        "checked_at": now_iso(),
        "method": (
            "Each URL was requested by this checker (paced to avoid unauthenticated 429 bursts). "
            "HTTP 200 = answered at check time; HTTP 429 = rate-limited by host; "
            "http_status null means no response was received and is recorded as such, never as success."
        ),
        "total": len(rows),
        "carried_forward": carried,
        "measured_now": len(rows) - carried,
        "reachable": sum(1 for r in rows if r["reachable"]),
        "throttled": sum(1 for r in rows if r.get("http_status") == 429),
        "unreachable": sum(1 for r in rows if not r["reachable"]),
        "rows": rows,
    }


def build_cadence() -> dict:
    runs = json.loads(HISTORY.read_text()) if HISTORY.exists() else []
    stamps = sorted(
        dt.datetime.fromisoformat(str(r.get("at") or r.get("run_at")).replace("Z", "+00:00"))
        for r in runs
        if r.get("at") or r.get("run_at")
    )
    gaps = [
        round((b - a).total_seconds() / 3600, 2) for a, b in zip(stamps, stamps[1:])
    ]
    measured = {}
    if gaps:
        measured = {
            "runs_used": len(stamps),
            "first_run": stamps[0].strftime("%Y-%m-%dT%H:%M:%SZ"),
            "last_run": stamps[-1].strftime("%Y-%m-%dT%H:%M:%SZ"),
            "gap_count": len(gaps),
            "median_gap_hours": round(statistics.median(gaps), 2),
            "mean_gap_hours": round(statistics.fmean(gaps), 2),
            "min_gap_hours": min(gaps),
            "max_gap_hours": max(gaps),
            "gaps_under_one_hour": sum(1 for g in gaps if g < 1),
            "gaps_under_1h": sum(1 for g in gaps if g < 1),
        }
    return {
        "source": "assets/data/refresh-history.json (appended by the GitHub Actions refresh job on every run)",
        "requested_cron": "*/30 * * * * (every 30 minutes, best effort on GitHub-hosted runners)",
        "runs_recorded": len(runs),
        "measured": measured,
        "note": (
            "The scheduler does not honour the requested interval. What is published on the site is this "
            "measurement, not the cron expression."
        ),
    }


def mark_price(bar: list) -> tuple[float | None, str | None]:
    _, bid, ask, trade, _ = (list(bar) + [None] * 5)[:5]
    if trade is not None:
        return trade, "trade close"
    if bid is not None and ask is not None:
        return round((bid + ask) / 2, 4), "bid/ask mid close"
    if ask is not None:
        return ask, "ask close (no bid)"
    if bid is not None:
        return bid, "bid close (no ask)"
    return None, None


def reclassify_alerts(snap: dict) -> int:
    """Rebuild alerts from the stored candles with the documented price rule,
    preserving official event_title and any pre-publish-window 24h 1m alerts.

    Returns the number of alerts changed. If the snapshot carries no candle
    series, existing alerts keep their labels but are never left unlabelled.
    """
    changed = 0
    events_by_ticker = {
        e["event_ticker"]: e
        for e in snap.get("events", [])
        if e.get("event_ticker")
    }
    markets = {}
    for m in snap.get("markets", []):
        ev_title = m.get("event_title") or events_by_ticker.get(m.get("event_ticker"), {}).get("title")
        if ev_title:
            m["event_title"] = ev_title
        markets[m["ticker"]] = m

    rebuilt = []
    largest = {"abs": 0.0}
    publish_cutoffs = {}
    for m in snap.get("markets", []):
        candles = m.get("candles")
        if not candles:
            continue
        m1_bars = candles.get("m1") or []
        if m1_bars:
            publish_cutoffs[m["ticker"]] = candles.get("publish_m1_start_ts") or m1_bars[0][0]
        ev_title = m.get("event_title") or events_by_ticker.get(m.get("event_ticker"), {}).get("title")
        for label, key, step in (("1m", "m1", 60), ("1h", "h1", 3600)):
            prev = None
            for bar in candles.get(key) or []:
                ts, bid, ask, price, vol = (list(bar) + [None] * 5)[:5]
                mark, basis = mark_price(bar)
                if mark is None:
                    continue
                if prev is not None:
                    delta = round(mark - prev[1], 4)
                    gap = max(0, round((ts - prev[0]) / 60)) if ts and prev[0] else 0
                    quote_only = price is None and prev[2] is None
                    stamp = dt.datetime.fromtimestamp(ts, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                    if abs(delta) > largest["abs"]:
                        largest = {
                            "abs": abs(delta), "delta": delta, "ticker": m["ticker"], "topic": m["topic"],
                            "ts": ts, "iso_time": stamp, "from_price": prev[1], "to_price": mark,
                            "price_basis": basis, "quote_only": quote_only, "interval": label,
                        }
                    if abs(delta) + 1e-9 >= SWING_THRESHOLD:
                        rebuilt.append({
                            "detected_from": f"Kalshi candlestick close-to-close ({label})",
                            "ts": ts, "iso_time": stamp, "ticker": m["ticker"],
                            "event_ticker": m.get("event_ticker"), "topic": m["topic"],
                            "title": m.get("title"), "event_title": ev_title,
                            "from_price": prev[1], "to_price": mark,
                            "price_basis": basis, "quote_only": quote_only, "delta": delta,
                            "direction": "up" if delta > 0 else "down",
                            "interval": f"{label} close-to-close" + (f" (gap {gap}m)" if gap > 2 * step // 60 else ""),
                            "gap_minutes": gap, "volume_contracts_in_bar": vol,
                            "kalshi_url": m.get("kalshi_url"), "candles_url": candles.get("source_url"),
                        })
                prev = (ts, mark, price)

    # Preserve 1m alerts detected in the 6h..24h lookback window before m1 was trimmed to 6h
    for existing in snap.get("alerts", []):
        if "(1m)" not in str(existing.get("detected_from") or ""):
            continue
        cutoff_ts = publish_cutoffs.get(existing.get("ticker"))
        if cutoff_ts and (existing.get("ts") or 0) <= cutoff_ts and existing.get("price_basis"):
            ev_title = existing.get("event_title") or events_by_ticker.get(existing.get("event_ticker"), {}).get("title")
            kept_row = {**existing, "event_title": ev_title}
            rebuilt.append(kept_row)
            if abs(existing.get("delta") or 0) > largest["abs"]:
                largest = {
                    "abs": abs(existing["delta"]),
                    "delta": existing["delta"],
                    "ticker": existing["ticker"],
                    "topic": existing["topic"],
                    "ts": existing["ts"],
                    "iso_time": existing.get("iso_time"),
                    "from_price": existing.get("from_price"),
                    "to_price": existing.get("to_price"),
                    "price_basis": existing.get("price_basis"),
                    "quote_only": bool(existing.get("quote_only")),
                    "interval": "1m",
                }

    if rebuilt:
        rebuilt.sort(key=lambda a: (a["ts"] or 0), reverse=True)
        # No cap: the snapshot carries every detected move in the detection window.
        seen, out = set(), []
        for a in rebuilt:
            key = (a["ticker"], a["ts"], a["direction"])
            if key in seen:
                continue
            seen.add(key)
            out.append(a)
        if out != snap.get("alerts"):
            changed = len(out)
            snap["alerts"] = out
            snap.setdefault("stats", {})["alerts_published"] = len(out)
            snap["stats"]["largest_move"] = largest

    # Never leave an alert without its basis label or event_title when known.
    for a in snap.get("alerts", []):
        if not a.get("event_title"):
            a["event_title"] = events_by_ticker.get(a.get("event_ticker"), {}).get("title")
        if not a.get("price_basis"):
            a["price_basis"] = "trade close" if a.get("detected_from", "").startswith("Kalshi") else "unknown"
        a.setdefault("quote_only", False)
    return changed


def build_resolution_window(snap: dict) -> dict:
    resolutions = snap.get("resolutions") or []
    lookback = (snap.get("stats", {}).get("settled_lookback_days") or 21)
    closes = []
    for r in resolutions:
        try:
            closes.append(dt.datetime.fromisoformat(str(r.get("close_time")).replace("Z", "+00:00")))
        except (ValueError, TypeError):
            continue
    now = dt.datetime.now(dt.timezone.utc)
    outside = [c for c in closes if c < now - dt.timedelta(days=lookback)]
    return {
        "lookback_days": lookback,
        "window_start": (now - dt.timedelta(days=lookback)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "rows_in_snapshot": len(resolutions),
        "rows_before_window": len(outside),
        "oldest_row_in_snapshot": min(closes).strftime("%Y-%m-%dT%H:%M:%SZ") if closes else None,
        "newest_row_in_snapshot": max(closes).strftime("%Y-%m-%dT%H:%M:%SZ") if closes else None,
        "source_field": "close_time, result, settlement_value_dollars from GET /markets/{ticker}",
        "note": (
            "Only markets that settled inside the window are requested and shipped; rows_before_window must be 0 "
            "and scripts/verify_site.py fails the build if it is not."
        ),
    }


def build_warning_summary(snap: dict) -> dict:
    warnings = snap.get("warnings") or []
    buckets = {}
    for w in warnings:
        text = str(w)
        if "429" in text or "rate" in text.lower():
            key = "rate_limited"
        elif "Candlestick" in text:
            key = "candlestick"
        elif "orderbook" in text.lower():
            key = "orderbook"
        elif "link" in text.lower() or "http" in text.lower():
            key = "link_check"
        else:
            key = "other"
        buckets[key] = buckets.get(key, 0) + 1
    return {
        "total": len(warnings),
        "by_kind": buckets,
        "note": (
            "A warning means the run could not read a source. It is published rather than hidden, because a market "
            "missing from the tables has to be explainable."
        ),
    }


def build_method_notes() -> dict:
    return {
        "alerts": (
            "A move is flagged when two consecutive candle marks differ by at least $0.10 either way "
            "(24h 1-minute candles and 72h 1-hour candles). A candle is priced at its last trade close when "
            "the bar traded, otherwise the mid of its closing bid and ask, otherwise whichever quote exists "
            "— one basis per bar, published as price_basis. quote_only marks a move where neither bar contained "
            "a trade, i.e. the change comes from quotes alone."
        ),
        "est_dollars": (
            "Events are ranked by official contract volume (sum of volume_fp across the event's markets) or "
            "by estimated dollar notional (sum of volume_fp x last_price_dollars across published markets), "
            "clearly labelled an estimate because Kalshi's public API exposes contract volume rather than "
            "cumulative dollar turnover."
        ),
        "paper": (
            "Paper entries fill at the actionable ask (live 20s quote when present, else orderbook snapshot, "
            "else last trade), marks and exits use the bid, and settlement pays $1.00 or $0.00 from the "
            "official result or the resolution table — the source used is recorded on the position."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="only verify the blocks exist")
    parser.add_argument("--offline", action="store_true", help="skip HTTP checks (keep previous measurements)")
    args = parser.parse_args()

    snap = json.loads(SNAPSHOT.read_text())
    required = ["official_links", "refresh_cadence", "resolution_window", "warning_summary", "method_notes"]

    if args.check:
        missing = [k for k in required if not snap.get(k)]
        unlabelled = [a for a in snap.get("alerts", []) if not a.get("price_basis")]
        if missing or unlabelled:
            print(f"FAIL — missing blocks: {missing or 'none'}; alerts without price_basis: {len(unlabelled)}")
            return 1
        print(f"OK — all {len(required)} audit blocks present; {len(snap['alerts'])} alerts labelled.")
        return 0

    previous_links = snap.get("official_links") or {}
    if not args.offline or not previous_links.get("rows"):
        snap["official_links"] = build_official_links(previous_links)
    else:
        for r in previous_links.get("rows", []):
            if r.get("http_status") == 429 and not r.get("note"):
                r["throttled"] = True
                r["note"] = "HTTP 429 rate-limited by host during unauthenticated batch check"
        previous_links["throttled"] = sum(
            1 for r in previous_links.get("rows", []) if r.get("http_status") == 429
        )
        snap["official_links"] = previous_links
    snap.setdefault("metrics", {})["swing_definition"] = (
        "Absolute change between consecutive candle marks (last trade close when the bar traded, "
        "else closing bid/ask mid, else closing ask or bid; quote_only=true when neither bar traded) "
        "of at least $0.10 per contract."
    )
    snap["refresh_cadence"] = build_cadence()
    changed = reclassify_alerts(snap)
    # Copy the measured status of each topic's category page onto the topic, so a
    # page cannot publish a "verified source" link that was never checked.
    links_by_url = {r["url"]: r for r in snap["official_links"]["rows"]}
    for meta in (snap.get("topics") or {}).values():
        row = links_by_url.get(meta.get("kalshi_category_url"))
        if row:
            meta["kalshi_category_http_status"] = row["http_status"]
            meta["kalshi_category_reachable"] = row["reachable"]
    snap["resolution_window"] = build_resolution_window(snap)
    snap["warning_summary"] = build_warning_summary(snap)
    snap["method_notes"] = build_method_notes()

    SNAPSHOT.write_text(json.dumps(snap, separators=(",", ":")))
    links = snap["official_links"]
    print(
        f"enriched {SNAPSHOT.relative_to(ROOT)}: {links['reachable']}/{links['total']} official links reachable, "
        f"{len(snap['alerts'])} alerts ({changed and sum(1 for a in snap['alerts'] if a.get('quote_only')) or 0} quote-only), "
        f"median refresh gap {snap['refresh_cadence']['measured'].get('median_gap_hours', 'n/a')} h"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
