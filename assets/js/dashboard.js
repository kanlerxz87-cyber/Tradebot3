/**
 * Landing Page & Live Dashboard Controller (index.html)
 */

import { TOPICS, ALLOWED_TOPICS } from './data.js';
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
let selectedTimeframe = 'minutes';
let selectedTableTopic = 'all';
let selectedStatusFilter = 'all';
let selectedAlertTopic = 'all';
let alertSearchQuery = '';
let selectedMarker = null;

// High-ROI desktop notification + audio ping state (opt-in, P2 suggestion implementation)
let notifyEnabled = false;
let lastNotifiedAlertId = null;

function playAlertPing(direction) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = direction === 'UP' ? 880 : 587.33;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close().catch(() => {});
  } catch (_) {
    // Audio unavailable — desktop notification still fires
  }
}

function maybeNotifyHighRoi() {
  if (!notifyEnabled) return;
  const latest = engine.highRoiAlerts[0];
  if (!latest || latest.id === lastNotifiedAlertId) return;
  lastNotifiedAlertId = latest.id;
  playAlertPing(latest.direction);
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(`High-ROI Swing ${latest.delta >= 0 ? '+' : ''}$${latest.delta.toFixed(2)} — ${latest.ticker}`, {
        body: `${latest.title}\n$${latest.fromPrice.toFixed(2)} → $${latest.toPrice.toFixed(2)} · ${latest.roi ? latest.roi.reason : ''}`,
        tag: latest.id
      });
      n.onclick = () => window.focus();
    }
  } catch (_) {
    // Notification blocked — chat feed still updates live
  }
}

