/**
 * Tradebot3 — category page controller (one per topic).
 * Reads the topic from <body data-topic="...">.
 */

import {
  SITE, TOPICS, initChrome, el, qs, qsa, toast, fmtUsd, fmtContracts, fmtPrice, fmtDelta,
  fmtNum, fmtDateTime, fmtDate, fmtClock, timeAgo, esc, isNum,
} from './core.js';
import { MarketData, TIMEFRAMES } from './market-data.js';
import { PriceChart } from './chart.js';
import { AlertFeed } from './alerts.js';
import { renderOrderbook } from './orderbook.js';
import { PaperAccount } from './paper.js';

const topicId = document.body.dataset.topic;
const topic = TOPICS[topicId];
const data = new MarketData();
const state = { timeframe: '5m', selected: null };
let account;
let chart;
let feedAll;
let feedModel;

async function boot() {
  initChrome({ active: topicId, base: '../' });
  if (!topic) return;
  document.title = `${topic.name} — Tradebot3 Kalshi dashboard`;
  qs('#topic-title').textContent = topic.name;
  qs('#topic-blurb').textContent = topic.blurb;

  try {
    await data.load();
  } catch (err) {
    qs('#topic-status').innerHTML = `<span class="status-err">Snapshot failed to load:</span> ${esc(err.message)}`;
    return;
  }
  account = new PaperAccount(data);
  account.settleResolved();

  const markets = data.marketsFor(topicId).slice().sort((a, b) => (b.volume || 0) - (a.volume || 0));
  state.selected = (markets.find((m) => m.candles?.m1?.length) || markets[0])?.ticker || null;

  renderStatus();
  renderKpis(markets);
  renderTable(markets);
  renderResolutions();
  renderChartSelect(markets);
  initChart();
  bindTicket();
  initFeeds();
  renderReferences();
  data.on('status', renderStatus);
  data.on('alert', (a) => {
    if (a.topic !== topicId) return;
    feedAll.add(a);
    feedModel.add(a);
  });
  data.on('update', () => { renderStatus(); drawChart(); });
  data.startLive();
}

function renderStatus() {
  const stats = data.topicStats(topicId);
  const live = data.live.state;
  const liveText = live === 'live' ? '<span class="status-ok">connected</span>'
    : live === 'blocked' ? '<span class="status-warn">blocked (CORS/offline)</span>'
      : live === 'error' ? '<span class="status-err">poll error</span>'
        : '<span class="status-warn">connecting…</span>';
  qs('#topic-status').innerHTML = `
    <span><strong>${stats.events}</strong> live events · <strong>${stats.markets}</strong> markets tracked</span>
    <span class="sep">|</span>
    <span>Snapshot ${esc(fmtDateTime(data.generatedAt))} UTC (${esc(timeAgo(data.generatedAt))})</span>
    <span class="sep">|</span>
    <span>Live API ${liveText}</span>
    <span class="sep">|</span>
    <span class="tiny">Inclusion rule: ${esc(data.snapshot?.topics?.[topicId]?.inclusion_rule || '—')}</span>`;
}

function renderKpis(markets) {
  const host = qs('#topic-kpis');
  const alerts = data.alerts().filter((a) => a.topic === topicId);
  const resolved = data.resolutions().filter((r) => r.topic === topicId);
  const volume = markets.reduce((s, m) => s + (m.volume || 0), 0);
  const vol24 = markets.reduce((s, m) => s + (m.volume_24h || 0), 0);
  const oi = markets.reduce((s, m) => s + (m.open_interest || 0), 0);
  const cards = [
    { label: 'Live events', value: fmtNum(data.eventsFor(topicId).length), foot: `${markets.length} markets` },
    { label: 'Official volume', value: fmtContracts(volume), foot: 'contracts (volume_fp)' },
    { label: '24h volume', value: fmtContracts(vol24), foot: 'contracts (volume_24h_fp)' },
    { label: 'Open interest', value: fmtContracts(oi), foot: 'contracts' },
    { label: '≥$0.10 moves', value: fmtNum(alerts.length), foot: `${resolved.length} resolved` },
  ];
  host.innerHTML = '';
  for (const c of cards) {
    host.append(el('div', { class: 'kpi' },
      el('div', { class: 'label', text: c.label }),
      el('div', { class: 'value', text: c.value }),
      el('div', { class: 'foot', text: c.foot })));
  }
}

