/**
 * Landing page controller for dated production catalog data, best-effort Demo REST snapshots,
 * explicit paper simulations, and the local simulated portfolio.
 */

import { TOPICS, ALLOWED_TOPICS, LAST_VERIFIED_DATE_UTC } from './data.js';
import { engine, TRADE_CATEGORIES } from './engine.js';
import { renderPriceChart } from './charts.js';
import {
  renderHeader,
  renderFooter,
  escapeHtml,
  formatDollarVolume,
  formatPrice,
  formatDeltaBadge,
  formatTopicBadge,
  formatResolutionBadge,
  formatSourceLink,
  renderOrderbookHtml,
  renderAlertItemHtml
} from './ui-common.js';

let selectedTicker = 'KXPRESNOMD-28';
let selectedRangeHours = 1;
let selectedTableTopic = 'all';
let selectedMarker = null;
const orderbookAttempts = new Map();

function money(value, digits = 2) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? '<span class="muted">—</span>'
    : `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function renderKpis() {
  const openCount = engine.markets.filter((market) => market.status === 'Open').length;
  const resolvedCount = engine.markets.filter((market) => market.status === 'Resolved').length;
  const totalVolume = engine.markets.reduce((sum, market) => sum + (market.volumeUsd || 0), 0);
  const summary = engine.getPortfolioSummary();
  const el = document.getElementById('kpi-strip');
  if (!el) return;
  el.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Tracked Market Rows</div>
      <div class="kpi-value">${engine.markets.length}</div>
      <div class="kpi-sub">${openCount} catalog/API Open · ${resolvedCount} Finalized · 5 topics only</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Production Event-Volume Snapshot</div>
      <div class="kpi-value">$${(totalVolume / 1e9).toFixed(2)}B</div>
      <div class="kpi-sub">Dated ${escapeHtml(LAST_VERIFIED_DATE_UTC)} · not Demo contract volume</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Alert Records</div>
      <div class="kpi-value">${engine.allAlerts.length} / ${engine.modelEdgeAlerts.length}</div>
      <div class="kpi-sub">REST snapshot changes / sourced-model filter (currently unavailable)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Paper Portfolio Equity</div>
      <div class="kpi-value">${money(summary.totalEquity)}</div>
      <div class="kpi-sub">${summary.totalPnl === null ? `${summary.unpricedPositionCount} position(s) lack a Demo REST mark` : `Paper P&amp;L: ${summary.totalPnl >= 0 ? '+' : ''}${money(summary.totalPnl)}`}</div>
    </div>
  `;
}

function renderTopicCards() {
  const el = document.getElementById('topic-cards');
  if (!el) return;
  el.innerHTML = ALLOWED_TOPICS.map((topicId) => {
    const topic = TOPICS[topicId];
    const markets = engine.getMarketsByTopic(topicId);
    const open = markets.filter((market) => market.status === 'Open').length;
    const resolved = markets.filter((market) => market.status === 'Resolved').length;
    const top = markets[0];
    return `
      <a class="topic-card" href="${topic.pagePath}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          ${formatTopicBadge(topicId)}
          <span class="tiny muted">${open} Open · ${resolved} Finalized</span>
        </div>
        <strong style="font-size:15px;">${escapeHtml(topic.name)}</strong>
        <div class="tiny muted">${escapeHtml(topic.description)}</div>
        <div class="tiny mono" style="margin-top:auto;padding-top:6px;border-top:1px solid #e2e8f0;">
          Largest dated event-volume snapshot: ${escapeHtml(top.ticker)} · ${top.volumeUsd === null ? 'Unverified' : '$' + top.volumeUsd.toLocaleString()}
        </div>
      </a>
    `;
  }).join('');
}

function renderDualChats() {
  const allEl = document.getElementById('chat-all-events');
  const roiEl = document.getElementById('chat-high-roi');
  const allCountEl = document.getElementById('count-all-alerts');
  const roiCountEl = document.getElementById('count-roi-alerts');
  if (allCountEl) allCountEl.textContent = String(engine.allAlerts.length);
  if (roiCountEl) roiCountEl.textContent = String(engine.modelEdgeAlerts.length);

  if (allEl) {
    allEl.innerHTML = engine.allAlerts.length
      ? engine.allAlerts.map((alert) => renderAlertItemHtml(alert, false)).join('')
      : '<p class="muted small">No >= $0.10 change between Demo REST snapshots has been observed, and no paper swing has been simulated.</p>';
  }
  if (roiEl) {
    roiEl.innerHTML = engine.modelEdgeAlerts.length
      ? engine.modelEdgeAlerts.map((alert) => renderAlertItemHtml(alert, true)).join('')
      : '<p class="muted small">Unavailable: the catalog contains no independently sourced fair-value model. This feed will not invent ROI signals.</p>';
  }
}

