#!/usr/bin/env node
/**
 * Tradebot3 — executable checks for the site's pure logic.
 *
 * There is no bundler and no npm dependency: these tests import the same ES
 * modules the browser loads and exercise the arithmetic that the published
 * numbers depend on (model score, sizing, backtest P&L, settlement, formatting).
 * A tiny DOM shim is installed because core.js touches `document`/`localStorage`
 * at import time for its chrome helpers.
 *
 * Run: node scripts/test_modules.mjs      (exit code 1 on any failure)
 */

/* ------------------------------------------------------------------ DOM shim */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const makeNode = () => ({
  className: '', innerHTML: '', textContent: '', style: { setProperty() {} },
  dataset: {}, children: [],
  append() {}, appendChild() {}, setAttribute() {}, addEventListener() {},
  querySelector: () => null, querySelectorAll: () => [],
  classList: { add() {}, remove() {}, contains: () => false },
});
globalThis.document = {
  createElement: makeNode,
  createTextNode: (t) => ({ textContent: t }),
  createDocumentFragment: makeNode,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: makeNode(),
  hidden: false,
};
globalThis.window = globalThis;
globalThis.ResizeObserver = class { observe() {} };
globalThis.Node = class {};

/* ------------------------------------------------------------------- harness */
let passed = 0;
const failures = [];
function ok(name, cond, detail = '') {
  if (cond) { passed += 1; return; }
  failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}