function renderTable(markets) {
  const body = qs('#topic-table-body');
  body.innerHTML = '';
  if (!markets.length) {
    body.innerHTML = '<tr><td colspan="10" class="table-empty">No markets in this topic in the current snapshot.</td></tr>';
    return;
  }
  const events = new Map(data.eventsFor(topicId).map((e) => [e.event_ticker, e]));
  const byEvent = new Map();
  for (const m of markets) {
    const list = byEvent.get(m.event_ticker) || [];
    list.push(m);
    byEvent.set(m.event_ticker, list);
  }
  const ordered = [...byEvent.entries()].sort((a, b) => {
    const va = a[1].reduce((s, m) => s + (m.volume || 0), 0);
    const vb = b[1].reduce((s, m) => s + (m.volume || 0), 0);
    return vb - va;
  });

  for (const [eventTicker, list] of ordered) {
    const ev = events.get(eventTicker) || {};
    const header = el('tr');
    header.style.background = '#f8fafc';
    header.innerHTML = `<td colspan="10" style="padding:7px 10px">
      <strong>${esc(ev.title || eventTicker)}</strong>
      <span class="tiny">· ${esc(eventTicker)} · ${list.length} tracked markets · ${fmtContracts(list.reduce((s, m) => s + (m.volume || 0), 0))} contracts</span>
      <a class="tiny" style="margin-left:6px" href="${esc(ev.kalshi_url || `https://kalshi.com/events/${eventTicker}`)}" target="_blank" rel="noopener noreferrer">open on Kalshi ↗</a>
    </td>`;
    body.append(header);

    for (const m of list.slice().sort((a, b) => (b.volume || 0) - (a.volume || 0))) {
      const price = data.bestPrice(m);
      const ob = m.orderbook;
      const tr = el('tr');
      const resultBadge = m.result
        ? `<span class="badge badge-${String(m.result).toLowerCase()}">${esc(String(m.result).toUpperCase())}</span>`
        : `<span class="badge badge-open">${esc(m.status || 'open')}</span>`;
      tr.innerHTML = `
        <td class="title"><a class="row-link" href="${esc(m.kalshi_url)}" target="_blank" rel="noopener noreferrer">${esc(m.title || m.ticker)}</a>
          <div class="ticker">${esc(m.subtitle || '')}</div></td>
        <td class="num">${fmtPrice(price)}</td>
        <td class="num">${fmtPrice(ob?.best_yes_bid ?? m.yes_bid)} / ${fmtPrice(ob?.best_yes_ask ?? m.yes_ask)}</td>
        <td class="num">${isNum(ob?.spread) ? `${(ob.spread * 100).toFixed(1)}¢` : '—'}</td>
        <td class="num">${fmtContracts(m.volume)}</td>
        <td class="num">${fmtContracts(m.volume_24h)}</td>
        <td class="num">${fmtContracts(m.open_interest)}</td>
        <td class="num">${fmtContracts(ob ? (ob.yes_bid_contracts + ob.no_bid_contracts) : null)}</td>
        <td>${resultBadge}</td>
        <td class="tiny"><a href="${esc(m.kalshi_url)}" target="_blank" rel="noopener noreferrer">Kalshi</a><br><a href="${esc(m.api_url)}" target="_blank" rel="noopener noreferrer">API</a></td>`;
      body.append(tr);
    }
  }
}

function renderResolutions() {
  const body = qs('#topic-resolutions');
  if (!body) return;
  const rows = data.resolutions().filter((r) => r.topic === topicId).slice(0, 25);
  body.innerHTML = '';
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="6" class="table-empty">No settlements captured for this topic in the lookback window.</td></tr>';
    return;
  }
  for (const r of rows) {
    const tr = el('tr');
    tr.innerHTML = `
      <td>${esc(fmtDate(r.close_time))}</td>
      <td class="title"><a class="row-link" href="${esc(r.kalshi_url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>
        <div class="ticker">${esc(r.ticker)}</div></td>
      <td><span class="badge badge-${String(r.result).toLowerCase() === 'yes' ? 'yes' : 'no'}">${esc(r.result)}</span></td>
      <td class="num">${isNum(r.settlement_value) ? `$${r.settlement_value.toFixed(2)}` : '—'}</td>
      <td class="num">${fmtContracts(r.volume)}</td>
      <td class="tiny"><a href="${esc(r.source_url)}" target="_blank" rel="noopener noreferrer">API record</a></td>`;
    body.append(tr);
  }
}

function renderChartSelect(markets) {
  const select = qs('#chart-market-select');
  select.innerHTML = '';
  for (const m of markets) {
    select.append(el('option', {
      value: m.ticker,
      text: `${(m.title || m.ticker).slice(0, 80)}${m.candles ? '' : ' (no candles)'}`,
    }));
  }
  if (state.selected) select.value = state.selected;
  select.addEventListener('change', () => {
    state.selected = select.value;
    drawChart();
  });

  const tfHost = qs('#chart-tf');
  const frames = [{ id: 'live', label: 'Live · sec' }, ...TIMEFRAMES.map((t) => ({ id: t.id, label: t.label }))];
  for (const frame of frames) {
    const btn = el('button', { type: 'button', text: frame.label, 'aria-pressed': String(frame.id === state.timeframe) });
    btn.addEventListener('click', () => {
      state.timeframe = frame.id;
      qsa('#chart-tf button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      drawChart();
    });
    tfHost.append(btn);
  }
}

function initChart() {
  chart = new PriceChart(qs('#chart-canvas'), {
    tooltipEl: qs('#chart-tooltip'),
    popoverEl: qs('#chart-popover'),
  });
  drawChart();
}

function drawChart() {
  if (!chart || !state.selected) return;
  const market = data.byTicker.get(state.selected);
  if (!market) return;
  const refs = (data.snapshot?.topics?.[topicId]?.reference_links || []).filter((r) => r.reachable);
  const series = state.timeframe === 'live'
    ? data.liveSeries(market.ticker, 300)
    : data.candlesFor(market.ticker, state.timeframe).map((c) => ({ t: c.t, price: c.price }));
  const fallback = data.candlesFor(market.ticker, '1m').map((c) => ({ t: c.t, price: c.price }));
  const markers = data.alerts().filter((a) => a.ticker === market.ticker).map((a) => ({
    ...a,
    ts: typeof a.ts === 'number' ? a.ts * 1000 : Date.parse(a.iso_time),
    catalyst_links: refs.map((r) => ({ label: r.label, url: r.url })),
  }));
  chart.setData({
    series: series.length ? series : fallback,
    markers,
    label: `${market.ticker} · ${state.timeframe}`,
    priceLabel: `${market.ticker} · ${state.timeframe}`,
  });

  qs('#chart-meta').innerHTML = `
    <div class="pill-row">
      <span class="badge badge-neutral">last ${fmtPrice(data.bestPrice(market))}</span>
      <span class="badge badge-neutral">spread ${isNum(market.orderbook?.spread) ? `${(market.orderbook.spread * 100).toFixed(1)}¢` : '—'}</span>
      ${market.result ? `<span class="badge badge-${String(market.result).toLowerCase()}">resolved ${esc(String(market.result).toUpperCase())}</span>` : ''}
      <span class="tiny">closes ${esc(fmtDateTime(market.close_time))}</span>
      <span class="tiny"><a href="${esc(market.kalshi_url)}" target="_blank" rel="noopener noreferrer">Kalshi</a> · <a href="${esc(market.api_url)}" target="_blank" rel="noopener noreferrer">API</a></span>
    </div>
    <div class="small" style="margin-top:4px">${esc(market.title || '')}</div>`;

  renderOrderbook(qs('#orderbook-panel'), market);
  const moves = data.alerts().filter((a) => a.ticker === market.ticker).slice(0, 5);
  qs('#chart-catalysts').innerHTML = `
    <h3 style="margin-bottom:6px">≥ $0.10 jumps &amp; candidate sources</h3>
    ${moves.length ? `<ul class="tight">${moves.map((a) => `<li><strong>${fmtDelta(a.delta)}</strong> ${fmtPrice(a.from_price)} → ${fmtPrice(a.to_price)} at ${esc(fmtClock(typeof a.ts === 'number' ? a.ts * 1000 : Date.parse(a.iso_time)))} — <a href="${esc(a.kalshi_url)}" target="_blank" rel="noopener noreferrer">event</a></li>`).join('')}</ul>` : '<div class="small">No ≥ $0.10 move for this contract in the current window.</div>'}
    <div class="hr"></div>
    <ul class="tight small">${refs.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.label)}</a></li>`).join('') || '<li>No topic source links verified this refresh.</li>'}</ul>
    <div class="tiny">Source pages are candidates for context; no causal claim is made.</div>`;
}

