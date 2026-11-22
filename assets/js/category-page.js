/** Shared controller for the five isolated topic pages. */

import { TOPICS, LAST_VERIFIED_DATE_UTC } from './data.js';
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

const topicId = document.body.dataset.topic || 'gas-prices';
const topicInfo = TOPICS[topicId];
let selectedTicker = null;
let selectedRangeHours = 1;
let selectedMarker = null;
const orderbookAttempts = new Map();

function initSelection() {
  const markets = engine.getMarketsByTopic(topicId);
  const firstOpen = markets.find((market) => market.status === 'Open') || markets[0];
  selectedTicker = firstOpen ? firstOpen.ticker : null;
}

function money(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? '<span class="muted">—</span>'
    : `$${Number(value).toFixed(2)}`;
}

function updateDataStatus() {
  const el = document.getElementById('cat-data-status');
  if (!el) return;
  const status = engine.marketDataStatus;
  el.className = `status-banner ${!status.connected && status.lastChecked ? 'warn' : ''}`;
  el.textContent = `${status.message} Catalog page snapshot date: ${LAST_VERIFIED_DATE_UTC}. Demo prices are not production prices; no WebSocket stream is connected.`;
}

function renderTopicHeaderAndKpis() {
  const markets = engine.getMarketsByTopic(topicId);
  const openCount = markets.filter((market) => market.status === 'Open').length;
  const resolvedCount = markets.filter((market) => market.status === 'Resolved').length;
  const reviewCount = markets.filter((market) => market.status === 'Needs Review').length;
  const totalVolume = markets.reduce((sum, market) => sum + (market.volumeUsd || 0), 0);

  const title = document.getElementById('topic-hero-title');
  const description = document.getElementById('topic-hero-desc');
  if (title) title.innerHTML = `${formatTopicBadge(topicId)} ${escapeHtml(topicInfo.name)} — Kalshi Demo Snapshots &amp; Catalog Lifecycle`;
  if (description) description.textContent = `${topicInfo.description} Demo REST data is best-effort and may be cached or unavailable; all trades are local paper simulations.`;

  const kpis = document.getElementById('topic-kpi-strip');
  if (!kpis) return;
  kpis.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(topicInfo.name)} Market Rows</div>
      <div class="kpi-value">${markets.length}</div>
      <div class="kpi-sub">${openCount} Open · ${resolvedCount} Finalized · ${reviewCount} Needs Review</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Production Event-Volume Snapshot</div>
      <div class="kpi-value">$${totalVolume.toLocaleString('en-US')}</div>
      <div class="kpi-sub">Dated ${LAST_VERIFIED_DATE_UTC} · separate from Demo contract volume</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Alert Records</div>
      <div class="kpi-value">${engine.allAlerts.filter((alert) => alert.topic === topicId).length}</div>
      <div class="kpi-sub">REST snapshot changes and explicitly labeled paper tests</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Official Hub</div>
      <div class="kpi-value" style="font-size:15px;margin-top:8px;">${formatSourceLink(topicInfo.officialHubUrl, 'Kalshi Official')}</div>
      <div class="kpi-sub">Every catalog row links to an official Kalshi page</div>
    </div>
  `;
}

function maybeRefreshOrderbook(market) {
  if (!market || !market.marketTicker || market.orderbook) return;
  const lastAttempt = orderbookAttempts.get(market.marketTicker) || 0;
  if (Date.now() - lastAttempt < 60_000) return;
  orderbookAttempts.set(market.marketTicker, Date.now());
  void engine.refreshOrderbook(market.ticker);
}

function renderTopicChartAndOrderbook() {
  const markets = engine.getMarketsByTopic(topicId);
  const market = markets.find((item) => item.ticker === selectedTicker) || markets[0];
  if (!market) return;
  selectedTicker = market.ticker;

  const select = document.getElementById('cat-market-select');
  if (select && !select.options.length) {
    markets.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.ticker;
      option.textContent = `${item.ticker} — ${item.title}`;
      select.appendChild(option);
    });
  }
  if (select) select.value = market.ticker;

  const meta = document.getElementById('cat-chart-meta');
  if (meta) {
    const priceInfo = market.currentPrice === null
      ? 'No verified Demo REST YES last loaded'
      : `Demo REST YES last ${formatPrice(market.currentPrice)} · fetched ${new Date(market.lastFetchedAt).toLocaleTimeString()}`;
    meta.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <strong class="mono">${escapeHtml(market.ticker)}</strong>
        ${formatResolutionBadge(market)}
        <span class="mono"><strong>${priceInfo}</strong></span>
        ${formatDeltaBadge(market.lastDelta)}
        ${formatSourceLink(market.dataSourceUrl || market.sourceUrl, market.dataSourceUrl ? 'Demo REST event' : 'Official Kalshi market page')}
      </div>
      <div class="tiny muted" style="margin-top:4px;">${escapeHtml(market.roi.reason)} REST responses may be cached; this chart does not backfill exchange history.</div>
    `;
  }

  renderPriceChart(document.getElementById('cat-price-chart'), market, selectedRangeHours, {
    onMarkerSelect: (marker) => {
      selectedMarker = marker;
      renderCatalysts(market);
    }
  });
  renderCatalysts(market);

  maybeRefreshOrderbook(market);
  const orderbookEl = document.getElementById('cat-orderbook-panel');
  if (orderbookEl) {
    orderbookEl.innerHTML = renderOrderbookHtml(market.orderbook, market.ticker, {
      marketTicker: market.marketTicker,
      error: market.orderbookError || ''
    });
  }

  const priceInput = document.getElementById('cat-qt-price');
  if (priceInput && document.activeElement !== priceInput) {
    const side = document.getElementById('cat-qt-side')?.value || 'YES';
    priceInput.value = market.currentPrice === null
      ? ''
      : (side === 'YES' ? market.currentPrice : 1 - market.currentPrice).toFixed(2);
  }
}

