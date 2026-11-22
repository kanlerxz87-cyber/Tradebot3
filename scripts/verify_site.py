#!/usr/bin/env python3
"""Verify Tradebot3 pages, source references, static-data boundaries, and paper-engine behavior."""

import json
import re
import subprocess
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
    missing = [name for name in REQUIRED_FILES if not (ROOT / name).exists()]
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
            if not target or target.startswith(("http://", "https://", "wss://", "mailto:", "#", "javascript:")):
                continue
            resolved = (html_path.parent / target.split("#")[0].split("?")[0]).resolve()
            checked += 1
            if not resolved.exists():
                broken.append((str(html_path.relative_to(ROOT)), target))
    if broken:
        raise AssertionError(f"Broken internal links found: {broken}")
    print(f"[PASS] Checked {checked} internal HTML links across {len(html_files)} pages — 0 broken.")


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
        ids = set(re.findall(r'id=["\']([^"\']+)["\']', html))
        for js_file in js_files:
            js = (ROOT / js_file).read_text(encoding="utf-8")
            for ref in re.findall(r'getElementById\(["\']([^"\']+)["\']\)', js):
                if js_file.endswith("verification-page.js"):
                    if html_file == "verification.html" and ref in {"irregularities-body", "unverified-fields-body"}:
                        continue
                    if html_file == "flagged-for-review.html" and ref in {"api-endpoints-body", "repo-audit-body", "suggestions-body"}:
                        continue
                if ref not in ids:
                    raise AssertionError(f"DOM ID mismatch: {js_file} references #{ref} missing in {html_file}")
    print(f"[PASS] Verified JS getElementById references across all {len(pairs)} HTML pages.")