function bindTicket() {
  const select = qs('#qt-market');
  const markets = data.marketsFor(topicId).slice().sort((a, b) => (b.volume || 0) - (a.volume || 0));
  for (const m of markets) {
    select.append(el('option', { value: m.ticker, text: `${(m.title || m.ticker).slice(0, 70)}` }));
  }
  if (state.selected) select.value = state.selected;
  const strategy = qs('#qt-strategy');
  for (const name of ['Manual', 'Swing Mean-Reversion', 'Momentum Breakout', 'High-ROI Model', 'News Catalyst']) {
    strategy.append(el('option', { value: name, text: name }));
  }
  const preview = () => {
    const qty = Number(qs('#qt-qty').value || 1);
    const side = qs('#qt-side').value;
    const quote = account.priceFor(select.value, side);
    qs('#qt-preview').innerHTML = quote
      ? `${qty} × ${fmtPrice(quote.price)} = <strong>$${(quote.price * qty).toFixed(2)}</strong> <span class="tiny">(${esc(quote.source)})</span>`
      : 'No usable quote for this market.';
  };
  select.addEventListener('change', () => { state.selected = select.value; drawChart(); preview(); });
  qs('#qt-side').addEventListener('change', preview);
  qs('#qt-qty').addEventListener('input', preview);
  qs('#quick-trade-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    try {
      const pos = account.buy({
        ticker: select.value,
        side: qs('#qt-side').value,
        qty: Number(qs('#qt-qty').value),
        strategy: strategy.value,
        note: `${topicId} page ticket`,
      });
      qs('#qt-feedback').innerHTML = `<span class="status-ok">Filled</span> ${pos.qty} × ${pos.side} @ ${fmtPrice(pos.entry)}`;
      toast('Paper order filled', 'ok');
      renderCash();
    } catch (err) {
      qs('#qt-feedback').innerHTML = `<span class="status-err">${esc(err.message)}</span>`;
    }
  });
  preview();
  renderCash();
}