function renderCatalysts(market) {
  const el = document.getElementById('cat-catalysts');
  if (!el) return;
  const markers = market.series.jumpMarkers || [];
  const selected = selectedMarker && selectedMarker.ticker === market.ticker
    ? `<div class="status-banner ok" style="margin-bottom:8px;"><strong>Selected REST snapshot change (${selectedMarker.delta >= 0 ? '+' : ''}$${selectedMarker.delta.toFixed(2)}):</strong> ${escapeHtml(selectedMarker.label)} · ${formatSourceLink(selectedMarker.url, selectedMarker.sourceName)}</div>`
    : '';
  if (!markers.length) {
    el.innerHTML = `${selected}<strong>Observed >= $0.10 changes:</strong> <span class="muted">No timestamped Demo REST change has been observed for ${escapeHtml(market.ticker)}. No synthetic catalyst marker is shown.</span>`;
    return;
  }
  el.innerHTML = `${selected}<strong>Changes between Demo REST snapshots (${escapeHtml(market.ticker)})</strong><span class="tiny muted"> · not streaming; no causal news attribution</span><ul class="catalyst-list">${markers.slice().reverse().map((marker) => `
    <li><span class="delta ${marker.delta >= 0 ? 'delta-up' : 'delta-down'}">${marker.delta >= 0 ? '+' : ''}$${marker.delta.toFixed(2)}</span> ${escapeHtml(marker.label)} — ${formatSourceLink(marker.url, marker.sourceName)}</li>
  `).join('')}</ul>`;
}

function renderTopicAlerts() {
  const allEl = document.getElementById('cat-chat-all');
  const roiEl = document.getElementById('cat-chat-roi');
  const alerts = engine.allAlerts.filter((alert) => alert.topic === topicId);
  const roiAlerts = engine.modelEdgeAlerts.filter((alert) => alert.topic === topicId);
  if (allEl) {
    allEl.innerHTML = alerts.length
      ? alerts.map((alert) => renderAlertItemHtml(alert, false)).join('')
      : `<p class="muted small">No REST snapshot change or paper simulation alert has been recorded for ${escapeHtml(topicInfo.name)}.</p>`;
  }
  if (roiEl) {
    roiEl.innerHTML = roiAlerts.length
      ? roiAlerts.map((alert) => renderAlertItemHtml(alert, true)).join('')
      : '<p class="muted small">Unavailable: no independently sourced fair-value estimate is provided for this topic.</p>';
  }
}

