/**
 * Tradebot3 — shared core helpers.
 * Pure browser ES module, no bundler, no external dependencies.
 */

export const SITE = {
  name: 'Tradebot3',
  tagline: 'Kalshi live-event dashboard & paper trading lab',
  repo: 'https://github.com/kanlerxz87-cyber/Tradebot3',
  pages: 'https://kanlerxz87-cyber.github.io/Tradebot3/',
  dataFile: 'assets/data/snapshot.json',
  legacyAuditFile: 'assets/data/legacy-audit.json',
  // Official Kalshi public production API (recommended host, per docs.kalshi.com)
  apiBase: 'https://external-api.kalshi.com/trade-api/v2',
  demoApiBase: 'https://external-api.demo.kalshi.co/trade-api/v2',
  swingThreshold: 0.10,
  modelThreshold: 60,
};

export const TOPICS = {
  'gas-prices': {
    name: 'Gas Prices',
    short: 'Gas',
    color: '#b45309',
    page: 'categories/gas-prices.html',
    kalshiCategory: 'https://kalshi.com/category/economics',
    blurb: 'AAA national and state regular-gasoline threshold contracts.',
  },
  elections: {
    name: 'Elections',
    short: 'Elections',
    color: '#1d4ed8',
    page: 'categories/elections.html',
    kalshiCategory: 'https://kalshi.com/category/elections',
    blurb: 'Presidential, Senate, House, gubernatorial and mayoral election contracts.',
  },
  culture: {
    name: 'Culture',
    short: 'Culture',
    color: '#7e22ce',
    page: 'categories/culture.html',
    kalshiCategory: 'https://kalshi.com/category/culture',
    blurb: 'Awards shows, box office, streaming and entertainment contracts.',
  },
  crypto: {
    name: 'Crypto',
    short: 'Crypto',
    color: '#0e7490',
    page: 'categories/crypto.html',
    kalshiCategory: 'https://kalshi.com/category/crypto',
    blurb: 'Bitcoin, Ethereum, Solana and other crypto price contracts.',
  },
  golf: {
    name: 'Golf',
    short: 'Golf',
    color: '#15803d',
    page: 'categories/golf.html',
    kalshiCategory: 'https://kalshi.com/category/sports/golf',
    blurb: 'PGA TOUR, LPGA and major-championship winner / placement contracts.',
  },
};

export const TOPIC_ORDER = ['gas-prices', 'elections', 'culture', 'crypto', 'golf'];

/* ------------------------------------------------------------ formatting */

