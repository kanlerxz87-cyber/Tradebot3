#!/usr/bin/env python3
"""
Tradebot3 — pre-publish verification.

Checks (all offline, no network needed):
  1. Every required file exists.
  2. Every internal link in the HTML resolves to a real file (no 404s, no dead anchors within a page).
  3. Every ES-module import path resolves.
  4. Every DOM id used by each page's script exists in that page.
  5. assets/data/snapshot.json obeys the schema and the five-topic rule.
  6. Every published market/event/alert/resolution carries an official https source URL.
  7. The legacy audit covers all 29 archived claims.
  8. Removed legacy modules are not referenced anywhere.

Exit code 0 = publishable. Run: python3 scripts/verify_site.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
ALLOWED_TOPICS = ["gas-prices", "elections", "culture", "crypto", "golf"]

REQUIRED = [
    "index.html",
    "portfolio.html",
    "verification.html",
    "flagged-for-review.html",
    "executive-summary.html",
    "categories/gas-prices.html",
    "categories/elections.html",
    "categories/culture.html",
    "categories/crypto.html",
    "categories/golf.html",
    "assets/css/styles.css",
    "assets/js/core.js",
    "assets/js/market-data.js",
    "assets/js/chart.js",
    "assets/js/alerts.js",
    "assets/js/orderbook.js",
    "assets/js/paper.js",
    "assets/js/strategy.js",
    "assets/js/dashboard.js",
    "assets/js/category.js",
    "assets/js/portfolio.js",
    "assets/js/verification.js",
    "assets/js/flagged.js",
    "assets/data/snapshot.json",
    "assets/data/legacy-audit.json",
    "scripts/fetch_kalshi_data.py",
    "scripts/verify_site.py",
    "scripts/test_modules.mjs",
    "assets/data/refresh-history.json",
    ".github/workflows/refresh-data.yml",
    "README.md",
    "COORDINATION.md",
    "EXECUTIVE_SUMMARY.md",
    ".nojekyll",
]

PAGE_SCRIPTS = {
    "index.html": "assets/js/dashboard.js",
    "portfolio.html": "assets/js/portfolio.js",
    "verification.html": "assets/js/verification.js",
    "flagged-for-review.html": "assets/js/flagged.js",
    "executive-summary.html": None,  # inline module
}
for topic in ALLOWED_TOPICS:
    PAGE_SCRIPTS[f"categories/{topic}.html"] = "assets/js/category.js"

REMOVED_MODULES = [
    "assets/js/data.js",
    "assets/js/engine.js",
    "assets/js/charts.js",
    "assets/js/ui-common.js",
    "assets/js/kalshi-client.js",
    "assets/js/category-page.js",
    "assets/js/portfolio-page.js",
    "assets/js/verification-page.js",
]

errors: list[str] = []
warnings: list[str] = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def check_files():
    for rel in REQUIRED:
        if not (ROOT / rel).exists():
            err(f"missing required file: {rel}")


HTML_FILES = [p for p in ROOT.rglob("*.html") if ".git" not in p.parts]

LINK_RE = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"')


def check_links():
    total = 0
    for page in HTML_FILES:
        rel_page = page.relative_to(ROOT)
        html = page.read_text(encoding="utf-8")
        ids = set(re.findall(r'id="([^"]+)"', html))
        for link in LINK_RE.findall(html):
            if link.startswith(("http://", "https://", "mailto:", "data:", "#", "javascript:")):
                if link.startswith("#") and len(link) > 1:
                    if link[1:] not in ids:
                        err(f"{rel_page}: anchor #{link[1:]} does not exist on this page")
                continue
            total += 1
            target = (page.parent / link.split("#")[0]).resolve()
            if not target.exists():
                err(f"{rel_page}: broken internal link '{link}'")
                continue
            if "#" in link and target.suffix == ".html":
                anchor = link.split("#", 1)[1]
                if anchor and anchor not in set(re.findall(r'id="([^"]+)"', target.read_text(encoding='utf-8'))):
                    warn(f"{rel_page}: cross-page anchor '{link}' not found")
    return total


IMPORT_RE = re.compile(r"from\s+['\"]([^'\"]+)['\"]")


def check_module_imports():
    count = 0
    for js in (ROOT / "assets" / "js").glob("*.js"):
        text = js.read_text(encoding="utf-8")
        for spec in IMPORT_RE.findall(text):
            if not spec.startswith("."):
                err(f"{js.name}: bare import '{spec}' (site must stay dependency-free)")
                continue
            count += 1
            target = (js.parent / spec).resolve()
            if not target.exists():
                err(f"{js.name}: import '{spec}' does not resolve")
    return count


ID_USE_RE = re.compile(r"(?:getElementById|qs)\(\s*['\"]#([A-Za-z0-9_-]+)['\"]")


def check_dom_ids():
    """Every #id a page script looks up should exist in that page's HTML."""
    for page_rel, script_rel in PAGE_SCRIPTS.items():
        page = ROOT / page_rel
        if not page.exists():
            continue
        html = page.read_text(encoding="utf-8")
        ids = set(re.findall(r'id="([^"]+)"', html))
        scripts = []
        if script_rel:
            scripts.append(ROOT / script_rel)
        else:
            inline = re.findall(r"<script[^>]*type=\"module\"[^>]*>(.*?)</script>", html, re.S)
            used = set()
            for block in inline:
                used |= set(ID_USE_RE.findall(block))
            for missing in sorted(used - ids):
                err(f"{page_rel}: inline script references missing id #{missing}")
            continue
        for script in scripts:
            if not script.exists():
                continue
            used = set(ID_USE_RE.findall(script.read_text(encoding="utf-8")))
            # ids provided by shared helpers for optional widgets are allowed to be absent
            optional = {"site-header", "site-footer", "chart-tooltip", "chart-popover", "toast-host"}
            for missing in sorted(used - ids - optional):
                err(f"{page_rel}: {script.name} references missing id #{missing}")


