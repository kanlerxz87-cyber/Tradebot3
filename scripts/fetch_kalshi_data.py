#!/usr/bin/env python3
"""
Tradebot3 — Kalshi official public-data snapshot builder.

Purpose
-------
Builds the dashboard's data file (assets/data/snapshot.json) and the legacy-claim
audit (assets/data/legacy-audit.json) from Kalshi's *official, unauthenticated*
public Trade API. No values are invented: every number written here is copied
from an API response and the response's own field name is recorded next to it.

Official sources used (see SOURCES below for the exact URLs):
  * API environments:  https://docs.kalshi.com/getting_started/api_environments
  * Orderbook format:  https://docs.kalshi.com/getting_started/orderbook_responses
  * Candlesticks:      GET /series/{series_ticker}/markets/{ticker}/candlesticks
  * Auth (not needed): https://docs.kalshi.com/getting_started/api_keys

Scope: strictly the five requested topics (gas-prices, elections, culture,
crypto, golf). Topic membership is decided by documented, auditable rules
(series-ticker prefixes + title keywords) that are written into the output file
so a reader can see exactly why a market is in the dataset.

Run: python3 scripts/fetch_kalshi_data.py [--demo-check] [--audit-legacy]
Only the standard library is required (works on GitHub Actions ubuntu-latest).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

PROD_BASE = "https://external-api.kalshi.com/trade-api/v2"
PROD_BASE_ALT = "https://api.elections.kalshi.com/trade-api/v2"
DEMO_BASE = "https://external-api.demo.kalshi.co/trade-api/v2"

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "assets" / "data"
SNAPSHOT_PATH = DATA_DIR / "snapshot.json"
LEGACY_AUDIT_PATH = DATA_DIR / "legacy-audit.json"
LEGACY_CLAIMS_PATH = ROOT / "scripts" / "legacy_claims.json"

UA = "Tradebot3-research-bot/2.0 (+https://github.com/kanlerxz87-cyber/Tradebot3)"
HTTP_TIMEOUT = 30
SWING_THRESHOLD = 0.10  # USD per contract, either direction

SOURCES = {
    "demo_env": "https://docs.kalshi.com/getting_started/demo_env",
    "api_environments": "https://docs.kalshi.com/getting_started/api_environments",
    "api_keys": "https://docs.kalshi.com/getting_started/api_keys",
    "orderbook": "https://docs.kalshi.com/getting_started/orderbook_responses",
    "websockets": "https://docs.kalshi.com/getting_started/quick_start_websockets",
    "rate_limits": "https://docs.kalshi.com/getting_started/rate_limits",
    "markets_ref": "https://docs.kalshi.com/api-reference/market/get-markets",
    "candles_ref": "https://docs.kalshi.com/api-reference/market/get-market-candlesticks",
    "order_ref": "https://docs.kalshi.com/api-reference/orders/create-order-v2",
}

# Topic classification. Each rule is either a series-ticker prefix or a
# case-insensitive keyword found in the market title / rules text. Prefix rules
# are checked first so broad keywords cannot pull in unrelated markets.
TOPIC_RULES = {
    "gas-prices": {
        "name": "Gas Prices",
        "prefixes": [
            "KXAAAGAS", "KXGAS", "KXGASOLINE", "KXAAGAS", "KXAAA",
        ],
        "keywords": ["gas price", "gasoline", "aaa gas"],
        "why": "Series ticker prefix KXAAAGAS*/KXGAS*/KXAAA* or title keyword 'gas price'/'gasoline' (AAA fuel-gauge contracts).",
    },
    "elections": {
        "name": "Elections",
        "prefixes": [
            "KXPRES", "KXSENATE", "KXHOUSE", "KXGOV", "KXMAYOR", "KXCONGRESS",
            "KXCONTROL", "KXELECT", "KXNEXTNATOSECGEN", "KXSPEAKER", "KXSCOTUSNOM",
            "KXCABINET", "KXIMPEACH", "KXVEEP", "KXPRIM",
        ],
        "keywords": ["election", "senate control", "presidential nomination", "electoral college"],
        "why": "Series ticker prefix for presidential / Senate / House / gubernatorial / mayoral election contracts, or title keyword 'election'.",
    },
    "culture": {
        "name": "Culture",
        "prefixes": [
            "KXOSCAR", "KXRT", "KXGAMEAWARDS", "KXGRAMMY", "KXEMMY", "KXGOLDENGLOBE",
            "KXBOXOFFICE", "KXBILLBOARD", "KXSPOTIFY", "KXTONY", "KXMETGALA", "KXTIME",
            "KXPERSONOFYEAR", "KXNOBEL", "KXBAFTA", "KXSUPERBOWLHALFTIME",
        ],
        "keywords": ["oscar", "grammy", "emmy", "rotten tomatoes", "game awards", "golden globe", "box office"],
        "why": "Series ticker prefix for awards / box-office / entertainment contracts, or title keyword such as 'oscar', 'grammy', 'box office'.",
    },
    "crypto": {
        "name": "Crypto",
        "prefixes": [
            "KXBTC", "KXETH", "KXSOL", "KXXRP", "KXDOGE", "KXCRYPTO", "KXADA",
            "KXAVAX", "KXLTC", "KXBNB", "KXHYPE", "KXSUI", "KXCRYPTOPRICE",
        ],
        "keywords": ["bitcoin", "ethereum", "solana", "dogecoin", "ripple", "crypto"],
        "why": "Series ticker prefix for BTC/ETH/SOL/XRP/DOGE price contracts, or title keyword naming a cryptocurrency.",
    },
    "golf": {
        "name": "Golf",
        "prefixes": [
            "KXPGATOUR", "KXGOLF", "KXLPGA", "KXRYDER", "KXPGA", "KXMASTERS",
            "KXPGAMASTERS",
        ],
        "keywords": ["golf", "pga tour", "ryder cup", "the masters"],
        "why": "Series ticker prefix KXPGATOUR*/KXGOLF*/KXLPGA*/KXRYDER* or title keyword 'golf'/'PGA Tour'.",
    },
}

TOPIC_ORDER = ["gas-prices", "elections", "culture", "crypto", "golf"]

# Topic reference pages that the dashboard links to as *possible* catalyst /
# primary-source pages. Their HTTP status is checked at build time and only
# reachable ones are published; none is asserted to have caused any price move.
TOPIC_REFERENCE_LINKS = {
    "gas-prices": [
        ("AAA Daily Fuel Gauge Report", "https://gasprices.aaa.com/"),
        ("U.S. EIA Weekly Petroleum Status Report", "https://www.eia.gov/petroleum/supply/weekly/"),
    ],
    "elections": [
        ("Federal Election Commission", "https://www.fec.gov/"),
        ("U.S. Senate — official site", "https://www.senate.gov/"),
        ("U.S. House of Representatives — Clerk (election results)", "https://clerk.house.gov/"),
        ("National Association of Secretaries of State — elections", "https://www.nass.org/"),
    ],
    "culture": [
        ("Academy of Motion Picture Arts and Sciences", "https://www.oscars.org/"),
        ("Rotten Tomatoes", "https://www.rottentomatoes.com/"),
        ("The Recording Academy (GRAMMYs)", "https://www.grammy.com/"),
        ("Box Office Mojo", "https://www.boxofficemojo.com/"),
    ],
    "crypto": [
        ("Coinbase — Bitcoin price page", "https://www.coinbase.com/price/bitcoin"),
        ("CF Benchmarks (Kalshi crypto settlement source)", "https://www.cfbenchmarks.com/"),
    ],
    "golf": [
        ("PGA TOUR — Leaderboard", "https://www.pgatour.com/leaderboard"),
        ("LPGA — official site", "https://www.lpga.com/"),
        ("The R&A — official site", "https://www.randa.org/"),
    ],
}

# Limits (keep the published snapshot small enough for a static page)
MAX_MARKETS_PER_TOPIC = 40
MAX_EVENTS_PER_TOPIC = 8
CANDLE_MARKETS_PER_TOPIC = 4
CANDLE_LOOKBACK_HOURS = 24      # detection window (1-minute candles)
CANDLE_PUBLISH_HOURS = 6        # bars shipped to the browser
MAX_ALERTS = 120
SETTLED_LOOKBACK_DAYS = 21

# --------------------------------------------------------------------------- #
# HTTP helpers
# --------------------------------------------------------------------------- #

_SSL_CTX = ssl.create_default_context()


class ApiError(RuntimeError):
    pass


def http_json(url: str, retries: int = 3, timeout: int = HTTP_TIMEOUT):
    """GET a URL and parse JSON. Retries 429/5xx with exponential backoff."""
    last_err = None
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Accept": "application/json",
        })
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw.strip() else {}
        except urllib.error.HTTPError as exc:
            body = ""
            try:
                body = exc.read().decode("utf-8", "replace")[:400]
            except Exception:  # pragma: no cover
                pass
            last_err = f"HTTP {exc.code} {url} {body}"
            if exc.code in (429, 500, 502, 503, 504):
                time.sleep(1.5 * (attempt + 1))
                continue
            raise ApiError(last_err)
        except Exception as exc:  # noqa: BLE001 - network flake
            last_err = f"{type(exc).__name__}: {exc} ({url})"
            time.sleep(1.0 * (attempt + 1))
    raise ApiError(last_err or f"failed: {url}")


def http_status(url: str, timeout: int = 20):
    """Return (status_code, note) without failing the build."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; Tradebot3-link-check/2.0)",
        "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
            return resp.status, ""
    except urllib.error.HTTPError as exc:
        return exc.code, ""
    except Exception as exc:  # noqa: BLE001
        return None, f"{type(exc).__name__}: {exc}"


