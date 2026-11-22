/**
 * Shared Controller for the 5 Separate Topic Subpages:
 * - categories/gas-prices.html
 * - categories/elections.html
 * - categories/culture.html
 * - categories/crypto.html
 * - categories/golf.html
 */

import { TOPICS } from './data.js';
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
let selectedTimeframe = 'minutes';
let selectedMarker = null;

function initSelection() {
  const list = engine.getMarketsByTopic(topicId);
  const firstOpen = list.find((m) => m.status === 'Open') || list[0];
  selectedTicker = firstOpen ? firstOpen.ticker : null;
}

function renderTopicHeaderAndKpis() {
  const list = engine.getMarketsByTopic(topicId);
  const openCount = list.filter((m) => m.status === 'Open').length;
  const yesCount = list.filter((m) => m.resolution === 'YES').length;
  const noCount = list.filter((m) => m.resolution === 'NO').length;
  const totalVol = list.reduce((s, m) => s + (m.volumeUsd || 0), 0);

  const heroTitle = document.getElementById('topic-hero-title');
  const heroDesc = document.getElementById('topic-hero-desc');
  if (heroTitle) heroTitle.innerHTML = `${formatTopicBadge(topicId)} ${escapeHtml(topicInfo.name)} — Kalshi Live &amp; Resolved Events`;
  if (heroDesc) heroDesc.textContent = topicInfo.description;

  const kpiEl = document.getElementById('topic-kpi-strip');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">${escapeHtml(topicInfo.name)} Contracts</div>
        <div class="kpi-value">${list.length}</div>
        <div class="kpi-sub">${openCount} Open · ${yesCount} YES · ${noCount} NO</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Verified Dollar Volume</div>
        <div class="kpi-value">$${totalVol.toLocaleString('en-US')}</div>
        <div class="kpi-sub">Excluding unverified blank volume cells</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Topic &gt;= $0.10 Alerts</div>
        <div class="kpi-value">${engine.allAlerts.filter((a) => a.topic === topicId).length}</div>
        <div class="kpi-sub">${engine.highRoiAlerts.filter((a) => a.topic === topicId).length} flagged High-ROI</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Official Hub</div>
        <div class="kpi-value" style="font-size:15px;margin-top:8px;">${formatSourceLink(topicInfo.officialHubUrl, 'Kalshi Official')}</div>
        <div class="kpi-sub">All table rows carry official links</div>
      </div>
    `;
  }
}

function renderTopicChartAndOrderbook() {
  const list = engine.getMarketsByTopic(topicId);
  const market = list.find((m) => m.ticker === selectedTicker) || list[0];
  if (!market) return;
  selectedTicker = market.ticker;

  const selectEl = document.getElementById('cat-market-select');
  if (selectEl && !selectEl.options.length) {
    list.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.ticker;
      opt.textContent = `${m.ticker} — ${m.title}`;
      selectEl.appendChild(opt);
    });
  }
  if (selectEl) selectEl.value = market.ticker;

  const metaEl = document.getElementById('cat-chart-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <strong class="mono">${escapeHtml(market.ticker)}</strong>
        ${formatResolutionBadge(market)}
        <span class="mono"><strong>$${market.currentPrice.toFixed(2)}</strong></span>
        ${formatDeltaBadge(market.lastDelta)}
        ${formatSourceLink(market.sourceUrl, 'Kalshi Official')}
      </div>
      <div class="tiny muted" style="margin-top:4px;">${escapeHtml(market.roi.reason)}</div>
    `;
  }

  const canvas = document.getElementById('cat-price-chart');
  renderPriceChart(canvas, market, selectedTimeframe, {
    onMarkerSelect: (mk) => {
      selectedMarker = mk;
      renderCatalysts(market);
    }
  });
  renderCatalysts(market);

  const obEl = document.getElementById('cat-orderbook-panel');
  if (obEl) obEl.innerHTML = renderOrderbookHtml(market.orderbook, market.ticker);

  const priceInput = document.getElementById('cat-qt-price');
  if (priceInput && document.activeElement !== priceInput) {
    priceInput.value = market.currentPrice.toFixed(2);
  }
}

function renderCatalysts(market) {
  const el = document.getElementById('cat-catalysts');
  if (!el) return;
  const markers = market.series.jumpMarkers || [];
  const activeHtml =
    selectedMarker && selectedMarker.ticker === market.ticker
      ? `<div class="status-banner ok" style="margin-bottom:8px;">
           <strong>Selected Jump (${selectedMarker.delta >= 0 ? '+' : ''}$${selectedMarker.delta.toFixed(2)}):</strong>
           ${escapeHtml(selectedMarker.label)} · ${formatSourceLink(selectedMarker.url, selectedMarker.sourceName)}
         </div>`
      : '';
  el.innerHTML = markers.length
    ? `${activeHtml}<strong>Catalyst Jump Links (&gt;= $0.10):</strong><ul class="catalyst-list">${markers
        .map(
          (mk) =>
            `<li><span class="delta ${mk.delta >= 0 ? 'delta-up' : 'delta-down'}">${mk.delta >= 0 ? '+' : ''}$${mk.delta.toFixed(2)}</span> ${escapeHtml(mk.label)} — ${formatSourceLink(mk.url, mk.sourceName)}</li>`
        )
        .join('')}</ul>`
    : `${activeHtml}<span class="muted">No &gt;= $0.10 catalyst markers logged yet on ${escapeHtml(market.ticker)}.</span>`;
}

