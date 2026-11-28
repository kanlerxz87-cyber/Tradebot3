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
import concurrent.futures
import json
import os
import re
import ssl
import sys
import threading
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
REFRESH_HISTORY_PATH = DATA_DIR / "refresh-history.json"

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
            "KXAAAGAS", "KXGAS", "KXGASOLINE", "KXAAGAS", "AAAGAS",
            "GASPRICE", "KXRBOB", "KXRETAILGAS", "KXUSGASCPI",
        ],
        "keywords": ["gas price", "gasoline", "aaa gas", "regular gas", "gallon of gas", "retail gas"],
        "exclude": ["natural gas", "henry hub", "diesel", "coal", "oil rig", "electricity", "lng"],
        "event_categories": [],
        "why": "Series ticker prefix KXAAAGAS*/KXGAS*/KXUSGASCPI* or title keyword 'gas price'/'gasoline' (AAA/EIA retail gasoline contracts; excludes natural gas, diesel, coal, electricity).",
    },
    "elections": {
        "name": "Elections",
        "prefixes": [
            "KXPRES", "KXSENATE", "KXSENMAJ", "KXHOUSE", "KXGOV", "KXMAYOR",
            "KXNEWTAIPEIMAYOR", "KXTAIPEIMAYOR", "KXTAICHUNGMAYOR", "KXKAOHSIUNGMAYOR", "KXKEELUNGMAYOR",
            "KXISRAELPM", "KXFRENCHPRES", "KXUKPM", "KXCANPM", "KXGERCHANC",
            "KXCONTROL", "CONTROL", "POWER", "KXELECT", "KXELECTION",
            "KXSPEAKER", "KXLEADERS", "KXVEEP", "KXPRIM",
        ],
        "keywords": [
            "election", "presidential nominee", "presidential nomination", "democratic nominee",
            "republican nominee", "senate control", "senate majority", "senate seats",
            "house control", "electoral college", "mayoral", "gubernatorial",
        ],
        "exclude": ["testify", "hearing", "subpoena", "oscars", "academy award", "grammy", "emmy"],
        "event_categories": ["elections"],
        "why": "Kalshi category 'Elections', series ticker prefix for presidential / Senate / House / gubernatorial / mayoral / parliamentary election contracts, or election title keyword (excludes non-election hearings).",
    },
    "culture": {
        "name": "Culture",
        "prefixes": [
            "KXOSCAR", "KXRT", "KXGAMEAWARDS", "KXGRAMMY", "KXEMMY", "KXGOLDENGLOBE",
            "KXBOXOFFICE", "KXBILLBOARD", "KXSPOTIFY", "KXTOPARTIST", "KXGTA",
            "KXGOODREADS", "KXNETFLIX", "KXYTVIEWS", "KXWEEKSNUM1",
            "KXTONY", "KXMETGALA", "KXTIME", "KXPERSONOFYEAR", "KXNOBEL", "KXBAFTA",
            "KXSUPERBOWLHALFTIME",
        ],
        "keywords": [
            "oscar", "grammy", "emmy", "rotten tomatoes", "game awards", "golden globe",
            "box office", "person of the year", "spotify", "billboard 200", "goodreads",
            "netflix show", "gta vi",
        ],
        "exclude": ["election", "president", "senate", "bitcoin", "ethereum", "gas price", "pga tour"],
        "event_categories": ["entertainment", "culture"],
        "why": "Kalshi category 'Entertainment'/'Culture', series ticker prefix for awards / film / music / books / gaming contracts, or culture title keyword.",
    },
    "crypto": {
        "name": "Crypto",
        "prefixes": [
            "KXBTC", "KXETH", "KXSOL", "KXXRP", "KXDOGE", "KXCRYPTO", "KXADA",
            "KXAVAX", "KXLTC", "KXBNB", "KXHYPE", "KXSUI", "KXNEAR", "KXZEC", "KXCRYPTOPRICE",
        ],
        "keywords": ["bitcoin", "ethereum", "solana", "dogecoin", "ripple", "xrp", "crypto"],
        "exclude": [],
        "event_categories": ["crypto"],
        "why": "Kalshi category 'Crypto', series ticker prefix for BTC/ETH/SOL/XRP/DOGE/crypto contracts, or title keyword naming a cryptocurrency.",
    },
    "golf": {
        "name": "Golf",
        "prefixes": [
            "KXPGATOUR", "KXGOLF", "KXLPGA", "KXRYDER", "KXPGARYDER", "KXPGA",
            "KXMASTERS", "KXPGAMASTERS", "KXDPWORLDTOUR", "KXLIV",
            "KXSCOTTIESLAM", "KXBRYSON",
        ],
        "keywords": [
            "golf", "pga tour", "dp world tour", "liv golf", "ryder cup",
            "the masters", "lpga",
        ],
        "exclude": ["disc golf", "volkswagen"],
        "event_categories": [],
        "why": "Series ticker prefix KXPGATOUR*/KXDPWORLDTOUR*/KXGOLF*/KXLPGA*/KXRYDER* or title/tag keyword 'golf'/'PGA Tour'/'DP World Tour'/'LIV Golf'/'Ryder Cup'/'The Masters'.",
    },
}