# --------------------------------------------------------------------------- #
# Parsing helpers (all field names are Kalshi's own; no derived inventions)
# --------------------------------------------------------------------------- #

NUM_RE = re.compile(r"[^0-9.\-]")


def num(value, default=None):
    """Parse Kalshi fixed-point / dollar strings ('0.4200', '28786.99')."""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value))
    except (TypeError, ValueError):
        cleaned = NUM_RE.sub("", str(value))
        try:
            return float(cleaned)
        except (TypeError, ValueError):
            return default


def pick(market: dict, *names, default=None):
    for name in names:
        if name in market and market[name] not in (None, ""):
            return market[name]
    return default


def classify(market: dict):
    """Return (topic_id, rule_text) or (None, None)."""
    series = str(market.get("series_ticker") or ticker_series(market.get("ticker", ""))).upper()
    if market.get("event_ticker") and not series:
        series = str(market["event_ticker"]).split("-")[0].upper()
    haystack = " ".join(
        str(market.get(k) or "") for k in ("title", "yes_sub_title", "rules_primary")
    ).lower()
    for topic in TOPIC_ORDER:
        rule = TOPIC_RULES[topic]
        if series and any(series.startswith(p) for p in rule["prefixes"]):
            return topic, f"series prefix {series} matches {rule['prefixes']} group"
        if any(k in haystack for k in rule["keywords"]):
            return topic, f"title/rules keyword match in '{str(market.get('title'))[:80]}'"
    return None, None