function renderTopicTable() {
  const tbody = document.getElementById('cat-markets-body');
  if (!tbody) return;
  tbody.innerHTML = engine.getMarketsByTopic(topicId).map((market) => `
    <tr>
      <td class="mono"><button class="link-btn btn-inspect" data-ticker="${escapeHtml(market.ticker)}">${escapeHtml(market.ticker)}</button></td>
      <td><strong>${escapeHtml(market.title)}</strong><div class="tiny muted">${escapeHtml(market.contractLabel)}</div></td>
      <td class="mono">${formatDollarVolume(market.volumeUsd)}<div class="tiny muted">${escapeHtml(market.volumeAsOf || 'As-of date unavailable')}</div></td>
      <td class="mono"><strong>${formatPrice(market.currentPrice)}</strong><div class="tiny muted">Demo REST</div></td>
      <td class="mono">${formatDeltaBadge(market.lastDelta)}</td>
      <td>${formatResolutionBadge(market)}</td>
      <td class="small">${escapeHtml(market.settlementSource)}</td>
      <td class="small">${escapeHtml(market.closeWindow)}</td>
      <td>${formatSourceLink(market.sourceUrl, market.sourceLabel)}</td>
    </tr>`).join('');
}

function bindEvents() {
  const select = document.getElementById('cat-market-select');
  if (select) {
    select.addEventListener('change', (event) => {
      selectedTicker = event.target.value;
      selectedMarker = null;
      renderTopicChartAndOrderbook();
    });
  }
  document.querySelectorAll('[data-chart-range]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedRangeHours = Number(button.dataset.chartRange) || 1;
      document.querySelectorAll('[data-chart-range]').forEach((item) => item.classList.toggle('active', item === button));
      renderTopicChartAndOrderbook();
    });
  });

  const simulateButton = document.getElementById('cat-trigger-swing');
  if (simulateButton) {
    simulateButton.addEventListener('click', () => {
      const market = engine.getMarket(selectedTicker);
      if (market && market.status === 'Open') engine.simulateSwing(market.ticker);
    });
  }
  const refreshButton = document.getElementById('cat-refresh-data');
  if (refreshButton) refreshButton.addEventListener('click', () => void engine.refreshMarketData());

  document.body.addEventListener('click', (event) => {
    const inspect = event.target.closest('.btn-inspect, .ticker-jump-btn');
    if (inspect && inspect.dataset.ticker) {
      selectedTicker = inspect.dataset.ticker;
      selectedMarker = null;
      renderTopicChartAndOrderbook();
    }
    const orderbookRefresh = event.target.closest('.btn-refresh-orderbook');
    if (orderbookRefresh) {
      const market = engine.getMarket(orderbookRefresh.dataset.ticker);
      if (market) {
        orderbookAttempts.set(market.marketTicker, Date.now());
        void engine.refreshOrderbook(market.ticker);
      }
    }
    const orderbookRow = event.target.closest('.ob-row');
    if (orderbookRow && orderbookRow.dataset.price) {
      const priceInput = document.getElementById('cat-qt-price');
      if (priceInput) priceInput.value = orderbookRow.dataset.price;
    }
  });

  const form = document.getElementById('cat-trade-form');
  if (form) {
    const categorySelect = document.getElementById('cat-qt-category');
    if (categorySelect) {
      categorySelect.innerHTML = TRADE_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const feedback = document.getElementById('cat-qt-feedback');
      try {
        const trade = engine.executePaperTrade({
          ticker: selectedTicker,
          action: 'BUY',
          side: document.getElementById('cat-qt-side').value,
          contracts: Number(document.getElementById('cat-qt-contracts').value),
          price: Number(document.getElementById('cat-qt-price').value),
          category: document.getElementById('cat-qt-category').value,
          note: `${topicInfo.name} page paper simulation; no exchange order was sent.`
        });
        if (feedback) {
          feedback.className = 'status-banner ok';
          feedback.textContent = `Paper trade recorded (${trade.id}): BUY ${trade.contracts} ${trade.side} on ${trade.ticker} @ $${trade.price.toFixed(2)}. No Kalshi order was submitted.`;
        }
      } catch (error) {
        if (feedback) {
          feedback.className = 'status-banner warn';
          feedback.textContent = error.message;
        }
      }
    });
  }

  const sideSelect = document.getElementById('cat-qt-side');
  if (sideSelect) sideSelect.addEventListener('change', () => renderTopicChartAndOrderbook());
  window.addEventListener('resize', () => renderTopicChartAndOrderbook());
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader(topicId);
  renderFooter();
  initSelection();
  bindEvents();
  const renderAll = () => {
    renderTopicHeaderAndKpis();
    renderTopicChartAndOrderbook();
    renderTopicAlerts();
    renderTopicTable();
    updateDataStatus();
  };
  renderAll();
  engine.subscribe(() => renderAll());
  engine.start();
});