TOPIC_ORDER = ["gas-prices", "elections", "culture", "crypto", "golf"]

# Human-facing Kalshi page for each topic. Gas-price contracts are filed under
# Kalshi's "Economics" category (GET /series/KXAAAGASM returns category
# "Economics"), so there is no /category/gas-prices page; golf is a sports
# sub-category. Both were resolved by fetching kalshi.com — see
# assets/data/snapshot.json -> official_links.
KALSHI_TOPIC_PAGE = {
    "gas-prices": "https://kalshi.com/category/economics",
    "elections": "https://kalshi.com/category/elections",
    "culture": "https://kalshi.com/category/culture",
    "crypto": "https://kalshi.com/category/crypto",
    "golf": "https://kalshi.com/category/sports/golf",
}

# Topic reference pages that the dashboard links to as *possible* catalyst /
# primary-source pages. Their HTTP status is checked at build time and only
# reachable ones are published; none is asserted to have caused any price move.
TOPIC_REFERENCE_LINKS = {
    "gas-prices": [
        ("Kalshi Oil & Energy (gasoline contracts)", "https://kalshi.com/category/economics/oil-and-energy"),
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

# The alert feed keeps every detected move. The table on the dashboard paginates,
# so a cap here would have silently published only the newest slice (the 19:56Z
# run detected 70 and the older snapshot showed 28, which read as a data loss).
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

# Global, process-wide pacing for the unauthenticated public API. Kalshi documents
# that unauthenticated requests "are subject to separate limits" and tells clients
# to back off on 429 (docs.kalshi.com/getting_started/rate_limits); the numeric
# limit is not published, so the pipeline paces itself conservatively instead of
# hammering the API and losing whole series to 429s.
MIN_REQUEST_INTERVAL = 0.10  # seconds between request starts, process-wide
_rate_lock = threading.Lock()
_last_request_at = [0.0]


def _pace():
    with _rate_lock:
        wait = _last_request_at[0] + MIN_REQUEST_INTERVAL - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last_request_at[0] = time.monotonic()


class ApiError(RuntimeError):
    pass


def http_json(url: str, retries: int = 5, timeout: int = HTTP_TIMEOUT):
    """GET a URL and parse JSON. Retries 429/5xx with exponential backoff."""
    last_err = None
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Accept": "application/json",
        })
        _pace()
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
                retry_after = None
                try:
                    retry_after = exc.headers.get("Retry-After")
                except Exception:  # pragma: no cover
                    retry_after = None
                delay = 1.5 * (2 ** attempt)
                if retry_after:
                    try:
                        delay = max(delay, float(retry_after))
                    except ValueError:
                        pass
                time.sleep(min(delay, 30))
                continue
            raise ApiError(last_err)
        except Exception as exc:  # noqa: BLE001 - network flake
            last_err = f"{type(exc).__name__}: {exc} ({url})"
            time.sleep(1.0 * (attempt + 1))
    raise ApiError(last_err or f"failed: {url}")


def http_status(url: str, timeout: int = 20, retries: int = 3):
    """Return (status_code, note) without failing the build.

    Retries a 429 a few times (paced) so a rate-limited check is reported as a
    measurement, not mistaken for a dead link.
    """
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; Tradebot3-link-check/2.0)",
        "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
    })
    last = (None, "")
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
                return resp.status, ""
        except urllib.error.HTTPError as exc:
            last = (exc.code, "")
            if exc.code == 429 and attempt < retries - 1:
                time.sleep(3 * (attempt + 1))
                continue
            return last
        except Exception as exc:  # noqa: BLE001
            last = (None, f"{type(exc).__name__}: {exc}")
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
    return last


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
    ev_cat = str(market.get("_event_category") or market.get("category") or "").strip().lower()
    haystack = " ".join(
        str(market.get(k) or "")
        for k in ("title", "yes_sub_title", "rules_primary", "_event_title")
    ).lower()
    for topic in TOPIC_ORDER:
        rule = TOPIC_RULES[topic]
        excludes = rule.get("exclude") or []
        if excludes and any(ex in haystack for ex in excludes):
            continue
        if series and any(series.startswith(p) for p in rule["prefixes"]):
            return topic, f"series prefix {series} matches {topic} prefixes"
        if any(k in haystack for k in rule["keywords"]):
            return topic, f"title/rules keyword match in '{str(market.get('title'))[:80]}'"
        if ev_cat and ev_cat in (rule.get("event_categories") or []):
            return topic, f"Kalshi event category '{ev_cat}' maps to {topic}"
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


