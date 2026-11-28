/**
 * Tradebot3 — portfolio, trade categorisation and strategy lab.
 * Paper money only. Prices come from the official snapshot / live poll.
 */

import {
  SITE, TOPICS, TOPIC_ORDER, initChrome, el, qs, qsa, toast,
  fmtUsd, fmtContracts, fmtPrice, fmtDelta, fmtNum, fmtDateTime, fmtDate, esc, cleanTitle, isNum, scoreMarket, loadJson, saveJson,
} from './core.js';
import { MarketData } from './market-data.js';
import { PaperAccount, equitySeries, STARTING_CASH } from './paper.js';
import { STRATEGIES, backtest } from './strategy.js';
import { shouldAutoTrade } from './alerts.js';

const data = new MarketData();
let account;
let autoConfig = loadJson('tradebot3.autotrade', { enabled: false, strategy: 'model', topic: 'all' });
let customStrategies = loadJson('tradebot3.customStrategies', []);
let logFilter = { topic: 'all', strategy: 'all' };
const backtestCache = new Map();

function allStrategies() {
  return [...STRATEGIES, ...(Array.isArray(customStrategies) ? customStrategies : [])];
}

async function boot() {
  initChrome({ active: 'portfolio.html' });
  try {
    await data.load();
  } catch (err) {
    qs('#pf-status').innerHTML = `<span class="status-err">Snapshot failed:</span> ${esc(err.message)}`;
    return;
  }
  account = new PaperAccount(data);
  account.settleResolved();

  buildTicket();
  buildFilters();
  renderAll();
  buildLab();
  restoreDemoForm();

  data.on('update', () => { account.recordEquity(); renderAll(); });
  data.on('alert', onLiveAlert);
  data.startLive();

  setInterval(() => {
    if (document.hidden) return;
    account.recordEquity();
    renderKpis();
    renderPositions();
    drawEquity();
  }, 15000);
}

/* ------------------------------------------------------------------ render */

function renderAll() {
  renderKpis();
  renderPositions();
  renderTrades();
  renderAnalytics();
  drawEquity();
  renderAutoPanel();
}

function renderKpis() {
  const a = account.analytics();
  const marked = account.marked();
  const unrealized = marked.reduce((s, p) => s + p.pnl, 0);
  const equity = account.equity();
  const cards = [
    { label: 'Paper equity', value: fmtUsd(equity), foot: `started at ${fmtUsd(STARTING_CASH)}` },
    { label: 'Cash', value: fmtUsd(account.cash), foot: `${account.openPositions.length} open positions` },
    { label: 'Realised P&L', value: fmtDelta(a.totalPnl), foot: `${a.count} closed trades` },
    { label: 'Unrealised P&L', value: fmtDelta(unrealized), foot: 'marked at current book' },
    { label: 'Win rate', value: a.winRate === null ? '—' : `${a.winRate.toFixed(1)}%`, foot: a.count ? `expectancy ${fmtDelta(a.expectancy)} / trade` : 'no closed trades yet' },
  ];
  const host = qs('#pf-kpis');
  host.innerHTML = '';
  for (const c of cards) {
    host.append(el('div', { class: 'kpi' },
      el('div', { class: 'label', text: c.label }),
      el('div', { class: 'value', text: c.value }),
      el('div', { class: 'foot', text: c.foot })));
  }
}

