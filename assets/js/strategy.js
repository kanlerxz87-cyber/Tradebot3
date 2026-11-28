/**
 * Tradebot3 — strategy definitions and candle backtester.
 *
 * The backtester runs only on official Kalshi candle data included in the
 * snapshot (1-minute bars, ~6 hours published per market) and is explicit that
 * the sample is short. It reports counts, P&L, hit rate and drawdown; it does
 * not claim a predictive edge.
 */

import { SITE, scoreMarket, isNum, candleMark } from './core.js';

export const STRATEGIES = [
  {
    id: 'fade',
    name: 'Swing fade (mean reversion)',
    category: 'Swing Mean-Reversion',
    rule: 'fade',
    minSwing: 0.10,
    holdBars: 5,
    stake: 100,
    enabled: true,
    description: 'After a ≥ $0.10 move, take the opposite side for 5 one-minute bars, betting on a partial retrace.',
  },
  {
    id: 'follow',
    name: 'Catalyst momentum',
    category: 'Momentum Breakout',
    rule: 'follow',
    minSwing: 0.10,
    holdBars: 5,
    stake: 100,
    enabled: true,
    description: 'After a ≥ $0.10 move, take the same side for 5 one-minute bars, betting the move continues.',
  },
  {
    id: 'model',
    name: 'High-ROI model filter',
    category: 'High-ROI Model',
    rule: 'model',
    minSwing: 0.10,
    minScore: SITE.modelThreshold,
    holdBars: 10,
    stake: 100,
    enabled: true,
    description: 'Same entry as momentum, but only when the market also scores 60+ on the liquidity/spread/band/runway model.',
  },
  {
    id: 'resolve',
    name: 'Longshot value scan',
    category: 'Longshot Value',
    rule: 'longshot',
    maxPrice: 0.15,
    holdBars: 30,
    stake: 50,
    enabled: false,
    description: 'Buys YES contracts priced at or below 15¢ and holds 30 bars. Small stake because most longshots expire worthless.',
  },
];

/**
 * @returns {{trades: Array, stats: object}}
 */
export function backtest(data, strategy, { markets = null } = {}) {
  const universe = (markets || data.markets).filter((m) => m.candles?.m1?.length > 2);
  const trades = [];

  for (const market of universe) {
    const bars = market.candles.m1;
    const marks = bars.map((bar) => candleMark(bar).mark);
    if (strategy.rule === 'longshot') {
      for (let i = 0; i < marks.length - 1; i += 1) {
        const entry = marks[i];
        if (!isNum(entry) || entry > strategy.maxPrice || entry <= 0) continue;
        const exitIdx = Math.min(i + strategy.holdBars, marks.length - 1);
        const exit = marks[exitIdx];
        if (!isNum(exit)) continue;
        trades.push(makeTrade({ market, side: 'YES', entry, exit, at: bars[i][0], strategy, kind: 'longshot entry' }));
      }
      continue;
    }

    for (let i = 1; i < marks.length - 1; i += 1) {
      const prev = marks[i - 1];
      const cur = marks[i];
      if (!isNum(prev) || !isNum(cur)) continue;
      const delta = cur - prev;
      if (Math.abs(delta) + 1e-9 < strategy.minSwing) continue;

      let side;
      if (strategy.rule === 'fade') side = delta > 0 ? 'NO' : 'YES';
      else side = delta > 0 ? 'YES' : 'NO';

      if (strategy.rule === 'model') {
        const swing = { delta, ts: bars[i][0] * 1000 };
        if (!scoreMarket(market, { recentSwing: swing }).qualifies) continue;
      }

      const exitIdx = Math.min(i + strategy.holdBars, marks.length - 1);
      const exitMark = marks[exitIdx];
      if (!isNum(exitMark)) continue;

      // Convert to a YES-equivalent entry so P&L maths stays in one frame.
      const entryYes = side === 'YES' ? cur : 1 - cur;
      const exitYes = side === 'YES' ? exitMark : 1 - exitMark;
      const pnl = (exitYes - entryYes) * Math.max(1, Math.floor(strategy.stake / entryYes));
      trades.push({
        ...makeTrade({ market, side, entry: entryYes, exit: exitYes, at: bars[i][0], strategy, kind: `swing ${delta > 0 ? 'up' : 'down'}` }),
        yes_entry_price: round4(entryYes),
        yes_exit_price: round4(exitYes),
        pnl: round2(pnl),
      });
    }
  }

  return { trades, stats: summarise(trades, strategy) };
}

function makeTrade({ market, side, entry, exit, at, strategy, kind }) {
  const contracts = Math.max(1, Math.floor(strategy.stake / entry));
  const pnl = (exit - entry) * contracts;
  return {
    ticker: market.ticker,
    event_ticker: market.event_ticker,
    topic: market.topic,
    title: market.title,
    side,
    entry: round4(entry),
    exit: round4(exit),
    contracts,
    stake: round2(entry * contracts),
    at: at * 1000,
    strategy: strategy.name,
    category: strategy.category,
    kind,
    pnl: round2(pnl),
    roi: round2((pnl / (entry * contracts)) * 100),
    market_url: market.kalshi_url,
    api_url: market.api_url || `${SITE.apiBase}/markets/${encodeURIComponent(market.ticker)}`,
  };
}

export function summarise(trades, strategy) {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  let peak = 0;
  let cum = 0;
  let maxDd = 0;
  for (const t of trades) {
    cum += t.pnl;
    peak = Math.max(peak, cum);
    maxDd = Math.min(maxDd, cum - peak);
  }
  const byTopic = new Map();
  for (const t of trades) {
    const g = byTopic.get(t.topic) || { topic: t.topic, count: 0, pnl: 0, wins: 0 };
    g.count += 1;
    g.pnl += t.pnl;
    g.wins += t.pnl > 0 ? 1 : 0;
    byTopic.set(t.topic, g);
  }
  return {
    strategy: strategy.name,
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    pnl: round2(pnl),
    avgPnl: trades.length ? round2(pnl / trades.length) : null,
    avgWin: wins.length ? round2(wins.reduce((s, t) => s + t.pnl, 0) / wins.length) : null,
    avgLoss: losses.length ? round2(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : null,
    hitRate: trades.length ? (wins.length / trades.length) * 100 : null,
    avgRoi: trades.length ? trades.reduce((s, t) => s + t.roi, 0) / trades.length : null,
    maxDrawdown: round2(maxDd),
    byTopic: [...byTopic.values()].map((g) => ({ ...g, pnl: round2(g.pnl) })),
    sample_note: 'Backtested on the published 1-minute candle window in this snapshot (~6 hours per market).',
  };
}

function round2(v) { return Math.round(v * 100) / 100; }
function round4(v) { return Math.round(v * 10000) / 10000; }