def classify_series(ticker: str, title: str = "", tags=None, category: str = ""):
    """Classify a Kalshi *series* into one of the five topics."""
    up = str(ticker or "").upper()
    hay = f"{title or ''} {' '.join(tags or [])}".lower()
    cat_low = str(category or "").strip().lower()
    for topic in TOPIC_ORDER:
        rule = TOPIC_RULES[topic]
        excludes = rule.get("exclude") or []
        if excludes and any(ex in hay for ex in excludes):
            continue
        for prefix in rule["prefixes"]:
            if up.startswith(prefix):
                return topic, f"series ticker {up} starts with {prefix}"
        for kw in rule["keywords"]:
            if kw in hay:
                return topic, f"series title/tags keyword '{kw}'"
        if cat_low and cat_low in (rule.get("event_categories") or []):
            return topic, f"Kalshi category '{cat_low}' maps to {topic}"
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
            item_cat = item.get("category") or category
            topic, rule = classify_series(ticker, item.get("title"), item.get("tags"), item_cat)
            if topic and ticker:
                found[ticker] = {
                    "topic": topic,
                    "title": item.get("title"),
                    "last_updated_ts": item.get("last_updated_ts"),
                    "rule": rule,
                    "category": item_cat,
                    "settlement_sources": [
                        {"name": s.get("name"), "url": s.get("url")}
                        for s in (item.get("settlement_sources") or [])
                    ][:6],
                }
                kept += 1
        print(f"  series[{category}]: {len(series)} listed, {kept} match a topic")
        time.sleep(0.2)
    return found


def scan_events_catalog(series_map, status, warnings, min_close_ts=None, max_pages=80):
    """Scan Kalshi events with nested markets via GET /events?with_nested_markets=true.

    Unlike per-series market queries capped at max_series_per_topic=250 sorted by
    series.last_updated_ts (which dropped older multi-hundred-million-contract
    series such as KXPRESNOMD, KXPRESPERSON, and KXPRESNOMR; see IRREG-42),
    cursor-paginating GET /events?status=...&limit=200&with_nested_markets=true
    covers the entire exchange catalog in ~20-35 requests while returning official
    event metadata alongside nested market records.
    """
    params = {
        "status": status,
        "limit": 200,
        "with_nested_markets": "true",
    }
    if min_close_ts is not None:
        params["min_close_ts"] = int(min_close_ts)
    raw_markets = []
    event_cache = {}
    events_seen = 0
    try:
        for ev in paginate("/events", params, max_pages=max_pages, page_sleep=0.12):
            events_seen += 1
            ev_ticker = ev.get("event_ticker")
            series_ticker = ev.get("series_ticker") or ticker_series(ev_ticker or "")
            if ev_ticker:
                event_cache[ev_ticker] = {
                    "title": ev.get("title"),
                    "sub_title": ev.get("sub_title"),
                    "category": ev.get("category"),
                    "mutually_exclusive": ev.get("mutually_exclusive"),
                    "settlement_sources": [
                        {"name": s.get("name"), "url": s.get("url")}
                        for s in (ev.get("settlement_sources") or [])
                    ][:6],
                    "last_updated_ts": ev.get("last_updated_ts"),
                }
            meta = series_map.get(series_ticker)
            ev_topic = None
            ev_rule = None
            # Re-check exclusions against the concrete event title before trusting series_map
            ev_hay = f"{ev.get('title') or ''} {ev.get('sub_title') or ''}".lower()
            if meta:
                cand_topic = meta["topic"]
                excludes = TOPIC_RULES[cand_topic].get("exclude") or []
                if not any(ex in ev_hay for ex in excludes):
                    ev_topic = cand_topic
                    ev_rule = meta.get("rule")
            if not ev_topic:
                ev_topic, ev_rule = classify_series(
                    series_ticker,
                    f"{ev.get('title') or ''} {ev.get('sub_title') or ''}",
                    None,
                    ev.get("category") or "",
                )
            for m in ev.get("markets") or []:
                m["series_ticker"] = series_ticker
                m["_event_title"] = ev.get("title")
                m["_event_category"] = ev.get("category")
                if ev_topic:
                    m["_series_meta"] = {
                        "topic": ev_topic,
                        "rule": ev_rule,
                        "settlement_sources": (
                            event_cache.get(ev_ticker, {}).get("settlement_sources")
                            or (meta or {}).get("settlement_sources")
                            or []
                        ),
                    }
                raw_markets.append(m)
    except ApiError as exc:
        warnings.append(f"Events catalog scan ({status}) interrupted after {events_seen} events: {exc}")
    print(f"  events[{status}]: {events_seen} events scanned, {len(raw_markets)} nested markets")
    return raw_markets, event_cache


