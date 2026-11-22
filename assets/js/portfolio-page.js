/** Paper portfolio, optional read-only API check, and local strategy simulator controller. */

import { TOPICS, ALLOWED_TOPICS } from './data.js';
import { engine, TRADE_CATEGORIES } from './engine.js';
import { renderEquityChart } from './charts.js';
import {
  renderHeader,
  renderFooter,
  escapeHtml,
  formatTopicBadge,
  formatSourceLink,
  formatTimeShort
} from './ui-common.js';

function money(value, digits = 2) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? '<span class="muted">—</span>'
    : `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function quoteLabel(market) {
  return market.currentPrice === null ? 'No Demo REST quote' : `Demo REST YES $${market.currentPrice.toFixed(2)}`;
}

function populateMarketSelect() {
  const select = document.getElementById('trade-ticker');
  if (!select || select.options.length) return;
  ALLOWED_TOPICS.forEach((topicId) => {
    const group = document.createElement('optgroup');
    group.label = TOPICS[topicId].name;
    engine.getMarketsByTopic(topicId).forEach((market) => {
      const option = document.createElement('option');
      option.value = market.ticker;
      option.textContent = `${market.ticker} (${market.status}) — ${quoteLabel(market)} — ${market.title}`;
      group.appendChild(option);
    });
    select.appendChild(group);
  });
  const categorySelect = document.getElementById('trade-category');
  if (categorySelect) categorySelect.innerHTML = TRADE_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  const strategyCategorySelect = document.getElementById('cs-category');
  if (strategyCategorySelect) strategyCategorySelect.innerHTML = TRADE_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
}

function updateMarketSelectLabels() {
  const select = document.getElementById('trade-ticker');
  if (!select) return;
  [...select.options].forEach((option) => {
    const market = engine.getMarket(option.value);
    if (market) option.textContent = `${market.ticker} (${market.status}) — ${quoteLabel(market)} — ${market.title}`;
  });
}

function renderPortfolioKpis() {
  const summary = engine.getPortfolioSummary();
  const el = document.getElementById('portfolio-kpis');
  if (el) {
    el.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">Total Paper Equity</div>
        <div class="kpi-value">${money(summary.totalEquity)}</div>
        <div class="kpi-sub">Starting paper balance: $10,000.00</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Available Paper Cash</div>
        <div class="kpi-value">${money(summary.cashBalance)}</div>
        <div class="kpi-sub">Paper positions value: ${money(summary.positionsValue)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Realized Paper P&amp;L</div>
        <div class="kpi-value ${summary.realizedPnl >= 0 ? 'delta-up' : 'delta-down'}">${summary.realizedPnl >= 0 ? '+' : ''}${money(summary.realizedPnl)}</div>
        <div class="kpi-sub">Local closed and paper-settled trades only</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Unrealized Paper P&amp;L</div>
        <div class="kpi-value ${summary.unrealizedPnl === null ? '' : summary.unrealizedPnl >= 0 ? 'delta-up' : 'delta-down'}">${summary.unrealizedPnl === null ? '—' : `${summary.unrealizedPnl >= 0 ? '+' : ''}${money(summary.unrealizedPnl)}`}</div>
        <div class="kpi-sub">ROI ${summary.totalRoiPct === null ? '—' : `${summary.totalRoiPct >= 0 ? '+' : ''}${summary.totalRoiPct}%`} · ${summary.unpricedPositionCount} unmarked positions</div>
      </div>
    `;
  }
  renderEquityChart(document.getElementById('equity-curve-chart'), engine.portfolio.equityCurve);
}