function renderKpis() {
  const openCount = engine.markets.filter((m) => m.status === 'Open').length;
  const resolvedCount = engine.markets.filter((m) => m.status === 'Resolved').length;
  const totalVol = engine.markets.reduce((sum, m) => sum + (m.volumeUsd || 0), 0);
  const summary = engine.getPortfolioSummary();

  const el = document.getElementById('kpi-strip');
  if (!el) return;
  el.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Tracked Kalshi Events</div>
      <div class="kpi-value">${engine.markets.length}</div>
      <div class="kpi-sub">${openCount} catalog-marked Open · ${resolvedCount} catalog-marked Resolved (static reference)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Catalog Dollar Volume</div>
      <div class="kpi-value">$${(totalVol / 1e9).toFixed(2)}B</div>
      <div class="kpi-sub">Static catalog values; not a live volume feed</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">&gt;= $0.10 Swing Alerts</div>
      <div class="kpi-value">${engine.allAlerts.length} / ${engine.highRoiAlerts.length}</div>
      <div class="kpi-sub">All Events / Illustrative Model Selective</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Demo Portfolio Equity</div>
      <div class="kpi-value">$${summary.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="kpi-sub ${summary.totalPnl >= 0 ? 'delta-up' : 'delta-down'}">P&amp;L: ${summary.totalPnl >= 0 ? '+' : ''}$${summary.totalPnl.toFixed(2)} (${summary.totalRoiPct >= 0 ? '+' : ''}${summary.totalRoiPct}%)</div>
    </div>
  `;
}

function renderTopicCards() {
  const el = document.getElementById('topic-cards');
  if (!el) return;
  el.innerHTML = ALLOWED_TOPICS.map((topicId) => {
    const t = TOPICS[topicId];
    const items = engine.getMarketsByTopic(topicId);
    const open = items.filter((m) => m.status === 'Open').length;
    const resolved = items.filter((m) => m.status === 'Resolved').length;
    const top = items[0];
    return `
      <a class="topic-card" href="${t.pagePath}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          ${formatTopicBadge(topicId)}
          <span class="tiny muted">${open} catalog Open · ${resolved} catalog Resolved</span>
        </div>
        <strong style="font-size:15px;">${escapeHtml(t.name)}</strong>
        <div class="tiny muted">${escapeHtml(t.description)}</div>
        <div class="tiny mono" style="margin-top:auto;padding-top:6px;border-top:1px solid #e2e8f0;">
          Top: ${escapeHtml(top.ticker)} · ${top.volumeUsd ? '$' + top.volumeUsd.toLocaleString() : 'Unverified Vol'}
        </div>
      </a>
    `;
  }).join('');
}

function filterAlertList(list) {
  const q = alertSearchQuery.trim().toLowerCase();
  return list.filter((a) => {
    if (selectedAlertTopic !== 'all' && a.topic !== selectedAlertTopic) return false;
    if (!q) return true;
    return (
      a.ticker.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      (a.catalystLabel || '').toLowerCase().includes(q) ||
      (a.catalystSource || '').toLowerCase().includes(q)
    );
  });
}

function renderDualChats() {
  const allEl = document.getElementById('chat-all-events');
  const roiEl = document.getElementById('chat-high-roi');
  const allCountEl = document.getElementById('count-all-alerts');
  const roiCountEl = document.getElementById('count-roi-alerts');

  const filteredAll = filterAlertList(engine.allAlerts);
  const filteredRoi = filterAlertList(engine.highRoiAlerts);

  if (allCountEl) allCountEl.textContent = String(filteredAll.length);
  if (roiCountEl) roiCountEl.textContent = String(filteredRoi.length);

  if (allEl) {
    allEl.innerHTML = filteredAll.length
      ? filteredAll.map((a) => renderAlertItemHtml(a, false)).join('')
      : '<p class="muted small">No matching alerts yet. Automatic ticks are a paper simulation, not Kalshi live market observations.</p>';
  }

  if (roiEl) {
    roiEl.innerHTML = filteredRoi.length
      ? filteredRoi.map((a) => renderAlertItemHtml(a, true)).join('')
      : '<p class="muted small">No simulated paper ticks currently meet the illustrative model thresholds (Net Edge >= $0.05 &amp; Exp ROI >= 15%). This is not a validated ROI forecast.</p>';
  }
}

function updateQuickTradeEstimate() {
  const estEl = document.getElementById('qt-est-summary');
  if (!estEl) return;
  const contracts = Math.max(0, Number(document.getElementById('qt-contracts')?.value || 0));
  const price = Math.max(0, Number(document.getElementById('qt-price')?.value || 0));
  const side = document.getElementById('qt-side')?.value || 'YES';
  const cost = contracts * price;
  const maxProfit = Math.max(0, contracts * (1 - price));
  estEl.textContent = `Est. Cost (${side}): $${cost.toFixed(2)} · Max Settlement Payout: $${contracts.toFixed(2)} (Max Profit +$${maxProfit.toFixed(2)})`;
}

function syncQuickTradePrice(force = false) {
  const market = engine.getMarket(selectedTicker);
  const priceInput = document.getElementById('qt-price');
  const sideEl = document.getElementById('qt-side');
  if (!market || !priceInput || !sideEl) return;
  if (force || document.activeElement !== priceInput) {
    const side = sideEl.value;
    const p = side === 'YES' ? market.currentPrice : Math.max(0.01, Math.min(0.99, +(1 - market.currentPrice).toFixed(2)));
    priceInput.value = p.toFixed(2);
  }
  updateQuickTradeEstimate();
}

function renderChartAndOrderbook() {
  const market = engine.getMarket(selectedTicker);
  if (!market) return;

  const selectEl = document.getElementById('chart-market-select');
  if (selectEl && !selectEl.options.length) {
    ALLOWED_TOPICS.forEach((topicId) => {
      const grp = document.createElement('optgroup');
      grp.label = TOPICS[topicId].name;
      engine.getMarketsByTopic(topicId).forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.ticker;
        opt.textContent = `${m.ticker} — ${m.title}`;
        grp.appendChild(opt);
      });
      selectEl.appendChild(grp);
    });
  }
  if (selectEl) selectEl.value = market.ticker;

  const metaEl = document.getElementById('chart-market-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        ${formatTopicBadge(market.topic)}
        <strong class="mono">${escapeHtml(market.ticker)}</strong>
        ${formatResolutionBadge(market)}
        <span class="mono" style="font-size:15px;font-weight:700;">Current: $${market.currentPrice.toFixed(2)}</span>
        ${formatDeltaBadge(market.lastDelta)}
        <span class="tiny muted">Static catalog volume: ${market.volumeUsd ? '$' + market.volumeUsd.toLocaleString() : 'Unverified'}</span>
        ${formatSourceLink(market.sourceUrl, 'Official Kalshi Market')}
      </div>
      <div class="tiny muted" style="margin-top:4px;">Illustrative model only (not a forecast): ${escapeHtml(market.roi.reason)}</div>
    `;
  }

  const canvas = document.getElementById('live-price-chart');
  renderPriceChart(canvas, market, selectedTimeframe, {
    onMarkerSelect: (marker) => {
      selectedMarker = marker;
      renderCatalystPanel(market);
    }
  });

  renderCatalystPanel(market);

  const obEl = document.getElementById('live-orderbook-panel');
  if (obEl) {
    obEl.innerHTML = renderOrderbookHtml(market.orderbook, market.ticker);
  }

  // Update quick trade defaults (syncing YES vs NO price accurately)
  syncQuickTradePrice(false);
}