def markets_for_series(series_map, status, warnings, max_series_per_topic=250, retry_failed=True):
    """Fetch markets for the discovered series of each topic, concurrently.

    Series are prioritised by Kalshi's own `last_updated_ts` so the most active
    series are always covered when a topic has more series than the cap.
    """
    by_topic = {t: [] for t in TOPIC_ORDER}
    for ticker, meta in series_map.items():
        by_topic[meta["topic"]].append((ticker, meta))

    jobs = []
    for topic, items in by_topic.items():
        items.sort(key=lambda kv: kv[1].get("last_updated_ts") or "", reverse=True)
        for ticker, meta in items[:max_series_per_topic]:
            jobs.append((ticker, meta))

    def fetch_one(job):
        ticker, meta = job
        url = f"{PROD_BASE}/markets?series_ticker={urllib.parse.quote(ticker)}&status={status}&limit=1000"
        try:
            data = http_json(url, retries=5)
        except ApiError as exc:
            return ticker, meta, [], str(exc)
        return ticker, meta, data.get("markets") or [], None

    out = []
    failed = []

    def drain(batch):
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            futures = [pool.submit(fetch_one, job) for job in batch]
            for fut in concurrent.futures.as_completed(futures):
                ticker, meta, rows, error = fut.result()
                if error:
                    failed.append((ticker, meta, error))
                    continue
                for row in rows:
                    row["series_ticker"] = ticker
                    row["_series_meta"] = meta
                    out.append(row)

    attempted = len(jobs)
    drain(jobs)
    # One paced retry pass: a transient 429 must not silently delete a whole
    # series (and with it every market, candle and alert for that series).
    if failed and retry_failed:
        retry_jobs = [(t, m) for t, m, _ in failed]
        print(f"  [retry] {len(retry_jobs)} series failed ({status}); retrying once, paced")
        failed.clear()
        time.sleep(5)
        drain(retry_jobs)
        for ticker, _meta, error in failed:
            warnings.append(f"Markets failed for series {ticker} ({status}): {error}")
        still_failing = len(failed)
        warnings.append(
            f"Rate limit: {attempted - still_failing} of {attempted} {status} series returned data after "
            f"the paced retry pass; {still_failing} still failed and are excluded from this snapshot."
        )
    elif failed:
        for ticker, _meta, error in failed:
            warnings.append(f"Markets failed for series {ticker} ({status}): {error}")
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
        per_event = max(1, MAX_MARKETS_PER_TOPIC // MAX_EVENTS_PER_TOPIC)
        for event_ticker, members in ranked:
            if kept >= MAX_MARKETS_PER_TOPIC:
                break
            members.sort(key=lambda x: x["volume"], reverse=True)
            added = 0
            for m in members:
                if kept >= MAX_MARKETS_PER_TOPIC or added >= per_event:
                    break
                markets_out.append(m)
                kept += 1
                added += 1
            if not added:
                continue
            selected_events.append({
                "event_ticker": event_ticker,
                "topic": topic,
                "volume_total": round(sum(x["volume"] for x in members), 2),
                # Number of markets published for this event (not the number that exist):
                # only `per_event` markets per event are published, so this is not "all markets".
                "market_count_tracked": added,
            })
    return markets_out, selected_events, by_topic


def enrich_events(events, warnings, event_cache=None):
    """Fetch official event metadata (title, settlement sources) per event."""
    cache = event_cache or {}
    for ev in events:
        ticker = ev["event_ticker"]
        cached = cache.get(ticker)
        if cached and cached.get("title"):
            ev["title"] = cached.get("title")
            ev["sub_title"] = cached.get("sub_title")
            ev["category"] = cached.get("category")
            ev["mutually_exclusive"] = cached.get("mutually_exclusive")
            ev["settlement_sources"] = cached.get("settlement_sources") or []
            ev["last_updated_ts"] = cached.get("last_updated_ts")
            continue
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


def fetch_orderbooks(markets, warnings, max_markets=80):
    """Attach a real orderbook snapshot + derived liquidity metrics.

    Markets that carry candles are prioritised so the chart and the liquidity
    ladder always describe the same contract.
    """
    count = 0
    ordered = sorted(
        markets,
        key=lambda m: (1 if m.get("candles") else 0, m.get("volume_24h") or 0, m.get("volume") or 0),
        reverse=True,
    )
    for m in ordered:
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
        m1_full = to_series(m1.get("candlesticks") or [])
        m["_m1_24h"] = m1_full
        m["candles"] = {
            "window_m1_start_ts": now - CANDLE_LOOKBACK_HOURS * 3600,
            "publish_m1_start_ts": publish_cutoff,
            "window_h1_start_ts": now - 3 * 86400,
            "m1": [row for row in m1_full if (row[0] or 0) >= publish_cutoff],
            "h1": to_series(h1.get("candlesticks") or []),
            "periods": "period_interval=1 (1 minute) and period_interval=60 (1 hour)",
            "source_url": f"{PROD_BASE}/series/{series}/markets/{ticker}/candlesticks",
            "docs_url": SOURCES["candles_ref"],
        }
        by_topic_count[topic] += 1
        time.sleep(0.1)


def mark_price(bar):
    """Pick the price that labels a candle, and say which price it is.

    The published feeds must be reproducible from the candle data with one rule.
    The rule is: last trade close if the bar traded, otherwise the mid of the
    closing bid and ask, otherwise whichever of the two exists. Mixing the ask of
    one bar with the bid of the next would fabricate $0.10 moves out of a spread
    that never changed, so a single basis is chosen per bar and recorded.
    """
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


def detect_swings(markets, events_by_ticker):
    """Detect real >= $0.10 close-to-close moves from Kalshi candle data.

    Also returns the largest absolute move observed, so the UI can explain an
    empty feed honestly instead of looking broken.
    """
    alerts = []
    largest = {"abs": 0.0}
    for m in markets:
        candles = m.get("candles")
        if not candles:
            continue
        for label, key, step in (("1m", "m1", 60), ("1h", "h1", 3600)):
            series = (m.get("_m1_24h") if key == "m1" and m.get("_m1_24h") is not None else candles.get(key)) or []
            prev = None
            for bar in series:
                ts, bid, ask, price, vol = (bar + [None] * 5)[:5]
                mark, basis = mark_price(bar)
                if mark is None:
                    continue
                if prev is not None:
                    delta = round(mark - prev[1], 4)
                    gap_min = max(0, round((ts - prev[0]) / 60)) if ts and prev[0] else 0
                    # A move carried only by quotes, with no trade print behind it,
                    # is real but less trustworthy; label it rather than hide it.
                    quote_only = price is None and prev[2] is None
                    if abs(delta) > largest["abs"]:
                        largest = {
                            "abs": abs(delta),
                            "delta": delta,
                            "ticker": m["ticker"],
                            "topic": m["topic"],
                            "ts": ts,
                            "iso_time": datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "from_price": prev[1],
                            "to_price": mark,
                            "price_basis": basis,
                            "quote_only": quote_only,
                            "interval": label,
                        }
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
                            "event_title": ev.get("title") or m.get("event_title"),
                            "from_price": prev[1],
                            "to_price": mark,
                            "price_basis": basis,
                            "quote_only": quote_only,
                            "delta": delta,
                            "direction": "up" if delta > 0 else "down",
                            "interval": f"{label} close-to-close" + (f" (gap {gap_min}m)" if gap_min > 2 * step // 60 else ""),
                            "gap_minutes": gap_min,
                            "volume_contracts_in_bar": vol,
                            "kalshi_url": m["kalshi_url"],
                            "candles_url": candles["source_url"],
                        })
                prev = (ts, mark, price)
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
    return deduped, largest


