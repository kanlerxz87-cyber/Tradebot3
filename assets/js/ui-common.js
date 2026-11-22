/**
 * Shared Navigation, Formatting, Verification Badges & Reusable UI Components
 */

import { TOPICS, LAST_VERIFIED_UTC } from './data.js';

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
            <div class="brand-sub">5-Topic Live Event &amp; Swing Alert Dashboard</div>
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
          <div class="muted small">Last verified against official Kalshi docs &amp; market pages: ${escapeHtml(LAST_VERIFIED_UTC)}. Unconfirmable values are left blank and flagged as Unverified.</div>
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
  if (market.resolution === 'YES') {
    return `<span class="badge badge-yes">Resolved YES ($1.00)</span>`;
  }
  if (market.resolution === 'NO') {
    return `<span class="badge badge-no">Resolved NO ($0.00)</span>`;
  }
  if (market.resolution === 'OPEN') {
    return `<span class="badge badge-open">Live / Open</span>`;
  }
  return formatUnverifiedCell('Unverified');
}

export function formatSourceLink(url, label) {
  if (!url) return formatUnverifiedCell('Missing Source');
  return `<a class="source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)} ↗</a>`;
}

export function formatTimeShort(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function renderOrderbookHtml(orderbook, ticker) {
  if (!orderbook) return '<p class="muted">No orderbook data loaded.</p>';
  const prefix = getRootPrefix();
  const simBadge = orderbook.simulated
    ? `<span class="badge badge-sim" title="Live Kalshi Demo resting depth requires runtime API pull; simulated ladder shown for interactive testing">Demo Simulated Depth · <a href="${prefix}flagged-for-review.html">IRREG-07</a></span>`
    : `<span class="badge badge-yes">Live Kalshi Demo REST Orderbook</span>`;

  const maxCount = Math.max(
    1,
    ...orderbook.yesBids.map((l) => l.count),
    ...orderbook.impliedYesAsks.map((l) => l.count)
  );

  const askRows = [...orderbook.impliedYesAsks]
    .slice(0, 5)
    .reverse()
    .map((lvl) => {
      const pct = Math.min(100, Math.round((lvl.count / maxCount) * 100));
      return `
        <tr class="ob-row ob-ask-row" data-ticker="${escapeHtml(ticker)}" data-side="YES" data-price="${lvl.price.toFixed(2)}">
          <td class="mono ask-price">$${lvl.price.toFixed(2)} <span class="muted tiny">(NO $${lvl.noBidPrice.toFixed(2)})</span></td>
          <td class="mono">${lvl.count.toLocaleString()}</td>
          <td class="mono">$${lvl.dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="bar-cell"><div class="depth-bar depth-ask" style="width:${pct}%"></div></td>
        </tr>
      `;
    })
    .join('');

  const bidRows = orderbook.yesBids
    .slice(0, 5)
    .map((lvl) => {
      const pct = Math.min(100, Math.round((lvl.count / maxCount) * 100));
      return `
        <tr class="ob-row ob-bid-row" data-ticker="${escapeHtml(ticker)}" data-side="YES" data-price="${lvl.price.toFixed(2)}">
          <td class="mono bid-price">$${lvl.price.toFixed(2)}</td>
          <td class="mono">${lvl.count.toLocaleString()}</td>
          <td class="mono">$${lvl.dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="bar-cell"><div class="depth-bar depth-bid" style="width:${pct}%"></div></td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="ob-header">
      <div>
        <strong>Orderbook Liquidity (${escapeHtml(ticker)})</strong>
        <div class="muted tiny">Click any level to pre-fill order price · Official reciprocal rule: YES Ask = $1.00 − NO Bid</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <button type="button" class="btn-xs btn-pull-live-ob" data-ticker="${escapeHtml(ticker)}" title="Fetch live GET /markets/${escapeHtml(ticker)}/orderbook from Kalshi Demo REST">Pull Live Book</button>
        ${simBadge}
      </div>
    </div>
    <div class="ob-summary-strip">
      <div><span class="muted">Best YES Bid:</span> <strong class="mono bid-price">${orderbook.bestYesBid !== null ? `$${orderbook.bestYesBid.toFixed(2)}` : '—'}</strong></div>
      <div><span class="muted">Implied YES Ask:</span> <strong class="mono ask-price">${orderbook.bestYesAsk !== null ? `$${orderbook.bestYesAsk.toFixed(2)}` : '—'}</strong></div>
      <div><span class="muted">Spread:</span> <strong class="mono">${orderbook.spread !== null ? `$${orderbook.spread.toFixed(2)}` : '—'}</strong></div>
      <div><span class="muted">Total Contracts:</span> <strong class="mono">${(orderbook.totalYesContracts + orderbook.totalNoContracts).toLocaleString()}</strong></div>
      <div><span class="muted">Total Depth:</span> <strong class="mono">$${orderbook.totalDollarLiquidity.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></div>
    </div>
    <div class="table-wrap">
      <table class="data-table compact-table">
        <thead>
          <tr>
            <th>Price Level (YES)</th>
            <th>Contracts Available</th>
            <th>Dollar Liquidity</th>
            <th>Depth</th>
          </tr>
        </thead>
        <tbody>
          ${askRows}
          <tr class="spread-divider"><td colspan="4">Spread: ${orderbook.spread !== null ? `$${orderbook.spread.toFixed(2)}` : '—'} · YES Bids Below / Implied YES Asks Above</td></tr>
          ${bidRows}
        </tbody>
      </table>
    </div>
  `;
}

export function renderAlertItemHtml(alert, isHighRoiFeed = false) {
  const dirIcon = alert.direction === 'UP' ? '▲' : '▼';
  const dirCls = alert.direction === 'UP' ? 'chat-up' : 'chat-down';
  const simTag = alert.simulated ? '<span class="badge badge-sim">Live Demo Tick</span>' : '<span class="badge badge-verified">Verified Observed Swing</span>';
  const roiHtml =
    isHighRoiFeed && alert.roi
      ? `<div class="roi-callout"><strong>High-ROI Model Signal:</strong> ${escapeHtml(alert.roi.reason)}</div>`
      : '';

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
        <span class="swing-pill ${dirCls}">${dirIcon} ${alert.delta >= 0 ? '+' : ''}$${alert.delta.toFixed(2)}</span>
        <strong>${escapeHtml(alert.title)}</strong>
        <span class="mono">($${alert.fromPrice.toFixed(2)} → $${alert.toPrice.toFixed(2)})</span>
      </div>
      ${roiHtml}
      <div class="chat-msg-footer">
        <span class="tiny muted">${escapeHtml(alert.catalystLabel)}</span>
        <div class="chat-actions">
          <a class="source-link tiny" href="${escapeHtml(alert.catalystUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(alert.catalystSource)} ↗</a>
          <button class="btn-xs btn-inspect" data-ticker="${escapeHtml(alert.ticker)}">Chart</button>
        </div>
      </div>
    </div>
  `;
}