def ticker_series(ticker: str) -> str:
    return str(ticker or "").split("-")[0]


def normalize_market(market: dict, topic: str, rule_text: str) -> dict:
    ticker = market.get("ticker")
    event_ticker = market.get("event_ticker") or ""
    out = {
        "ticker": ticker,
        "event_ticker": event_ticker,
        "series_ticker": market.get("series_ticker") or ticker_series(ticker),
        "topic": topic,
        "topic_rule": rule_text,
        "title": market.get("title"),
        "subtitle": market.get("yes_sub_title") or market.get("no_sub_title"),
        "yes_bid": num(pick(market, "yes_bid_dollars")),
        "yes_ask": num(pick(market, "yes_ask_dollars")),
        "no_bid": num(pick(market, "no_bid_dollars")),
        "no_ask": num(pick(market, "no_ask_dollars")),
        "last_price": num(pick(market, "last_price_dollars", "last_price")),
        "previous_price": num(pick(market, "previous_price_dollars", "previous_price")),
        "volume": num(pick(market, "volume_fp", "volume"), 0.0),
        "volume_24h": num(pick(market, "volume_24h_fp", "volume_24h"), 0.0),
        "open_interest": num(pick(market, "open_interest_fp", "open_interest"), 0.0),
        "status": market.get("status"),
        "result": market.get("result") or None,
        "settlement_value": num(pick(market, "settlement_value_dollars", "settlement_value")),
        "close_time": pick(market, "close_time", "expected_expiration_time"),
        "open_time": market.get("open_time"),
        "updated_time": market.get("updated_time"),
        "rules_primary": market.get("rules_primary"),
        "rules_secondary": market.get("rules_secondary"),
        "yes_ask_size": num(pick(market, "yes_ask_size_fp", "yes_ask_size"), 0.0),
        "yes_bid_size": num(pick(market, "yes_bid_size_fp", "yes_bid_size"), 0.0),
        "kalshi_url": f"https://kalshi.com/events/{event_ticker}" if event_ticker else None,
        "api_url": f"{PROD_BASE}/markets/{ticker}",
        "field_source": "GET /markets (Kalshi Trade API v2) — fields volume_fp, open_interest_fp, yes_bid_dollars, yes_ask_dollars, last_price_dollars, result, settlement_value_dollars",
    }
    return out


# --------------------------------------------------------------------------- #
# Collection
# --------------------------------------------------------------------------- #

def paginate(path: str, params: dict, max_pages: int, base: str = PROD_BASE, page_sleep=0.25):
    """Yield items from a cursor-paginated endpoint; tolerate missing cursors."""
    cursor = None
    seen = 0
    for _ in range(max_pages):
        query = dict(params)
        if cursor:
            query["cursor"] = cursor
        url = f"{base}{path}?{urllib.parse.urlencode(query)}"
        data = http_json(url)
        items = data.get("markets") or data.get("events") or data.get("series") or []
        for item in items:
            yield item
            seen += 1
        cursor = data.get("cursor")
        if not cursor or not items:
            break
        time.sleep(page_sleep)
    else:
        print(f"  [warn] pagination cap reached for {path} ({seen} items)", file=sys.stderr)


SERIES_CATEGORIES = [
    "Economics", "Elections", "Culture", "Crypto", "Financials",
    "Sports", "Entertainment", "Politics", "Companies",
]


def classify_series(ticker: str, title: str = "", tags=None):
    """Classify a Kalshi *series* into one of the five topics."""
    up = str(ticker or "").upper()
    hay = f"{title or ''} {' '.join(tags or [])}".lower()
    for topic in TOPIC_ORDER:
        rule = TOPIC_RULES[topic]
        for prefix in rule["prefixes"]:
            if up.startswith(prefix):
                return topic, f"series ticker {up} starts with {prefix}"
        for kw in rule["keywords"]:
            if kw in hay:
                return topic, f"series title/tags keyword '{kw}'"
    return None, None