def check_reference_links(warnings):
    out = {}
    for topic, links in TOPIC_REFERENCE_LINKS.items():
        rows = []
        for label, url in links:
            if "kalshi.com/" in url:
                time.sleep(0.65)
            status, note = http_status(url)
            ok = status is not None and 200 <= status < 400
            if not ok:
                warnings.append(f"Reference link not reachable ({status}): {url} {note}".strip())
            rows.append({
                "label": label,
                "url": url,
                "http_status": status,
                "reachable": ok,
            })
        out[topic] = rows
    return out


def build_resolutions(settled_by_topic, events_by_ticker, limit_per_topic=12, warnings=None, event_cache=None):
    rows = []
    cache = event_cache or {}
    settled_event_titles = {}
    seen_tickers = set()
    for topic in TOPIC_ORDER:
        bucket = settled_by_topic.get(topic, [])
        if isinstance(bucket, dict):
            bucket = bucket.get("settled", [])
        deduped = []
        for m in bucket:
            t = m.get("ticker")
            if not t or t in seen_tickers or m.get("result") not in ("yes", "no"):
                continue
            seen_tickers.add(t)
            deduped.append(m)
        deduped.sort(key=lambda m: (m.get("close_time") or "", m.get("volume") or 0), reverse=True)
        # Cap strikes per event_ticker on pass 1 so a 20-strike daily ladder does not
        # crowd out other resolved events in the same topic; backfill if sparse.
        chosen = []
        overflow = []
        per_ev_counts = {}
        for m in deduped:
            ev_t = m.get("event_ticker") or ""
            if per_ev_counts.get(ev_t, 0) < 4:
                chosen.append(m)
                per_ev_counts[ev_t] = per_ev_counts.get(ev_t, 0) + 1
            else:
                overflow.append(m)
            if len(chosen) >= limit_per_topic:
                break
        if len(chosen) < limit_per_topic:
            chosen.extend(overflow[: limit_per_topic - len(chosen)])

        for m in chosen[:limit_per_topic]:
            ev = events_by_ticker.get(m["event_ticker"]) or cache.get(m["event_ticker"]) or {}
            if not ev.get("title"):
                if m["event_ticker"] not in settled_event_titles and warnings is not None:
                    try:
                        data = http_json(
                            f"{PROD_BASE}/events/{urllib.parse.quote(m['event_ticker'])}?with_nested_markets=false"
                        )
                        event = data.get("event") or {}
                        settled_event_titles[m["event_ticker"]] = event.get("title")
                    except ApiError as exc:
                        warnings.append(f"Settled event metadata failed for {m['event_ticker']}: {exc}")
                        settled_event_titles[m["event_ticker"]] = None
                ev = {"title": settled_event_titles.get(m["event_ticker"])}
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


