/**
 * Shared Navigation, Formatting, Verification Badges & Reusable UI Components
 */

import { TOPICS, LAST_VERIFIED_DATE_UTC } from './data.js';

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getRootPrefix() {
  const depth = document.body.dataset.rootDepth ? Number(document.body.dataset.rootDepth) : 0;
  return depth > 0 ? '../'.repeat(depth) : '';
}

export function renderHeader(activeKey) {
  const prefix = getRootPrefix();
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', href: `${prefix}index.html` },
    { key: 'gas-prices', label: 'Gas Prices', href: `${prefix}categories/gas-prices.html` },
    { key: 'elections', label: 'Elections', href: `${prefix}categories/elections.html` },
    { key: 'culture', label: 'Culture', href: `${prefix}categories/culture.html` },
    { key: 'crypto', label: 'Crypto', href: `${prefix}categories/crypto.html` },
    { key: 'golf', label: 'Golf', href: `${prefix}categories/golf.html` },
    { key: 'portfolio', label: 'Portfolio & Strategies', href: `${prefix}portfolio.html` },
    { key: 'verification', label: 'API & Suggestions', href: `${prefix}verification.html` },
    { key: 'flagged', label: 'Flagged for Review', href: `${prefix}flagged-for-review.html` }
  ];

  const header = document.getElementById('site-header');
  if (!header) return;

  header.innerHTML = `
    <div class="topbar">
      <div class="container topbar-inner">
        <a class="brand" href="${prefix}index.html">
          <span class="brand-mark">TB3</span>
          <div>
            <div class="brand-title">Tradebot3 · Kalshi Demo</div>
            <div class="brand-sub">5 Topics · Demo REST snapshots · Paper trades</div>
          </div>
        </a>
        <nav class="nav-links" aria-label="Primary Navigation">
          ${navItems
            .map(
              (item) =>
                `<a class="nav-link ${item.key === activeKey ? 'active' : ''} ${
                  item.key === 'flagged' ? 'nav-flagged' : ''
                }" href="${item.href}">${escapeHtml(item.label)}</a>`
            )
            .join('')}
        </nav>
      </div>
    </div>
  `;
}

export function renderFooter() {
  const prefix = getRootPrefix();
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <strong>Tradebot3 — Kalshi Demo Dashboard</strong> · Strictly scoped to Gas Prices, Elections, Culture, Crypto &amp; Golf.
          <div class="muted small">Catalog page snapshot date: ${escapeHtml(LAST_VERIFIED_DATE_UTC)}. Demo REST snapshots are separate from production; all trades and strategies are local paper simulations.</div>
        </div>
        <div class="footer-links">
          <a href="${prefix}EXECUTIVE_SUMMARY.md">Executive Summary</a>
          <a href="${prefix}COORDINATION.md">COORDINATION.md</a>
          <a href="${prefix}verification.html">API Verification</a>
          <a href="${prefix}flagged-for-review.html">Flagged for Review</a>
          <a href="https://docs.kalshi.com/getting_started/demo_env" target="_blank" rel="noopener noreferrer">Kalshi Demo Docs ↗</a>
        </div>
      </div>
    </footer>
  `;
}

export function formatUnverifiedCell(note = 'Unverified') {
  const prefix = getRootPrefix();
  return `<span class="blank-cell" title="Value not confirmed from official static source"></span> <a class="badge badge-unverified" href="${prefix}flagged-for-review.html">${escapeHtml(note)}</a>`;
}

export function formatDollarVolume(volumeUsd) {
  if (volumeUsd === null || volumeUsd === undefined) {
    return formatUnverifiedCell('Unverified');
  }
  return `$${Number(volumeUsd).toLocaleString('en-US')}`;
}

export function formatPrice(price) {
  if (price === null || price === undefined) return formatUnverifiedCell('Unverified');
  return `$${Number(price).toFixed(2)}`;
}

export function formatDeltaBadge(delta) {
  if (delta === null || delta === undefined) return '<span class="muted">—</span>';
  const num = Number(delta);
  const cls = num > 0 ? 'delta-up' : num < 0 ? 'delta-down' : 'delta-flat';
  const big = Math.abs(num) >= 0.1 ? ' delta-alert' : '';
  const sign = num > 0 ? '+' : '';
  return `<span class="delta ${cls}${big}">${sign}$${num.toFixed(2)}</span>`;
}

export function formatTopicBadge(topicId) {
  const t = TOPICS[topicId];
  if (!t) return '';
  return `<span class="topic-pill" style="background:${t.bgTint};color:${t.color};">${escapeHtml(t.shortName)}</span>`;
}