function renderOpenPositions() {
  const tbody = document.getElementById('open-positions-body');
  if (!tbody) return;
  const { openPositions } = engine.getPortfolioSummary();
  if (!openPositions.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="muted">No open paper positions. Record a paper trade or run a clearly labeled simulation.</td></tr>';
    return;
  }
  tbody.innerHTML = openPositions.map((position) => {
    const market = engine.getMarket(position.ticker);
    const closeButton = position.mark === null
      ? '<span class="tiny muted">No Demo REST mark; close from the paper ticket using a chosen fill price.</span>'
      : `<button class="btn-xs btn-close-pos" data-ticker="${escapeHtml(position.ticker)}" data-side="${escapeHtml(position.side)}" data-qty="${position.contracts}" data-price="${position.mark.toFixed(2)}">Paper close</button>`;
    return `
      <tr>
        <td class="mono"><strong>${escapeHtml(position.ticker)}</strong><div class="tiny muted">${escapeHtml(position.marketTitle)}</div></td>
        <td>${formatTopicBadge(position.topic)}</td>
        <td><span class="badge ${position.side === 'YES' ? 'badge-yes' : 'badge-no'}">${escapeHtml(position.side)}</span></td>
        <td class="mono">${position.contracts}</td>
        <td class="mono">$${position.avgPrice.toFixed(2)}</td>
        <td class="mono">${position.mark === null ? '<span class="muted">No Demo REST mark</span>' : `$${position.mark.toFixed(2)}`}</td>
        <td class="mono ${position.pnl === null ? '' : position.pnl >= 0 ? 'delta-up' : 'delta-down'}">${position.pnl === null ? '<span class="muted">— (unmarked)</span>' : `${position.pnl >= 0 ? '+' : ''}$${position.pnl.toFixed(2)} (${position.roiPct >= 0 ? '+' : ''}${position.roiPct}%)`}</td>
        <td><span class="badge badge-sim">${escapeHtml(position.category || 'Manual')} · Paper</span></td>
        <td style="white-space:nowrap;">
          ${closeButton}
          <button class="btn-xs btn-resolve-yes" data-ticker="${escapeHtml(position.ticker)}" title="Paper-only settlement test; does not change the Kalshi market">Paper YES</button>
          <button class="btn-xs btn-resolve-no" data-ticker="${escapeHtml(position.ticker)}" title="Paper-only settlement test; does not change the Kalshi market">Paper NO</button>
          ${market ? formatSourceLink(market.sourceUrl, 'Official page') : ''}
        </td>
      </tr>`;
  }).join('');
}

function renderStrategies() {
  const el = document.getElementById('strategies-list');
  if (!el) return;
  el.innerHTML = engine.portfolio.strategies.map((strategy) => `
    <div class="strategy-card">
      <div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <strong>${escapeHtml(strategy.name)}</strong>
          <span class="badge badge-sim">${escapeHtml(strategy.category)} · Paper only</span>
          <span class="badge ${strategy.enabled ? 'badge-yes' : 'badge-no'}">${strategy.enabled ? 'ACTIVE' : 'PAUSED'}</span>
        </div>
        <div class="small muted" style="margin-top:4px;">${escapeHtml(strategy.description)}</div>
        <div class="tiny mono muted" style="margin-top:4px;">
          Topic: ${escapeHtml(strategy.topicFilter)} · Trigger >= $${Number(strategy.minSwing).toFixed(2)} · ROI threshold: ${strategy.minExpectedRoi}% · Max size: ${strategy.maxContracts} · Rule: ${escapeHtml(strategy.rule)}
        </div>
      </div>
      <button class="btn btn-sm btn-toggle-strat" data-strat-id="${escapeHtml(strategy.id)}">${strategy.enabled ? 'Pause' : 'Enable'}</button>
    </div>`).join('');
}