def is_official(url: str) -> bool:
    if not isinstance(url, str) or not url.startswith("https://"):
        return False
    host = urlparse(url).hostname or ""
    return host.endswith("kalshi.com") or host.endswith("kalshi.co")


def check_snapshot():
    path = ROOT / "assets/data/snapshot.json"
    if not path.exists():
        return
    snap = json.loads(path.read_text())
    for key in ("generated_at", "api_base", "metrics", "stats", "topics", "events", "markets", "alerts", "resolutions"):
        if key not in snap:
            err(f"snapshot.json missing key '{key}'")
    markets = snap.get("markets") or []
    events = snap.get("events") or []
    alerts = snap.get("alerts") or []
    resolutions = snap.get("resolutions") or []
    if not markets:
        err("snapshot.json contains no markets")
    if not events:
        err("snapshot.json contains no events")

    for m in markets:
        tag = m.get("ticker", "?")
        if m.get("topic") not in ALLOWED_TOPICS:
            err(f"market {tag}: topic '{m.get('topic')}' is outside the five allowed topics")
        for field in ("ticker", "event_ticker", "title", "api_url", "field_source", "kalshi_url"):
            if not m.get(field):
                err(f"market {tag}: missing '{field}'")
        if not is_official(m.get("api_url", "")) or not is_official(m.get("kalshi_url", "")):
            err(f"market {tag}: source URLs are not official Kalshi URLs")
        if m.get("volume") is None:
            err(f"market {tag}: volume missing (should be 0 or a number, never blank)")

    for ev in events:
        if not ev.get("kalshi_url") or not is_official(ev["kalshi_url"]):
            err(f"event {ev.get('event_ticker')}: missing official Kalshi URL")
        if ev.get("topic") not in ALLOWED_TOPICS:
            err(f"event {ev.get('event_ticker')}: bad topic")
        if not ev.get("market_tickers"):
            err(f"event {ev.get('event_ticker')}: no market tickers")

    for a in alerts:
        if a.get("topic") not in ALLOWED_TOPICS:
            err(f"alert {a.get('ticker')}: bad topic")
        if not isinstance(a.get("delta"), (int, float)) or abs(a["delta"]) < 0.10 - 1e-9:
            err(f"alert {a.get('ticker')}: delta {a.get('delta')} is below the $0.10 threshold")
        if not a.get("kalshi_url") or not is_official(a["kalshi_url"]):
            err(f"alert {a.get('ticker')}: missing official Kalshi URL")

    for r in resolutions:
        if str(r.get("result", "")).lower() not in ("yes", "no"):
            err(f"resolution {r.get('ticker')}: result must be YES or NO")
        if not r.get("kalshi_url") or not is_official(r["kalshi_url"]):
            err(f"resolution {r.get('ticker')}: missing official Kalshi URL")

    if not snap.get("warnings"):
        warn("snapshot.json has no warnings array content (fine, but unusual)")

    # --- promise-vs-code checks added 2026-11-27 -----------------------------
    # Every official link the site publishes must carry a measured status.
    links = snap.get("official_links") or {}
    rows = links.get("rows") or []
    if not rows:
        err("snapshot.json has no official_links measurements")
    for row in rows:
        if "http_status" not in row or "reachable" not in row:
            err(f"official link {row.get('url')}: no measured status")
        if "http_status" in row and row["http_status"] is None:
            warn(f"official link {row.get('url')}: no response at last check")
    reachable = sum(1 for r in rows if r.get("reachable"))
    if links and links.get("reachable") != reachable:
        err("official_links.reachable does not match its rows")

    # Refresh cadence must be present and must be measured, not asserted.
    cadence = snap.get("refresh_cadence") or {}
    if "requested_cron" not in cadence:
        err("snapshot.json has no refresh_cadence.requested_cron")
    measured = (cadence.get("measured") or {})
    if measured:
        for key in ("median_gap_hours", "max_gap_hours", "runs_used", "gap_count"):
            if not isinstance(measured.get(key), (int, float)):
                err(f"refresh_cadence.measured.{key} missing")
        if measured.get("median_gap_hours", 0) < 0:
            err("refresh_cadence median gap is negative")

    # Every topic page link must be one of the verified category pages.
    for topic, meta in (snap.get("topics") or {}).items():
        url = meta.get("kalshi_category_url")
        if not url or not is_official(url):
            err(f"topic {topic}: kalshi_category_url is not an official Kalshi URL")
        if meta.get("kalshi_category_http_status") is None:
            warn(f"topic {topic}: category page status not measured")

    # Events must report how many markets they actually publish.
    for ev in events:
        if ev.get("markets_published") is not None and ev.get("market_count") is not None:
            if ev["markets_published"] != ev["market_count"]:
                err(f"event {ev.get('event_ticker')}: markets_published != market_count")

    # Resolutions must fall inside the advertised window.
    window = snap.get("resolution_window") or {}
    if window.get("lookback_days"):
        import datetime as _dt
        cutoff = _dt.datetime.now(_dt.timezone.utc) - _dt.timedelta(days=window["lookback_days"] + 1)
        for r in resolutions:
            try:
                close = _dt.datetime.fromisoformat(str(r.get("close_time")).replace("Z", "+00:00"))
            except ValueError:
                continue
            if close < cutoff:
                err(f"resolution {r.get('ticker')}: close_time {r.get('close_time')} is outside the "
                    f"{window['lookback_days']}-day window the page advertises")

    print(f"  snapshot: {len(markets)} markets, {len(events)} events, {len(alerts)} alerts, {len(resolutions)} resolutions")


