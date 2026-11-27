/**
 * Tradebot3 — paper trading account.
 *
 * Simulated money only. Fills use the *real* Kalshi orderbook prices captured in
 * the snapshot (or the live poll when available); no price is invented. If a
 * market has no book, the fill falls back to the last trade price and the trade
 * is flagged with `price_source: 'last trade (no book)'`.
 */

import { isNum, loadJson, saveJson } from './core.js';

const KEY = 'tradebot3.paper.v2';
export const STARTING_CASH = 10000;

export class PaperAccount {
  constructor(data) {
    this.data = data;
    this.state = loadJson(KEY, null) || this._fresh();
  }

  _fresh() {
    return {
      cash: STARTING_CASH,
      positions: [], // open
      trades: [],    // closed
      history: [],   // equity points
      created_at: Date.now(),
      fee_model: 'excluded',
    };
  }

  reset() {
    this.state = this._fresh();
    this.save();
  }

  save() {
    saveJson(KEY, this.state);
  }

  get cash() { return this.state.cash; }
  get openPositions() { return this.state.positions; }
  get closedTrades() { return this.state.trades; }

  /**
   * Quote for an action: buying lifts the ask, selling hits the bid.
   * Using the bid for marks/exits keeps P&L honest about the spread.
   */
  priceFor(ticker, side, action = 'buy') {
    const market = this.data.byTicker.get(ticker);
    if (!market) return null;
    const ob = market.orderbook;
    const buying = action === 'buy';
    if (side === 'YES') {
      if (buying && isNum(ob?.best_yes_ask)) return { price: ob.best_yes_ask, source: 'orderbook ask' };
      if (!buying && isNum(ob?.best_yes_bid)) return { price: ob.best_yes_bid, source: 'orderbook bid' };
      if (isNum(ob?.best_yes_ask)) return { price: ob.best_yes_ask, source: 'orderbook ask' };
      if (isNum(ob?.best_yes_bid)) return { price: ob.best_yes_bid, source: 'orderbook bid' };
      if (isNum(market.last_price)) return { price: market.last_price, source: 'last trade (no book)' };
      return null;
    }
    if (buying && isNum(ob?.best_no_ask)) return { price: ob.best_no_ask, source: 'orderbook ask' };
    if (!buying && isNum(ob?.best_no_bid)) return { price: ob.best_no_bid, source: 'orderbook bid' };
    if (isNum(ob?.best_no_ask)) return { price: ob.best_no_ask, source: 'orderbook ask' };
    if (isNum(ob?.best_no_bid)) return { price: ob.best_no_bid, source: 'orderbook bid' };
    if (isNum(market.last_price)) return { price: 1 - market.last_price, source: 'implied from last trade' };
    return null;
  }

  buy({ ticker, side, qty, strategy = 'Manual', note = '' }) {
    const market = this.data.byTicker.get(ticker);
    if (!market) throw new Error('Unknown market');
    if (market.status !== 'active') throw new Error('Market is not open');
    const q = Math.floor(Number(qty));
    if (!q || q < 1) throw new Error('Enter at least 1 contract');
    const quote = this.priceFor(ticker, side, 'buy');
    if (!quote || !isNum(quote.price)) throw new Error('No usable price for this market');
    const cost = quote.price * q;
    if (cost > this.state.cash) throw new Error(`Insufficient paper cash (need $${cost.toFixed(2)})`);

    this.state.cash = round2(this.state.cash - cost);
    this.state.positions.push({
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ticker,
      event_ticker: market.event_ticker,
      topic: market.topic,
      title: market.title,
      event_title: market.event_title || this.data.eventByTicker.get(market.event_ticker)?.title || '',
      side,
      qty: q,
      entry: quote.price,
      entry_source: quote.source,
      opened_at: Date.now(),
      strategy,
      note,
      market_url: market.kalshi_url,
    });
    this.save();
    this.recordEquity();
    return this.state.positions[this.state.positions.length - 1];
  }

  close(positionId, { price = null, reason = 'manual' } = {}) {
    const idx = this.state.positions.findIndex((p) => p.id === positionId);
    if (idx < 0) throw new Error('Position not found');
    const pos = this.state.positions[idx];
    const quote = price !== null ? { price, source: 'manual' } : this.priceFor(pos.ticker, pos.side, 'sell');
    if (!quote || !isNum(quote.price)) throw new Error('No usable exit price');
    const proceeds = quote.price * pos.qty;
    const pnl = (quote.price - pos.entry) * pos.qty;
    this.state.cash = round2(this.state.cash + proceeds);
    this.state.positions.splice(idx, 1);
    this.state.trades.unshift({
      ...pos,
      exit: quote.price,
      exit_source: quote.source,
      closed_at: Date.now(),
      pnl: round2(pnl),
      roi_pct: pos.entry > 0 ? round2((pnl / (pos.entry * pos.qty)) * 100) : 0,
      close_reason: reason,
      category: pos.strategy || 'Manual',
    });
    this.save();
    this.recordEquity();
    return this.state.trades[0];
  }

