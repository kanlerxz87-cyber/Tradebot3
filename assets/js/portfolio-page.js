/**
 * Portfolio Tracker, Kalshi Demo Account Connector, Trade Execution,
 * Trade Categorization Analysis, & Automated Strategy Lab (portfolio.html)
 */

import { TOPICS, ALLOWED_TOPICS } from './data.js';
import { engine, TRADE_CATEGORIES } from './engine.js';
import { renderEquityChart, renderCategoryBarChart } from './charts.js';
import {
  renderHeader,
  renderFooter,
  escapeHtml,
  formatTopicBadge,
  formatSourceLink,
  formatTimeShort
} from './ui-common.js';

function populateMarketSelect() {
  const sel = document.getElementById('trade-ticker');
  if (!sel || sel.options.length) return;
  ALLOWED_TOPICS.forEach((topicId) => {
    const grp = document.createElement('optgroup');
    grp.label = TOPICS[topicId].name;
    engine.getMarketsByTopic(topicId).forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.ticker;
      opt.textContent = `${m.ticker} (${m.status}) — $${m.currentPrice.toFixed(2)} — ${m.title}`;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  });

  const catSel = document.getElementById('trade-category');
  if (catSel) {
    catSel.innerHTML = TRADE_CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }
  const stratCatSel = document.getElementById('cs-category');
  if (stratCatSel) {
    stratCatSel.innerHTML = TRADE_CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }
}