function drawEquity() {
  const canvas = qs('#equity-canvas');
  if (!canvas) return;
  const series = equitySeries(account);
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  if (series.length < 2) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px -apple-system, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Equity curve appears after your first paper trade.', w / 2, h / 2);
    return;
  }
  const pad = 28;
  const values = series.map((p) => p.equity).concat(STARTING_CASH);
  let min = Math.min(...values);
  let max = Math.max(...values);
  const span = Math.max(max - min, 50);
  min -= span * 0.1;
  max += span * 0.1;
  const t0 = series[0].t;
  const t1 = series[series.length - 1].t || t0 + 1;
  const xOf = (t) => pad + ((t - t0) / Math.max(t1 - t0, 1)) * (w - pad * 2);
  const yOf = (v) => h - pad + 6 - ((v - min) / (max - min)) * (h - pad * 2 + 6);

  ctx.strokeStyle = '#eef2f6';
  for (let i = 0; i <= 3; i += 1) {
    const v = min + ((max - min) * i) / 3;
    const y = yOf(v);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`$${v.toFixed(0)}`, 2, y + 3);
  }
  ctx.beginPath();
  series.forEach((p, i) => {
    const x = xOf(p.t);
    const y = yOf(p.equity);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.lineTo(xOf(series[series.length - 1].t), h);
  ctx.lineTo(xOf(series[0].t), h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(15,118,110,.10)';
  ctx.fill();

  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 11px ui-monospace, Menlo, monospace';
  ctxx(ctx, `$${series[series.length - 1].equity.toFixed(2)}`, w - 4, yOf(series[series.length - 1].equity) - 6);
}

function ctxx(ctx, ...args) { ctx.textAlign = 'right'; ctx.fillText(...args); }

function renderPositions() {
  const body = qs('#positions-body');
  const marked = account.marked();
  body.innerHTML = '';
  if (!marked.length) {
    body.innerHTML = '<tr><td colspan="10" class="table-empty">No open positions. Use the ticket or a strategy to open one.</td></tr>';
    return;
  }
  for (const p of marked) {
    const kalshiUrl = p.market_url || `https://kalshi.com/events/${encodeURIComponent(p.event_ticker || p.ticker)}`;
    const apiUrl = p.api_url || `${SITE.apiBase}/markets/${encodeURIComponent(p.ticker)}`;
    const tr = el('tr');
    tr.innerHTML = `
      <td class="title"><a class="row-link" href="${esc(kalshiUrl)}" target="_blank" rel="noopener noreferrer">${esc(cleanTitle(p.event_title || p.title || p.ticker).slice(0, 64))}</a>
        <div class="ticker">${esc(p.ticker)}</div></td>
      <td>${badge(p.topic)}</td>
      <td><span class="badge badge-${p.side === 'YES' ? 'yes' : 'no'}">${p.side}</span></td>
      <td class="num">${fmtNum(p.qty)}</td>
      <td class="num">${fmtPrice(p.entry)}<div class="tiny">${esc(p.entry_source || '')}</div></td>
      <td class="num">${fmtPrice(p.mark)}</td>
      <td class="num" style="color:${p.pnl >= 0 ? 'var(--up)' : 'var(--down)'}">${fmtDelta(p.pnl)}</td>
      <td class="num">${p.roi_pct >= 0 ? '+' : ''}${p.roi_pct.toFixed(1)}%</td>
      <td class="tiny"><a href="${esc(kalshiUrl)}" target="_blank" rel="noopener noreferrer">Kalshi</a> · <a href="${esc(apiUrl)}" target="_blank" rel="noopener noreferrer">API</a></td>
      <td><button class="btn btn-sm" data-close="${esc(p.id)}">Close</button></td>`;
    body.append(tr);
  }
  qsa('[data-close]').forEach((btn) => btn.addEventListener('click', () => {
    try {
      const trade = account.close(btn.dataset.close, { reason: 'manual close' });
      toast(`Closed ${trade.ticker} for ${fmtDelta(trade.pnl)}`, trade.pnl >= 0 ? 'ok' : 'err');
      renderAll();
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
}

function renderTrades() {
  const body = qs('#trades-body');
  const trades = account.closedTrades.filter((t) => (
    (logFilter.topic === 'all' || t.topic === logFilter.topic)
    && (logFilter.strategy === 'all' || (t.category || t.strategy) === logFilter.strategy)
  ));
  body.innerHTML = '';
  if (!trades.length) {
    body.innerHTML = '<tr><td colspan="11" class="table-empty">No closed trades match the filter.</td></tr>';
    return;
  }
  for (const t of trades.slice(0, 200)) {
    const kalshiUrl = t.market_url || `https://kalshi.com/events/${encodeURIComponent(t.event_ticker || t.ticker)}`;
    const apiUrl = t.api_url || `${SITE.apiBase}/markets/${encodeURIComponent(t.ticker)}`;
    const tr = el('tr');
    tr.innerHTML = `
      <td>${esc(fmtDateTime(t.closed_at))}</td>
      <td class="title"><a class="row-link" href="${esc(kalshiUrl)}" target="_blank" rel="noopener noreferrer">${esc(cleanTitle(t.event_title || t.title || t.ticker).slice(0, 60))}</a><div class="ticker">${esc(t.ticker)}</div></td>
      <td>${badge(t.topic)}</td>
      <td>${esc(t.category || t.strategy || '—')}</td>
      <td><span class="badge badge-${t.side === 'YES' ? 'yes' : 'no'}">${t.side}</span></td>
      <td class="num">${fmtNum(t.qty)}</td>
      <td class="num">${fmtPrice(t.entry)} → ${fmtPrice(t.exit)}</td>
      <td class="num" style="color:${t.pnl >= 0 ? 'var(--up)' : 'var(--down)'}">${fmtDelta(t.pnl)}</td>
      <td class="num">${t.roi_pct >= 0 ? '+' : ''}${t.roi_pct.toFixed(1)}%</td>
      <td class="tiny">${esc(t.close_reason || '')}</td>
      <td class="tiny"><a href="${esc(kalshiUrl)}" target="_blank" rel="noopener noreferrer">Kalshi</a> · <a href="${esc(apiUrl)}" target="_blank" rel="noopener noreferrer">API</a></td>`;
    body.append(tr);
  }
}

function renderAnalytics() {
  const a = account.analytics();
  fillAnalytics('#an-strategy', a.byStrategy, 'Category');
  fillAnalytics('#an-topic', a.byTopic, 'Topic');
  fillAnalytics('#an-side', a.bySide, 'Side');
}

function fillAnalytics(sel, rows, label) {
  const body = qs(sel);
  if (!body) return;
  body.innerHTML = '';
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="table-empty">No closed trades yet — ${label.toLowerCase()} analytics appear after a trade settles or closes.</td></tr>`;
    return;
  }
  for (const r of rows) {
    const tr = el('tr');
    let name;
    if (r.key === 'YES' || r.key === 'NO') {
      name = `<a href="verification.html" title="Paper settlement &amp; side rules"><span class="badge badge-${r.key.toLowerCase()}">${r.key}</span></a>`;
    } else if (TOPICS[r.key]) {
      name = `<a href="${esc(TOPICS[r.key].kalshiCategory)}" target="_blank" rel="noopener noreferrer">${esc(TOPICS[r.key].name)}</a>`;
    } else {
      name = `<a href="verification.html" title="Paper fill &amp; category rules">${esc(r.key)}</a>`;
    }
    tr.innerHTML = `
      <td>${name}</td>
      <td class="num">${fmtNum(r.count)}</td>
      <td class="num" style="color:${r.pnl >= 0 ? 'var(--up)' : 'var(--down)'}">${fmtDelta(r.pnl)}</td>
      <td class="num">${r.win_rate.toFixed(0)}%</td>
      <td class="num">${r.avg_roi >= 0 ? '+' : ''}${r.avg_roi.toFixed(1)}%</td>`;
    body.append(tr);
  }
}

function badge(topic) {
  const t = TOPICS[topic];
  return `<span class="badge badge-neutral"><span class="dot" style="background:${t?.color || '#64748b'}"></span>${esc(t?.name || topic || '—')}</span>`;
}

/* ------------------------------------------------------------------ ticket */

function buildTicket() {
  const select = qs('#pf-market');
  for (const topic of TOPIC_ORDER) {
    const group = el('optgroup', { label: TOPICS[topic].name });
    for (const m of data.marketsFor(topic).sort((a, b) => (b.volume || 0) - (a.volume || 0))) {
      group.append(el('option', { value: m.ticker, text: `${cleanTitle(m.event_title || m.title || m.ticker).slice(0, 70)} · ${m.subtitle || ''}` }));
    }
    select.append(group);
  }
  const category = qs('#pf-category');
  for (const name of ['Manual', 'Swing Mean-Reversion', 'Momentum Breakout', 'High-ROI Model', 'News Catalyst', 'Longshot Value', 'Spread Capture']) {
    category.append(el('option', { value: name, text: name }));
  }
  const preview = () => {
    const ticker = select.value;
    const side = qs('#pf-side').value;
    const qty = Number(qs('#pf-qty').value || 1);
    const q = account.priceFor(ticker, side);
    const market = data.byTicker.get(ticker);
    qs('#pf-preview').innerHTML = q
      ? `${qty} × ${fmtPrice(q.price)} = <strong>$${(q.price * qty).toFixed(2)}</strong> <span class="tiny">(${esc(q.source)}; max payout $${qty.toFixed(2)})</span>
         ${market?.close_time ? `<br><span class="tiny">closes ${esc(fmtDateTime(market.close_time))}</span>` : ''}`
      : 'No usable quote.';
  };
  select.addEventListener('change', preview);
  qs('#pf-side').addEventListener('change', preview);
  qs('#pf-qty').addEventListener('input', preview);
  preview();

  qs('#pf-ticket').addEventListener('submit', (ev) => {
    ev.preventDefault();
    try {
      const pos = account.buy({
        ticker: select.value,
        side: qs('#pf-side').value,
        qty: Number(qs('#pf-qty').value),
        strategy: qs('#pf-category').value,
        note: qs('#pf-note').value,
      });
      qs('#pf-feedback').innerHTML = `<span class="status-ok">Filled</span> ${pos.qty} × ${pos.side} @ ${fmtPrice(pos.entry)} (${esc(pos.entry_source)})`;
      toast('Paper order filled', 'ok');
      renderAll();
    } catch (err) {
      qs('#pf-feedback').innerHTML = `<span class="status-err">${esc(err.message)}</span>`;
    }
  });

  qs('#btn-reset').addEventListener('click', () => {
    if (!confirm('Reset the paper account to $10,000 and delete all simulated trades?')) return;
    account.reset();
    renderAll();
    toast('Paper account reset', 'ok');
  });
  qs('#btn-export').addEventListener('click', () => {
    const blob = new Blob([account.export()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradebot3-paper-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function buildFilters() {
  const topicSel = qs('#log-filter-topic');
  topicSel.append(el('option', { value: 'all', text: 'All topics' }));
  for (const t of TOPIC_ORDER) topicSel.append(el('option', { value: t, text: TOPICS[t].name }));
  topicSel.addEventListener('change', () => { logFilter.topic = topicSel.value; renderTrades(); });

  const stratSel = qs('#log-filter-strategy');
  stratSel.append(el('option', { value: 'all', text: 'All categories' }));
  for (const s of ['Manual', 'Swing Mean-Reversion', 'Momentum Breakout', 'High-ROI Model', 'News Catalyst', 'Longshot Value', 'Spread Capture']) {
    stratSel.append(el('option', { value: s, text: s }));
  }
  stratSel.addEventListener('change', () => { logFilter.strategy = stratSel.value; renderTrades(); });
}

/* -------------------------------------------------------------- strategy lab */

function buildLab() {
  const host = qs('#lab-grid');
  host.innerHTML = '';
  const list = allStrategies();
  for (const strat of list) {
    const card = el('div', { class: 'card' });
    card.style.boxShadow = 'none';
    card.innerHTML = `
      <div class="card-head" style="padding:9px 12px">
        <h3>${esc(strat.name)}</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <label class="switch"><input type="checkbox" data-strat="${esc(strat.id)}" ${strat.enabled ? 'checked' : ''}> enabled</label>
          ${strat.custom ? `<button type="button" class="btn btn-sm btn-ghost" data-del-strat="${esc(strat.id)}" title="Delete custom strategy">✕</button>` : ''}
        </div>
      </div>
      <div class="card-body" style="padding:10px 12px">
        <div class="small">${esc(strat.description)}</div>
        <div class="tiny" style="margin-top:3px">Category: <strong>${esc(strat.category)}</strong>${strat.topicFilter && strat.topicFilter !== 'all' ? ` · Topic: <strong>${esc(TOPICS[strat.topicFilter]?.name || strat.topicFilter)}</strong>` : ''}</div>
        <div class="hr"></div>
        <div id="lab-${esc(strat.id)}"><div class="small">Running backtest on official 1-minute candles…</div></div>
      </div>`;
    host.append(card);
    qsa(`[data-strat="${strat.id}"]`).forEach((cb) => cb.addEventListener('change', () => {
      strat.enabled = cb.checked;
      if (strat.custom) saveJson('tradebot3.customStrategies', customStrategies);
    }));
    qsa(`[data-del-strat="${strat.id}"]`).forEach((btn) => btn.addEventListener('click', () => {
      customStrategies = customStrategies.filter((s) => s.id !== strat.id);
      saveJson('tradebot3.customStrategies', customStrategies);
      backtestCache.delete(strat.id);
      buildLab();
      renderAutoPanel();
    }));
  }
  bindCustomStrategyForm();
  setTimeout(runBacktests, 40);
}

function bindCustomStrategyForm() {
  const form = qs('#custom-strat-form');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = qs('#cs-name').value.trim();
    const category = qs('#cs-category').value;
    const rule = qs('#cs-rule').value;
    const topicFilter = qs('#cs-topic').value;
    const minSwing = Math.max(0.05, Number(qs('#cs-swing').value || 0.10));
    const holdBars = Math.max(1, Math.floor(Number(qs('#cs-hold').value || 5)));
    const stake = Math.max(10, Number(qs('#cs-stake').value || 100));
    if (!name) return;
    const strat = {
      id: `custom_${Date.now().toString(36)}`,
      name,
      category,
      rule,
      topicFilter,
      minSwing,
      maxPrice: 0.15,
      minScore: SITE.modelThreshold,
      holdBars,
      stake,
      enabled: true,
      custom: true,
      description: `Custom ${category} rule (${rule}): ≥ $${minSwing.toFixed(2)} trigger, hold ${holdBars}m, $${stake} stake.`,
    };
    customStrategies.push(strat);
    saveJson('tradebot3.customStrategies', customStrategies);
    qs('#cs-name').value = '';
    buildLab();
    renderAutoPanel();
    toast(`Created & backtested strategy "${name}"`, 'ok');
  });
}

function runBacktests() {
  for (const strat of allStrategies()) {
    const host = qs(`#lab-${strat.id}`);
    if (!host) continue;
    const key = `${strat.id}`;
    if (!backtestCache.has(key)) {
      const pool = strat.topicFilter && strat.topicFilter !== 'all'
        ? data.marketsFor(strat.topicFilter)
        : data.markets;
      backtestCache.set(key, backtest(data, strat, { markets: pool }));
    }
    const { stats } = backtestCache.get(key);
    host.innerHTML = `
      <div class="ob-summary" style="grid-template-columns:repeat(2,1fr)">
        <div class="ob-stat"><div class="k">Trades</div><div class="v">${fmtNum(stats.trades)}</div></div>
        <div class="ob-stat"><div class="k">Simulated P&amp;L</div><div class="v" style="color:${stats.pnl >= 0 ? 'var(--up)' : 'var(--down)'}">${fmtDelta(stats.pnl)}</div></div>
        <div class="ob-stat"><div class="k">Hit rate</div><div class="v">${stats.hitRate === null ? '—' : `${stats.hitRate.toFixed(0)}%`}</div></div>
        <div class="ob-stat"><div class="k">Avg ROI / trade</div><div class="v">${stats.avgRoi === null ? '—' : `${stats.avgRoi >= 0 ? '+' : ''}${stats.avgRoi.toFixed(1)}%`}</div></div>
      </div>
      <div class="tiny" style="margin-top:6px">Max drawdown ${fmtDelta(stats.maxDrawdown)} · stake $${strat.stake}/trade · hold ${strat.holdBars} bars</div>
      <div class="tiny" style="margin-top:3px">${esc(stats.sample_note)}</div>`;
  }
}

function renderAutoPanel() {
  const enabled = qs('#auto-enabled');
  const select = qs('#auto-strategy');
  const list = allStrategies();
  select.innerHTML = '';
  for (const s of list) select.append(el('option', { value: s.id, text: s.name }));
  if (!list.some((s) => s.id === autoConfig.strategy)) autoConfig.strategy = list[0]?.id || 'model';
  enabled.checked = !!autoConfig.enabled;
  select.value = autoConfig.strategy;
  qs('#auto-status').textContent = autoConfig.enabled
    ? `Auto-trade ON — ${list.find((s) => s.id === autoConfig.strategy)?.name}`
    : 'Auto-trade OFF';
  enabled.onchange = () => {
    autoConfig.enabled = enabled.checked;
    saveJson('tradebot3.autotrade', autoConfig);
    renderAutoPanel();
  };
  select.onchange = () => {
    autoConfig.strategy = select.value;
    saveJson('tradebot3.autotrade', autoConfig);
    renderAutoPanel();
  };
}

function onLiveAlert(alert) {
  if (!autoConfig.enabled) return;
  const strat = allStrategies().find((s) => s.id === autoConfig.strategy);
  const market = data.byTicker.get(alert.ticker);
  if (!strat || !market) return;
  const score = scoreMarket(market, { recentSwing: alert });
  if (!shouldAutoTrade({ ...strat, rule: strat.rule }, alert, score)) return;
  if (account.openPositions.some((p) => p.ticker === alert.ticker)) return;
  const side = strat.rule === 'fade'
    ? (alert.delta > 0 ? 'NO' : 'YES')
    : (alert.delta > 0 ? 'YES' : 'NO');
  try {
    const pos = account.buy({
      ticker: alert.ticker,
      side,
      qty: 10,
      strategy: strat.category,
      note: `auto-trade: ${strat.id} on ${fmtDelta(alert.delta)} live swing`,
    });
    toast(`Auto-trade: ${pos.qty} × ${side} ${pos.ticker}`, 'ok');
    renderAll();
  } catch {
    /* insufficient cash or no quote — ignore */
  }
}

/* ------------------------------------------------------------ demo account */

const DEMO_KEY = 'tradebot3.demo.keyid';
let demoSession = null; // { keyId, pem } held in memory only, never persisted

/**
 * Kalshi request signing requires the full API path from host root (`/trade-api/v2/...`)
 * with any query string stripped:
 * https://docs.kalshi.com/getting_started/api_environments#request-signing
 */
export function canonicalApiPath(pathWithQuery) {
  const [rawPath] = String(pathWithQuery || '').split('?');
  const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return normalized.startsWith('/trade-api/v2') ? normalized : `/trade-api/v2${normalized}`;
}

/**
 * Build a Create Order V2 request body per official docs:
 * https://docs.kalshi.com/api-reference/orders/create-order-v2
 * Single-book convention on event markets:
 *   side = "bid" buys YES at `yesPrice`
 *   side = "ask" sells YES at `yesPrice` (economically long NO at `1 - yesPrice`)
 */
export function buildDemoOrderV2Payload({ ticker, side = 'YES', qty = 1, yesPrice = 0.50, clientOrderId = '' }) {
  const id = clientOrderId || `tb3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const clampedPrice = Math.min(0.99, Math.max(0.01, Number(yesPrice)));
  return {
    ticker: String(ticker || '').trim(),
    client_order_id: id,
    side: side === 'NO' ? 'ask' : 'bid',
    count: Math.max(1, Math.floor(Number(qty) || 1)).toFixed(2),
    price: clampedPrice.toFixed(4),
    time_in_force: 'good_till_canceled',
    self_trade_prevention_type: 'taker_at_cross',
    post_only: false,
    cancel_order_on_pause: false,
    reduce_only: false,
    subaccount: 0,
  };
}

function restoreDemoForm() {
  const keyId = localStorage.getItem(DEMO_KEY);
  if (keyId) qs('#demo-keyid').value = keyId;
  const demoTicker = qs('#demo-order-ticker');
  if (demoTicker) {
    for (const topic of TOPIC_ORDER) {
      const group = el('optgroup', { label: TOPICS[topic].name });
      for (const m of data.marketsFor(topic).sort((a, b) => (b.volume || 0) - (a.volume || 0))) {
        group.append(el('option', { value: m.ticker, text: `${m.ticker} · ${cleanTitle(m.title || '').slice(0, 52)}` }));
      }
      demoTicker.append(group);
    }
  }
  qs('#demo-connect').addEventListener('click', connectDemo);
  qs('#demo-positions').addEventListener('click', () => loadDemoResource('/portfolio/positions?count_filter=position,total_traded&limit=50'));
  qs('#demo-fills').addEventListener('click', () => loadDemoResource('/portfolio/fills?limit=20'));
  qs('#demo-order-form')?.addEventListener('submit', submitDemoOrder);
  qs('#demo-clear').addEventListener('click', () => {
    qs('#demo-pem').value = '';
    demoSession = null;
    qs('#demo-data').style.display = 'none';
    const structured = qs('#demo-structured');
    if (structured) structured.innerHTML = '';
    qs('#demo-positions').disabled = true;
    qs('#demo-fills').disabled = true;
    const orderBtn = qs('#demo-order-submit');
    if (orderBtn) orderBtn.disabled = true;
    localStorage.removeItem(DEMO_KEY);
    qs('#demo-status').innerHTML = 'Cleared. The private key was never stored.';
  });
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Web Crypto only imports PKCS#8 (`BEGIN PRIVATE KEY`), while Kalshi's RSA keys
 * are handed out as PKCS#1 (`BEGIN RSA PRIVATE KEY`) — docs.kalshi.com/
 * getting_started/api_keys lists exactly that PEM header for RSA keys. Both
 * carry the same RSA key, so PKCS#1 is wrapped in the standard PKCS#8 envelope
 * (RSA AlgorithmIdentifier + OCTET STRING) rather than rejected. Verified in
 * this repository's tests against a real openssl-generated PKCS#1 key.
 */
const RSA_ALGORITHM_ID = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];

function derLength(n) {
  if (n < 0x80) return [n];
  const bytes = [];
  let v = n;
  while (v > 0) { bytes.unshift(v & 0xff); v >>= 8; }
  return [0x80 | bytes.length, ...bytes];
}

function wrapPkcs1AsPkcs8(pkcs1) {
  const body = [
    0x02, 0x01, 0x00,                                  // version 0
    ...RSA_ALGORITHM_ID,                               // AlgorithmIdentifier
    0x04, ...derLength(pkcs1.length), ...pkcs1,        // OCTET STRING with the key
  ];
  return new Uint8Array([0x30, ...derLength(body.length), ...body]);
}

/**
 * Sign one Kalshi request with Web Crypto.
 *
 * Kalshi supports two key types and verifies with the algorithm of the
 * registered public key: Ed25519 (the documented default) signs the message
 * directly; RSA keys use RSA-PSS with SHA-256 and a salt length equal to the
 * digest. Both are documented at
 * https://docs.kalshi.com/getting_started/api_keys ("Headers, pre-sign text,
 * permissions and errors are identical for both types"). The type is detected
 * from the parsed key, because the PEM header alone does not identify it.
 */
async function signDemoRequest(keyId, pem, method, path) {
  const der = pemToArrayBuffer(pem);
  const isPkcs1 = /BEGIN RSA PRIVATE KEY-----/.test(pem);
  const keyDer = isPkcs1 ? wrapPkcs1AsPkcs8(der) : der;
  const ts = String(Date.now());
  const message = new TextEncoder().encode(`${ts}${method}${path}`);
  let signature;
  let keyType;
  if (ed25519Pkcs8(keyDer)) {
    const key = await crypto.subtle.importKey('pkcs8', keyDer, { name: 'Ed25519' }, false, ['sign']);
    signature = await crypto.subtle.sign('Ed25519', key, message);
    keyType = 'Ed25519';
  } else {
    // 'RSASSA-PSS' is the Web Crypto spec name browsers use; 'RSA-PSS' is the
    // alias some bindings (Node's WebCrypto) require. Try the spec name first.
    let key;
    try {
      key = await crypto.subtle.importKey('pkcs8', keyDer, { name: 'RSASSA-PSS', hash: 'SHA-256' }, false, ['sign']);
      signature = await crypto.subtle.sign({ name: 'RSASSA-PSS', saltLength: 32 }, key, message);
    } catch (err) {
      key = await crypto.subtle.importKey('pkcs8', keyDer, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['sign']);
      signature = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, key, message);
    }
    keyType = `RSA-PSS (SHA-256, salt 32${isPkcs1 ? ', PKCS#1 key wrapped as PKCS#8' : ''})`;
  }
  const b64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return {
    keyType,
    headers: {
      'KALSHI-ACCESS-KEY': keyId,
      'KALSHI-ACCESS-TIMESTAMP': ts,
      'KALSHI-ACCESS-SIGNATURE': b64,
    },
  };
}

/**
 * An Ed25519 PKCS#8 key is 48 bytes (16-byte DER header + 32-byte seed); RSA
 * PKCS#8 keys are hundreds of bytes. Length is a safe discriminator between the
 * two types Kalshi issues.
 */
function ed25519Pkcs8(der) {
  return der.byteLength === 48;
}

async function connectDemo() {
  const keyId = qs('#demo-keyid').value.trim();
  const pem = qs('#demo-pem').value.trim();
  const status = qs('#demo-status');
  if (!keyId || !pem) {
    status.innerHTML = '<span class="status-err">Enter both the demo Key ID and the private key PEM (RSA or Ed25519).</span>';
    return;
  }
  status.innerHTML = 'Detecting the key type and signing a test request…';
  try {
    const path = canonicalApiPath('/portfolio/balance');
    const { headers, keyType } = await signDemoRequest(keyId, pem, 'GET', path);
    localStorage.setItem(DEMO_KEY, keyId);
    const res = await fetch(`${SITE.demoApiBase}/portfolio/balance`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    // GET /portfolio/balance documents `balance` in cents plus `balance_dollars`
    // and `portfolio_value` in cents (docs.kalshi.com/api-reference/portfolio/get-balance).
    const balanceDollars = body?.balance_dollars !== undefined ? Number(body.balance_dollars) : null;
    const balanceCents = body?.balance ?? body?.portfolio_balance;
    const pvCents = body?.portfolio_value;
    demoSession = { keyId, pem };
    qs('#demo-positions').disabled = false;
    qs('#demo-fills').disabled = false;
    const orderBtn = qs('#demo-order-submit');
    if (orderBtn) orderBtn.disabled = false;
    const balanceText = isNum(balanceDollars)
      ? fmtUsd(balanceDollars)
      : isNum(balanceCents) ? `${fmtUsd(balanceCents / 100)} (from cents field)` : esc(JSON.stringify(body).slice(0, 120));
    const pvText = isNum(pvCents) ? ` · Portfolio value ${fmtUsd(pvCents / 100)}` : '';
    status.innerHTML = `<span class="status-ok">Connected to Kalshi demo.</span> Balance ${balanceText}${pvText}
      <div class="tiny">Signed <code>GET ${esc(path)}</code> with ${esc(keyType)} per <a href="https://docs.kalshi.com/getting_started/api_keys" target="_blank" rel="noopener noreferrer">API Keys docs</a>.</div>`;
    qs('#demo-pem').value = '';
  } catch (err) {
    const hint = /Failed to fetch|NetworkError|load failed/i.test(err.message)
      ? 'The browser could not reach the demo API — most likely CORS. This does not affect the paper account.'
      : 'Check the Key ID/PEM pair and that the key was created in the demo environment (keys are not shared with production).';
    status.innerHTML = `<span class="status-err">Could not verify: ${esc(err.message)}</span><div class="tiny">${hint}</div>`;
  }
}

function renderDemoStructured(pathWithQuery, body) {
  const host = qs('#demo-structured');
  if (!host) return;
  if (pathWithQuery.startsWith('/portfolio/positions') && Array.isArray(body?.market_positions)) {
    const rows = body.market_positions;
    host.innerHTML = rows.length
      ? `<div class="table-wrap" style="margin-top:8px"><table class="data"><thead><tr><th>Ticker</th><th class="num">Position (fp)</th><th class="num">Total traded</th><th class="num">Realised P&amp;L</th><th>Source</th></tr></thead><tbody>${
        rows.slice(0, 25).map((r) => `<tr>
          <td class="ticker">${esc(r.ticker || '')}</td>
          <td class="num">${esc(r.position_fp ?? r.position ?? '0')}</td>
          <td class="num">${esc(r.total_traded_dollars ?? r.total_traded ?? '—')}</td>
          <td class="num">${esc(r.realized_pnl_dollars ?? r.realized_pnl ?? '—')}</td>
          <td class="tiny"><a href="https://external-api.demo.kalshi.co/trade-api/v2/markets/${encodeURIComponent(r.ticker || '')}" target="_blank" rel="noopener noreferrer">demo API</a></td>
        </tr>`).join('')
      }</tbody></table></div>`
      : '<div class="small" style="margin-top:8px">Demo account returned 0 unsettled market positions.</div>';
    return;
  }
  if (pathWithQuery.startsWith('/portfolio/fills') && Array.isArray(body?.fills)) {
    const rows = body.fills;
    host.innerHTML = rows.length
      ? `<div class="table-wrap" style="margin-top:8px"><table class="data"><thead><tr><th>Ticker</th><th>Outcome / book</th><th class="num">Count</th><th class="num">YES price</th><th class="num">Fee</th><th>Source</th></tr></thead><tbody>${
        rows.slice(0, 25).map((f) => `<tr>
          <td class="ticker">${esc(f.ticker || f.market_ticker || '')}</td>
          <td>${esc((f.outcome_side || f.side || '').toUpperCase())} <span class="tiny">(${esc(f.book_side || f.action || '')})</span></td>
          <td class="num">${esc(f.count_fp ?? f.count ?? '—')}</td>
          <td class="num">$${esc(f.yes_price_dollars ?? '—')}</td>
          <td class="num">$${esc(f.fee_cost ?? '0')}</td>
          <td class="tiny"><a href="https://external-api.demo.kalshi.co/trade-api/v2/markets/${encodeURIComponent(f.ticker || f.market_ticker || '')}" target="_blank" rel="noopener noreferrer">demo API</a></td>
        </tr>`).join('')
      }</tbody></table></div>`
      : '<div class="small" style="margin-top:8px">Demo account returned 0 recent fills.</div>';
  }
}

async function loadDemoResource(pathWithQuery) {
  const status = qs('#demo-status');
  const out = qs('#demo-data');
  if (!demoSession) {
    status.innerHTML = '<span class="status-err">Verify the demo connection first.</span>';
    return;
  }
  const signPath = canonicalApiPath(pathWithQuery);
  try {
    const { headers } = await signDemoRequest(demoSession.keyId, demoSession.pem, 'GET', signPath);
    const res = await fetch(`${SITE.demoApiBase}${pathWithQuery}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    renderDemoStructured(pathWithQuery, body);
    out.textContent = JSON.stringify(body, null, 2).slice(0, 6000);
    out.style.display = 'block';
    status.innerHTML = `<span class="status-ok">Loaded</span> <code>GET ${esc(signPath)}</code> <span class="tiny">— structured summary &amp; raw Kalshi response shown below.</span>`;
  } catch (err) {
    status.innerHTML = `<span class="status-err">Request failed: ${esc(err.message)}</span><div class="tiny">Likely browser CORS on the demo host, or an expired/invalid signature.</div>`;
  }
}

async function submitDemoOrder(ev) {
  ev.preventDefault();
  const status = qs('#demo-order-status');
  if (!demoSession) {
    status.innerHTML = '<span class="status-err">Connect your Kalshi demo API key above before placing a demo order.</span>';
    return;
  }
  const ticker = qs('#demo-order-ticker').value;
  const side = qs('#demo-order-side').value;
  const qty = Number(qs('#demo-order-qty').value || 1);
  const yesPrice = Number(qs('#demo-order-price').value || 0.50);
  const payload = buildDemoOrderV2Payload({ ticker, side, qty, yesPrice });
  const signPath = canonicalApiPath('/portfolio/events/orders');
  status.innerHTML = `Signing <code>POST ${esc(signPath)}</code>…`;
  try {
    const { headers } = await signDemoRequest(demoSession.keyId, demoSession.pem, 'POST', signPath);
    const res = await fetch(`${SITE.demoApiBase}/portfolio/events/orders`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${parsed?.code || parsed?.message || text.slice(0, 140)}`);
    status.innerHTML = `<span class="status-ok">Demo V2 order accepted (HTTP ${res.status}):</span> order_id <code>${esc(parsed.order_id || '—')}</code> · filled ${esc(parsed.fill_count || '0')} · remaining ${esc(parsed.remaining_count || '0')}`;
    const out = qs('#demo-data');
    out.textContent = JSON.stringify({ request: payload, response: parsed }, null, 2);
    out.style.display = 'block';
  } catch (err) {
    status.innerHTML = `<span class="status-err">Demo order failed: ${esc(err.message)}</span> <span class="tiny">(Mock-funds demo endpoint only; check CORS, shard balance, or price grid.)</span>`;
  }
}

export { wrapPkcs1AsPkcs8, signDemoRequest };

if (qs('#pf-kpis')) {
  boot();
}