function renderCash() {
  qs('#qt-cash').innerHTML = `Paper cash <strong>$${account.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> · ${account.openPositions.length} open · <a href="../portfolio.html">Portfolio →</a>`;
}

function initFeeds() {
  feedAll = new AlertFeed({ container: qs('#chat-all'), counter: qs('#count-all'), mode: 'all', data, onSelect: (t) => { state.selected = t; qs('#chart-market-select').value = t; drawChart(); } });
  feedModel = new AlertFeed({ container: qs('#chat-model'), counter: qs('#count-model'), mode: 'model', data, onSelect: (t) => { state.selected = t; qs('#chart-market-select').value = t; drawChart(); } });
  const alerts = data.alerts().filter((a) => a.topic === topicId).map((a) => ({
    ...a,
    ts: typeof a.ts === 'number' ? a.ts * 1000 : Date.parse(a.iso_time),
    source_note: 'official 1m candles',
    catalyst_links: (data.snapshot?.topics?.[topicId]?.reference_links || []).filter((r) => r.reachable),
  }));
  feedAll.addMany(alerts);
  feedModel.addMany(alerts);
}

function renderReferences() {
  const refs = data.snapshot?.topics?.[topicId]?.reference_links || [];
  const host = qs('#topic-references');
  if (!host) return;
  host.innerHTML = refs.length
    ? `<ul class="tight small">${refs.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.label)}</a> ${r.reachable ? '<span class="badge badge-up">reachable</span>' : '<span class="badge badge-warn">flagged</span>'}</li>`).join('')}</ul>`
    : '<div class="small">No reference links verified in this refresh.</div>';
}

boot();