  /** Settle open positions whose market has officially resolved. */
  settleResolved() {
    const settled = [];
    for (const pos of [...this.state.positions]) {
      const found = this.data.resultFor ? this.data.resultFor(pos.ticker) : null;
      const result = found?.result || this.data.byTicker.get(pos.ticker)?.result;
      if (!result) continue;
      const win = String(result).toLowerCase() === pos.side.toLowerCase();
      const payout = win ? 1 : 0;
      const pnl = (payout - pos.entry) * pos.qty;
      this.state.cash = round2(this.state.cash + payout * pos.qty);
      const idx = this.state.positions.findIndex((p) => p.id === pos.id);
      if (idx >= 0) this.state.positions.splice(idx, 1);
      this.state.trades.unshift({
        ...pos,
        exit: payout,
        exit_source: 'official settlement',
        closed_at: Date.now(),
        pnl: round2(pnl),
        roi_pct: pos.entry > 0 ? round2((pnl / (pos.entry * pos.qty)) * 100) : 0,
        close_reason: `resolved ${String(result).toUpperCase()}`,
        settlement_source: found?.source || 'market record',
        category: pos.strategy || 'Manual',
      });
      settled.push(pos.ticker);
    }
    if (settled.length) {
      this.save();
      this.recordEquity();
    }
    return settled;
  }

  markPosition(pos) {
    const market = this.data.byTicker.get(pos.ticker);
    const quote = this.priceFor(pos.ticker, pos.side, 'sell');
    const mark = quote?.price;
    const value = isNum(mark) ? mark * pos.qty : pos.entry * pos.qty;
    const pnl = isNum(mark) ? (mark - pos.entry) * pos.qty : 0;
    return {
      ...pos,
      mark,
      mark_source: quote?.source || '—',
      value,
      pnl,
      roi_pct: pos.entry > 0 ? (pnl / (pos.entry * pos.qty)) * 100 : 0,
      status: market?.status || (this.data.resultFor?.(pos.ticker) ? 'finalized' : 'unknown'),
      result: market?.result || this.data.resultFor?.(pos.ticker)?.result || null,
    };
  }

  marked() {
    return this.state.positions.map((p) => this.markPosition(p));
  }

  equity() {
    const openValue = this.marked().reduce((s, p) => s + p.value, 0);
    return round2(this.state.cash + openValue);
  }

  recordEquity() {
    const point = { t: Date.now(), equity: this.equity(), cash: this.state.cash };
    const hist = this.state.history;
    if (!hist.length || Date.now() - hist[hist.length - 1].t > 5000) hist.push(point);
    if (hist.length > 800) hist.splice(0, hist.length - 800);
    this.save();
  }

  analytics() {
    const trades = this.state.trades;
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl <= 0);
    const totalPnl = round2(trades.reduce((s, t) => s + t.pnl, 0));
    const winRate = trades.length ? (wins.length / trades.length) * 100 : null;
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : null;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : null;
    const expectancy = trades.length ? totalPnl / trades.length : null;

    const group = (keyFn) => {
      const map = new Map();
      for (const t of trades) {
        const key = keyFn(t) || 'Unlabelled';
        const g = map.get(key) || { key, count: 0, pnl: 0, wins: 0, contracts: 0, roiSum: 0 };
        g.count += 1;
        g.pnl += t.pnl;
        g.wins += t.pnl > 0 ? 1 : 0;
        g.contracts += t.qty;
        g.roiSum += t.roi_pct || 0;
        map.set(key, g);
      }
      return [...map.values()]
        .map((g) => ({ ...g, pnl: round2(g.pnl), win_rate: (g.wins / g.count) * 100, avg_roi: g.roiSum / g.count }))
        .sort((a, b) => b.pnl - a.pnl);
    };

    return {
      count: trades.length,
      totalPnl,
      winRate,
      avgWin,
      avgLoss,
      expectancy,
      byStrategy: group((t) => t.category || t.strategy),
      byTopic: group((t) => t.topic),
      bySide: group((t) => t.side),
      byExit: group((t) => t.close_reason),
    };
  }

  export() {
    return JSON.stringify({ exported_at: new Date().toISOString(), ...this.state }, null, 2);
  }
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

export function equitySeries(account) {
  const hist = account.state.history.slice();
  const now = { t: Date.now(), equity: account.equity() };
  if (!hist.length) return [now];
  hist.push(now);
  return hist.map((p) => ({ t: p.t, equity: p.equity }));
}