def discover_series(warnings):
    """Enumerate Kalshi series per category and keep only the five topics.

    /series?category=... is an official public endpoint and returns every series
    in the category (the `limit` parameter is ignored by the API), so the
    response can be large. It is parsed on the runner, never shipped to the site.
    """
    found = {}
    for category in SERIES_CATEGORIES:
        url = f"{PROD_BASE}/series?category={urllib.parse.quote(category)}"
        try:
            data = http_json(url, timeout=120)
        except ApiError as exc:
            warnings.append(f"Series discovery failed for category {category}: {exc}")
            continue
        series = data.get("series") or []
        kept = 0
        for item in series:
            ticker = item.get("ticker")
            topic, rule = classify_series(ticker, item.get("title"), item.get("tags"))
            if topic and ticker:
                found[ticker] = {
                    "topic": topic,
                    "title": item.get("title"),
                    "rule": rule,
                    "category": item.get("category") or category,
                    "settlement_sources": [
                        {"name": s.get("name"), "url": s.get("url")}
                        for s in (item.get("settlement_sources") or [])
                    ][:6],
                }
                kept += 1
        print(f"  series[{category}]: {len(series)} listed, {kept} match a topic")
        time.sleep(0.2)
    return found


def markets_for_series(series_map, status, warnings, max_series_per_topic=70):
    """Fetch markets for the discovered series of each topic."""
    per_topic = {t: 0 for t in TOPIC_ORDER}
    out = []
    for ticker in sorted(series_map):
        meta = series_map[ticker]
        topic = meta["topic"]
        if per_topic[topic] >= max_series_per_topic:
            continue
        url = f"{PROD_BASE}/markets?series_ticker={urllib.parse.quote(ticker)}&status={status}&limit=1000"
        try:
            data = http_json(url)
        except ApiError as exc:
            warnings.append(f"Markets failed for series {ticker} ({status}): {exc}")
            continue
        rows = data.get("markets") or []
        if rows:
            per_topic[topic] += 1
        for row in rows:
            row["series_ticker"] = ticker
            row["_series_meta"] = meta
            out.append(row)
        time.sleep(0.08)
    return out


def normalize_all(raw_markets, warnings):
    out = []
    unclassified = 0
    combos = 0
    for m in raw_markets:
        if m.get("mve_collection_ticker"):
            combos += 1
            continue
        meta = m.get("_series_meta") or {}
        topic = meta.get("topic")
        rule = meta.get("rule")
        if not topic:
            topic, rule = classify(m)
        if not topic:
            unclassified += 1
            continue
        norm = normalize_market(m, topic, rule or "series match")
        if not norm["ticker"]:
            continue
        if meta.get("settlement_sources"):
            norm["settlement_sources"] = meta["settlement_sources"]
        out.append(norm)
    warnings.append(
        f"Classifier: {combos} multivariate combo markets skipped, {unclassified} non-topic markets ignored."
    )
    return out


def select_topics(open_markets, settled_markets, warnings):
    """Group classified markets by topic and event, then apply per-topic caps."""
    by_topic = {t: {"open": [], "settled": []} for t in TOPIC_ORDER}
    for m in open_markets:
        by_topic[m["topic"]]["open"].append(m)
    for m in settled_markets:
        if m.get("result") in ("yes", "no"):
            by_topic[m["topic"]]["settled"].append(m)

    selected_events = []
    markets_out = []
    for topic in TOPIC_ORDER:
        pool = by_topic[topic]["open"]
        events = {}
        for m in pool:
            events.setdefault(m["event_ticker"], []).append(m)
        ranked = sorted(
            events.items(),
            key=lambda kv: sum(x["volume"] for x in kv[1]),
            reverse=True,
        )[:MAX_EVENTS_PER_TOPIC]
        kept = 0
        for event_ticker, members in ranked:
            members.sort(key=lambda x: x["volume"], reverse=True)
            for m in members:
                if kept >= MAX_MARKETS_PER_TOPIC:
                    break
                markets_out.append(m)
                kept += 1
            selected_events.append({
                "event_ticker": event_ticker,
                "topic": topic,
                "volume_total": round(sum(x["volume"] for x in members), 2),
                "market_count_tracked": len(members),
            })
    return markets_out, selected_events, by_topic


def enrich_events(events, warnings):
    """Fetch official event metadata (title, settlement sources) per event."""
    for ev in events:
        ticker = ev["event_ticker"]
        try:
            data = http_json(f"{PROD_BASE}/events/{urllib.parse.quote(ticker)}?with_nested_markets=false")
            event = data.get("event") or {}
            sources = event.get("settlement_sources") or []
            ev["title"] = event.get("title")
            ev["sub_title"] = event.get("sub_title")
            ev["category"] = event.get("category")
            ev["mutually_exclusive"] = event.get("mutually_exclusive")
            ev["settlement_sources"] = [
                {"name": s.get("name"), "url": s.get("url")} for s in sources
            ][:6]
            ev["last_updated_ts"] = event.get("last_updated_ts")
        except ApiError as exc:
            warnings.append(f"Event metadata failed for {ticker}: {exc}")
            ev["title"] = None
            ev["settlement_sources"] = []
        time.sleep(0.1)