function maybeRefreshOrderbook(market) {
  if (!market || !market.marketTicker || market.orderbook) return;
  const lastAttempt = orderbookAttempts.get(market.marketTicker) || 0;
  if (Date.now() - lastAttempt < 60_000) return;
  orderbookAttempts.set(market.marketTicker, Date.now());
  void engine.refreshOrderbook(market.ticker);
}

function renderChartAndOrderbook() {
  const market = engine.getMarket(selectedTicker);
  if (!market) return;
  const select = document.getElementById('chart-market-select');
  if (select && !select.options.length) {
    ALLOWED_TOPICS.forEach((topicId) => {
      const group = document.createElement('optgroup');
      group.label = TOPICS[topicId].name;
      engine.getMarketsByTopic(topicId).forEach((item) => {
        const option = document.createElement('option');
        option.value = item.ticker;
        option.textContent = `${item.ticker} — ${item.title}`;
        group.appendChild(option);
      });
      select.appendChild(group);
    });
  }
  if (select) select.value = market.ticker;

  const meta = document.getElementById('chart-market-meta');
  if (meta) {
    const sourceText = market.dataStatus === 'demo-rest'
      ? `Demo REST YES last ${formatPrice(market.currentPrice)} · fetched ${new Date(market.lastFetchedAt).toLocaleTimeString()}`
      : market.dataStatus === 'stale'
        ? `Stale Demo REST snapshot from ${market.lastFetchedAt ? new Date(market.lastFetchedAt).toLocaleTimeString() : 'unknown time'}`
        : 'No verified Demo REST quote loaded; no price is inferred';
    meta.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        ${formatTopicBadge(market.topic)}
        <strong class="mono">${escapeHtml(market.ticker)}</strong>
        ${formatResolutionBadge(market)}
        <span class="mono" style="font-size:15px;font-weight:700;">${sourceText}</span>
        ${formatDeltaBadge(market.lastDelta)}
        <span class="tiny muted">Production event-volume snapshot: ${formatDollarVolume(market.volumeUsd)}</span>
        ${formatSourceLink(market.dataSourceUrl || market.sourceUrl, market.dataSourceUrl ? 'Demo REST event response' : 'Official Kalshi market page')}
      </div>
      <div class="tiny muted" style="margin-top:4px;">${escapeHtml(market.roi.reason)} REST snapshots are best-effort and may be cached.</div>
    `;
  }

  const canvas = document.getElementById('live-price-chart');
  renderPriceChart(canvas, market, selectedRangeHours, {
    onMarkerSelect: (marker) => {
      selectedMarker = marker;
      renderCatalystPanel(market);
    }
  });
  renderCatalystPanel(market);

  maybeRefreshOrderbook(market);
  const orderbookPanel = document.getElementById('live-orderbook-panel');
  if (orderbookPanel) {
    orderbookPanel.innerHTML = renderOrderbookHtml(market.orderbook, market.ticker, {
      marketTicker: market.marketTicker,
      error: market.orderbookError || ''
    });
  }

  const priceInput = document.getElementById('qt-price');
  if (priceInput && document.activeElement !== priceInput) {
    const side = document.getElementById('qt-side')?.value || 'YES';
    priceInput.value = market.currentPrice === null
      ? ''
      : (side === 'YES' ? market.currentPrice : 1 - market.currentPrice).toFixed(2);
  }
}

function renderCatalystPanel(market) {
  const el = document.getElementById('chart-catalysts');
  if (!el) return;
  const markers = market.series.jumpMarkers || [];
  const activeHtml = selectedMarker && selectedMarker.ticker === market.ticker
    ? `<div class="status-banner ok" style="margin-bottom:8px;">
         <strong>Selected REST snapshot change (${selectedMarker.delta >= 0 ? '+' : ''}$${selectedMarker.delta.toFixed(2)}):</strong>
         ${escapeHtml(selectedMarker.label)} · ${formatSourceLink(selectedMarker.url, selectedMarker.sourceName)}
       </div>`
    : '';
  if (!markers.length) {
    el.innerHTML = `${activeHtml}<strong>Observed >= $0.10 changes:</strong> <span class="muted">No timestamped Demo REST change marker for ${escapeHtml(market.ticker)}. Article links do not establish price causation.</span>`;
    return;
  }
  el.innerHTML = `
    ${activeHtml}
    <strong>Changes between Demo REST snapshots for ${escapeHtml(market.ticker)}</strong>
    <span class="tiny muted">(not a real-time feed and not causal news attribution)</span>
    <ul class="catalyst-list">${markers.slice().reverse().map((marker) => `
      <li><span class="delta ${marker.delta >= 0 ? 'delta-up' : 'delta-down'}">${marker.delta >= 0 ? '+' : ''}$${marker.delta.toFixed(2)}</span>
      ${escapeHtml(marker.label)} — ${formatSourceLink(marker.url, marker.sourceName)}</li>
    `).join('')}</ul>
  `;
}

function renderMarketsTable() {
  const tbody = document.getElementById('markets-table-body');
  if (!tbody) return;
  const topics = selectedTableTopic === 'all' ? ALLOWED_TOPICS : [selectedTableTopic];
  const rows = [];

  topics.forEach((topicId) => {
    const topic = TOPICS[topicId];
    const markets = engine.getMarketsByTopic(topicId);
    rows.push(`
      <tr class="topic-group-row">
        <td colspan="9">
          ${formatTopicBadge(topicId)}
          <span style="margin-left:6px;">${escapeHtml(topic.name)} — ${markets.length} rows (ordered by dated event-volume snapshot)</span>
          <a href="${topic.pagePath}" style="float:right;font-size:12px;">Open ${escapeHtml(topic.name)} Subpage →</a>
        </td>
      </tr>`);
    markets.forEach((market) => {
      rows.push(`
        <tr class="${market.ticker === selectedTicker ? 'selected-row' : ''}">
          <td>
            <button class="link-btn ticker-jump-btn" data-ticker="${escapeHtml(market.ticker)}">${escapeHtml(market.ticker)}</button>
            <div class="tiny muted">${escapeHtml(market.closeWindow)}</div>
          </td>
          <td><strong>${escapeHtml(market.title)}</strong><div class="tiny muted">Settlement source: ${escapeHtml(market.settlementSource)}</div></td>
          <td class="mono">${formatDollarVolume(market.volumeUsd)}<div class="tiny muted">${escapeHtml(market.volumeAsOf || 'As-of date unavailable')}</div></td>
          <td class="mono"><strong>${formatPrice(market.currentPrice)}</strong><div class="tiny muted">Demo REST only</div></td>
          <td class="mono">${formatDeltaBadge(market.lastDelta)}</td>
          <td>${formatResolutionBadge(market)}</td>
          <td class="tiny">${market.roi.qualified ? `<span class="badge badge-verified">Heuristic filter ${market.roi.expectedRoiPct}%</span>` : '<span class="muted">No sourced fair-value model</span>'}</td>
          <td>${formatSourceLink(market.sourceUrl, market.sourceLabel)}</td>
          <td><button class="btn-xs btn-inspect" data-ticker="${escapeHtml(market.ticker)}">Chart</button></td>
        </tr>`);
    });
  });
  tbody.innerHTML = rows.join('');
}

function updateDataStatusBanner(message = null, isError = false) {
  const banner = document.getElementById('demo-api-status');
  if (!banner) return;
  const status = engine.marketDataStatus;
  banner.className = `status-banner ${isError || (!status.connected && status.lastChecked) ? 'warn' : ''}`;
  banner.textContent = message || `${status.message} Last check: ${status.lastChecked ? new Date(status.lastChecked).toLocaleTimeString() : 'not yet completed'}.`;
}

function bindEvents() {
  const select = document.getElementById('chart-market-select');
  if (select) {
    select.addEventListener('change', (event) => {
      selectedTicker = event.target.value;
      selectedMarker = null;
      renderChartAndOrderbook();
      renderMarketsTable();
    });
  }

  document.querySelectorAll('[data-chart-range]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedRangeHours = Number(button.dataset.chartRange) || 1;
      document.querySelectorAll('[data-chart-range]').forEach((item) => item.classList.toggle('active', item === button));
      renderChartAndOrderbook();
    });
  });

  document.querySelectorAll('[data-topic-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedTableTopic = button.dataset.topicFilter;
      document.querySelectorAll('[data-topic-filter]').forEach((item) => item.classList.toggle('active', item === button));
      renderMarketsTable();
    });
  });

  const pollingButton = document.getElementById('btn-toggle-live');
  if (pollingButton) {
    pollingButton.addEventListener('click', () => {
      const running = engine.toggleLive();
      pollingButton.textContent = running ? 'Demo REST Polling: ON' : 'Demo REST Polling: PAUSED';
      updateDataStatusBanner(running ? 'Best-effort Demo REST polling started; responses may be cached. This is not a stream.' : 'Demo REST polling paused. Previously fetched values are timestamped snapshots.');
    });
  }

  const simulateButton = document.getElementById('btn-trigger-swing');
  if (simulateButton) {
    simulateButton.addEventListener('click', () => {
      const market = engine.getMarket(selectedTicker);
      if (market && market.status === 'Open') engine.simulateSwing(market.ticker);
    });
  }

  const refreshButton = document.getElementById('btn-test-demo-api');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      updateDataStatusBanner('Checking Kalshi Demo public REST and refreshing tracked event snapshots…');
      const check = await engine.client.testPublicConnectivity();
      if (check.ok) {
        await engine.refreshMarketData();
        updateDataStatusBanner();
      } else {
        updateDataStatusBanner(check.status.message, true);
      }
    });
  }

  document.body.addEventListener('click', (event) => {
    const inspect = event.target.closest('.btn-inspect, .ticker-jump-btn');
    if (inspect && inspect.dataset.ticker) {
      selectedTicker = inspect.dataset.ticker;
      selectedMarker = null;
      renderChartAndOrderbook();
      renderMarketsTable();
      document.getElementById('interactive-chart-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    const orderbookRefresh = event.target.closest('.btn-refresh-orderbook');
    if (orderbookRefresh) {
      const market = engine.getMarket(orderbookRefresh.dataset.ticker);
      if (market) {
        orderbookAttempts.set(market.marketTicker, Date.now());
        void engine.refreshOrderbook(market.ticker);
      }
      return;
    }
    const orderbookRow = event.target.closest('.ob-row');
    if (orderbookRow && orderbookRow.dataset.price) {
      const input = document.getElementById('qt-price');
      if (input) input.value = orderbookRow.dataset.price;
    }
  });

  const quickTradeForm = document.getElementById('quick-trade-form');
  if (quickTradeForm) {
    const categorySelect = document.getElementById('qt-category');
    if (categorySelect) {
      categorySelect.innerHTML = TRADE_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
    }
    quickTradeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const message = document.getElementById('qt-feedback');
      try {
        const trade = engine.executePaperTrade({
          ticker: selectedTicker,
          action: 'BUY',
          side: document.getElementById('qt-side').value,
          contracts: Number(document.getElementById('qt-contracts').value),
          price: Number(document.getElementById('qt-price').value),
          category: document.getElementById('qt-category').value,
          note: 'Dashboard paper simulation; no Kalshi order was sent.'
        });
        if (message) {
          message.className = 'status-banner ok';
          message.textContent = `Paper trade recorded (${trade.id}): BUY ${trade.contracts} ${trade.side} on ${trade.ticker} @ $${trade.price.toFixed(2)}. No Kalshi order was submitted.`;
        }
      } catch (error) {
        if (message) {
          message.className = 'status-banner warn';
          message.textContent = error.message;
        }
      }
    });
  }

  const sideSelect = document.getElementById('qt-side');
  if (sideSelect) sideSelect.addEventListener('change', () => renderChartAndOrderbook());
  window.addEventListener('resize', () => renderChartAndOrderbook());
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader('dashboard');
  renderFooter();
  bindEvents();
  updateDataStatusBanner();

  const renderAll = () => {
    renderKpis();
    renderTopicCards();
    renderDualChats();
    renderChartAndOrderbook();
    renderMarketsTable();
    updateDataStatusBanner();
  };
  renderAll();
  engine.subscribe(() => renderAll());
  engine.start();
});