function renderCatalystPanel(market) {
  const el = document.getElementById('chart-catalysts');
  if (!el) return;
  const markers = market.series.jumpMarkers || [];
  const activeHtml = selectedMarker && selectedMarker.ticker === market.ticker
    ? `<div class="status-banner ok" style="margin-bottom:8px;">
         <strong>Selected >= $0.10 Jump Marker (${selectedMarker.delta >= 0 ? '+' : ''}$${selectedMarker.delta.toFixed(2)}):</strong>
         ${escapeHtml(selectedMarker.label)} ·
         ${formatSourceLink(selectedMarker.url, selectedMarker.sourceName)}
       </div>`
    : '';

  if (!markers.length) {
    el.innerHTML = `
      ${activeHtml}
      <strong>Simulated Swing Markers (&gt;= $0.10):</strong>
      <span class="muted">No simulated &gt;= $0.10 swing markers for ${escapeHtml(market.ticker)} yet. Use "Trigger &gt;= $0.10 Swing" to test the paper simulator.</span>
    `;
    return;
  }

  el.innerHTML = `
    ${activeHtml}
      <strong>Simulated &gt;= $0.10 Ticks on ${escapeHtml(market.ticker)}</strong>
      <span class="tiny muted">Linked pages are contextual references, not verified causes of these synthetic price changes. Click a diamond marker for details.</span>
    <ul class="catalyst-list">
      ${markers
        .map(
          (mk) => `
        <li>
          <span class="delta ${mk.delta >= 0 ? 'delta-up' : 'delta-down'}">${mk.delta >= 0 ? '+' : ''}$${mk.delta.toFixed(2)}</span>
          ${escapeHtml(mk.label)} — ${formatSourceLink(mk.url, mk.sourceName)}
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}

function renderMarketsTable() {
  const tbody = document.getElementById('markets-table-body');
  if (!tbody) return;

  const topicsToShow = selectedTableTopic === 'all' ? ALLOWED_TOPICS : [selectedTableTopic];
  const rows = [];

  topicsToShow.forEach((topicId) => {
    const t = TOPICS[topicId];
    const items = engine.getMarketsByTopic(topicId).filter((m) => {
      if (selectedStatusFilter === 'open') return m.status === 'Open';
      if (selectedStatusFilter === 'resolved') return m.status === 'Resolved';
      return true;
    });
    if (!items.length) return;
    rows.push(`
      <tr class="topic-group-row">
        <td colspan="9">
          ${formatTopicBadge(topicId)}
          <span style="margin-left:6px;">${escapeHtml(t.name)} — ${items.length} Catalog Markets (Sorted by Published Volume)</span>
          <a href="${t.pagePath}" style="float:right;font-size:12px;">Open ${escapeHtml(t.name)} Subpage →</a>
        </td>
      </tr>
    `);

    items.forEach((m) => {
      const isSelected = m.ticker === selectedTicker;
      rows.push(`
        <tr class="${isSelected ? 'selected-row' : ''}">
          <td>
            <button class="link-btn ticker-jump-btn" data-ticker="${escapeHtml(m.ticker)}">${escapeHtml(m.ticker)}</button>
            <div class="tiny muted">${escapeHtml(m.closeWindow)}</div>
          </td>
          <td>
            <strong>${escapeHtml(m.title)}</strong>
            <div class="tiny muted">Settlement: ${escapeHtml(m.settlementSource)}</div>
          </td>
          <td class="mono">${formatDollarVolume(m.volumeUsd)}</td>
          <td class="mono"><strong>${formatPrice(m.currentPrice)}</strong> ${formatDeltaBadge(m.lastDelta)}</td>
          <td class="mono">${formatPrice(m.observedPrice)}</td>
          <td>${formatResolutionBadge(m)}</td>
          <td class="tiny">${m.roi.qualified ? `<span class="badge badge-verified">Illustrative Model (+${m.roi.expectedRoiPct}%)</span>` : '<span class="muted">Watch</span>'}</td>
          <td>${formatSourceLink(m.sourceUrl, m.sourceLabel)}</td>
          <td>
            <button class="btn-xs btn-inspect" data-ticker="${escapeHtml(m.ticker)}">Chart</button>
          </td>
        </tr>
      `);
    });
  });

  tbody.innerHTML = rows.join('');
}