function renderCategoryAnalytics() {
  const tbody = document.getElementById('category-analytics-body');
  if (!tbody) return;
  tbody.innerHTML = engine.getCategoryAnalytics().map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.category)}</strong></td>
      <td class="mono">${row.totalTrades}</td>
      <td class="mono">${row.closedTrades}</td>
      <td class="mono">${row.winRatePct === null ? '<span class="muted">—</span>' : `${row.winRatePct}%`}</td>
      <td class="mono ${row.pnl === null ? '' : row.pnl >= 0 ? 'delta-up' : 'delta-down'}">${row.pnl === null ? '<span class="muted">— (open mark unavailable)</span>' : `${row.pnl >= 0 ? '+' : ''}$${row.pnl.toFixed(2)}`}</td>
      <td class="mono ${row.roiPct === null ? '' : row.roiPct >= 0 ? 'delta-up' : 'delta-down'}">${row.roiPct === null ? '<span class="muted">—</span>' : `${row.roiPct >= 0 ? '+' : ''}${row.roiPct}%`}</td>
      <td><button class="btn-xs btn-prefill-strat" data-category="${escapeHtml(row.category)}">Build Paper Rule →</button></td>
    </tr>`).join('');
}

function renderTradesTable() {
  const tbody = document.getElementById('trades-ledger-body');
  if (!tbody) return;
  tbody.innerHTML = engine.portfolio.trades.map((trade) => {
    const market = engine.getMarket(trade.ticker);
    const exit = trade.exitPrice !== null ? ` → $${Number(trade.exitPrice).toFixed(2)}` : '';
    const isOpen = trade.status === 'OPEN';
    const pnl = isOpen ? '—' : `${Number(trade.pnl) >= 0 ? '+' : ''}$${Number(trade.pnl).toFixed(2)} (${Number(trade.roiPct).toFixed(1)}%)`;
    return `
      <tr>
        <td class="mono tiny">${formatTimeShort(trade.ts)}<div class="muted">${escapeHtml(trade.id)}</div></td>
        <td class="mono"><strong>${escapeHtml(trade.ticker)}</strong><div>${formatTopicBadge(trade.topic)}</div></td>
        <td><strong>Paper ${escapeHtml(trade.action)} ${escapeHtml(trade.side)}</strong></td>
        <td class="mono">${trade.contracts}</td>
        <td class="mono">$${Number(trade.price).toFixed(2)}${exit}</td>
        <td><span class="badge ${isOpen ? 'badge-open' : Number(trade.pnl) >= 0 ? 'badge-yes' : 'badge-no'}">${escapeHtml(trade.status)}</span><div class="tiny muted">${escapeHtml(trade.mode || 'Paper Simulation')}</div></td>
        <td class="mono ${Number(trade.pnl) > 0 ? 'delta-up' : Number(trade.pnl) < 0 ? 'delta-down' : ''}">${pnl}</td>
        <td><span class="badge badge-sim">${escapeHtml(trade.category || 'Manual')}</span></td>
        <td class="tiny">${escapeHtml(trade.note)} ${market ? formatSourceLink(market.sourceUrl, 'Official market page') : ''}</td>
      </tr>`;
  }).join('');
}

function setFeedback(text, warn = false) {
  const element = document.getElementById('trade-feedback');
  if (!element) return;
  element.className = `status-banner ${warn ? 'warn' : 'ok'}`;
  element.textContent = text;
}

function bindEvents() {
  const apiForm = document.getElementById('demo-api-form');
  if (apiForm) {
    apiForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = document.getElementById('api-conn-feedback');
      const baseUrl = document.getElementById('api-base-url').value;
      const keyId = document.getElementById('api-key-id').value;
      const privateKey = document.getElementById('api-private-key').value;
      try {
        await engine.client.configure({ baseUrl, keyId, privateKeyPem: privateKey });
        if (keyId && privateKey) {
          const balance = await engine.client.getPortfolioBalance();
          const balanceDollars = balance.balance_dollars ?? (Number.isFinite(Number(balance.balance)) ? (Number(balance.balance) / 100).toFixed(2) : 'unavailable');
          const portfolioValue = Number.isFinite(Number(balance.portfolio_value)) ? (Number(balance.portfolio_value) / 100).toFixed(2) : 'unavailable';
          if (status) {
            status.className = 'status-banner ok';
            status.textContent = `Read-only Kalshi Demo balance request succeeded: balance $${balanceDollars}; portfolio value $${portfolioValue}. This is not connected to the local paper ledger; no positions were synchronized and no orders were submitted.`;
          }
        } else {
          const connectivity = await engine.client.testPublicConnectivity();
          if (connectivity.ok) {
            const marketStatus = await engine.refreshMarketData();
            if (status) {
              status.className = 'status-banner ok';
              status.textContent = `${connectivity.status.message} ${marketStatus.message} All trades remain local paper simulations.`;
            }
          } else if (status) {
            status.className = 'status-banner warn';
            status.textContent = `${connectivity.status.message} The local $10,000 paper account remains available.`;
          }
        }
      } catch (error) {
        if (status) {
          status.className = 'status-banner warn';
          status.textContent = `Read-only API check did not complete (${error.message}). The local paper portfolio remains separate; no order was submitted.`;
        }
      }
    });
  }

  const tradeForm = document.getElementById('execute-trade-form');
  if (tradeForm) {
    const tickerSelect = document.getElementById('trade-ticker');
    const syncPrice = () => {
      const market = engine.getMarket(tickerSelect.value);
      const side = document.getElementById('trade-side').value;
      const input = document.getElementById('trade-price');
      if (!input || document.activeElement === input) return;
      input.value = !market || market.currentPrice === null
        ? ''
        : (side === 'YES' ? market.currentPrice : 1 - market.currentPrice).toFixed(2);
    };
    tickerSelect.addEventListener('change', syncPrice);
    document.getElementById('trade-side').addEventListener('change', syncPrice);
    syncPrice();
    tradeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        const trade = engine.executePaperTrade({
          ticker: tickerSelect.value,
          action: document.getElementById('trade-action').value,
          side: document.getElementById('trade-side').value,
          contracts: Number(document.getElementById('trade-contracts').value),
          price: Number(document.getElementById('trade-price').value),
          category: document.getElementById('trade-category').value,
          note: document.getElementById('trade-note').value || 'Local paper simulation; no Kalshi order was sent.'
        });
        setFeedback(`Paper trade recorded (${trade.id}): ${trade.action} ${trade.contracts} ${trade.side} on ${trade.ticker} @ $${trade.price.toFixed(2)}. No Kalshi order was submitted.`);
      } catch (error) {
        setFeedback(error.message, true);
      }
    });
  }

  const simulationBurst = document.getElementById('btn-run-sim-burst');
  if (simulationBurst) {
    simulationBurst.addEventListener('click', () => {
      const openMarkets = engine.markets.filter((market) => market.status === 'Open');
      for (let index = 0; index < 3; index += 1) {
        const market = openMarkets[Math.floor(Math.random() * openMarkets.length)];
        if (market) engine.simulateSwing(market.ticker);
      }
    });
  }
  document.getElementById('btn-reset-portfolio')?.addEventListener('click', () => engine.resetPortfolio());

  const strategyForm = document.getElementById('custom-strategy-form');
  if (strategyForm) {
    strategyForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.getElementById('cs-name').value;
      if (!name.trim()) return;
      try {
        engine.addCustomStrategy({
          name,
          category: document.getElementById('cs-category').value,
          topicFilter: document.getElementById('cs-topic').value,
          minSwing: Number(document.getElementById('cs-min-swing').value),
          minExpectedRoi: Number(document.getElementById('cs-min-roi').value),
          maxContracts: Number(document.getElementById('cs-max-contracts').value),
          rule: document.getElementById('cs-rule').value,
          description: document.getElementById('cs-desc').value
        });
        strategyForm.reset();
        setFeedback('Paper-only strategy added. It does not place Kalshi orders.');
      } catch (error) {
        setFeedback(error.message, true);
      }
    });
  }

  document.body.addEventListener('click', (event) => {
    const closeButton = event.target.closest('.btn-close-pos');
    if (closeButton) {
      try {
        engine.executePaperTrade({
          ticker: closeButton.dataset.ticker,
          action: 'SELL',
          side: closeButton.dataset.side,
          contracts: Number(closeButton.dataset.qty),
          price: Number(closeButton.dataset.price),
          note: 'Paper position closed at the latest Demo REST snapshot; no Kalshi order was sent.'
        });
      } catch (error) {
        setFeedback(error.message, true);
      }
      return;
    }
    const paperYes = event.target.closest('.btn-resolve-yes');
    if (paperYes) {
      const result = engine.simulateResolution(paperYes.dataset.ticker, 'YES');
      if (result) setFeedback('Paper YES resolution test recorded. Kalshi market status and result were not changed.');
      return;
    }
    const paperNo = event.target.closest('.btn-resolve-no');
    if (paperNo) {
      const result = engine.simulateResolution(paperNo.dataset.ticker, 'NO');
      if (result) setFeedback('Paper NO resolution test recorded. Kalshi market status and result were not changed.');
      return;
    }
    const toggle = event.target.closest('.btn-toggle-strat');
    if (toggle) {
      engine.toggleStrategy(toggle.dataset.stratId);
      return;
    }
    const prefill = event.target.closest('.btn-prefill-strat');
    if (prefill) {
      const category = prefill.dataset.category;
      const categorySelect = document.getElementById('cs-category');
      const nameInput = document.getElementById('cs-name');
      if (categorySelect) categorySelect.value = category;
      if (nameInput) nameInput.value = `${category} Paper Rule`;
      document.getElementById('custom-strategy-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  window.addEventListener('resize', () => renderPortfolioKpis());
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader('portfolio');
  renderFooter();
  populateMarketSelect();
  bindEvents();
  const renderAll = () => {
    updateMarketSelectLabels();
    renderPortfolioKpis();
    renderOpenPositions();
    renderStrategies();
    renderCategoryAnalytics();
    renderTradesTable();
  };
  renderAll();
  engine.subscribe(() => renderAll());
  engine.start();
});