def demo_spot_check(markets, warnings, per_topic=2):
    """Compare demo last prices with production to document divergence.

    Sampled per topic (most-active market first) instead of taking the first N
    rows of the whole list, which in practice were all gas-price contracts and
    made the published comparison look like a single-topic check.
    """
    rows = []
    sample = []
    for topic in TOPIC_ORDER:
        pool = sorted(
            (m for m in markets if m.get("topic") == topic and m.get("status") == "active"),
            key=lambda m: (m.get("volume_24h") or 0, m.get("volume") or 0),
            reverse=True,
        )
        sample.extend(pool[:per_topic])
    for m in sample:
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


def check_official_links(topics_meta, sample_events, warnings):
    """HTTP-check every official link the site publishes.

    Nothing here is assumed: the docs URLs the site cites, the Kalshi category
    pages the topic cards link to, and a sample of the event pages behind the
    published rows are all requested and their status codes recorded. A link
    that does not answer is kept in the output with its measured status and
    flagged, never silently presented as working.
    """
    rows = []

    def add(kind, label, url):
        if "kalshi.com/" in url:
            time.sleep(0.65)
        status, note = http_status(url, timeout=20)
        ok = status is not None and 200 <= status < 400
        if not ok:
            warnings.append(f"Official link not reachable ({status}): {url} {note}".strip())
        rows.append({"kind": kind, "label": label, "url": url, "http_status": status, "reachable": ok})
        time.sleep(0.08)

    for key, url in SOURCES.items():
        add("kalshi-docs", f"docs.{key}", url)
    for topic in TOPIC_ORDER:
        meta = topics_meta.get(topic) or {}
        add("kalshi-category", f"{topic} category page", meta["kalshi_category_url"])
    for ev in sample_events[:6]:
        add("kalshi-event", ev.get("event_ticker") or "", ev.get("kalshi_url") or "")

    reachable = sum(1 for r in rows if r["reachable"])
    return {
        "checked_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(rows),
        "reachable": reachable,
        "unreachable": len(rows) - reachable,
        "note": "HTTP status codes measured by the snapshot job at build time. A non-200/3xx status is reported here rather than assumed working; the GitHub-hosted runner may see different blocking than your browser.",
        "rows": rows,
    }


