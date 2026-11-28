/**
 * Tradebot3 — orderbook / liquidity ladder.
 *
 * Kalshi's REST orderbook returns BIDS ONLY. Implied asks follow from the
 * binary reciprocal: YES ask = $1.00 − best NO bid. Source:
 * https://docs.kalshi.com/getting_started/orderbook_responses
 */

import { el, fmtContracts, fmtUsd, fmtPrice, isNum, esc } from './core.js';

export function renderOrderbook(container, market, { onLevelClick } = {}) {
  container.innerHTML = '';
  if (!market) {
    container.append(el('div', { class: 'table-empty', text: 'Select a market to see its book.' }));
    return;
  }
  const ob = market.orderbook;
  if (!ob) {
    const hasQuote = isNum(market.yes_bid) || isNum(market.yes_ask);
    container.append(
      el('div', { class: 'table-empty' },
        'No 10-level orderbook snapshot in this data refresh for this contract.',
        hasQuote
          ? el('div', { class: 'small', style: 'margin-top:6px' },
            `Top-of-book (GET /markets): bid ${fmtPrice(market.yes_bid)}${isNum(market.yes_bid_size) ? ` (${fmtContracts(market.yes_bid_size)} ct)` : ''} · ask ${fmtPrice(market.yes_ask)}${isNum(market.yes_ask_size) ? ` (${fmtContracts(market.yes_ask_size)} ct)` : ''}`,
          )
          : null,
        market.api_url
          ? el('div', { class: 'tiny', style: 'margin-top:6px' },
            el('a', { href: market.api_url, target: '_blank', rel: 'noopener noreferrer', text: 'Inspect official GET /markets record ↗' }),
          )
          : null,
      ),
    );
    return;
  }

  const yesBids = (ob.yes_bids || []).slice();
  const noBids = (ob.no_bids || []).slice();
  const asks = noBids
    .map(([p, c]) => ({ price: Math.round((1 - p) * 10000) / 10000, contracts: c }))
    .sort((a, b) => a.price - b.price); // ascending: best (lowest) ask first
  const bids = yesBids
    .map(([p, c]) => ({ price: p, contracts: c }))
    .sort((a, b) => b.price - a.price); // descending: best bid first

  const topAsks = asks.slice(0, 6).reverse(); // display worst→best like a DOM
  const topBids = bids.slice(0, 6);
  const maxContracts = Math.max(1, ...topAsks.map((l) => l.contracts), ...topBids.map((l) => l.contracts));

  const head = el('div', { class: 'ob-head' },
    el('span', { text: 'Price (YES)' }),
    el('span', { text: 'Contracts' }),
    el('span', { text: '$ value' }),
  );
  const ladder = el('div', { class: 'ob-ladder' });

  const row = (level, kind) => {
    const node = el('div', { class: `ob-row ${kind}`, role: 'button', tabindex: '0' });
    const bar = el('div', { class: 'bar' });
    bar.style.width = `${Math.max(3, (level.contracts / maxContracts) * 100)}%`;
    node.append(
      bar,
      el('span', { class: 'p', text: fmtPrice(level.price) }),
      el('span', { class: 'q', text: fmtContracts(level.contracts) }),
      el('span', { class: 'q', text: fmtUsd(level.price * level.contracts) }),
    );
    if (onLevelClick) {
      const handler = () => onLevelClick(level, kind);
      node.addEventListener('click', handler);
      node.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') handler(); });
    }
    return node;
  };

  topAsks.forEach((level) => ladder.append(row(level, 'ask')));
  ladder.append(el('div', { class: 'ob-mid' },
    el('span', {}, el('strong', { text: fmtPrice(ob.best_yes_bid) }), ' bid'),
    el('span', {}, 'ask ', el('strong', { text: fmtPrice(ob.best_yes_ask) })),
    el('span', {}, 'spread ', el('strong', { text: isNum(ob.spread) ? `${(ob.spread * 100).toFixed(1)}¢` : '—' })),
  ));
  topBids.forEach((level) => ladder.append(row(level, 'bid')));

  const stats = el('div', { class: 'ob-summary' },
    stat('YES bid depth', `${fmtContracts(ob.yes_bid_contracts)} ct`),
    stat('NO bid depth', `${fmtContracts(ob.no_bid_contracts)} ct`),
    stat('$ resting (YES)', fmtUsd(ob.yes_bid_usd_at_risk)),
    stat('$ resting (NO)', fmtUsd(ob.no_bid_usd_at_risk)),
  );

  const askSize = market.yes_ask_size;
  const sizeLine = el('div', { class: 'tiny', style: 'margin-top:8px' },
    'Contracts offered at best YES ask: ',
    el('strong', { text: isNum(askSize) ? `${fmtContracts(askSize)} ct` : 'not published in snapshot' }),
    ' · ',
    el('a', { href: ob.source_url || market.api_url, target: '_blank', rel: 'noopener noreferrer', text: 'raw API book' }),
  );

  container.append(
    el('div', { class: 'pill-row', style: 'margin-bottom:8px' },
      el('span', { class: 'tiny', text: `Kalshi stock ticker ${market.ticker}` }),
      el('span', { class: 'tiny', text: '·' }),
      el('span', { class: 'tiny', text: `book fetched ${ob.fetched_at || '—'} UTC` }),
    ),
    head,
    ladder,
    stats,
    sizeLine,
    el('div', { class: 'tiny', style: 'margin-top:8px' },
      'Bids only (Kalshi returns no asks); implied asks use the $1.00 binary reciprocal. ',
      el('a', { href: 'https://docs.kalshi.com/getting_started/orderbook_responses', target: '_blank', rel: 'noopener noreferrer', text: 'Kalshi orderbook docs' }),
    ),
  );
}

function stat(key, value) {
  return el('div', { class: 'ob-stat' },
    el('div', { class: 'k', text: key }),
    el('div', { class: 'v', text: value }),
  );
}

export function orderbookSummary(market) {
  const ob = market?.orderbook;
  if (!ob) return { text: 'no book', cls: 'badge-neutral' };
  const spread = ob.spread;
  if (!isNum(spread)) return { text: 'one-sided book', cls: 'badge-warn' };
  const cls = spread <= 0.02 ? 'badge-up' : spread <= 0.06 ? 'badge-info' : 'badge-warn';
  return { text: `${(spread * 100).toFixed(1)}¢ spread`, cls };
}

export function renderLiquidityHint(market) {
  const ob = market?.orderbook;
  if (!ob) return el('span', { class: 'tiny', text: 'liquidity: no snapshot' });
  const contracts = (ob.yes_bid_contracts || 0) + (ob.no_bid_contracts || 0);
  return el('span', {
    class: 'tiny',
    html: `book depth ${esc(fmtContracts(contracts))} ct · ${esc(fmtUsd((ob.yes_bid_usd_at_risk || 0) + (ob.no_bid_usd_at_risk || 0)))} resting`,
  });
}