def check_legacy_audit():
    path = ROOT / "assets/data/legacy-audit.json"
    if not path.exists():
        return
    audit = json.loads(path.read_text())
    rows = audit.get("rows") or []
    if len(rows) != 29:
        err(f"legacy audit must cover 29 claims, found {len(rows)}")
    for row in rows:
        if "api_found" not in row:
            err(f"legacy audit row {row.get('ticker')}: missing api_found")
    print(f"  legacy audit: {audit.get('claims_found_in_api')} of {len(rows)} claims exist in the live API")


def check_removed_modules():
    patterns = [
        (gone, re.compile(rf"['\"](?:\./|/)?(?:assets/js/)?{re.escape(Path(gone).name)}['\"]"))
        for gone in REMOVED_MODULES
    ]
    for page in HTML_FILES:
        text = page.read_text(encoding="utf-8")
        for gone, pattern in patterns:
            if pattern.search(text):
                err(f"{page.relative_to(ROOT)} still references removed module {gone}")
    for js in (ROOT / "assets" / "js").glob("*.js"):
        text = js.read_text(encoding="utf-8")
        for gone, pattern in patterns:
            if js.name != Path(gone).name and pattern.search(text):
                err(f"{js.name} still imports removed module {gone}")


def main():
    print("Tradebot3 site verification")
    check_files()
    links = check_links()
    imports = check_module_imports()
    check_dom_ids()
    check_snapshot()
    check_legacy_audit()
    check_removed_modules()

    print(f"  internal links checked: {links}")
    print(f"  module imports checked: {imports}")
    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings:
            print("  !", w)
    if errors:
        print(f"\nFAILED with {len(errors)} error(s):")
        for e in errors:
            print("  x", e)
        return 1
    print("\nOK — site is internally consistent and publishable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
