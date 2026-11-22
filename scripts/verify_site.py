#!/usr/bin/env python3
"""
Tradebot3 Automated Site, Link, Data & Logic Verification Script
Verifies:
  1. All required repository and GitHub Pages files exist.
  2. Zero broken internal links across all HTML files.
  3. Strict 5-topic isolation (gas-prices, elections, culture, crypto, golf ONLY).
  4. Every table row in data.js carries a valid https:// official sourceUrl.
  5. Kalshi official orderbook_fp reciprocal calculation and engine trading/alert logic pass.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REQUIRED_FILES = [
    ".nojekyll",
    "COORDINATION.md",
    "EXECUTIVE_SUMMARY.md",
    "README.md",
    "index.html",
    "portfolio.html",
    "verification.html",
    "flagged-for-review.html",
    "categories/gas-prices.html",
    "categories/elections.html",
    "categories/culture.html",
    "categories/crypto.html",
    "categories/golf.html",
    "assets/css/styles.css",
    "assets/js/data.js",
    "assets/js/kalshi-client.js",
    "assets/js/engine.js",
    "assets/js/charts.js",
    "assets/js/ui-common.js",
    "assets/js/dashboard.js",
    "assets/js/category-page.js",
    "assets/js/portfolio-page.js",
    "assets/js/verification-page.js",
]


def check_required_files():
    missing = [f for f in REQUIRED_FILES if not (ROOT / f).exists()]
    if missing:
        raise AssertionError(f"Missing required files: {missing}")
    print(f"[PASS] All {len(REQUIRED_FILES)} required files exist.")


def check_internal_links():
    html_files = list(ROOT.glob("*.html")) + list((ROOT / "categories").glob("*.html"))
    attr_re = re.compile(r"""(?:href|src)=["']([^"']+)["']""")
    broken = []
    checked = 0

    for html_path in html_files:
        text = html_path.read_text(encoding="utf-8")
        for match in attr_re.finditer(text):
            target = match.group(1).strip()
            if (
                not target
                or target.startswith(("http://", "https://", "wss://", "mailto:", "#", "javascript:"))
            ):
                continue
            clean = target.split("#")[0].split("?")[0]
            resolved = (html_path.parent / clean).resolve()
            checked += 1
            if not resolved.exists():
                broken.append((str(html_path.relative_to(ROOT)), target))

    if broken:
        raise AssertionError(f"Broken internal links found: {broken}")
    print(f"[PASS] Checked {checked} internal HTML links across {len(html_files)} pages — 0 broken.")


def check_js_modules_and_data():
    node_script = r"""
import {
  ALLOWED_TOPICS,
  TOPICS,
  DEMO_API_ENDPOINTS,
  VERIFIED_MARKETS,
  FLAGGED_IRREGULARITIES,
  REPO_AUDIT_ITEMS,
  INTERACTIVE_SUGGESTIONS
} from './assets/js/data.js';
import { parseOrderbookFp } from './assets/js/kalshi-client.js';
import { TradebotEngine } from './assets/js/engine.js';

// 1. Strict 5-topic check
const expectedTopics = ['gas-prices', 'elections', 'culture', 'crypto', 'golf'];
if (JSON.stringify(ALLOWED_TOPICS) !== JSON.stringify(expectedTopics)) {
  throw new Error('ALLOWED_TOPICS mismatch: ' + JSON.stringify(ALLOWED_TOPICS));
}
for (const t of expectedTopics) {
  const count = VERIFIED_MARKETS.filter((m) => m.topic === t).length;
  if (count < 5) throw new Error(`Topic ${t} has fewer than 5 markets (${count})`);
}
for (const m of VERIFIED_MARKETS) {
  if (!expectedTopics.includes(m.topic)) {
    throw new Error(`Disallowed topic detected: ${m.topic} on ${m.ticker}`);
  }
}

// 2. Every table row has a valid https:// official sourceUrl
const checkSources = (name, rows) => {
  if (!rows.length) throw new Error(`Empty dataset: ${name}`);
  for (const r of rows) {
    if (!r.sourceUrl || !r.sourceUrl.startsWith('https://')) {
      throw new Error(`Missing/invalid sourceUrl in ${name}: ${JSON.stringify(r)}`);
    }
  }
};
checkSources('DEMO_API_ENDPOINTS', DEMO_API_ENDPOINTS);
checkSources('VERIFIED_MARKETS', VERIFIED_MARKETS);
checkSources('FLAGGED_IRREGULARITIES', FLAGGED_IRREGULARITIES);
checkSources('REPO_AUDIT_ITEMS', REPO_AUDIT_ITEMS);
checkSources('INTERACTIVE_SUGGESTIONS', INTERACTIVE_SUGGESTIONS);

for (const m of VERIFIED_MARKETS) {
  for (const c of m.catalysts || []) {
    if (!c.url || !c.url.startsWith('https://')) {
      throw new Error(`Invalid catalyst URL on ${m.ticker}: ${JSON.stringify(c)}`);
    }
  }
}

// 3. Official Kalshi orderbook_fp reciprocal test (from docs.kalshi.com example)
const ob = parseOrderbookFp({
  orderbook_fp: {
    yes_dollars: [['0.3500', '11.00'], ['0.4200', '13.00']],
    no_dollars: [['0.4500', '20.00'], ['0.5600', '17.00']]
  }
});
if (ob.bestYesBid !== 0.42 || ob.bestYesAsk !== 0.44 || ob.spread !== 0.02) {
  throw new Error('Orderbook reciprocal math failed: ' + JSON.stringify(ob));
}

