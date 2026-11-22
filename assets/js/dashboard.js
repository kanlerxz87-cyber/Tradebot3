/**
 * Tradebot3 — dashboard page controller.
 */

import {
  SITE, TOPICS, TOPIC_ORDER, initChrome, el, qs, qsa, toast,
  fmtUsd, fmtContracts, fmtPrice, fmtDelta, fmtNum, fmtDateTime, fmtClock, timeAgo,
  esc, isNum, scoreMarket,
} from './core.js';
import { MarketData, TIMEFRAMES } from './market-data.js';
import { PriceChart } from './chart.js';
import { AlertFeed } from './alerts.js';
import { renderOrderbook } from './orderbook.js';
import { PaperAccount } from './paper.js';

const data = new MarketData();
const state = {
  timeframe: '5m',
  selectedTicker: null,
  eventTopic: 'all',
  feedsPaused: false,
  autoRefresh: true,
};

let account;
let chart;
let feedAll;
let feedModel;

async function boot() {
  initChrome({ active: 'index.html' });
  try {
    await data.load();
  } catch (err) {
    qs('#data-status').innerHTML = `<span class="status-err">Could not load assets/data/snapshot.json</span> — ${esc(err.message)}`;
    return;
  }
  account = new PaperAccount(data);
  account.settleResolved();

  buildChrome();
  renderStatus();
  renderKpis();
  renderTopicCards();
  renderEventsTable();
  renderResolutions();
  initChart();
  renderQuickTradeDefaults();
  bindControls();

  feedAll = new AlertFeed({ container: qs('#chat-all'), counter: qs('#count-all'), mode: 'all', data, onSelect: selectMarket });
  feedModel = new AlertFeed({ container: qs('#chat-model'), counter: qs('#count-model'), mode: 'model', data, onSelect: selectMarket });
  feedAll.addMany(snapshotAlerts());
  feedModel.addMany(snapshotAlerts());
  refreshTradeKpis();

  data.on('alert', (alert) => {
    feedAll.add(alert);
    feedModel.add(alert);
  });
  data.on('status', renderStatus);
  data.on('update', () => {
    renderStatus();
    refreshTradeKpis();
    if (state.selectedTicker) drawChart();
  });
  data.startLive();

  if (state.autoRefresh) {
    setInterval(async () => {
      if (document.hidden) return;
      try {
        await data.load();
        renderStatus();
        renderKpis();
        renderEventsTable();
      } catch { /* keep the current snapshot */ }
    }, 300000);
  }
}

function snapshotAlerts() {
  const refsByTopic = data.snapshot?.topics || {};
  return data.alerts().map((a) => ({
    ...a,
    ts: typeof a.ts === 'number' ? a.ts * 1000 : Date.parse(a.iso_time),
    source_note: 'from official 1m candles',
    catalyst_links: (refsByTopic[a.topic]?.reference_links || []).filter((r) => r.reachable),
  }));
}