export function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function fmtUsd(v, digits = 2) {
  if (!isNum(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e4) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function fmtNum(v, digits = 0) {
  if (!isNum(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtContracts(v) {
  if (!isNum(v)) return '—';
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e4) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function fmtPrice(v) {
  if (!isNum(v)) return '—';
  return `${(v * 100).toFixed(v < 0.1 ? 2 : 1)}¢`;
}

export function fmtDelta(v) {
  if (!isNum(v)) return '—';
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

export function fmtPct(v, digits = 1) {
  if (!isNum(v)) return '—';
  return `${v.toFixed(digits)}%`;
}

export function parseTs(value) {
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value;
  if (!value) return NaN;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : NaN;
}

export function fmtDateTime(value) {
  const t = parseTs(value);
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleString('en-US', {
    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function fmtClock(value) {
  const t = parseTs(value);
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function fmtDate(value) {
  const t = parseTs(value);
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function timeAgo(value) {
  const t = parseTs(value);
  if (!Number.isFinite(t)) return '—';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return `${Math.max(s, 0)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ------------------------------------------------------------------- DOM */

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function toast(message, kind = '') {
  let host = qs('.toast-host');
  if (!host) {
    host = el('div', { class: 'toast-host' });
    document.body.append(host);
  }
  const node = el('div', { class: `toast ${kind}`.trim(), text: message });
  host.append(node);
  setTimeout(() => node.remove(), 4200);
}

/* --------------------------------------------------------------- storage */

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be disabled in private mode — paper state simply won't persist */
  }
}

/* ------------------------------------------------------------------ chips */

export function topicBadge(topicId) {
  const t = TOPICS[topicId];
  if (!t) return el('span', { class: 'badge badge-neutral', text: topicId || 'unknown' });
  return el('span', {
    class: 'badge badge-neutral',
    html: `<span class="dot" style="background:${t.color}"></span>${esc(t.name)}`,
  });
}

export function sourceLink(url, label = 'source') {
  if (!url) return el('span', { class: 'tiny', text: 'unverified' });
  return el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', class: 'src', text: label });
}

/* -------------------------------------------------------------- chrome */

const NAV = [
  { href: 'index.html', label: 'Dashboard', match: ['index.html', ''] },
  { href: 'categories/gas-prices.html', label: 'Gas Prices', topic: 'gas-prices' },
  { href: 'categories/elections.html', label: 'Elections', topic: 'elections' },
  { href: 'categories/culture.html', label: 'Culture', topic: 'culture' },
  { href: 'categories/crypto.html', label: 'Crypto', topic: 'crypto' },
  { href: 'categories/golf.html', label: 'Golf', topic: 'golf' },
  { href: 'portfolio.html', label: 'Portfolio & Strategy Lab' },
  { href: 'verification.html', label: 'API Verification' },
  { href: 'flagged-for-review.html', label: 'Flagged for Review' },
  { href: 'executive-summary.html', label: 'Executive Summary' },
];

export function initChrome({ active = '', base = '' } = {}) {
  const header = qs('#site-header');
  if (header) {
    const nav = el('nav', { class: 'site-nav', 'aria-label': 'Main navigation' });
    for (const item of NAV) {
      const isActive = active === item.href || (item.topic && active === item.topic);
      nav.append(el('a', {
        href: `${base}${item.href}`,
        class: isActive ? 'active' : '',
        'aria-current': isActive ? 'page' : null,
        text: item.label,
      }));
    }
    header.className = 'site-header';
    header.innerHTML = '';
    const inner = el('div', { class: 'header-inner' });
    inner.append(
      el('a', { class: 'brand', href: `${base}index.html` },
        el('span', { class: 'brand-mark', text: 'TB3' }),
        el('span', { class: 'brand-text' },
          el('span', { text: 'Tradebot3' }),
          el('small', { text: 'Kalshi live events · paper trading' }),
        ),
      ),
      nav,
    );
    header.append(inner);
  }

  const footer = qs('#site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = '';
    const inner = el('div', { class: 'footer-inner' });
    inner.append(
      el('div', {},
        el('div', {}, el('strong', { text: 'Tradebot3' }), ' — independent research dashboard for Kalshi markets.'),
        el('div', { class: 'tiny', style: 'margin-top:4px' },
          'Market data: official Kalshi Trade API v2 (public, unauthenticated). Not affiliated with Kalshi. ',
          el('a', { href: 'verification.html', text: 'Sources & verification' }),
          ' · ',
          el('a', { href: 'flagged-for-review.html', text: 'Flagged for review' }),
        ),
      ),
      el('div', { class: 'tiny' },
        'Paper trading only — no real money is at risk. ',
        el('br'),
        el('a', { href: SITE.repo, target: '_blank', rel: 'noopener noreferrer', text: 'GitHub repository' }),
      ),
    );
    footer.append(inner);
  }
}

/* ------------------------------------------------------------ ROI model */

/**
 * Transparent, deterministic scoring heuristic used by the "High-ROI model"
 * feed. It is NOT a probability forecast and does not invent a fair value:
 * every input is an official Kalshi field or a candle-derived statistic.
 *
 * Components (max 100):
 *   liquidity  0–40  recent contract volume (volume_24h) + open interest
 *   spread     0–20  tighter quoted spread scores higher
 *   price band 0–15  avoids near-resolved contracts (<8¢ or >85¢)
 *   catalyst   0–15  a >= $0.10 candle move within the last hour
 *   runway     0–10  time remaining before the close time
 */
export function scoreMarket(market, { recentSwing = null } = {}) {
  const parts = [];
  const v24 = isNum(market.volume_24h) ? market.volume_24h : 0;
  const oi = isNum(market.open_interest) ? market.open_interest : 0;
  const liq = Math.min(v24 / 4000, 1) * 25 + Math.min(oi / 25000, 1) * 15;
  parts.push({ key: 'liquidity', label: 'Liquidity', value: Math.round(liq), max: 40, detail: `${fmtContracts(v24)} contracts 24h · ${fmtContracts(oi)} open interest` });

  const spread = market.orderbook?.spread;
  let spreadScore = 0;
  if (isNum(spread)) {
    spreadScore = spread <= 0.02 ? 20 : spread <= 0.05 ? 13 : spread <= 0.10 ? 7 : 2;
  }
  parts.push({ key: 'spread', label: 'Spread efficiency', value: spreadScore, max: 20, detail: isNum(spread) ? `${(spread * 100).toFixed(1)}¢ spread` : 'no orderbook snapshot' });

  const price = market.last_price ?? market.orderbook?.best_yes_bid;
  let band = 0;
  if (isNum(price)) band = price >= 0.08 && price <= 0.85 ? 15 : price >= 0.04 && price < 0.08 ? 8 : 3;
  parts.push({ key: 'band', label: 'Price band', value: band, max: 15, detail: isNum(price) ? `${fmtPrice(price)} YES` : 'no price' });

  let catalyst = 0;
  if (recentSwing) catalyst = Math.min(Math.abs(recentSwing.delta) / 0.10, 2) * 7.5;
  catalyst = Math.round(catalyst);
  parts.push({ key: 'catalyst', label: 'Catalyst', value: catalyst, max: 15, detail: recentSwing ? `${fmtDelta(recentSwing.delta)} move at ${fmtClock(recentSwing.ts)}` : 'no ≥$0.10 move in window' });

  let runway = 0;
  const close = parseTs(market.close_time);
  if (Number.isFinite(close)) {
    const days = (close - Date.now()) / 86400000;
    runway = days > 0 && days <= 30 ? 10 : days > 30 && days <= 120 ? 7 : days > 120 ? 4 : 0;
  }
  parts.push({ key: 'runway', label: 'Time runway', value: runway, max: 10, detail: market.close_time ? `closes ${fmtDateTime(market.close_time)}` : 'no close time' });

  const total = parts.reduce((sum, p) => sum + p.value, 0);
  return { total, parts, qualifies: total >= SITE.modelThreshold };
}

export function modelBadge(score) {
  const cls = score >= 75 ? 'badge-up' : score >= SITE.modelThreshold ? 'badge-info' : 'badge-neutral';
  return `<span class="badge ${cls}" title="Transparent liquidity/spread/price-band/catalyst/runway score">model ${score}</span>`;
}