def fetch_orderbooks(markets, warnings, max_markets=60):
    """Attach a real orderbook snapshot + derived liquidity metrics."""
    count = 0
    for m in markets:
        if m["status"] != "active":
            continue
        if count >= max_markets:
            break
        ticker = m["ticker"]
        try:
            data = http_json(f"{PROD_BASE}/markets/{urllib.parse.quote(ticker)}/orderbook?depth=10")
        except ApiError as exc:
            warnings.append(f"Orderbook failed for {ticker}: {exc}")
            continue
        book = data.get("orderbook_fp") or {}
        yes_levels = [(num(p), num(c, 0.0)) for p, c in (book.get("yes_dollars") or [])]
        no_levels = [(num(p), num(c, 0.0)) for p, c in (book.get("no_dollars") or [])]
        yes_levels = [x for x in yes_levels if x[0] is not None]
        no_levels = [x for x in no_levels if x[0] is not None]

        best_yes_bid = yes_levels[-1][0] if yes_levels else None
        best_no_bid = no_levels[-1][0] if no_levels else None
        # Kalshi docs: YES ask = 1.00 - best NO bid; NO ask = 1.00 - best YES bid
        best_yes_ask = round(1.0 - best_no_bid, 4) if best_no_bid is not None else None
        best_no_ask = round(1.0 - best_yes_bid, 4) if best_yes_bid is not None else None
        spread = None
        if best_yes_bid is not None and best_yes_ask is not None:
            spread = round(best_yes_ask - best_yes_bid, 4)

        def usd(levels):
            return round(sum(p * c for p, c in levels), 2)

        m["orderbook"] = {
            "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "yes_bids": yes_levels,          # ascending price, as Kalshi returns them
            "no_bids": no_levels,
            "best_yes_bid": best_yes_bid,
            "best_yes_ask": best_yes_ask,
            "best_no_bid": best_no_bid,
            "best_no_ask": best_no_ask,
            "spread": spread,
            "yes_bid_contracts": round(sum(c for _, c in yes_levels), 2),
            "no_bid_contracts": round(sum(c for _, c in no_levels), 2),
            "yes_bid_usd_at_risk": usd(yes_levels),
            "no_bid_usd_at_risk": usd(no_levels),
            "note": "Bids only. YES ask = $1.00 - best NO bid (Kalshi orderbook docs).",
            "source_url": f"{PROD_BASE}/markets/{ticker}/orderbook?depth=10",
            "docs_url": SOURCES["orderbook"],
        }
        count += 1
        time.sleep(0.08)


def to_series(candles, field_side="yes_bid"):
    """Compact candle series: [end_period_ts, yes_bid_close, yes_ask_close, trade_price, volume]."""
    series = []
    for c in candles:
        ts = c.get("end_period_ts")
        bid = num((c.get(field_side) or {}).get("close_dollars"))
        ask = num((c.get("yes_ask") or {}).get("close_dollars"))
        price = num((c.get("price") or {}).get("close_dollars"))
        vol = num(c.get("volume_fp"), 0.0)
        def rnd(v):
            return None if v is None else round(v, 3)
        series.append([ts, rnd(bid), rnd(ask), rnd(price), round(vol, 2) if vol is not None else 0.0])
    return series


def fetch_candles(markets, warnings):
    now = int(time.time())
    by_topic_count = {t: 0 for t in TOPIC_ORDER}
    ranked = sorted(markets, key=lambda m: (m.get("volume_24h") or 0, m.get("volume") or 0), reverse=True)
    for m in ranked:
        if m["status"] != "active":
            continue
        topic = m["topic"]
        if by_topic_count[topic] >= CANDLE_MARKETS_PER_TOPIC:
            continue
        ticker = m["ticker"]
        series = m["series_ticker"]
        try:
            m1 = http_json(
                f"{PROD_BASE}/series/{urllib.parse.quote(series)}/markets/{urllib.parse.quote(ticker)}"
                f"/candlesticks?start_ts={now - CANDLE_LOOKBACK_HOURS * 3600}&end_ts={now}&period_interval=1"
            )
            h1 = http_json(
                f"{PROD_BASE}/series/{urllib.parse.quote(series)}/markets/{urllib.parse.quote(ticker)}"
                f"/candlesticks?start_ts={now - 3 * 86400}&end_ts={now}&period_interval=60"
            )
        except ApiError as exc:
            warnings.append(f"Candlesticks failed for {ticker}: {exc}")
            continue
        publish_cutoff = now - CANDLE_PUBLISH_HOURS * 3600
        m["candles"] = {
            "window_m1_start_ts": now - CANDLE_LOOKBACK_HOURS * 3600,
            "publish_m1_start_ts": publish_cutoff,
            "window_h1_start_ts": now - 3 * 86400,
            "m1": [row for row in to_series(m1.get("candlesticks") or []) if (row[0] or 0) >= publish_cutoff],
            "h1": to_series(h1.get("candlesticks") or []),
            "periods": "period_interval=1 (1 minute) and period_interval=60 (1 hour)",
            "source_url": f"{PROD_BASE}/series/{series}/markets/{ticker}/candlesticks",
            "docs_url": SOURCES["candles_ref"],
        }
        by_topic_count[topic] += 1
        time.sleep(0.1)