function renderTopicAlerts() {
  const allEl = document.getElementById('cat-chat-all');
  const roiEl = document.getElementById('cat-chat-roi');
  const topicAlerts = engine.allAlerts.filter((a) => a.topic === topicId);
  const topicRoi = engine.highRoiAlerts.filter((a) => a.topic === topicId);

  if (allEl) {
    allEl.innerHTML = topicAlerts.length
      ? topicAlerts.map((a) => renderAlertItemHtml(a, false)).join('')
      : `<p class="muted small">No &gt;= $0.10 swings logged yet for ${escapeHtml(topicInfo.name)}. Click "Trigger &gt;= $0.10 Swing" to test.</p>`;
  }
  if (roiEl) {
    roiEl.innerHTML = topicRoi.length
      ? topicRoi.map((a) => renderAlertItemHtml(a, true)).join('')
      : `<p class="muted small">No ${escapeHtml(topicInfo.name)} swings currently meet High-ROI Model thresholds.</p>`;
  }
}

function renderTopicTable() {
  const tbody = document.getElementById('cat-markets-body');
  if (!tbody) return;
  const list = engine.getMarketsByTopic(topicId);

  tbody.innerHTML = list
    .map(
      (m) => `
    <tr>
      <td class="mono"><button class="link-btn btn-inspect" data-ticker="${escapeHtml(m.ticker)}">${escapeHtml(m.ticker)}</button></td>
      <td><strong>${escapeHtml(m.title)}</strong><div class="tiny muted">${escapeHtml(m.contractLabel)}</div></td>
      <td class="mono">${formatDollarVolume(m.volumeUsd)}</td>
      <td class="mono"><strong>${formatPrice(m.currentPrice)}</strong> ${formatDeltaBadge(m.lastDelta)}</td>
      <td class="mono">${formatPrice(m.observedPrice)}</td>
      <td>${formatResolutionBadge(m)}</td>
      <td class="small">${escapeHtml(m.settlementSource)}</td>
      <td class="small">${escapeHtml(m.closeWindow)}</td>
      <td>${formatSourceLink(m.sourceUrl, m.sourceLabel)}</td>
    </tr>
  `
    )
    .join('');
}

function bindEvents() {
  const sel = document.getElementById('cat-market-select');
  if (sel) {
    sel.addEventListener('change', (e) => {
      selectedTicker = e.target.value;
      selectedMarker = null;
      renderTopicChartAndOrderbook();
    });
  }

  document.querySelectorAll('[data-timeframe]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedTimeframe = btn.dataset.timeframe;
      document.querySelectorAll('[data-timeframe]').forEach((b) => b.classList.toggle('active', b === btn));
      renderTopicChartAndOrderbook();
    });
  });

  const trigBtn = document.getElementById('cat-trigger-swing');
  if (trigBtn) {
    trigBtn.addEventListener('click', () => {
      const open = engine.getMarketsByTopic(topicId).find((m) => m.status === 'Open');
      if (open) engine.runTick(selectedTicker && engine.getMarket(selectedTicker).status === 'Open' ? selectedTicker : open.ticker);
    });
  }

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-inspect, .ticker-jump-btn');
    if (btn && btn.dataset.ticker) {
      selectedTicker = btn.dataset.ticker;
      selectedMarker = null;
      renderTopicChartAndOrderbook();
    }
    const obRow = e.target.closest('.ob-row');
    if (obRow && obRow.dataset.price) {
      const p = document.getElementById('cat-qt-price');
      if (p) p.value = obRow.dataset.price;
    }
  });

  const form = document.getElementById('cat-trade-form');
  if (form) {
    const catSel = document.getElementById('cat-qt-category');
    if (catSel) {
      catSel.innerHTML = TRADE_CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fb = document.getElementById('cat-qt-feedback');
      try {
        const trade = engine.executePaperTrade({
          ticker: selectedTicker,
          action: 'BUY',
          side: document.getElementById('cat-qt-side').value,
          contracts: Number(document.getElementById('cat-qt-contracts').value),
          price: Number(document.getElementById('cat-qt-price').value),
          category: document.getElementById('cat-qt-category').value,
          note: `${topicInfo.name} Subpage Trade`
        });
        if (fb) {
          fb.className = 'status-banner ok';
          fb.textContent = `Demo Order Filled (${trade.id}): BUY ${trade.contracts} ${trade.side} on ${trade.ticker} @ $${trade.price.toFixed(2)}.`;
        }
      } catch (err) {
        if (fb) {
          fb.className = 'status-banner warn';
          fb.textContent = err.message;
        }
      }
    });
  }

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
  };

  renderAll();
  engine.subscribe(() => renderAll());
  engine.start();
});