export function formatResolutionBadge(market) {
  const source = market.dataStatus === 'demo-rest'
    ? 'Kalshi Demo REST'
    : market.dataStatus === 'stale'
      ? 'Stale Demo REST'
      : `Catalog ${market.catalogAsOf || LAST_VERIFIED_DATE_UTC}`;
  const status = market.status || 'Needs Review';
  const resolution = String(market.resolution || '').toUpperCase();

  if (status === 'Resolved' && (resolution === 'YES' || resolution === 'NO')) {
    const cls = resolution === 'YES' ? 'badge-yes' : 'badge-no';
    return `<span class="badge ${cls}">${escapeHtml(source)} · Finalized ${resolution}</span>`;
  }
  if (status === 'Determined' && (resolution === 'YES' || resolution === 'NO')) {
    return `<span class="badge badge-open">${escapeHtml(source)} · Determined ${resolution} (settlement pending)</span>`;
  }
  if (status === 'Open' || resolution === 'OPEN') {
    return `<span class="badge badge-open">${escapeHtml(source)} · Open</span>`;
  }
  if (status === 'Needs Review') return formatUnverifiedCell('Needs Review');
  if (resolution === 'YES' || resolution === 'NO') {
    return `<span class="badge badge-open">${escapeHtml(source)} · ${escapeHtml(status)} ${resolution}</span>`;
  }
  return `<span class="badge badge-open">${escapeHtml(source)} · ${escapeHtml(status)} · outcome unavailable</span>`;
}

export function formatSourceLink(url, label) {
  if (!url) return formatUnverifiedCell('Missing Source');
  return `<a class="source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)} ↗</a>`;
}