function buildChrome() {
  const select = qs('#chart-market-select');
  select.innerHTML = '';
  for (const topic of TOPIC_ORDER) {
    const group = el('optgroup', { label: TOPICS[topic].name });
    const markets = data.marketsFor(topic).slice().sort((a, b) => (b.volume || 0) - (a.volume || 0));
    for (const m of markets) {
      const label = `${(m.event_title || m.title || m.ticker).slice(0, 70)} · ${m.subtitle || ''} (${m.ticker})`;
      group.append(el('option', { value: m.ticker, text: label }));
    }
    if (markets.length) select.append(group);
  }

  const tf = qs('#chart-tf');
  tf.innerHTML = '';
  const frames = [{ id: 'live', label: 'Live · sec' }, ...TIMEFRAMES.map((t) => ({ id: t.id, label: t.label }))];
  for (const frame of frames) {
    const btn = el('button', { type: 'button', text: frame.label, 'aria-pressed': String(frame.id === state.timeframe) });
    btn.addEventListener('click', () => {
      state.timeframe = frame.id;
      qsa('#chart-tf button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      drawChart();
    });
    tf.append(btn);
  }

  const filter = qs('#events-filter');
  filter.innerHTML = '';
  for (const topic of ['all', ...TOPIC_ORDER]) {
    const chip = el('button', { type: 'button', class: 'topic-chip', 'aria-pressed': String(topic === state.eventTopic) });
    if (topic === 'all') chip.append(document.createTextNode('All topics'));
    else {
      const swatch = el('span', { class: 'swatch' });
      swatch.style.background = TOPICS[topic].color;
      chip.append(swatch, document.createTextNode(TOPICS[topic].name));
    }
    chip.addEventListener('click', () => {
      state.eventTopic = topic;
      qsa('#events-filter .topic-chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      renderEventsTable();
    });
    filter.append(chip);
  }

  const first = pickDefaultMarket();
  if (first) select.value = first;
}

function pickDefaultMarket() {
  const withCandles = data.markets.filter((m) => m.candles?.m1?.length);
  const pool = withCandles.length ? withCandles : data.markets;
  const best = pool.slice().sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];
  if (best) state.selectedTicker = best.ticker;
  return state.selectedTicker;
}

function renderStatus() {
  const box = qs('#data-status');
  if (!box) return;
  const live = data.live;
  const liveLabel = {
    idle: '<span class="status-warn">not started</span>',
    connecting: '<span class="status-warn">connecting…</span>',
    live: '<span class="status-ok">connected</span>',
    blocked: '<span class="status-warn">blocked by browser (CORS/offline)</span>',
    error: '<span class="status-err">poll error</span>',
    paused: '<span class="status-warn">paused</span>',
  }[live.state] || live.state;

  const stats = data.snapshot?.stats || {};
  const parts = [
    `<span><strong>Snapshot</strong> ${esc(fmtDateTime(data.generatedAt))} UTC (${esc(timeAgo(data.generatedAt))})</span>`,
    '<span class="sep">|</span>',
    `<span><strong>Source</strong> <a href="https://docs.kalshi.com/getting_started/api_environments" target="_blank" rel="noopener noreferrer">Kalshi public Trade API</a> (unauthenticated)</span>`,
    '<span class="sep">|</span>',
    `<span><strong>Live API</strong> ${liveLabel}${live.lastError ? ` <span class="tiny">(${esc(live.lastError)})</span>` : ''}</span>`,
    '<span class="sep">|</span>',
    `<span class="tiny">${fmtNum(stats.open_markets_scanned || 0)} open markets scanned · ${fmtNum(stats.settled_markets_recent || 0)} recent settlements · ${stats.candle_series_fetched || 0} candle series</span>`,
  ];
  box.innerHTML = parts.join(' ');
}

function renderKpis() {
  const host = qs('#kpi-strip');
  const markets = data.markets;
  const events = data.allEvents();
  const volume = markets.reduce((s, m) => s + (m.volume || 0), 0);
  const alerts = data.alerts();
  const recentAlerts = alerts.filter((a) => a.ts * 1000 > Date.now() - 86400000);
  const equity = account ? account.equity() : null;
  const pnl = account ? account.analytics().totalPnl + account.marked().reduce((s, p) => s + p.pnl, 0) : null;

  const cards = [
    { label: 'Live events tracked', value: fmtNum(events.length), foot: `${markets.length} markets across 5 topics` },
    { label: 'Official contract volume', value: fmtContracts(volume), foot: 'sum of volume_fp (contracts)' },
    { label: '≥ $0.10 moves detected', value: fmtNum(alerts.length), foot: `${recentAlerts.length} in the last 24h` },
    { label: 'Recently resolved', value: fmtNum(data.resolutions().length), foot: 'official YES / NO results' },
    {
      label: 'Paper equity',
      value: `$${equity !== null ? equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}`,
      foot: `P&L ${pnl !== null ? `${pnl >= 0 ? '+' : '−'}$${Math.abs(pnl).toFixed(2)}` : '—'} · ${account?.openPositions.length || 0} open`,
    },
  ];
  host.innerHTML = '';
  for (const card of cards) {
    host.append(el('div', { class: 'kpi' },
      el('div', { class: 'label', text: card.label }),
      el('div', { class: 'value', text: card.value }),
      el('div', { class: 'foot', text: card.foot }),
    ));
  }
}

function renderTopicCards() {
  const host = qs('#topic-cards');
  host.innerHTML = '';
  for (const topic of TOPIC_ORDER) {
    const stats = data.topicStats(topic);
    const alerts = data.alerts().filter((a) => a.topic === topic).length;
    const card = el('a', { class: 'topic-card', href: TOPICS[topic].page });
    card.style.setProperty('--topic-color', TOPICS[topic].color);
    card.innerHTML = `
      <div class="tc-top"><span class="tc-name">${esc(TOPICS[topic].name)}</span><span class="badge badge-neutral">${stats.events} live</span></div>
      <div class="tc-stat">${fmtContracts(stats.volume)} ct</div>
      <div class="tc-sub">${alerts} ≥$0.10 move${alerts === 1 ? '' : 's'} · ${stats.markets} markets tracked</div>`;
    host.append(card);
  }
}

function renderEventsTable() {
  const body = qs('#events-table-body');
  if (!body) return;
  const events = data.allEvents()
    .filter((e) => state.eventTopic === 'all' || e.topic === state.eventTopic)
    .sort((a, b) => (b.est_dollars_traded || 0) - (a.est_dollars_traded || 0));
  body.innerHTML = '';
  if (!events.length) {
    body.innerHTML = '<tr><td colspan="9" class="table-empty">No tracked events for this filter in the current snapshot.</td></tr>';
    return;
  }
  for (const ev of events.slice(0, 40)) {
    const lead = ev.markets.slice().sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];
    const vol24 = ev.markets.reduce((s, m) => s + (m.volume_24h || 0), 0);
    const resolvedYes = ev.markets.filter((m) => (m.result || '').toLowerCase() === 'yes').length;
    const resolvedNo = ev.markets.filter((m) => (m.result || '').toLowerCase() === 'no').length;
    const openCount = ev.markets.filter((m) => m.status === 'active').length;
    const statusBadge = openCount
      ? `<span class="badge badge-open">${openCount} open</span>`
      : `<span class="badge badge-neutral">closed</span>`;
    const tr = el('tr');
    tr.innerHTML = `
      <td class="title"><a class="row-link" href="${esc(ev.kalshi_url)}" target="_blank" rel="noopener noreferrer">${esc(ev.title || ev.event_ticker)}</a>
        <div class="ticker">${esc(ev.event_ticker)}</div></td>
      <td>${topicDot(ev.topic)}</td>
      <td class="num">${fmtContracts(ev.volume_total)}</td>
      <td class="num">${fmtUsd(ev.est_dollars_traded)}<div class="tiny">estimate</div></td>
      <td class="num">${fmtContracts(vol24)}</td>
      <td class="num">${lead ? fmtPrice(data.bestPrice(lead)) : '—'}<div class="tiny">${lead ? esc((lead.subtitle || '').slice(0, 26)) : ''}</div></td>
      <td>${statusBadge}${resolvedYes || resolvedNo ? `<div class="tiny">YES ${resolvedYes} · NO ${resolvedNo}</div>` : ''}</td>
      <td class="tiny">${esc(fmtDate(lead?.close_time))}</td>
      <td class="tiny"><a href="${esc(ev.kalshi_url)}" target="_blank" rel="noopener noreferrer">Kalshi</a> · <a href="${esc(lead?.api_url || SITE.apiBase)}" target="_blank" rel="noopener noreferrer">API</a></td>`;
    body.append(tr);
  }
}