def detect_swings(markets, events_by_ticker):
    """Detect real >= $0.10 close-to-close moves from Kalshi candle data."""
    alerts = []
    for m in markets:
        candles = m.get("candles")
        if not candles:
            continue
        for label, key, step in (("1m", "m1", 60), ("1h", "h1", 3600)):
            series = candles.get(key) or []
            prev = None
            for bar in series:
                ts, bid, ask, price, vol = (bar + [None] * 5)[:5]
                mark = ask if ask is not None else bid
                if mark is None:
                    continue
                if prev is not None:
                    delta = round(mark - prev[1], 4)
                    gap_min = max(0, round((ts - prev[0]) / 60)) if ts and prev[0] else 0
                    if abs(delta) + 1e-9 >= SWING_THRESHOLD:
                        ev = events_by_ticker.get(m["event_ticker"], {})
                        alerts.append({
                            "detected_from": f"Kalshi candlestick close-to-close ({label})",
                            "ts": ts,
                            "iso_time": datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "ticker": m["ticker"],
                            "event_ticker": m["event_ticker"],
                            "topic": m["topic"],
                            "title": m["title"],
                            "event_title": ev.get("title"),
                            "from_price": prev[1],
                            "to_price": mark,
                            "delta": delta,
                            "direction": "up" if delta > 0 else "down",
                            "interval": f"{label} close-to-close" + (f" (gap {gap_min}m)" if gap_min > 2 * step // 60 else ""),
                            "gap_minutes": gap_min,
                            "volume_contracts_in_bar": vol,
                            "kalshi_url": m["kalshi_url"],
                            "candles_url": candles["source_url"],
                        })
                prev = (ts, mark)
    alerts.sort(key=lambda a: (a["ts"] or 0), reverse=True)
    # de-duplicate the same ticker/timestamp/direction seen in both windows
    seen = set()
    deduped = []
    for a in alerts:
        key = (a["ticker"], a["ts"], a["direction"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(a)
        if len(deduped) >= MAX_ALERTS:
            break
    return deduped


def check_reference_links(warnings):
    out = {}
    for topic, links in TOPIC_REFERENCE_LINKS.items():
        rows = []
        for label, url in links:
            status, note = http_status(url)
            ok = status is not None and 200 <= status < 400
            if not ok:
                warnings.append(f"Reference link not reachable ({status}): {url} {note}")
            rows.append({
                "label": label,
                "url": url,
                "http_status": status,
                "reachable": ok,
            })
        out[topic] = rows
    return out


def build_resolutions(settled_by_topic, events_by_ticker, limit_per_topic=12, warnings=None):
    rows = []
    for topic in TOPIC_ORDER:
        bucket = settled_by_topic.get(topic, [])
        if isinstance(bucket, dict):
            bucket = bucket.get("settled", [])
        items = [m for m in bucket if m.get("result") in ("yes", "no")]
        items.sort(key=lambda m: m.get("close_time") or "", reverse=True)
        for m in items[:limit_per_topic]:
            ev = events_by_ticker.get(m["event_ticker"], {})
            if not ev and warnings is not None:
                try:
                    data = http_json(f"{PROD_BASE}/events/{urllib.parse.quote(m['event_ticker'])}?with_nested_markets=false")
                    event = data.get("event") or {}
                    ev = {"title": event.get("title")}
                    events_by_ticker[m["event_ticker"]] = ev
                except ApiError as exc:
                    warnings.append(f"Settled event metadata failed for {m['event_ticker']}: {exc}")
                    ev = {}
            rows.append({
                "ticker": m["ticker"],
                "event_ticker": m["event_ticker"],
                "topic": topic,
                "title": m["title"],
                "event_title": ev.get("title"),
                "result": m["result"].upper(),
                "settlement_value": m.get("settlement_value"),
                "close_time": m.get("close_time"),
                "volume": m.get("volume"),
                "kalshi_url": m["kalshi_url"],
                "source_url": m["api_url"],
                "source_note": "result and settlement_value_dollars read from GET /markets/{ticker}",
            })
    return rows


def demo_spot_check(markets, warnings):
    """Compare a few demo last prices with production to document divergence."""
    rows = []
    for m in markets[:8]:
        ticker = m["ticker"]
        try:
            data = http_json(f"{DEMO_BASE}/markets/{urllib.parse.quote(ticker)}")
            demo = data.get("market") or {}
            rows.append({
                "ticker": ticker,
                "prod_last_price": m.get("last_price"),
                "demo_last_price": num(demo.get("last_price_dollars")),
                "prod_volume": m.get("volume"),
                "demo_volume": num(demo.get("volume_fp")),
                "demo_url": f"https://demo.kalshi.co/",
                "note": "Demo is a separate mock-funds environment; prices and volume are not the production book (Kalshi demo docs).",
            })
        except ApiError as exc:
            warnings.append(f"Demo spot-check failed for {ticker}: {exc}")
        time.sleep(0.1)
    return rows


# --------------------------------------------------------------------------- #
# Legacy claim audit — checks the previous session's dataset against the API
# --------------------------------------------------------------------------- #

def audit_legacy(warnings):
    if not LEGACY_CLAIMS_PATH.exists():
        warnings.append("legacy_claims.json missing; legacy audit skipped")
        return None
    claims = json.loads(LEGACY_CLAIMS_PATH.read_text())
    rows = []
    for claim in claims:
        ticker = claim.get("ticker")
        row = {
            "ticker": ticker,
            "topic": claim.get("topic"),
            "claimed_status": claim.get("status"),
            "claimed_volume_usd": claim.get("volume"),
            "claimed_price": claim.get("price"),
            "claimed_url": claim.get("url"),
            "api_found": False,
            "api_event_found": False,
            "api_status": None,
            "api_last_price": None,
            "api_volume_contracts": None,
            "api_result": None,
            "url_http_status": None,
            "notes": [],
        }
        if not ticker:
            row["notes"].append("No ticker supplied in the claim")
            rows.append(row)
            continue
        try:
            data = http_json(f"{PROD_BASE}/markets/{urllib.parse.quote(ticker)}")
            market = data.get("market") or {}
            row["api_found"] = bool(market)
            row["api_status"] = market.get("status")
            row["api_last_price"] = num(market.get("last_price_dollars"))
            row["api_volume_contracts"] = num(market.get("volume_fp"))
            row["api_result"] = market.get("result") or None
            row["resolved_ticker"] = market.get("ticker")
        except ApiError as exc:
            row["notes"].append(f"GET /markets/{ticker}: {exc}")
            # The claim may be an *event* ticker rather than a market ticker.
            try:
                ev = http_json(f"{PROD_BASE}/events/{urllib.parse.quote(ticker)}?with_nested_markets=false")
                event = ev.get("event") or {}
                if event:
                    row["api_event_found"] = True
                    row["api_event_title"] = event.get("title")
                    row["notes"].append(
                        "Ticker resolves as a Kalshi EVENT, not a market; the claim's price/volume "
                        "therefore cannot be a market-level value."
                    )
            except ApiError:
                row["api_event_found"] = False
        if claim.get("url"):
            status, note = http_status(claim["url"], timeout=15)
            row["url_http_status"] = status
            if note:
                row["notes"].append(f"URL check note: {note}")
        rows.append(row)
        time.sleep(0.15)

    found = sum(1 for r in rows if r["api_found"])
    summary = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "api_base": PROD_BASE,
        "claims_checked": len(rows),
        "claims_found_in_api": found,
        "claims_not_found_in_api": len(rows) - found,
        "method": "For each previous-dataset claim, GET /markets/{ticker} was requested on the official production Trade API. 'api_found' is false when Kalshi returned 404 (no such market). Claimed volumes are NOT re-used anywhere on the current site.",
        "rows": rows,
    }
    LEGACY_AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    LEGACY_AUDIT_PATH.write_text(json.dumps(summary, indent=2))
    print(f"Legacy audit: {found}/{len(rows)} claimed tickers exist in the live API")
    return summary


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo-check", action="store_true", help="Compare demo vs production prices")
    ap.add_argument("--audit-legacy", action="store_true", help="Audit the previous dataset claims")
    args = ap.parse_args()

    warnings: list[str] = []
    started = time.time()

    print("Discovering Kalshi series in the five topics ...")
    series_map = discover_series(warnings)
    for topic in TOPIC_ORDER:
        n = sum(1 for v in series_map.values() if v["topic"] == topic)
        print(f"  {topic}: {n} matching series")

    print("Fetching open markets for those series ...")
    raw_open = markets_for_series(series_map, "open", warnings)
    open_markets = normalize_all(raw_open, warnings)
    print(f"  {len(open_markets)} open topic markets after filtering")

    stats = {
        "series_discovered": len(series_map),
        "open_markets_scanned": len(raw_open),
        "open_topic_markets": len(open_markets),
    }

    markets, events, _by_topic_open = select_topics(open_markets, [], warnings)
    print(f"Selected {len(markets)} markets across {len(events)} events")

    # Resolutions: pull settled markets only for the series we actually track.
    tracked_series = sorted({m["series_ticker"] for m in markets})
    resolved_series_map = {t: series_map[t] for t in tracked_series if t in series_map}
    print(f"Fetching recent settlements for {len(resolved_series_map)} tracked series ...")
    raw_settled = markets_for_series(resolved_series_map, "settled", warnings)
    cutoff = datetime.now(timezone.utc) - timedelta(days=SETTLED_LOOKBACK_DAYS)
    recent_raw = []
    for m in raw_settled:
        close = m.get("close_time")
        if close:
            try:
                ts = datetime.fromisoformat(close.replace("Z", "+00:00"))
                if ts < cutoff:
                    continue
            except ValueError:
                pass
        recent_raw.append(m)
    settled_markets = normalize_all(recent_raw, warnings)
    stats["settled_markets_scanned"] = len(raw_settled)
    stats["settled_markets_recent"] = len(settled_markets)
    stats["settled_lookback_days"] = SETTLED_LOOKBACK_DAYS

    _markets2, _events2, by_topic = select_topics(markets, settled_markets, warnings)

    events_by_ticker = {}
    for ev in events:
        events_by_ticker.setdefault(ev["event_ticker"], ev)
    enrich_events(events_by_ticker.values(), warnings)

    fetch_orderbooks(markets, warnings)
    fetch_candles(markets, warnings)
    alerts = detect_swings(markets, events_by_ticker)
    resolutions = build_resolutions(by_topic, events_by_ticker, warnings=warnings)
    reference_links = check_reference_links(warnings)

    demo_rows = demo_spot_check(markets, warnings) if args.demo_check else []

    if args.audit_legacy:
        audit_legacy(warnings)

    # Attach orderbook-derived liquidity to the flat market list by reference;
    # keep events with their market tickers so the UI can group them.
    for ev in events_by_ticker.values():
        ev["market_tickers"] = [
            m["ticker"] for m in sorted(
                (x for x in markets if x["event_ticker"] == ev["event_ticker"]),
                key=lambda x: x["volume"], reverse=True,
            )
        ]
        ev["market_count"] = len(ev["market_tickers"])
        ev["est_dollars_traded"] = round(
            sum(
                (m["volume"] or 0) * (m["last_price"] or 0)
                for m in markets if m["event_ticker"] == ev["event_ticker"]
            ), 2
        )
        ev["kalshi_url"] = f"https://kalshi.com/events/{ev['event_ticker']}"
        ev["resolved_yes"] = sum(
            1 for m in markets
            if m["event_ticker"] == ev["event_ticker"] and (m.get("result") or "").lower() == "yes"
        )
        ev["resolved_no"] = sum(
            1 for m in markets
            if m["event_ticker"] == ev["event_ticker"] and (m.get("result") or "").lower() == "no"
        )

    topics_meta = {}
    for topic in TOPIC_ORDER:
        rule = TOPIC_RULES[topic]
        topics_meta[topic] = {
            "id": topic,
            "name": rule["name"],
            "inclusion_rule": rule["why"],
            "prefixes": rule["prefixes"],
            "keywords": rule["keywords"],
            "kalshi_category_url": f"https://kalshi.com/category/{'sports/golf' if topic == 'golf' else topic}",
            "reference_links": reference_links.get(topic, []),
            "market_count": sum(1 for m in markets if m["topic"] == topic),
            "event_count": sum(1 for e in events if e["topic"] == topic),
        }

    snapshot = {
        "schema_version": 2,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generator": "scripts/fetch_kalshi_data.py",
        "environment": "production public market data (no authentication)",
        "api_base": PROD_BASE,
        "docs": SOURCES,
        "metrics": {
            "swing_threshold_usd": SWING_THRESHOLD,
            "swing_definition": "Absolute change between consecutive candle closes (yes ask close when present, else yes bid close) of at least $0.10 per contract.",
            "ranking": "Events are ranked by total official contract volume (sum of volume_fp across tracked markets). Kalshi's public API exposes contract volume, not dollar volume; 'est_dollars_traded' = sum(volume_fp x last_price_dollars) is a clearly-labelled estimate, not an official dollar-volume figure.",
            "volume_field": "volume_fp (contracts)",
            "open_interest_field": "open_interest_fp (contracts)",
            "liquidity_field": "orderbook_fp yes_dollars/no_dollars bid levels (depth=10)",
        },
        "stats": {
            **stats,
            "markets_published": len(markets),
            "events_published": len(events),
            "alerts_published": len(alerts),
            "resolutions_published": len(resolutions),
            "orderbooks_fetched": sum(1 for m in markets if "orderbook" in m),
            "candle_series_fetched": sum(1 for m in markets if "candles" in m),
            "scan_seconds": round(time.time() - started, 1),
        },
        "topics": topics_meta,
        "events": sorted(events_by_ticker.values(), key=lambda e: e["volume_total"], reverse=True),
        "markets": sorted(markets, key=lambda m: (m["topic"], -(m["volume"] or 0))),
        "alerts": alerts,
        "resolutions": resolutions,
        "demo_spot_check": demo_rows,
        "warnings": warnings,
    }

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_PATH.write_text(json.dumps(snapshot, separators=(",", ":")))
    size_kb = SNAPSHOT_PATH.stat().st_size / 1024
    print(f"Wrote {SNAPSHOT_PATH.relative_to(ROOT)} ({size_kb:.1f} KB) at {snapshot['generated_at']}")
    for topic in TOPIC_ORDER:
        print(f"  {topic:11s} markets={topics_meta[topic]['market_count']:3d} events={topics_meta[topic]['event_count']:3d}")
    if warnings:
        seen_w = []
        for w in warnings:
            if w not in seen_w:
                seen_w.append(w)
        warnings[:] = seen_w
        print(f"Warnings ({len(warnings)}):")
        for w in warnings[:15]:
            print("  -", w)


if __name__ == "__main__":
    sys.exit(main())
# pipeline smoke test 1795332266