export function formatTimeShort(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function renderOrderbookHtml(orderbook, ticker, { marketTicker = null, error = '' } = {}) {
  if (!orderbook) {
    return `
      <div class="ob-header">
        <div>
          <strong>Orderbook Liquidity (${escapeHtml(ticker)})</strong>
          <div class="muted tiny">No resting depth is invented when Demo REST is unavailable.</div>
          ${error ? `<div class="tiny muted">${escapeHtml(error)}</div>` : ''}
        </div>
        ${marketTicker ? `<button class="btn-xs btn-refresh-orderbook" data-ticker="${escapeHtml(ticker)}">Refresh Demo REST book</button>` : '<span class="badge badge-unverified">Contract match pending</span>'}
      </div>
    `;
  }

  const simulated = Boolean(orderbook.simulated);
  const sourceBadge = simulated
    ? '<span class="badge badge-sim">Paper simulation depth · not exchange data</span>'
    : `<span class="badge badge-verified">Kalshi Demo REST snapshot${orderbook.fetchedAt ? ` · ${formatTimeShort(orderbook.fetchedAt)}` : ''}</span>`;
  const yesBids = Array.isArray(orderbook.yesBids) ? orderbook.yesBids : [];
  const asks = Array.isArray(orderbook.impliedYesAsks) ? orderbook.impliedYesAsks : [];
  const maxCount = Math.max(1, ...yesBids.map((level) => level.count), ...asks.map((level) => level.count));

  const askRows = asks.slice(0, 5).reverse().map((level) => {
    const pct = Math.min(100, Math.round((level.count / maxCount) * 100));
    return `
      <tr class="ob-row ob-ask-row" data-ticker="${escapeHtml(ticker)}" data-side="YES" data-price="${level.price.toFixed(2)}">
        <td class="mono ask-price">$${level.price.toFixed(2)} <span class="muted tiny">(NO bid $${level.noBidPrice.toFixed(2)})</span></td>
        <td class="mono">${level.count.toLocaleString()}</td>
        <td class="mono">$${level.dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="bar-cell"><div class="depth-bar depth-ask" style="width:${pct}%"></div></td>
      </tr>`;
  }).join('');
  const bidRows = yesBids.slice(0, 5).map((level) => {
    const pct = Math.min(100, Math.round((level.count / maxCount) * 100));
    return `
      <tr class="ob-row ob-bid-row" data-ticker="${escapeHtml(ticker)}" data-side="YES" data-price="${level.price.toFixed(2)}">
        <td class="mono bid-price">$${level.price.toFixed(2)}</td>
        <td class="mono">${level.count.toLocaleString()}</td>
        <td class="mono">$${level.dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="bar-cell"><div class="depth-bar depth-bid" style="width:${pct}%"></div></td>
      </tr>`;
  }).join('');
  const empty = yesBids.length === 0 && asks.length === 0;
  const emptyRow = empty
    ? '<tr><td colspan="4" class="muted">Demo REST returned no resting bid levels for this snapshot.</td></tr>'
    : '';
  const spread = orderbook.spread === null || orderbook.spread === undefined ? null : orderbook.spread;
  const yesContracts = Number(orderbook.totalYesContracts) || 0;
  const noContracts = Number(orderbook.totalNoContracts) || 0;
  const dollarLiquidity = Number(orderbook.totalDollarLiquidity) || 0;

  return `
    <div class="ob-header">
      <div>
        <strong>Orderbook Liquidity (${escapeHtml(ticker)})</strong>
        <div class="muted tiny">Read-only snapshot. YES ask is implied from the complementary NO bid (YES ask = $1 − NO bid).</div>
      </div>
      <div>${sourceBadge}</div>
    </div>
    <div class="ob-summary-strip">
      <div><span class="muted">Best YES Bid:</span> <strong class="mono bid-price">${orderbook.bestYesBid !== null ? `$${orderbook.bestYesBid.toFixed(2)}` : '—'}</strong></div>
      <div><span class="muted">Implied YES Ask:</span> <strong class="mono ask-price">${orderbook.bestYesAsk !== null ? `$${orderbook.bestYesAsk.toFixed(2)}` : '—'}</strong></div>
      <div><span class="muted">Spread:</span> <strong class="mono">${spread !== null ? `$${spread.toFixed(2)}` : '—'}</strong></div>
      <div><span class="muted">Bid Contracts:</span> <strong class="mono">${(yesContracts + noContracts).toLocaleString()}</strong></div>
      <div><span class="muted">Visible Depth:</span> <strong class="mono">$${dollarLiquidity.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong></div>
    </div>
    <div class="table-wrap">
      <table class="data-table compact-table">
        <thead><tr><th>Price Level (YES)</th><th>Contracts</th><th>Dollar Notional</th><th>Depth</th></tr></thead>
        <tbody>
          ${emptyRow}${askRows}
          ${empty ? '' : `<tr class="spread-divider"><td colspan="4">Spread: ${spread !== null ? `$${spread.toFixed(2)}` : '—'} · YES bids below / implied YES asks above</td></tr>`}
          ${bidRows}
        </tbody>
      </table>
    </div>
  `;
}

export function renderAlertItemHtml(alert, isModelEdgeFeed = false) {
  const dirIcon = alert.direction === 'UP' ? '▲' : '▼';
  const dirCls = alert.direction === 'UP' ? 'chat-up' : 'chat-down';
  const simTag = alert.simulated
    ? '<span class="badge badge-sim">Paper simulation · synthetic</span>'
    : '<span class="badge badge-verified">Demo REST snapshot change · not streaming</span>';
  const roiHtml = isModelEdgeFeed && alert.roi
    ? `<div class="roi-callout"><strong>Heuristic filter (not a forecast):</strong> ${escapeHtml(alert.roi.reason)}</div>`
    : '';
  const fromPrice = Number(alert.fromPrice);
  const toPrice = Number(alert.toPrice);
  const priceText = Number.isFinite(fromPrice) && Number.isFinite(toPrice)
    ? `<span class="mono">($${fromPrice.toFixed(2)} → $${toPrice.toFixed(2)})</span>`
    : '';
  const sourceUrl = alert.catalystUrl || alert.verifiedSourceUrl;

  return `
    <div class="chat-msg ${dirCls}" data-ticker="${escapeHtml(alert.ticker)}">
      <div class="chat-msg-top">
        <div class="chat-msg-left">
          ${formatTopicBadge(alert.topic)}
          <button class="link-btn ticker-jump-btn" data-ticker="${escapeHtml(alert.ticker)}">${escapeHtml(alert.ticker)}</button>
          ${simTag}
        </div>
        <span class="mono tiny muted">${formatTimeShort(alert.ts)}</span>
      </div>
      <div class="chat-msg-body">
        <span class="swing-pill ${dirCls}">${dirIcon} ${alert.delta >= 0 ? '+' : ''}$${Number(alert.delta).toFixed(2)}</span>
        <strong>${escapeHtml(alert.title)}</strong>
        ${priceText}
      </div>
      ${roiHtml}
      <div class="chat-msg-footer">
        <span class="tiny muted">${escapeHtml(alert.catalystLabel)}</span>
        <div class="chat-actions">
          ${sourceUrl ? `<a class="source-link tiny" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(alert.catalystSource || 'Kalshi source')} ↗</a>` : ''}
          <button class="btn-xs btn-inspect" data-ticker="${escapeHtml(alert.ticker)}">Chart</button>
        </div>
      </div>
    </div>
  `;
}