function renderPortfolioKpis() {
  const s = engine.getPortfolioSummary();
  const el = document.getElementById('portfolio-kpis');
  if (!el) return;
  el.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Demo Equity</div>
      <div class="kpi-value">$${s.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="kpi-sub">Starting Balance: $10,000.00</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Available Cash</div>
      <div class="kpi-value">$${s.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="kpi-sub">Positions Value: $${s.positionsValue.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Realized P&amp;L</div>
      <div class="kpi-value ${s.realizedPnl >= 0 ? 'delta-up' : 'delta-down'}">${s.realizedPnl >= 0 ? '+' : ''}$${s.realizedPnl.toFixed(2)}</div>
      <div class="kpi-sub">From closed &amp; settled trades</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Unrealized P&amp;L</div>
      <div class="kpi-value ${s.unrealizedPnl >= 0 ? 'delta-up' : 'delta-down'}">${s.unrealizedPnl >= 0 ? '+' : ''}$${s.unrealizedPnl.toFixed(2)}</div>
      <div class="kpi-sub">Total ROI: ${s.totalRoiPct >= 0 ? '+' : ''}${s.totalRoiPct}%</div>
    </div>
  `;

  const eqCanvas = document.getElementById('equity-curve-chart');
  renderEquityChart(eqCanvas, engine.portfolio.equityCurve);
}

function renderOpenPositions() {
  const tbody = document.getElementById('open-positions-body');
  if (!tbody) return;
  const { openPositions } = engine.getPortfolioSummary();

  if (!openPositions.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="muted">No open positions. Place a paper trade or enable a strategy test below.</td></tr>';
    return;
  }

  tbody.innerHTML = openPositions
    .map((p) => {
      const m = engine.getMarket(p.ticker);
      return `
        <tr>
          <td class="mono"><strong>${escapeHtml(p.ticker)}</strong><div class="tiny muted">${escapeHtml(p.marketTitle)}</div></td>
          <td>${formatTopicBadge(p.topic)}</td>
          <td><span class="badge ${p.side === 'YES' ? 'badge-yes' : 'badge-no'}">${escapeHtml(p.side)}</span></td>
          <td class="mono">${p.contracts}</td>
          <td class="mono">$${p.avgPrice.toFixed(2)}</td>
          <td class="mono">$${p.mark.toFixed(2)}</td>
          <td class="mono ${p.pnl >= 0 ? 'delta-up' : 'delta-down'}">${p.pnl >= 0 ? '+' : ''}$${p.pnl.toFixed(2)} (${p.roiPct >= 0 ? '+' : ''}${p.roiPct}%)</td>
          <td><span class="badge badge-sim">${escapeHtml(p.category || 'Manual')}</span></td>
          <td style="white-space:nowrap;">
            <button class="btn-xs btn-close-pos" data-ticker="${escapeHtml(p.ticker)}" data-side="${escapeHtml(p.side)}" data-qty="${p.contracts}" data-price="${p.mark.toFixed(2)}">Close</button>
            <button class="btn-xs btn-resolve-yes" data-ticker="${escapeHtml(p.ticker)}" title="Simulate YES Resolution ($1.00)">Settle YES</button>
            <button class="btn-xs btn-resolve-no" data-ticker="${escapeHtml(p.ticker)}" title="Simulate NO Resolution ($0.00)">Settle NO</button>
            ${m ? formatSourceLink(m.sourceUrl, 'Src') : ''}
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderStrategies() {
  const el = document.getElementById('strategies-list');
  if (!el) return;

  el.innerHTML = engine.portfolio.strategies
    .map(
      (s) => `
      <div class="strategy-card">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong>${escapeHtml(s.name)}</strong>
            <span class="badge badge-sim">${escapeHtml(s.category)}</span>
            <span class="badge ${s.enabled ? 'badge-yes' : 'badge-no'}">${s.enabled ? 'ACTIVE' : 'PAUSED'}</span>
          </div>
          <div class="small muted" style="margin-top:4px;">${escapeHtml(s.description)}</div>
          <div class="tiny mono muted" style="margin-top:4px;">
            Topic: ${escapeHtml(s.topicFilter)} · Trigger Swing &gt;= $${Number(s.minSwing).toFixed(2)} · Min ROI: ${s.minExpectedRoi}% · Max Size: ${s.maxContracts} contracts · Rule: ${escapeHtml(s.rule)}
          </div>
        </div>
        <button class="btn btn-sm btn-toggle-strat" data-strat-id="${escapeHtml(s.id)}">${s.enabled ? 'Pause' : 'Enable'}</button>
      </div>
    `
    )
    .join('');
}

function renderCategoryAnalytics() {
  const tbody = document.getElementById('category-analytics-body');
  if (!tbody) return;
  const rows = engine.getCategoryAnalytics();
  renderCategoryBarChart(document.getElementById('category-pnl-chart'), rows);

  tbody.innerHTML = rows
    .map(
      (r) => `
      <tr>
        <td><strong>${escapeHtml(r.category)}</strong></td>
        <td class="mono">${r.totalTrades}</td>
        <td class="mono">${r.closedTrades}</td>
        <td class="mono">${r.winRatePct !== null ? `${r.winRatePct}%` : '<span class="muted">—</span>'}</td>
        <td class="mono ${r.pnl >= 0 ? 'delta-up' : 'delta-down'}">${r.pnl >= 0 ? '+' : ''}$${r.pnl.toFixed(2)}</td>
        <td class="mono ${r.roiPct >= 0 ? 'delta-up' : 'delta-down'}">${r.roiPct >= 0 ? '+' : ''}${r.roiPct}%</td>
        <td>
          <button class="btn-xs btn-prefill-strat" data-category="${escapeHtml(r.category)}">Build Strategy →</button>
        </td>
      </tr>
    `
    )
    .join('');
}

function renderTradesTable() {
  const tbody = document.getElementById('trades-ledger-body');
  if (!tbody) return;
  const trades = engine.portfolio.trades;

  tbody.innerHTML = trades
    .map((t) => {
      const m = engine.getMarket(t.ticker);
      return `
        <tr>
          <td class="mono tiny">${formatTimeShort(t.ts)}<div class="muted">${escapeHtml(t.id)}</div></td>
          <td class="mono"><strong>${escapeHtml(t.ticker)}</strong><div>${formatTopicBadge(t.topic)}</div></td>
          <td><strong>${escapeHtml(t.action)} ${escapeHtml(t.side)}</strong></td>
          <td class="mono">${t.contracts}</td>
          <td class="mono">$${Number(t.price).toFixed(2)}${t.exitPrice !== null ? ` → $${Number(t.exitPrice).toFixed(2)}` : ''}</td>
          <td><span class="badge ${t.status === 'OPEN' ? 'badge-open' : t.pnl >= 0 ? 'badge-yes' : 'badge-no'}">${escapeHtml(t.status)}</span></td>
          <td class="mono ${t.pnl > 0 ? 'delta-up' : t.pnl < 0 ? 'delta-down' : ''}">${t.status === 'OPEN' ? '—' : `${t.pnl >= 0 ? '+' : ''}$${Number(t.pnl).toFixed(2)} (${t.roiPct}%)`}</td>
          <td><span class="badge badge-sim">${escapeHtml(t.category)}</span></td>
          <td class="tiny">${escapeHtml(t.note)} ${m ? formatSourceLink(m.sourceUrl, 'Kalshi') : ''}</td>
        </tr>
      `;
    })
    .join('');
}

function bindEvents() {
  // Kalshi Demo API Connector Form
  const apiForm = document.getElementById('demo-api-form');
  if (apiForm) {
    apiForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = document.getElementById('api-conn-feedback');
      const baseUrl = document.getElementById('api-base-url').value;
      const keyId = document.getElementById('api-key-id').value;
      const pem = document.getElementById('api-private-key').value;
      try {
        await engine.client.configure({ baseUrl, keyId, privateKeyPem: pem });
        if (keyId && pem) {
          const bal = await engine.client.getPortfolioBalance();
          if (statusEl) {
            statusEl.className = 'status-banner ok';
            statusEl.textContent = `Connected to Kalshi Demo Account (${engine.client.keyAlgorithm || 'Signed'})! Live Demo Balance: $${bal.balance_dollars || (bal.balance / 100).toFixed(2)} (Portfolio Value: $${(bal.portfolio_value / 100).toFixed(2)}).`;
          }
        } else {
          const res = await engine.client.testPublicConnectivity();
          if (statusEl) {
            statusEl.className = res.ok ? 'status-banner ok' : 'status-banner warn';
            statusEl.textContent = res.status.message;
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.className = 'status-banner warn';
          statusEl.textContent = `Kalshi Demo API call did not complete in browser (${err.message}). Paper Demo Account remains active (see IRREG-02).`;
        }
      }
    });
  }

  // Trade Execution Ticket
  const tradeForm = document.getElementById('execute-trade-form');
  if (tradeForm) {
    const tickerSel = document.getElementById('trade-ticker');
    const syncPrice = () => {
      const m = engine.getMarket(tickerSel.value);
      const side = document.getElementById('trade-side').value;
      const priceInput = document.getElementById('trade-price');
      if (m && priceInput) {
        priceInput.value = (side === 'YES' ? m.currentPrice : 1 - m.currentPrice).toFixed(2);
      }
    };
    tickerSel.addEventListener('change', syncPrice);
    document.getElementById('trade-side').addEventListener('change', syncPrice);
    syncPrice();

    tradeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fb = document.getElementById('trade-feedback');
      try {
        const trade = engine.executePaperTrade({
          ticker: tickerSel.value,
          action: document.getElementById('trade-action').value,
          side: document.getElementById('trade-side').value,
          contracts: Number(document.getElementById('trade-contracts').value),
          price: Number(document.getElementById('trade-price').value),
          category: document.getElementById('trade-category').value,
          note: document.getElementById('trade-note').value
        });
        if (fb) {
          fb.className = 'status-banner ok';
          fb.textContent = `Paper simulation recorded (no order was sent) (${trade.id}): ${trade.action} ${trade.contracts} ${trade.side} on ${trade.ticker} @ $${trade.price.toFixed(2)} [${trade.category}].`;
        }
      } catch (err) {
        if (fb) {
          fb.className = 'status-banner warn';
          fb.textContent = err.message;
        }
      }
    });
  }

  // Run Simulated Swing Burst for Automated Strategies
  const simBurstBtn = document.getElementById('btn-run-sim-burst');
  if (simBurstBtn) {
    simBurstBtn.addEventListener('click', () => {
      const open = engine.markets.filter((m) => m.status === 'Open');
      for (let i = 0; i < 3; i += 1) {
        const pick = open[Math.floor(Math.random() * open.length)];
        if (pick) engine.runTick(pick.ticker);
      }
    });
  }

  const resetBtn = document.getElementById('btn-reset-portfolio');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => engine.resetPortfolio());
  }

  // Custom Strategy Creator Form
  const csForm = document.getElementById('custom-strategy-form');
  if (csForm) {
    csForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cs-name').value;
      if (!name.trim()) return;
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
      csForm.reset();
    });
  }

  // Delegate table & strategy card button clicks
  document.body.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.btn-close-pos');
    if (closeBtn) {
      engine.executePaperTrade({
        ticker: closeBtn.dataset.ticker,
        action: 'SELL',
        side: closeBtn.dataset.side,
        contracts: Number(closeBtn.dataset.qty),
        price: Number(closeBtn.dataset.price),
        note: 'Manual position close at current mark'
      });
      return;
    }

    const resYes = e.target.closest('.btn-resolve-yes');
    if (resYes) {
      engine.simulateResolution(resYes.dataset.ticker, 'YES');
      return;
    }

    const resNo = e.target.closest('.btn-resolve-no');
    if (resNo) {
      engine.simulateResolution(resNo.dataset.ticker, 'NO');
      return;
    }

    const toggleBtn = e.target.closest('.btn-toggle-strat');
    if (toggleBtn) {
      engine.toggleStrategy(toggleBtn.dataset.stratId);
      return;
    }

    const prefillBtn = e.target.closest('.btn-prefill-strat');
    if (prefillBtn) {
      const cat = prefillBtn.dataset.category;
      const catSel = document.getElementById('cs-category');
      const nameIn = document.getElementById('cs-name');
      if (catSel) catSel.value = cat;
      if (nameIn) nameIn.value = `${cat} Auto-Rule`;
      const section = document.getElementById('custom-strategy-section');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  });

  window.addEventListener('resize', () => {
    renderPortfolioKpis();
    renderCategoryAnalytics();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader('portfolio');
  renderFooter();
  populateMarketSelect();
  bindEvents();

  const renderAll = () => {
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