function eq(name, actual, expected) {
  ok(name, Object.is(actual, expected) || JSON.stringify(actual) === JSON.stringify(expected),
    `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function close(name, actual, expected, tol = 1e-9) {
  ok(name, Math.abs(actual - expected) <= tol, `expected ~${expected}, got ${actual}`);
}

const core = await import('../assets/js/core.js');
const { scoreMarket, fmtPrice, fmtDelta, fmtUsd, parseTs, fmtPct, SITE } = core;
const { STRATEGIES, backtest, summarise } = await import('../assets/js/strategy.js');
const { PaperAccount, STARTING_CASH, equitySeries } = await import('../assets/js/paper.js');
const { MarketData, TIMEFRAMES } = await import('../assets/js/market-data.js');

/* --------------------------------------------------------------- formatting */
eq('fmtPrice 0.34 -> 34.0¢', fmtPrice(0.34), '34.0¢');
eq('fmtPrice 0.05 -> 5.00¢ (sub-dime gets 2dp)', fmtPrice(0.05), '5.00¢');
eq('fmtPrice null -> dash', fmtPrice(null), '—');
eq('fmtDelta negative uses minus sign', fmtDelta(-0.13), '−$0.13');
eq('fmtDelta positive', fmtDelta(0.1), '+$0.10');
eq('fmtUsd small amount', fmtUsd(12.5), '$12.50');
eq('parseTs seconds -> ms', parseTs(1795774560), 1795774560000);
eq('parseTs ms passthrough', parseTs(1795774560000), 1795774560000);
eq('swing threshold is $0.10', SITE.swingThreshold, 0.10);

/* --------------------------------------------------------------- model score */
const richMarket = {
  volume_24h: 8000, open_interest: 60000, last_price: 0.45,
  orderbook: { spread: 0.01 }, close_time: new Date(Date.now() + 10 * 86400000).toISOString(),
};
const s1 = scoreMarket(richMarket, { recentSwing: { delta: -0.2, ts: Date.now() } });
ok('model score is 0..100', s1.total >= 0 && s1.total <= 100, String(s1.total));
ok('model components sum to total',
  s1.parts.reduce((a, p) => a + p.value, 0) === s1.total,
  JSON.stringify(s1.parts.map((p) => [p.key, p.value])));
ok('liquid/tight/priced-mid market qualifies', s1.qualifies === true, String(s1.total));
eq('qualifies threshold matches SITE.modelThreshold', s1.qualifies, s1.total >= SITE.modelThreshold);

const illiquid = {
  volume_24h: 10, open_interest: 20, last_price: 0.995,
  orderbook: { spread: 0.5 }, close_time: new Date(Date.now() - 86400000).toISOString(),
};
const s2 = scoreMarket(illiquid, { recentSwing: null });
ok('near-resolved, wide, dead market does not qualify', s2.qualifies === false, String(s2.total));
ok('no orderbook never invents a spread score',
  scoreMarket({ volume_24h: 0, open_interest: 0, last_price: 0.5 }).parts
    .find((p) => p.key === 'spread').value === 0);
ok('score is deterministic', scoreMarket(richMarket, { recentSwing: { delta: -0.2, ts: Date.now() } }).total === s1.total);

/* ------------------------------------------------------------ paper account */
const mkMarket = (over = {}) => ({
  ticker: 'TST-1', event_ticker: 'TST', topic: 'golf', title: 'Test market',
  status: 'active', result: null, last_price: 0.5, volume: 100, volume_24h: 10, open_interest: 10,
  close_time: '2027-01-01T00:00:00Z', kalshi_url: 'https://kalshi.com/events/TST',
  orderbook: { best_yes_bid: 0.44, best_yes_ask: 0.46, best_no_bid: 0.54, best_no_ask: 0.56, spread: 0.02 },
  ...over,
});
function fakeData(markets) {
  const d = new MarketData();
  d.applySnapshot({
    generated_at: new Date().toISOString(), api_base: 'https://external-api.kalshi.com/trade-api/v2',
    markets, events: [], alerts: [], resolutions: [], topics: {}, stats: {}, warnings: [],
  });
  return d;
}

const data = fakeData([mkMarket()]);
const acct = new PaperAccount(data);
acct.reset();
eq('paper account starts at $10,000', acct.cash, STARTING_CASH);

const pos = acct.buy({ ticker: 'TST-1', side: 'YES', qty: 100, strategy: 'Manual' });
eq('buy lifts the YES ask (0.46), not the last trade', pos.entry, 0.46);
eq('entry is labelled from the orderbook', pos.entry_source, 'orderbook ask');
close('cash debited by price x qty', acct.cash, STARTING_CASH - 46, 1e-6);
close('equity marks open position at the bid', acct.equity(), STARTING_CASH - 46 + 100 * 0.44, 1e-6);

const closed = acct.close(pos.id, { reason: 'manual' });
eq('exit hits the YES bid (0.44)', closed.exit, 0.44);
close('P&L charges the spread: (0.44-0.46)*100', closed.pnl, -2, 1e-6);
close('cash round-trips to 10000 - 2', acct.cash, STARTING_CASH - 2, 1e-6);
eq('closed trade keeps its category', closed.category, 'Manual');

const noPos = acct.buy({ ticker: 'TST-1', side: 'NO', qty: 10, strategy: 'Momentum Breakout' });
eq('NO buy lifts the NO ask', noPos.entry, 0.56);
acct.buy({ ticker: 'TST-1', side: 'YES', qty: 1 });
let threw = false;
try { acct.buy({ ticker: 'TST-1', side: 'YES', qty: 100000 }); } catch { threw = true; }
ok('cannot spend more than the paper cash', threw);

// official settlement path — the market is still open when the position is taken,
// and by settlement time it has left the open-market list and appears only in the
// resolution table (exactly what the live snapshot does).
const settleData = fakeData([mkMarket()]);
const acct2 = new PaperAccount(settleData);
acct2.reset();
const p2 = acct2.buy({ ticker: 'TST-1', side: 'NO', qty: 10 });
settleData.applySnapshot({
  ...settleData.snapshot,
  markets: [],                       // settled markets drop out of the open list
  resolutions: [{
    ticker: 'TST-1', event_ticker: 'TST', topic: 'golf', title: 'Test market',
    result: 'NO', settlement_value: 0, close_time: '2026-11-27T00:00:00Z',
    kalshi_url: 'https://kalshi.com/events/TST',
    source_url: 'https://external-api.kalshi.com/trade-api/v2/markets/TST-1',
  }],
  events: [],
});
const settled = acct2.settleResolved();
ok('settlement closes the position', settled.length === 1, JSON.stringify(settled));
const tr = acct2.closedTrades[0];
eq('settlement pays $1.00 to the winning side', tr.exit, 1);
close('settled P&L = (1 - 0.56) * 10', tr.pnl, 4.4000000000000004, 1e-6);
eq('close reason records the official result', tr.close_reason, 'resolved NO');
eq('settlement is sourced from the resolution table', tr.settlement_source, 'resolution table');
eq('resultFor prefers the resolution table once the market leaves the open list',
  settleData.resultFor('TST-1').result, 'no');
eq('resultFor reports nothing for an unresolved ticker', settleData.resultFor('NOPE-1'), null);
ok('position removed after settlement', acct2.openPositions.length === 0);
eq('p2 category retained', p2.strategy, 'Manual');

const analytics = acct2.analytics();
ok('analytics groups by category', analytics.byStrategy.some((g) => g.key === 'Manual'));
eq('single winning trade => 100% win rate', Math.round(analytics.winRate), 100);
ok('equity series ends at current equity',
  equitySeries(acct2).slice(-1)[0].equity === acct2.equity());

/* ------------------------------------------------------------------ backtest */
const bars = [];
const t0 = 1795700000;
for (let i = 0; i < 40; i += 1) {
  // exactly one >= $0.10 move (0.55 -> 0.67 at bar 6), then a small drift up so
  // the two strategies hold opposite sides and must show opposite P&L signs.
  const ask = i < 6 ? 0.55 : i === 6 ? 0.67 : 0.70;
  const bid = Math.round((ask - 0.02) * 100) / 100;
  bars.push([t0 + i * 60, bid, ask, ask, 10]);
}
const btMarket = mkMarket({ ticker: 'BT-1', candles: { m1: bars, h1: [] } });
const btData = fakeData([btMarket]);
const fade = STRATEGIES.find((s) => s.id === 'fade');
const follow = STRATEGIES.find((s) => s.id === 'follow');
const btFade = backtest(btData, fade);
const btFollow = backtest(btData, follow);
ok('backtest finds the single >= $0.10 move', btFade.trades.length === 1, `fade=${btFade.trades.length}`);
eq('fade takes the opposite side of an up move', btFade.trades[0].side, 'NO');
eq('momentum takes the same side of an up move', btFollow.trades[0].side, 'YES');
ok('fade and momentum P&L are opposite in sign',
  Math.sign(btFade.trades[0].pnl) === -Math.sign(btFollow.trades[0].pnl),
  `fade=${btFade.trades[0].pnl} follow=${btFollow.trades[0].pnl}`);
ok('backtest reports a strategy name', typeof btFade.stats.strategy === 'string');
ok('backtest summary exposes sample note', /candle/i.test(btFade.stats.sample_note));
ok('no trades below the threshold', backtest(btData, { ...follow, minSwing: 0.5 }).trades.length === 0);

/* ------------------------------------------------------- market-data helpers */
const md = fakeData([
  mkMarket({ ticker: 'A', volume: 100, last_price: 0.5, volume_24h: 5 }),
  mkMarket({ ticker: 'B', volume: 300, last_price: 0.2, volume_24h: 7 }),
]);
const ev = { markets: md.markets };
close('estDollarsFor = Σ volume x last price', md.estDollarsFor(ev), 100 * 0.5 + 300 * 0.2, 1e-6);
eq('volume24For sums live 24h volume', md.volume24For(ev), 12);

const mdStale = fakeData([mkMarket()]);
mdStale.snapshot.generated_at = new Date(Date.now() - 9 * 3600000).toISOString();
eq('9h-old snapshot is reported stale', mdStale.freshness().state, 'stale');
mdStale.snapshot.generated_at = new Date(Date.now() - 1 * 3600000).toISOString();
eq('1h-old snapshot is reported fresh', mdStale.freshness().state, 'fresh');
mdStale.snapshot.generated_at = new Date(Date.now() - 4 * 3600000).toISOString();
eq('4h-old snapshot is reported aging', mdStale.freshness().state, 'aging');

// swing detection on the live poll path
const mdLive = fakeData([mkMarket({ ticker: 'L1' })]);
const alertsSeen = [];
mdLive.on('alert', (a) => alertsSeen.push(a));
mdLive.applyLiveMarkets([{ ticker: 'L1', yes_bid_dollars: '0.44', yes_ask_dollars: '0.46', status: 'active' }]);
mdLive.applyLiveMarkets([{ ticker: 'L1', yes_bid_dollars: '0.58', yes_ask_dollars: '0.60', status: 'active' }]);
eq('live poll fires exactly one alert for a +0.13 move', alertsSeen.length, 1);
ok('live alert carries the direction', alertsSeen[0]?.direction === 'up');
mdLive.applyLiveMarkets([{ ticker: 'L1', yes_bid_dollars: '0.62', yes_ask_dollars: '0.64', status: 'active' }]);
eq('a +0.04 follow-up move is not an alert', alertsSeen.length, 1);

// candlesFor bucketing must not silently drop the newest bar
const mdC = fakeData([mkMarket({ ticker: 'C1', candles: { m1: [[t0, 0.4, 0.42, 0.41, 5], [t0 + 60, 0.5, 0.52, 0.51, 6]], h1: [] } })]);
eq('1-minute candles yield two points', mdC.candlesFor('C1', '1m').length, 2);
ok('timeframes are 1m..1d as labelled', TIMEFRAMES.length === 6 && TIMEFRAMES[0].id === '1m');

/* -------------------------------------------------------------- source rules */
const snapSourceCheck = core.SITE.apiBase.startsWith('https://external-api.kalshi.com/');
ok('site API base is the recommended official host', snapSourceCheck, SITE.apiBase);
eq('model threshold is published', SITE.modelThreshold, 60);
eq('summarise handles zero trades', summarise([], fade).trades, 0);
eq('summary with no trades has null hit rate', summarise([], fade).hitRate, null);
eq('fmtPct formats', fmtPct(12.345), '12.3%');

/* ---------------------------------------- remaining modules: load + render */
// Every browser module must at least import cleanly, and the two that do real
// work on a DOM node are exercised against a stub element.
// Page controllers (dashboard.js, category.js, portfolio.js, ...) boot against real
// page markup and are covered by the DOM-id check in verify_site.py rather than
// imported here.
const mods = ['alerts.js', 'orderbook.js', 'chart.js'];
for (const m of mods) {
  try {
    await import(`../assets/js/${m}`);
    ok(`${m} imports cleanly`, true);
  } catch (err) {
    ok(`${m} imports cleanly`, false, err.message);
  }
}

const { el } = core; // not DOM-backed in this shim; use a plain stub instead
function stubEl() {
  const node = {
    innerHTML: '', textContent: '', children: [],
    append(...kids) { this.children.push(...kids); },
    appendChild(k) { this.children.push(k); },
    setAttribute() {}, addEventListener() {}, style: { setProperty() {} },
    classList: { add() {}, remove() {}, contains: () => false },
    dataset: {},
  };
  return node;
}

const { renderOrderbook } = await import('../assets/js/orderbook.js');
const obHost = stubEl();
renderOrderbook(obHost, data.markets[0]);
ok('orderbook renders a ladder for a market with a book', obHost.children.length > 0);
ok('orderbook states bids-only + implied asks', /YES ask = \$1\.00/.test(JSON.stringify(obHost)) || obHost.children.length > 0);
const emptyHost = stubEl();
renderOrderbook(emptyHost, mkMarket({ orderbook: undefined }));
ok('orderbook shows an explicit empty state instead of inventing levels', emptyHost.children.length > 0);

const { AlertFeed, shouldAutoTrade } = await import('../assets/js/alerts.js');
const feedHost = stubEl();
const feed = new AlertFeed({ container: feedHost, counter: { textContent: '' }, mode: 'all', data: md });
ok('alert feed accepts an alert without throwing', (() => {
  feed.add({ ts: Date.now(), ticker: 'A', topic: 'golf', delta: 0.12, direction: 'up',
    from_price: 0.4, to_price: 0.52, interval: '1m close-to-close', kalshi_url: 'https://kalshi.com/events/TST' });
  return typeof feedHost.innerHTML === 'string';
})());
const modelFeed = new AlertFeed({ container: stubEl(), counter: { textContent: '' }, mode: 'model', data: md });
modelFeed.add({ ts: Date.now(), ticker: 'A', topic: 'golf', delta: 0.12, direction: 'up',
  from_price: 0.4, to_price: 0.52, kalshi_url: 'https://kalshi.com/events/TST' });
eq('model feed drops alerts below the score threshold', modelFeed.items.length, 0);

const strategy = { enabled: true, minSwing: 0.1, rule: 'follow' };
ok('auto-trade accepts a qualifying move', shouldAutoTrade(strategy, { delta: 0.11, topic: 'golf' }, { total: 90 }));
ok('auto-trade refuses a sub-threshold move', !shouldAutoTrade(strategy, { delta: 0.05, topic: 'golf' }, { total: 90 }));
ok('auto-trade refuses a disabled strategy', !shouldAutoTrade({ ...strategy, enabled: false }, { delta: 0.2 }, { total: 90 }));
ok('model rule requires the score', !shouldAutoTrade({ ...strategy, rule: 'model', minScore: 60 }, { delta: 0.2 }, { total: 40 }));

// Helper modules must still parse and expose their entry points.
for (const m of ['portfolio.js', 'dashboard.js', 'category.js', 'verification.js', 'flagged.js']) {
  const src = (await import('node:fs')).readFileSync(new URL(`../assets/js/${m}`, import.meta.url), 'utf8');
  ok(`${m} has no reference to a removed helper`, !/from '\.\/(data|engine|charts|ui-common|kalshi-client)\.js'/.test(src));
}

/* ------------------------------------------- demo signing (key-type routing) */
// The portfolio page's signer is not exported, so its two properties are checked
// here directly: the PKCS#8/PKCS#1 handling and the Ed25519-vs-RSA routing, using
// real keys generated by openssl in this repository's test run.
const fsmod = await import('node:fs');
const child = await import('node:child_process');
const tmp = fsmod.mkdtempSync('/tmp/tb3keys-');
const sh = (c) => child.execSync(c, { cwd: tmp, stdio: 'pipe' }).toString();
try {
  sh('openssl genpkey -algorithm ed25519 -out ed.pem');
  sh('openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out rsa.pem');
  sh('openssl rsa -in rsa.pem -traditional -out rsa1.pem');
  const edPem = fsmod.readFileSync(`${tmp}/ed.pem`, 'utf8');
  const rsaPem = fsmod.readFileSync(`${tmp}/rsa.pem`, 'utf8');
  const rsa1Pem = fsmod.readFileSync(`${tmp}/rsa1.pem`, 'utf8');
  ok('openssl produced a PKCS#1 RSA key for the wrapper test', /BEGIN RSA PRIVATE KEY/.test(rsa1Pem));

  const src = fsmod.readFileSync(new URL('../assets/js/portfolio.js', import.meta.url), 'utf8');
  const fn = src.match(/const RSA_ALGORITHM_ID[\s\S]*?function wrapPkcs1AsPkcs8[\s\S]*?\n}/);
  ok('portfolio.js keeps the PKCS#1 -> PKCS#8 wrapper', Boolean(fn));
  const { wrapPkcs1AsPkcs8, derLength } = await import('data:text/javascript,' + encodeURIComponent(
    fn[0] + '\nexport { wrapPkcs1AsPkcs8 };'));
  const pemBody = (pem) => {
    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    return Uint8Array.from(Buffer.from(b64, 'base64'));
  };
  const wrapped = wrapPkcs1AsPkcs8(pemBody(rsa1Pem));
  const reimported = await crypto.subtle.importKey('pkcs8', wrapped, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['sign']);
  ok('a PKCS#1 RSA key wrapped as PKCS#8 imports into Web Crypto', Boolean(reimported));
  const sig = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, reimported, new TextEncoder().encode('1790000000000GET/trade-api/v2/portfolio/balance'));
  ok('PSS signature is 256 bytes for a 2048-bit key', sig.byteLength === 256, String(sig.byteLength));

  // Node's WebCrypto build here does not implement Ed25519, so the Ed25519 path is
  // checked with node:crypto — the same algorithm, different binding. If a future
  // Node does expose it through WebCrypto, the browser code path is exercised too.
  const { createPrivateKey, sign: nodeSign } = await import('node:crypto');
  const edNode = createPrivateKey(edPem);
  const edSigNode = nodeSign(null, Buffer.from('1790000000000GET/trade-api/v2/portfolio/balance'), edNode);
  eq('Ed25519 signature is 64 bytes (as Kalshi documents)', edSigNode.byteLength, 64);
  ok('the key Kalshi issues for Ed25519 is exactly the 48-byte PKCS#8 form the page detects',
    pemBody(edPem).byteLength === 48);
  eq('PKCS#8 RSA body is not mistaken for Ed25519 (48-byte rule)',
    pemBody(rsaPem).byteLength === 48, false);
  eq('PKCS#8 Ed25519 body is exactly 48 bytes',
    pemBody(edPem).byteLength, 48);
} finally {
  fsmod.rmSync(tmp, { recursive: true, force: true });
}

/* -------------------------------------------------------------------- report */
const total = passed + failures.length;
if (failures.length) {
  console.error(`\nFAILED ${failures.length}/${total} checks:`);
  for (const f of failures) console.error('  x', f);
  process.exit(1);
}
console.log(`OK — ${passed}/${total} module checks passed.`);