function topicDot(topic) {
  const t = TOPICS[topic];
  return `<span class="badge badge-neutral"><span class="dot" style="background:${t?.color || '#64748b'}"></span>${esc(t?.name || topic)}</span>`;
}

function renderResolutions() {
  const body = qs('#resolutions-table-body');
  if (!body) return;
  const rows = data.resolutions().slice(0, 20);
  body.innerHTML = '';
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="6" class="table-empty">No settlements captured in this refresh window.</td></tr>';
    return;
  }
  for (const r of rows) {
    const tr = el('tr');
    tr.innerHTML = `
      <td>${esc(fmtDate(r.close_time))}</td>
      <td class="title"><a class="row-link" href="${esc(r.kalshi_url)}" target="_blank" rel="noopener noreferrer">${esc(r.event_title || r.title)}</a>
        <div class="ticker">${esc(r.ticker)}</div></td>
      <td>${topicDot(r.topic)}</td>
      <td><span class="badge badge-${String(r.result).toLowerCase() === 'yes' ? 'yes' : 'no'}">${esc(r.result)}</span></td>
      <td class="num">${isNum(r.settlement_value) ? `$${r.settlement_value.toFixed(2)}` : '—'}</td>
      <td class="num">${fmtContracts(r.volume)}</td>`;
    body.append(tr);
  }
}