// 4. Engine live tick, >= $0.10 swing alert, trade execution, resolution & custom strategy test
const eng = new TradebotEngine();
if (eng.portfolio.trades.length !== 0 || Object.keys(eng.portfolio.positions).length !== 0 || eng.portfolio.cashBalance !== 10000) {
  throw new Error('Fresh paper account should start clean at the $10,000 mock balance');
}
if (!eng.allAlerts.length || eng.allAlerts.some((a) => !a.snapshot || a.ts !== null)) {
  throw new Error('Seeded catalog alerts must be labeled snapshots without invented timestamps');
}
const beforeAlerts = eng.allAlerts.length;
eng.runTick('KXPRESNOMD-28');
if (eng.allAlerts.length <= beforeAlerts) {
  throw new Error('Expected >= $0.10 forced swing alert to fire');
}
if (!eng.allAlerts[0].simulated || eng.allAlerts[0].snapshot) {
  throw new Error('Generated alert must be labeled as a simulation, not a live alert');
}
const trade = eng.executePaperTrade({
  ticker: 'KXAAAGASMIN-26DEC31',
  action: 'BUY',
  side: 'YES',
  contracts: 10,
  price: 0.50,
  category: 'News Catalyst'
});
if (!trade || trade.contracts !== 10) throw new Error('Trade execution failed');

const res = eng.simulateResolution('KXAAAGASMIN-26DEC31', 'YES');
if (!res || res.outcome !== 'YES') throw new Error('Simulated resolution failed');

const cs = eng.addCustomStrategy({
  name: 'Test Gas Strategy',
  category: 'News Catalyst',
  topicFilter: 'gas-prices',
  minSwing: 0.10,
  minExpectedRoi: 12,
  maxContracts: 15,
  rule: 'model-edge'
});
if (!cs || !cs.id) throw new Error('Custom strategy creation failed');

const analytics = eng.getCategoryAnalytics();
if (!analytics.length) throw new Error('Category analytics empty');

console.log(JSON.stringify({
  markets: VERIFIED_MARKETS.length,
  apiEndpoints: DEMO_API_ENDPOINTS.length,
  irregularities: FLAGGED_IRREGULARITIES.length,
  unverifiedVolumeMarkets: VERIFIED_MARKETS.filter((m) => m.volumeUsd === null).length,
  resolvedMarkets: VERIFIED_MARKETS.filter((m) => m.status === 'Resolved').length,
  orderbookSpreadCheck: ob.spread,
  alertsAfterForcedSwing: eng.allAlerts.length,
  highRoiAlerts: eng.highRoiAlerts.length
}));
"""
    proc = subprocess.run(
        ["node", "--input-type=module", "-e", node_script],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise AssertionError(f"Node verification failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")
    stats = json.loads(proc.stdout.strip().splitlines()[-1])
    print(f"[PASS] JS modules, 5-topic isolation, official source URLs, orderbook math & engine tests passed: {stats}")


def check_dom_ids():
    pairs = [
        ("index.html", ["assets/js/dashboard.js", "assets/js/ui-common.js"]),
        ("portfolio.html", ["assets/js/portfolio-page.js", "assets/js/ui-common.js"]),
        ("verification.html", ["assets/js/verification-page.js", "assets/js/ui-common.js"]),
        ("flagged-for-review.html", ["assets/js/verification-page.js", "assets/js/ui-common.js"]),
        ("categories/gas-prices.html", ["assets/js/category-page.js", "assets/js/ui-common.js"]),
        ("categories/elections.html", ["assets/js/category-page.js", "assets/js/ui-common.js"]),
        ("categories/culture.html", ["assets/js/category-page.js", "assets/js/ui-common.js"]),
        ("categories/crypto.html", ["assets/js/category-page.js", "assets/js/ui-common.js"]),
        ("categories/golf.html", ["assets/js/category-page.js", "assets/js/ui-common.js"]),
    ]
    for html_file, js_files in pairs:
        html = (ROOT / html_file).read_text(encoding="utf-8")
        ids_in_html = set(re.findall(r'id=["\']([^"\']+)["\']', html))
        for jf in js_files:
            js = (ROOT / jf).read_text(encoding="utf-8")
            for ref in re.findall(r'getElementById\(["\']([^"\']+)["\']\)', js):
                if jf.endswith("verification-page.js"):
                    if html_file == "verification.html" and ref in {"irregularities-body", "unverified-fields-body"}:
                        continue
                    if html_file == "flagged-for-review.html" and ref in {"api-endpoints-body", "repo-audit-body", "suggestions-body"}:
                        continue
                if ref not in ids_in_html:
                    raise AssertionError(f"DOM ID mismatch: {jf} references #{ref} missing in {html_file}")
    print(f"[PASS] Verified all JS getElementById references across all {len(pairs)} HTML pages.")


def main():
    check_required_files()
    check_internal_links()
    check_dom_ids()
    check_js_modules_and_data()
    print("\nALL VERIFICATION CHECKS PASSED.")


if __name__ == "__main__":
    main()