function bindEvents() {
  const selectEl = document.getElementById('chart-market-select');
  if (selectEl) {
    selectEl.addEventListener('change', (e) => {
      selectedTicker = e.target.value;
      selectedMarker = null;
      renderChartAndOrderbook();
      renderMarketsTable();
    });
  }

  document.querySelectorAll('[data-timeframe]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedTimeframe = btn.dataset.timeframe;
      document.querySelectorAll('[data-timeframe]').forEach((b) => b.classList.toggle('active', b === btn));
      renderChartAndOrderbook();
    });
  });

  document.querySelectorAll('[data-topic-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedTableTopic = btn.dataset.topicFilter;
      document.querySelectorAll('[data-topic-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      renderMarketsTable();
    });
  });

  document.querySelectorAll('[data-status-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedStatusFilter = btn.dataset.statusFilter;
      document.querySelectorAll('[data-status-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      renderMarketsTable();
    });
  });

  const alertTopicSel = document.getElementById('alert-topic-filter');
  if (alertTopicSel) {
    alertTopicSel.addEventListener('change', (e) => {
      selectedAlertTopic = e.target.value;
      renderDualChats();
    });
  }

  const alertSearchIn = document.getElementById('alert-search');
  if (alertSearchIn) {
    alertSearchIn.addEventListener('input', (e) => {
      alertSearchQuery = e.target.value;
      renderDualChats();
    });
  }

  const soundBtn = document.getElementById('btn-toggle-sound');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      engine.soundEnabled = !engine.soundEnabled;
      soundBtn.textContent = engine.soundEnabled ? 'High-ROI Sound Ping: ON' : 'High-ROI Sound Ping: OFF';
      if (engine.soundEnabled) engine.playAlertPing();
    });
  }

  const liveBtn = document.getElementById('btn-toggle-live');
  if (liveBtn) {
    liveBtn.addEventListener('click', () => {
      const running = engine.toggleLive();
      liveBtn.innerHTML = running
        ? '<span class="live-dot"></span>Paper Simulation: ON'
        : '<span class="live-dot paused"></span>Paper Simulation: PAUSED';
    });
  }

  const triggerBtn = document.getElementById('btn-trigger-swing');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      const m = engine.getMarket(selectedTicker);
      const target = m && m.status === 'Open' ? m.ticker : null;
      engine.runTick(target);
    });
  }

  const notifyBtn = document.getElementById('btn-alert-notify');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', async () => {
      if (!notifyEnabled && 'Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (_) {
          // Permission request dismissed — audio ping still works
        }
      }
      notifyEnabled = !notifyEnabled;
      if (notifyEnabled) {
        const latest = engine.highRoiAlerts[0];
        lastNotifiedAlertId = latest ? latest.id : null; // don't replay history
        notifyBtn.textContent = 'High-ROI Alerts: ON';
        notifyBtn.classList.add('btn-alert-on');
      } else {
        notifyBtn.textContent = 'Enable High-ROI Alerts';
        notifyBtn.classList.remove('btn-alert-on');
      }
    });
  }

  const testApiBtn = document.getElementById('btn-test-demo-api');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', async () => {
      const banner = document.getElementById('demo-api-status');
      if (banner) {
        banner.textContent = 'Testing live Kalshi Demo REST connectivity (external-api.demo.kalshi.co)...';
        banner.className = 'status-banner';
      }
      const res = await engine.client.testPublicConnectivity();
      if (banner) {
        banner.textContent = res.status.message;
        banner.className = res.ok ? 'status-banner ok' : 'status-banner warn';
      }
    });
  }

  // Delegate clicks on ticker buttons, Chart buttons, orderbook price rows & Pull Live Book button
  document.body.addEventListener('click', async (e) => {
    const pullObBtn = e.target.closest('.btn-pull-live-ob');
    if (pullObBtn && pullObBtn.dataset.ticker) {
      const statusEl = document.getElementById('ob-live-status');
      if (statusEl) {
        statusEl.className = 'status-banner';
        statusEl.textContent = `Fetching live Kalshi Demo orderbook for ${pullObBtn.dataset.ticker}...`;
      }
      const res = await engine.fetchLiveOrderbook(pullObBtn.dataset.ticker);
      if (statusEl) {
        statusEl.className = res.ok ? 'status-banner ok' : 'status-banner warn';
        statusEl.textContent = res.message;
      }
      renderChartAndOrderbook();
      return;
    }

    const inspectBtn = e.target.closest('.btn-inspect, .ticker-jump-btn');
    if (inspectBtn && inspectBtn.dataset.ticker) {
      selectedTicker = inspectBtn.dataset.ticker;
      selectedMarker = null;
      renderChartAndOrderbook();
      syncQuickTradePrice(true);
      renderMarketsTable();
      const chartCard = document.getElementById('interactive-chart-section');
      if (chartCard) chartCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const obRow = e.target.closest('.ob-row');
    if (obRow && obRow.dataset.price) {
      const sideSel = document.getElementById('qt-side');
      const priceInput = document.getElementById('qt-price');
      if (sideSel) sideSel.value = obRow.dataset.side || 'YES';
      if (priceInput) priceInput.value = obRow.dataset.price;
      updateQuickTradeEstimate();
    }
  });

  // Quick Trade Form
  const qtForm = document.getElementById('quick-trade-form');
  if (qtForm) {
    const catSelect = document.getElementById('qt-category');
    if (catSelect) {
      catSelect.innerHTML = TRADE_CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }
    const qtSide = document.getElementById('qt-side');
    const qtContracts = document.getElementById('qt-contracts');
    const qtPrice = document.getElementById('qt-price');
    if (qtSide) qtSide.addEventListener('change', () => syncQuickTradePrice(true));
    if (qtContracts) qtContracts.addEventListener('input', updateQuickTradeEstimate);
    if (qtPrice) qtPrice.addEventListener('input', updateQuickTradeEstimate);
    qtForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const msgEl = document.getElementById('qt-feedback');
      try {
        const side = document.getElementById('qt-side').value;
        const contracts = Number(document.getElementById('qt-contracts').value);
        const price = Number(document.getElementById('qt-price').value);
        const category = document.getElementById('qt-category').value;
        const trade = engine.executePaperTrade({
          ticker: selectedTicker,
          action: 'BUY',
          side,
          contracts,
          price,
          category,
          note: `Dashboard Quick Trade (${category})`
        });
        if (msgEl) {
          msgEl.className = 'status-banner ok';
          msgEl.textContent = `Paper simulation only (not sent to Kalshi): ${trade.id} BUY ${trade.contracts} ${trade.side} on ${trade.ticker} @ $${trade.price.toFixed(2)}. Track in Portfolio & Strategies.`;
        }
      } catch (err) {
        if (msgEl) {
          msgEl.className = 'status-banner warn';
          msgEl.textContent = err.message;
        }
      }
    });
  }

  window.addEventListener('resize', () => renderChartAndOrderbook());
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader('dashboard');
  renderFooter();
  bindEvents();

  const renderAll = () => {
    renderKpis();
    renderTopicCards();
    renderDualChats();
    renderChartAndOrderbook();
    renderMarketsTable();
    maybeNotifyHighRoi();
  };

  renderAll();
  engine.subscribe(() => renderAll());
  engine.start();
});