function initChart() {
  const canvas = qs('#chart-canvas');
  chart = new PriceChart(canvas, {
    tooltipEl: qs('#chart-tooltip'),
    popoverEl: qs('#chart-popover'),
  });
  qs('#chart-market-select').addEventListener('change', (ev) => {
    state.selectedTicker = ev.target.value;
    drawChart();
  });
  drawChart();
}

function selectMarket(ticker) {
  state.selectedTicker = ticker;
  const select = qs('#chart-market-select');
  if (select) select.value = ticker;
  drawChart();
  qs('#chart-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function drawChart() {
  if (!chart || !state.selectedTicker) return;
  qs('#chart-market-select').value = state.selectedTicker;
  const market = data.byTicker.get(state.selectedTicker);
  if (!market) return;

  const refs = data.snapshot?.topics?.[market.topic]?.reference_links || [];
  const catalystLinks = refs.filter((r) => r.reachable).map((r) => ({ label: r.label, url: r.url }));

  let series;
  let tfLabel;
  if (state.timeframe === 'live') {
    series = data.liveSeries(market.ticker, 300);
    tfLabel = 'live browser ticks (seconds)';
  } else {
    series = data.candlesFor(market.ticker, state.timeframe).map((c) => ({ t: c.t, price: c.price }));
    tfLabel = TIMEFRAMES.find((t) => t.id === state.timeframe)?.label || state.timeframe;
  }
  if (!series.length) {
    const m1 = data.candlesFor(market.ticker, '1m').map((c) => ({ t: c.t, price: c.price }));
    series = m1;
    if (state.timeframe === 'live') tfLabel += ' — no ticks yet, showing 1-minute candles';
  }

  const markers = data.alerts()
    .filter((a) => a.ticker === market.ticker)
    .map((a) => ({
      ...a,
      ts: typeof a.ts === 'number' ? a.ts * 1000 : Date.parse(a.iso_time),
      catalyst_links: catalystLinks,
    }));

  chart.setData({ series, markers, label: tfLabel, priceLabel: `${market.ticker} · ${tfLabel}` });

  const meta = qs('#chart-meta');
  const price = data.bestPrice(market);
  const ob = market.orderbook;
  meta.innerHTML = `
    <div class="pill-row">
      <span class="badge ${market.status === 'active' ? 'badge-open' : 'badge-neutral'}">${esc(market.status || 'unknown')}</span>
      ${topicDot(market.topic)}
      <span class="badge badge-neutral">last ${fmtPrice(price)}</span>
      <span class="badge badge-neutral">bid ${fmtPrice(ob?.best_yes_bid ?? market.yes_bid)} / ask ${fmtPrice(ob?.best_yes_ask ?? market.yes_ask)}</span>
      ${market.result ? `<span class="badge badge-${String(market.result).toLowerCase()}">resolved ${esc(String(market.result).toUpperCase())}</span>` : ''}
      <span class="tiny">closes ${esc(fmtDateTime(market.close_time))}</span>
      <span class="tiny"><a href="${esc(market.kalshi_url)}" target="_blank" rel="noopener noreferrer">Kalshi page</a> · <a href="${esc(market.api_url)}" target="_blank" rel="noopener noreferrer">API record</a></span>
    </div>
    <div class="small" style="margin-top:4px">${esc(market.event_title || '')} — ${esc(market.title || '')}</div>`;

  renderCatalysts(market, catalystLinks);
  renderOrderbook(qs('#orderbook-panel'), market, {
    onLevelClick: (level) => {
      const qty = qs('#qt-qty');
      if (qty) qty.value = String(Math.max(1, Math.floor(level.contracts)));
      toast(`Loaded ${Math.floor(level.contracts)} contracts at ${fmtPrice(level.price)} into the ticket`, 'ok');
    },
  });
  renderQuickTradeDefaults();
  updateTicketPreview();
}

function renderCatalysts(market, links) {
  const host = qs('#chart-catalysts');
  if (!host) return;
  const moves = data.alerts().filter((a) => a.ticker === market.ticker).slice(0, 4);
  const items = moves.map((a) => `
    <li>
      <strong>${fmtDelta(a.delta)}</strong> ${fmtPrice(a.from_price)} → ${fmtPrice(a.to_price)}
      at ${esc(fmtClock(typeof a.ts === 'number' ? a.ts * 1000 : Date.parse(a.iso_time)))} (${esc(a.interval)})
      — <a href="${esc(a.kalshi_url)}" target="_blank" rel="noopener noreferrer">event</a>
    </li>`).join('');
  host.innerHTML = `
    <h3 style="margin-bottom:6px">≥ $0.10 jump markers on this contract</h3>
    ${items ? `<ul class="tight">${items}</ul>` : '<div class="small">No ≥ $0.10 move for this contract in the current candle window.</div>'}
    <div class="hr"></div>
    <div class="small"><strong>Primary-source pages for this topic</strong> (candidate causes, not confirmed):</div>
    <ul class="tight small">${links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`).join('') || '<li>none verified this refresh</li>'}</ul>
    <div class="tiny">Marker causality is not asserted: Kalshi candles show the price move, the linked pages are the official data sources for the topic.</div>`;
}

function renderQuickTradeDefaults() {
  const strategySelect = qs('#qt-strategy');
  if (!strategySelect || strategySelect.options.length) return;
  for (const name of ['Manual', 'Swing Mean-Reversion', 'Momentum Breakout', 'High-ROI Model', 'News Catalyst']) {
    strategySelect.append(el('option', { value: name, text: name }));
  }
}

function updateTicketPreview() {
  const host = qs('#qt-preview');
  if (!host || !state.selectedTicker) return;
  const market = data.byTicker.get(state.selectedTicker);
  const side = qs('#qt-side')?.value || 'YES';
  const qty = Number(qs('#qt-qty')?.value || 1);
  const quote = account.priceFor(market.ticker, side);
  if (!quote) { host.textContent = 'No usable quote.'; return; }
  const cost = quote.price * qty;
  host.innerHTML = `Est. ${qty} × ${fmtPrice(quote.price)} = <strong>$${cost.toFixed(2)}</strong> <span class="tiny">(${esc(quote.source)}; max payout $${(qty * 1).toFixed(2)})</span>`;
}

function bindControls() {
  qs('#qt-side')?.addEventListener('change', updateTicketPreview);
  qs('#qt-qty')?.addEventListener('input', updateTicketPreview);
  qs('#quick-trade-form')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!state.selectedTicker) return;
    const side = qs('#qt-side').value;
    const qty = Number(qs('#qt-qty').value);
    const strategy = qs('#qt-strategy').value;
    try {
      const pos = account.buy({ ticker: state.selectedTicker, side, qty, strategy, note: 'dashboard ticket' });
      qs('#qt-feedback').innerHTML = `<span class="status-ok">Filled</span> ${pos.qty} × ${side} @ ${fmtPrice(pos.entry)} (${esc(pos.entry_source)})`;
      toast(`Paper fill: ${pos.qty} × ${side} ${state.selectedTicker}`, 'ok');
      refreshTradeKpis();
      renderKpis();
      updateTicketPreview();
    } catch (err) {
      qs('#qt-feedback').innerHTML = `<span class="status-err">${esc(err.message)}</span>`;
    }
  });
  qs('#btn-refresh-data')?.addEventListener('click', async () => {
    try {
      await data.load();
      renderStatus(); renderKpis(); renderTopicCards(); renderEventsTable(); renderResolutions();
      drawChart();
      toast('Snapshot reloaded from the repository', 'ok');
    } catch (err) {
      toast(`Reload failed: ${err.message}`, 'err');
    }
  });
  qs('#btn-toggle-live')?.addEventListener('click', (ev) => {
    if (data.live.enabled) {
      data.stopLive();
      ev.target.textContent = 'Live polling: OFF';
    } else {
      data.startLive();
      ev.target.textContent = 'Live polling: ON';
    }
  });
  qs('#btn-pause-all')?.addEventListener('click', (ev) => togglePause(ev, [feedAll]));
  qs('#btn-pause-model')?.addEventListener('click', (ev) => togglePause(ev, [feedModel]));
}

function togglePause(ev, feeds) {
  state.feedsPaused = !state.feedsPaused;
  for (const feed of feeds) feed.setPaused(state.feedsPaused);
  ev.target.textContent = state.feedsPaused ? 'Resume feed' : 'Pause feed';
}

function refreshTradeKpis() {
  const cash = qs('#qt-cash');
  if (cash && account) {
    cash.innerHTML = `Paper cash <strong>$${account.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> · ${account.openPositions.length} open positions · <a href="portfolio.html">Portfolio →</a>`;
  }
}

boot();