def refresh_cadence(warnings):
    """Measure the real refresh cadence from the committed run history.

    The cron in .github/workflows/refresh-data.yml asks for every 30 minutes, but
    GitHub only guarantees best-effort scheduling and this repository's runs have
    been much further apart. Rather than claim a cadence the site does not
    deliver, the measured gaps are computed here and published.
    """
    out = {
        "source": "assets/data/refresh-history.json (appended by the GitHub Actions refresh job)",
        "requested_cron": "*/30 * * * * (every 30 minutes, best effort on GitHub-hosted runners)",
        "runs_recorded": 0,
    }
    if not REFRESH_HISTORY_PATH.exists():
        out["measured"] = None
        out["note"] = "No run history yet; the first refresh after this change starts it."
        return out
    try:
        history = json.loads(REFRESH_HISTORY_PATH.read_text())
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"refresh-history.json unreadable: {exc}")
        out["measured"] = None
        return out
    stamps = []
    for item in history if isinstance(history, list) else history.get("runs", []):
        raw = item.get("at") if isinstance(item, dict) else item
        if not raw:
            continue
        try:
            stamps.append(datetime.fromisoformat(str(raw).replace("Z", "+00:00")))
        except ValueError:
            continue
    stamps.sort()
    out["runs_recorded"] = len(stamps)
    if len(stamps) >= 2:
        gaps = [
            (stamps[i + 1] - stamps[i]).total_seconds() / 3600
            for i in range(len(stamps) - 1)
            if 0 < (stamps[i + 1] - stamps[i]).total_seconds() < 7 * 86400
        ]
        if gaps:
            gaps_sorted = sorted(gaps)
            out["measured"] = {
                "runs_used": len(gaps) + 1,
                "first_run": stamps[0].strftime("%Y-%m-%dT%H:%M:%SZ"),
                "last_run": stamps[-1].strftime("%Y-%m-%dT%H:%M:%SZ"),
                "median_gap_hours": round(gaps_sorted[len(gaps_sorted) // 2], 2),
                "mean_gap_hours": round(sum(gaps) / len(gaps), 2),
                "max_gap_hours": round(max(gaps), 2),
                "min_gap_hours": round(min(gaps), 2),
                "gaps_under_one_hour": sum(1 for g in gaps if g < 1),
                "gaps_under_1h": sum(1 for g in gaps if g < 1),
                "gap_count": len(gaps),
            }
            out["note"] = (
                "Measured from this repository's own commit history. GitHub Actions cron is best-effort, "
                "so the delivered cadence is slower than the requested cron; the dashboard shows the "
                "snapshot age so a stale snapshot is visible."
            )
    return out


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
            status, note = http_status(claim["url"], timeout=20)
            row["url_http_status"] = status
            if status == 429:
                row["notes"].append(
                    "kalshi.com rate-limited the audit runner (HTTP 429), so this page's status is "
                    "unmeasured this run — not broken."
                )
            elif note:
                row["notes"].append(f"URL check note: {note}")
            time.sleep(0.3)
        rows.append(row)
        time.sleep(0.15)

    found = sum(1 for r in rows if r["api_found"])
    event_only = sum(1 for r in rows if r["api_event_found"] and not r["api_found"])
    absent = len(rows) - found - event_only
    summary = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "api_base": PROD_BASE,
        "claims_checked": len(rows),
        "claims_found_in_api": found,
        "claims_found_as_market": found,
        "claims_found_as_event_only": event_only,
        "claims_absent_from_api": absent,
        "claims_not_found_in_api": len(rows) - found,
        "note": (
            "Three outcomes are reported separately because they mean different things: "
            "'market' = GET /markets/{ticker} returned a market record (the claim can be checked as a market); "
            "'event-only' = the ticker is a Kalshi EVENT ticker, so it exists on Kalshi but the claimed market-level "
            "price/volume cannot be true; 'absent' = neither a market nor an event answered."
        ),
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

    print("Scanning full Kalshi open events catalog (with nested markets) ...")
    raw_open_all, event_cache = scan_events_catalog(series_map, "open", warnings, max_pages=80)
    if not raw_open_all:
        print("  [fallback] events catalog empty; falling back to per-series open market scan")
        raw_open_all = markets_for_series(series_map, "open", warnings, max_series_per_topic=1500)

    raw_open = []
    nested_settled = []
    for m in raw_open_all:
        st = (m.get("status") or "").lower()
        res = (m.get("result") or "").lower()
        if res in ("yes", "no") or st in ("finalized", "settled"):
            nested_settled.append(m)
        elif st in ("active", "open", ""):
            raw_open.append(m)

    open_markets = normalize_all(raw_open, warnings)
    print(f"  {len(open_markets)} open topic markets after filtering (from {len(raw_open)} open markets scanned)")

    stats = {
        "series_discovered": len(series_map),
        "open_markets_scanned": len(raw_open),
        "open_topic_markets": len(open_markets),
    }

    markets, events, _by_topic_open = select_topics(open_markets, [], warnings)
    print(f"Selected {len(markets)} markets across {len(events)} events")

    # Resolutions: scan recently settled events across the catalog + tracked series.
    cutoff = datetime.now(timezone.utc) - timedelta(days=SETTLED_LOOKBACK_DAYS)
    tracked_series = sorted({m["series_ticker"] for m in markets})
    resolved_series_map = {t: series_map[t] for t in tracked_series if t in series_map}
    print(f"Fetching recent settlements (catalog + {len(resolved_series_map)} tracked series) ...")
    raw_settled_catalog, settled_ev_cache = scan_events_catalog(
        series_map, "settled", warnings, min_close_ts=int(cutoff.timestamp()), max_pages=25
    )
    event_cache.update({k: v for k, v in settled_ev_cache.items() if k not in event_cache})
    raw_settled_series = markets_for_series(resolved_series_map, "settled", warnings)
    raw_settled = nested_settled + raw_settled_catalog + raw_settled_series
    seen_settled = set()
    recent_raw = []
    for m in raw_settled:
        t = m.get("ticker")
        if not t or t in seen_settled:
            continue
        close = m.get("close_time") or m.get("expected_expiration_time")
        if not close:
            continue
        try:
            ts = datetime.fromisoformat(str(close).replace("Z", "+00:00"))
            if ts < cutoff:
                continue
        except ValueError:
            continue
        seen_settled.add(t)
        recent_raw.append(m)
    settled_markets = normalize_all(recent_raw, warnings)
    stats["settled_markets_scanned"] = len(raw_settled)
    stats["settled_markets_recent"] = len(settled_markets)
    stats["settled_lookback_days"] = SETTLED_LOOKBACK_DAYS

    _markets2, _events2, by_topic = select_topics(markets, settled_markets, warnings)

    events_by_ticker = {}
    for ev in events:
        events_by_ticker.setdefault(ev["event_ticker"], ev)
    enrich_events(events_by_ticker.values(), warnings, event_cache=event_cache)

    for m in markets:
        m["event_title"] = events_by_ticker.get(m["event_ticker"], {}).get("title")

    fetch_candles(markets, warnings)
    fetch_orderbooks(markets, warnings)
    alerts, largest_move = detect_swings(markets, events_by_ticker)
    for m in markets:
        m.pop("_m1_24h", None)
    resolutions = build_resolutions(by_topic, events_by_ticker, warnings=warnings, event_cache=event_cache)
    reference_links = check_reference_links(warnings)

    demo_rows = demo_spot_check(markets, warnings) if args.demo_check else []

    if args.audit_legacy:
        audit_legacy(warnings)

    # Attach orderbook-derived liquidity to the flat market list by reference;
    # keep events with their market tickers so the UI can group them.
    for ev in events_by_ticker.values():
        if not ev.get("event_ticker"):
            continue
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
        # Resolution counters are counted over *settled* markets of this event, not over
        # the (still open) markets above, which by definition have no result yet.
        ev["resolved_yes"] = sum(
            1 for m in settled_markets
            if m["event_ticker"] == ev["event_ticker"] and (m.get("result") or "").lower() == "yes"
        )
        ev["resolved_no"] = sum(
            1 for m in settled_markets
            if m["event_ticker"] == ev["event_ticker"] and (m.get("result") or "").lower() == "no"
        )
        ev["markets_published"] = ev["market_count"]
        ev["est_dollars_method"] = "sum over published markets of volume_fp x last_price_dollars (estimate; Kalshi publishes contract volume, not dollar volume)"

    topics_meta = {}
    for topic in TOPIC_ORDER:
        rule = TOPIC_RULES[topic]
        topics_meta[topic] = {
            "id": topic,
            "name": rule["name"],
            "inclusion_rule": rule["why"],
            "prefixes": rule["prefixes"],
            "keywords": rule["keywords"],
            "kalshi_category_url": KALSHI_TOPIC_PAGE[topic],
            "reference_links": reference_links.get(topic, []),
            "market_count": sum(1 for m in markets if m["topic"] == topic),
            "event_count": sum(1 for e in events if e["topic"] == topic),
        }

    # Measured (not assumed) official-link status and refresh cadence.
    by_volume = sorted(events_by_ticker.values(), key=lambda e: e.get("volume_total") or 0, reverse=True)
    official_links = check_official_links(topics_meta, by_volume, warnings)
    for topic in TOPIC_ORDER:
        page_url = topics_meta[topic]["kalshi_category_url"]
        match = next((r for r in official_links["rows"] if r["url"] == page_url), None)
        topics_meta[topic]["kalshi_category_http_status"] = match["http_status"] if match else None
        topics_meta[topic]["kalshi_category_reachable"] = bool(match and match["reachable"])
    cadence = refresh_cadence(warnings)

    deduped_warnings = []
    for w in warnings:
        if w not in deduped_warnings:
            deduped_warnings.append(w)
    warnings = deduped_warnings

    snapshot = {
        "schema_version": 2,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generator": "scripts/fetch_kalshi_data.py",
        "environment": "production public market data (no authentication)",
        "api_base": PROD_BASE,
        "docs": SOURCES,
        "metrics": {
            "swing_threshold_usd": SWING_THRESHOLD,
            "swing_definition": (
                "Absolute change between consecutive candle marks (last trade close when the bar traded, "
                "else closing bid/ask mid, else closing ask or bid; quote_only=true when neither bar traded) "
                "of at least $0.10 per contract."
            ),
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
            "largest_move": largest_move,
            "candle_lookback_hours": CANDLE_LOOKBACK_HOURS,
            "candle_publish_hours": CANDLE_PUBLISH_HOURS,
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
        "official_links": official_links,
        "refresh_cadence": cadence,
        "warning_summary": {
            "total": len(warnings),
            "rate_limited_series": sum(1 for w in warnings if "429" in w or "too_many_requests" in w),
            "unreachable_official_links": official_links["unreachable"],
            "note": "429 entries mean the public API throttled the refresh for that series; the retry pass above records what recovered. Nothing is filled in for a failed request.",
        },
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