def check_js_modules_and_data():
    node_script = r"""
import {
  ALLOWED_TOPICS,
  DEMO_API_ENDPOINTS,
  VERIFIED_MARKETS,
  FLAGGED_IRREGULARITIES,
  REPO_AUDIT_ITEMS,
  INTERACTIVE_SUGGESTIONS
} from './assets/js/data.js';
import { parseOrderbookFp } from './assets/js/kalshi-client.js';
import { TradebotEngine, evaluateModelEdge } from './assets/js/engine.js';

const expectedTopics = ['gas-prices', 'elections', 'culture', 'crypto', 'golf'];
if (JSON.stringify(ALLOWED_TOPICS) !== JSON.stringify(expectedTopics)) {
  throw new Error('ALLOWED_TOPICS mismatch: ' + JSON.stringify(ALLOWED_TOPICS));
}
for (const topic of expectedTopics) {
  const count = VERIFIED_MARKETS.filter((market) => market.topic === topic).length;
  if (count < 5) throw new Error(`Topic ${topic} has fewer than five rows (${count})`);
}
for (const market of VERIFIED_MARKETS) {
  if (!expectedTopics.includes(market.topic)) throw new Error(`Disallowed topic: ${market.topic}`);
  if (!market.eventTicker || !market.contractMatch) throw new Error(`Missing event/contract selector: ${market.ticker}`);
  if (!market.sourceUrl || !market.sourceUrl.startsWith('https://')) throw new Error(`Missing official source: ${market.ticker}`);
  if (market.observedPrice !== null || market.observedSwing !== null) throw new Error(`Static quote/swing must remain blank: ${market.ticker}`);
  if ('modelFairValue' in market) throw new Error(`Unsupported fair value remains: ${market.ticker}`);
  if ('catalysts' in market && market.catalysts.length) throw new Error(`Unverified static catalyst remains: ${market.ticker}`);
  if (!market.catalogAsOf) throw new Error(`Missing catalog snapshot date: ${market.ticker}`);
  if (!market.volumeAsOf) throw new Error(`Missing event-volume snapshot date: ${market.ticker}`);
  if (market.status === 'Resolved' && !['YES', 'NO'].includes(market.resolution)) {
    throw new Error(`Resolved row needs a YES/NO result: ${market.ticker}`);
  }
  if (market.status === 'Needs Review' && market.resolution !== null) {
    throw new Error(`Needs Review row must not assert a result: ${market.ticker}`);
  }
}

const checkSources = (name, rows) => {
  if (!rows.length) throw new Error(`Empty dataset: ${name}`);
  for (const row of rows) {
    if (!row.sourceUrl || !row.sourceUrl.startsWith('https://')) {
      throw new Error(`Missing HTTPS source in ${name}: ${JSON.stringify(row)}`);
    }
  }
};
checkSources('DEMO_API_ENDPOINTS', DEMO_API_ENDPOINTS);
checkSources('VERIFIED_MARKETS', VERIFIED_MARKETS);
checkSources('FLAGGED_IRREGULARITIES', FLAGGED_IRREGULARITIES);
checkSources('REPO_AUDIT_ITEMS', REPO_AUDIT_ITEMS);
checkSources('INTERACTIVE_SUGGESTIONS', INTERACTIVE_SUGGESTIONS);

for (const market of VERIFIED_MARKETS) {
  if (Array.isArray(market.contractMatch) && market.contractMatch.some((value) => !value)) {
    throw new Error(`Empty contract alias: ${market.ticker}`);
  }
}

const orderbook = parseOrderbookFp({
  orderbook_fp: {
    yes_dollars: [['0.3500', '11.00'], ['0.4200', '13.00']],
    no_dollars: [['0.4500', '20.00'], ['0.5600', '17.00']]
  }
});
if (orderbook.bestYesBid !== 0.42 || orderbook.bestYesAsk !== 0.44 || orderbook.spread !== 0.02) {
  throw new Error('Orderbook reciprocal math failed: ' + JSON.stringify(orderbook));
}

const baseEngine = new TradebotEngine();
if (baseEngine.running || baseEngine.refreshTimer || baseEngine.allAlerts.length) {
  throw new Error('Engine must not auto-start or seed simulated/live alerts.');
}
if (baseEngine.markets.some((market) => market.currentPrice !== null)) {
  throw new Error('No quote should be invented before a successful Demo REST response.');
}
const market = baseEngine.getMarket('KXPRESNOMD-28');
const initialLifecycle = market.status;
const simulatedAlert = baseEngine.simulateSwing(market.ticker);
if (!simulatedAlert || !simulatedAlert.simulated || !simulatedAlert.catalystLabel.includes('Synthetic')) {
  throw new Error('Explicit paper swing simulation should be separately labeled.');
}
if (market.currentPrice !== null || market.status !== initialLifecycle) {
  throw new Error('Paper simulation must not change a Demo quote or market lifecycle.');
}

const trade = baseEngine.executePaperTrade({
  ticker: 'KXAAAGASMIN-26DEC31',
  action: 'BUY',
  side: 'YES',
  contracts: 10,
  price: 0.50,
  category: 'News Catalyst'
});
if (!trade || trade.contracts !== 10 || trade.mode !== 'Paper Simulation') throw new Error('Paper trade labeling failed.');
if (baseEngine.getPortfolioSummary().totalEquity !== null) throw new Error('Unmarked paper position should not produce fabricated equity.');
const gasMarket = baseEngine.getMarket('KXAAAGASMIN-26DEC31');
const lifecycleBeforeSettlement = `${gasMarket.status}:${gasMarket.resolution}`;
const paperSettlement = baseEngine.simulateResolution(gasMarket.ticker, 'YES');
if (!paperSettlement || paperSettlement.outcome !== 'YES') throw new Error('Paper settlement test failed.');
if (`${gasMarket.status}:${gasMarket.resolution}` !== lifecycleBeforeSettlement) {
  throw new Error('Paper settlement must not mutate exchange/catalog lifecycle.');
}

const strategy = baseEngine.addCustomStrategy({
  name: 'Test paper gas strategy',
  category: 'News Catalyst',
  topicFilter: 'gas-prices',
  minSwing: 0.10,
  minExpectedRoi: 12,
  maxContracts: 15,
  rule: 'model-edge'
});
if (!strategy || !strategy.id) throw new Error('Custom paper strategy creation failed.');
if (evaluateModelEdge(gasMarket, 0.5).qualified) throw new Error('A model signal must not be generated without sourced fair value.');

let nextPrice = '0.0600';
const fakeClient = {
  baseUrl: 'https://external-api.demo.kalshi.co/trade-api/v2',
  lastStatus: { connected: false },
  getEventUrl: (ticker) => `https://external-api.demo.kalshi.co/trade-api/v2/events/${ticker}`,
  getEvent: async () => ({ markets: [{
    ticker: 'KXAAAGASMAX-26DEC31-4.60',
    yes_sub_title: 'Above $4.60',
    status: 'active',
    result: '',
    last_price_dollars: nextPrice
  }] }),
  getMarketOrderbook: async () => orderbook
};
const restEngine = new TradebotEngine({ client: fakeClient });
const singleMarket = restEngine.getMarket('KXAAAGASMAX-26DEC31');
restEngine.markets = [singleMarket];
const firstRefresh = await restEngine.refreshMarketData();
if (firstRefresh.fetched !== 1 || singleMarket.currentPrice !== 0.06 || singleMarket.dataStatus !== 'demo-rest') {
  throw new Error('A matching Demo REST event should populate the verified contract quote.');
}
nextPrice = '0.1600';
await restEngine.refreshMarketData();
if (restEngine.allAlerts.length !== 1 || restEngine.allAlerts[0].simulated || restEngine.allAlerts[0].delta !== 0.1) {
  throw new Error('>= $0.10 REST snapshot change should create a non-streaming REST-tagged alert.');
}
const bookResult = await restEngine.refreshOrderbook(singleMarket.ticker);
if (!bookResult.ok || singleMarket.orderbook.source !== 'demo-rest') throw new Error('Demo REST orderbook tagging failed.');

console.log(JSON.stringify({
  topics: ALLOWED_TOPICS.length,
  markets: VERIFIED_MARKETS.length,
  apiEndpoints: DEMO_API_ENDPOINTS.length,
  irregularities: FLAGGED_IRREGULARITIES.length,
  staticQuoteFieldsBlank: VERIFIED_MARKETS.every((market) => market.observedPrice === null && market.observedSwing === null),
  unresolvedMarkets: VERIFIED_MARKETS.filter((market) => market.status === 'Needs Review').length,
  orderbookSpreadCheck: orderbook.spread,
  initialAlerts: 0,
  paperSimulationTagged: simulatedAlert.simulated,
  demoRestSnapshotAlerts: restEngine.allAlerts.length,
  paperTradesNotSubmitted: trade.mode === 'Paper Simulation'
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
    print(f"[PASS] Five-topic data, sources, quote boundaries, REST updates, paper isolation and orderbook tests passed: {stats}")


def check_no_order_submission():
    app_files = [
        ROOT / "assets/js/dashboard.js",
        ROOT / "assets/js/category-page.js",
        ROOT / "assets/js/portfolio-page.js",
        ROOT / "assets/js/engine.js",
        ROOT / "assets/js/kalshi-client.js",
    ]
    offenders = []
    for path in app_files:
        text = path.read_text(encoding="utf-8")
        if ".createOrderV2(" in text:
            offenders.append(str(path.relative_to(ROOT)))
        if "request('POST'" in text or 'request("POST"' in text:
            offenders.append(str(path.relative_to(ROOT)))
    if offenders:
        raise AssertionError(f"Order submission must stay unimplemented: {sorted(set(offenders))}")
    print("[PASS] No app module can submit a Kalshi order; only public reads and a read-only balance GET exist.")


STALE_DOC_PATTERNS = [
    (r"real[- ]time scrolling", "claims a real-time scrolling feed"),
    (r"live event dashboard", "claims a live event dashboard"),
    (r"high[- ]roi model(?: chat)? feed", "claims a working high-ROI model feed"),
    (r"quantitative high[- ]roi model", "claims a quantitative model"),
    (r"seconds-level charts", "claims seconds-level chart history"),
    (r"zero[- ]latency", "claims zero-latency execution"),
    (r"live tick engine", "claims a live tick engine"),
    (r"trade execution ticket", "claims exchange trade execution"),
    (r"automated strategy simulator", "claims unattended strategy execution"),
    (r"full trade execution", "claims exchange trade execution"),
]


def check_doc_claims():
    doc_files = [
        ROOT / "README.md",
        ROOT / "EXECUTIVE_SUMMARY.md",
        ROOT / "verification.html",
        ROOT / "index.html",
        ROOT / "portfolio.html",
        *sorted((ROOT / "categories").glob("*.html")),
    ]
    problems = []
    for path in doc_files:
        text = path.read_text(encoding="utf-8").lower()
        for pattern, reason in STALE_DOC_PATTERNS:
            if re.search(pattern, text):
                problems.append(f"{path.relative_to(ROOT)}: {reason}")
    if problems:
        raise AssertionError("Stale capability claims remain: " + "; ".join(problems))
    print(f"[PASS] No stale live-feed, model-ROI, seconds-level or order-execution claims in {len(doc_files)} user-facing docs/pages.")


def main():
    check_required_files()
    check_internal_links()
    check_dom_ids()
    check_js_modules_and_data()
    check_no_order_submission()
    check_doc_claims()
    print("\nALL VERIFICATION CHECKS PASSED.")


if __name__ == "__main__":
    main()
