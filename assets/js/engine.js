/**
 * Tradebot3 Live Alerting, Orderbook, Portfolio & Automated Strategy Engine
 * - Enforces >= $0.10 swing alerts in either direction into TWO scrolling chats:
 *   1) All Events Feed
 *   2) High-ROI Model Selective Feed
 * - Generates Seconds / Minutes / Hours chart histories + pinned >= $0.10 catalyst markers
 * - Tracks Demo Portfolio positions, realized/unrealized P&L, trade categorization,
 *   automated simulated strategies, and custom category-based strategies.
 */

import { VERIFIED_MARKETS, TOPICS, ALLOWED_TOPICS } from './data.js';
import { KalshiDemoClient } from './kalshi-client.js';

// v2 intentionally discards the prior demo's pre-populated example trades so performance starts clean.
const STORAGE_KEY = 'tradebot3_demo_state_v2';
export const SWING_ALERT_THRESHOLD = 0.10; // >= $0.10 in either direction

export const TRADE_CATEGORIES = [
  'Swing Mean-Reversion',
  'Momentum Breakout',
  'High-ROI Model',
  'News Catalyst',
  'Spread Capture',
  'Manual'
];

export const DEFAULT_STRATEGIES = [
  {
    id: 'strat-mean-reversion',
    name: 'Swing Mean-Reversion (>= $0.10)',
    category: 'Swing Mean-Reversion',
    topicFilter: 'all',
    enabled: true,
    minSwing: 0.10,
    minExpectedRoi: 8,
    maxContracts: 25,
    rule: 'fade',
    description: 'Automatically fades sudden >= $0.10 price spikes/drops expecting short-term orderbook mean reversion.'
  },
  {
    id: 'strat-momentum',
    name: 'Catalyst Momentum Breakout (>= $0.10)',
    category: 'Momentum Breakout',
    topicFilter: 'all',
    enabled: true,
    minSwing: 0.10,
    minExpectedRoi: 10,
    maxContracts: 20,
    rule: 'follow',
    description: 'Follows sharp >= $0.10 breakouts when accompanied by verified news/data catalysts.'
  },
  {
    id: 'strat-high-roi',
    name: 'High-ROI Model Selective Auto-Trader',
    category: 'High-ROI Model',
    topicFilter: 'all',
    enabled: true,
    minSwing: 0.10,
    minExpectedRoi: 15,
    maxContracts: 35,
    rule: 'model-edge',
    description: 'Executes automatically only on alerts passing the High-ROI Model selective chat filter (edge >= $0.06, Exp ROI >= 15%).'
  },
  {
    id: 'strat-spread-capture',
    name: 'Liquidity Spread Capture',
    category: 'Spread Capture',
    topicFilter: 'elections',
    enabled: false,
    minSwing: 0.05,
    minExpectedRoi: 6,
    maxContracts: 30,
    rule: 'spread',
    description: 'Captures bid-ask spread on high-volume contracts when best bid/ask spread widens >= $0.03.'
  }
];

function clampPrice(p) {
  return Math.max(0.01, Math.min(0.99, +Number(p).toFixed(2)));
}

function seededRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Build deterministic simulated orderbook depth centered on current contract price.
 * Clearly labeled in UI as simulated when live Kalshi Demo REST orderbook is unavailable.
 */
export function buildSimulatedOrderbook(price, volumeUsd, tickerSeed = 1) {
  const p = clampPrice(price);
  const volFactor = volumeUsd ? Math.min(25, Math.max(2, Math.log10(volumeUsd + 10) * 3)) : 4;
  const spread = volumeUsd && volumeUsd > 10000000 ? 0.01 : volumeUsd && volumeUsd > 500000 ? 0.02 : 0.03;
  const bestYesBid = clampPrice(p - spread / 2);
  const bestYesAsk = clampPrice(Math.max(bestYesBid + 0.01, p + spread / 2));
  const bestNoBid = clampPrice(1 - bestYesAsk);

  const yesBids = [];
  const noBids = [];

  for (let i = 0; i < 6; i += 1) {
    const ybPrice = clampPrice(bestYesBid - i * 0.01);
    const ybCount = Math.round((40 + seededRand(tickerSeed + i * 7.1) * 180) * volFactor);
    if (ybPrice > 0.01 && (!yesBids.length || ybPrice < yesBids[yesBids.length - 1].price)) {
      yesBids.push({ price: ybPrice, count: ybCount, dollars: +(ybPrice * ybCount).toFixed(2) });
    }

    const nbPrice = clampPrice(bestNoBid - i * 0.01);
    const nbCount = Math.round((40 + seededRand(tickerSeed + i * 11.3 + 50) * 180) * volFactor);
    if (nbPrice > 0.01 && (!noBids.length || nbPrice < noBids[noBids.length - 1].price)) {
      noBids.push({ price: nbPrice, count: nbCount, dollars: +(nbPrice * nbCount).toFixed(2) });
    }
  }

  const impliedYesAsks = noBids
    .map((lvl) => {
      const askPrice = clampPrice(1 - lvl.price);
      return {
        price: askPrice,
        noBidPrice: lvl.price,
        count: lvl.count,
        dollars: +(askPrice * lvl.count).toFixed(2)
      };
    })
    .sort((a, b) => a.price - b.price);

  const totalYesContracts = yesBids.reduce((s, l) => s + l.count, 0);
  const totalNoContracts = noBids.reduce((s, l) => s + l.count, 0);
  const totalDollarLiquidity = +(
    yesBids.reduce((s, l) => s + l.dollars, 0) +
    impliedYesAsks.reduce((s, l) => s + l.dollars, 0)
  ).toFixed(2);

  return {
    simulated: true,
    yesBids,
    noBids,
    impliedYesAsks,
    bestYesBid: yesBids.length ? yesBids[0].price : p,
    bestYesAsk: impliedYesAsks.length ? impliedYesAsks[0].price : clampPrice(p + 0.02),
    spread: +(
      (impliedYesAsks.length ? impliedYesAsks[0].price : clampPrice(p + 0.02)) -
      (yesBids.length ? yesBids[0].price : p)
    ).toFixed(2),
    totalYesContracts,
    totalNoContracts,
    totalDollarLiquidity
  };
}

/**
 * Evaluate whether an event/swing qualifies for the High-ROI Model Selective Feed.
 */
export function evaluateHighRoi(market, currentPrice, delta = 0, orderbook = null) {
  if (market.status === 'Resolved') {
    return { qualified: false, edge: 0, expectedRoiPct: 0, side: 'NONE', liquidityScore: 0, reason: 'Market settled' };
  }
  const fair = market.modelFairValue ?? currentPrice;
  const rawEdge = +(fair - currentPrice).toFixed(3);
  const side = rawEdge >= 0 ? 'YES' : 'NO';
  const entryCost = side === 'YES' ? currentPrice : +(1 - currentPrice).toFixed(2);
  const absEdge = Math.abs(rawEdge);
  const spread = orderbook && orderbook.spread !== null ? orderbook.spread : 0.02;
  const netEdge = +(absEdge - spread * 0.5).toFixed(3);
  const expectedRoiPct = entryCost > 0.01 ? +((netEdge / entryCost) * 100).toFixed(1) : 0;
  const liquidityScore = orderbook
    ? Math.min(99, Math.round(Math.log10(orderbook.totalDollarLiquidity + 10) * 18))
    : 70;

  const qualified = netEdge >= 0.05 && expectedRoiPct >= 15 && liquidityScore >= 55;
  const swingNote = Math.abs(delta) >= SWING_ALERT_THRESHOLD ? `Post-swing ${delta > 0 ? '+' : ''}$${delta.toFixed(2)}` : 'Live valuation';

  return {
    qualified,
    side,
    entryCost,
    fairValue: fair,
    edge: +netEdge.toFixed(2),
    expectedRoiPct,
    liquidityScore,
    reason: `${swingNote} · Model Fair $${fair.toFixed(2)} vs $${currentPrice.toFixed(2)} -> Buy ${side} (Net Edge $${netEdge.toFixed(2)}, Exp ROI +${expectedRoiPct}%, Liq ${liquidityScore}/100)`
  };
}

function generateInitialSeries(market, nowMs) {
  const seed = market.ticker.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const basePrice = market.observedPrice;
  const isResolved = market.status === 'Resolved';

  const makePoints = (count, stepMs) => {
    const pts = [];
    let p = isResolved ? (market.resolution === 'YES' ? 0.68 : 0.32) : clampPrice(basePrice - (market.observedSwing || 0));
    for (let i = count - 1; i >= 0; i -= 1) {
      const ts = nowMs - i * stepMs;
      const progress = 1 - i / Math.max(1, count - 1);
      if (i === 0) {
        p = basePrice;
      } else {
        const noise = (seededRand(seed + i * 13.7 + stepMs) - 0.5) * (isResolved ? 0.05 : 0.035);
        const target = isResolved
          ? market.resolution === 'YES'
            ? 0.65 + progress * 0.35
            : 0.35 - progress * 0.35
          : basePrice - (market.observedSwing || 0) * (1 - progress);
        p = isResolved && progress > 0.85 ? basePrice : clampPrice(p * 0.55 + target * 0.45 + noise);
      }
      pts.push({ ts, price: +p.toFixed(2) });
    }
    return pts;
  };

  const hours = makePoints(36, 3600 * 1000);
  const minutes = makePoints(45, 60 * 1000);
  const seconds = makePoints(50, 1000);

  // No historic jump markers are synthesized: the static reference sources do not prove a causal timestamped move.
  const jumpMarkers = [];
  return { seconds, minutes, hours, jumpMarkers };
}

export class TradebotEngine {
  constructor() {
    this.client = new KalshiDemoClient();
    this.listeners = new Set();
    this.running = true;
    this.soundEnabled = false;
    this.tickTimer = null;
    this.tickCount = 0;
    this.markets = [];
    this.allAlerts = [];
    this.highRoiAlerts = [];
    this.portfolio = this.loadState();
    this.initMarkets();
  }

  playAlertPing() {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
    } catch (_) {
      // Ignore audio autoplay blocks
    }
  }

  loadState() {
    const fallback = {
      cashBalance: 10000.0,
      startingBalance: 10000.0,
      positions: {},
      trades: [],
      strategies: JSON.parse(JSON.stringify(DEFAULT_STRATEGIES)),
      // A single flat starting point is a baseline, not simulated performance history.
      equityCurve: [{ ts: Date.now(), equity: 10000.0 }]
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.cashBalance === 'number' && Array.isArray(parsed.trades)) {
        if (!Array.isArray(parsed.strategies) || !parsed.strategies.length) {
          parsed.strategies = JSON.parse(JSON.stringify(DEFAULT_STRATEGIES));
        }
        return parsed;
      }
    } catch (_) {
      // Ignore unavailable or malformed browser storage and start from the clean paper baseline.
    }
    return fallback;
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.portfolio));
    } catch (_) {
      // Ignore storage errors
    }
  }

  resetPortfolio() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Ignore
    }
    this.portfolio = this.loadState();
    this.notify('portfolio');
  }

  initMarkets() {
    const now = Date.now();
    this.markets = VERIFIED_MARKETS.filter((m) => ALLOWED_TOPICS.includes(m.topic)).map((m, idx) => {
      const series = generateInitialSeries(m, now);
      const orderbook = buildSimulatedOrderbook(m.observedPrice, m.volumeUsd, idx + 11);
      const currentPrice = m.observedPrice;
      const roi = evaluateHighRoi(m, currentPrice, 0, orderbook);
      return {
        ...m,
        currentPrice,
        prevPrice: currentPrice,
        lastDelta: 0,
        orderbook,
        series,
        roi,
        lastUpdated: now
      };
    });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(eventType = 'tick', payload = null) {
    this.listeners.forEach((fn) => {
      try {
        fn(eventType, payload);
      } catch (err) {
        console.error('TradebotEngine listener error:', err);
      }
    });
  }

  getMarket(ticker) {
    return (
      this.markets.find(
        (m) => m.ticker === ticker || m.marketTicker === ticker || m.eventTicker === ticker
      ) || this.markets[0]
    );
  }

  getMarketsByTopic(topic) {
    return this.markets
      .filter((m) => topic === 'all' || m.topic === topic)
      .sort((a, b) => (b.volumeUsd || 0) - (a.volumeUsd || 0));
  }

  start() {
    if (this.tickTimer) return;
    this.running = true;
    this.tickTimer = setInterval(() => this.runTick(), 2200);
    this.notify('status');
  }

  stop() {
    this.running = false;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.notify('status');
  }

  toggleLive() {
    if (this.running) this.stop();
    else this.start();
    return this.running;
  }

  /**
   * Simulate a real-time tick across open markets; periodically produces a >= $0.10 swing alert.
   */
  runTick(forceSwingTicker = null) {
    this.tickCount += 1;
    const now = Date.now();
    const openMarkets = this.markets.filter((m) => m.status === 'Open');
    if (!openMarkets.length) return;

    const triggerBigSwing = Boolean(forceSwingTicker) || this.tickCount % 4 === 0;
    const targetMarket = forceSwingTicker
      ? this.getMarket(forceSwingTicker)
      : openMarkets[Math.floor(Math.random() * openMarkets.length)];

    openMarkets.forEach((m, idx) => {
      let delta = (Math.random() - 0.5) * 0.02;
      let isBigSwing = false;

      if (triggerBigSwing && m.ticker === targetMarket.ticker) {
        const dir = Math.random() > 0.45 ? 1 : -1;
        const mag = +(0.10 + Math.random() * 0.07).toFixed(2);
        delta = dir * mag;
        if (m.currentPrice + delta > 0.96 || m.currentPrice + delta < 0.04) {
          delta = -delta;
        }
        isBigSwing = Math.abs(delta) >= SWING_ALERT_THRESHOLD;
      }

      const prev = m.currentPrice;
      const next = clampPrice(prev + delta);
      const actualDelta = +(next - prev).toFixed(2);

      m.prevPrice = prev;
      m.currentPrice = next;
      m.lastDelta = actualDelta;
      m.lastUpdated = now;
      const keepLiveBook =
        m.orderbook &&
        m.orderbook.simulated === false &&
        m.orderbook.fetchedAtMs &&
        now - m.orderbook.fetchedAtMs < 30000;
      if (!keepLiveBook) {
        m.orderbook = buildSimulatedOrderbook(next, m.volumeUsd, idx + this.tickCount);
      }
      m.roi = evaluateHighRoi(m, next, actualDelta, m.orderbook);

      // Append to seconds series
      m.series.seconds.push({ ts: now, price: next });
      if (m.series.seconds.length > 90) m.series.seconds.shift();

      // Update latest minute & hour bar
      const lastMin = m.series.minutes[m.series.minutes.length - 1];
      if (!lastMin || now - lastMin.ts >= 60000) {
        m.series.minutes.push({ ts: now, price: next });
        if (m.series.minutes.length > 90) m.series.minutes.shift();
      } else {
        lastMin.price = next;
      }

      const lastHr = m.series.hours[m.series.hours.length - 1];
      if (!lastHr || now - lastHr.ts >= 3600000) {
        m.series.hours.push({ ts: now, price: next });
        if (m.series.hours.length > 72) m.series.hours.shift();
      } else {
        lastHr.price = next;
      }

      if (isBigSwing && Math.abs(actualDelta) >= SWING_ALERT_THRESHOLD) {
        const cat = (m.catalysts && m.catalysts[0]) || null;
        const alert = {
          id: `ALT-${now}-${idx}`,
          ts: now,
          ticker: m.ticker,
          title: m.title,
          topic: m.topic,
          fromPrice: prev,
          toPrice: next,
          delta: actualDelta,
          direction: actualDelta >= 0 ? 'UP' : 'DOWN',
          catalystLabel: cat
            ? `Simulated Demo Tick (${cat.sourceName} reference): ${cat.label}`
            : `Simulated Demo Tick: Rapid orderbook repricing (${actualDelta >= 0 ? '+' : ''}$${actualDelta.toFixed(2)})`,
          catalystUrl: cat ? cat.url : m.sourceUrl,
          catalystSource: cat ? cat.sourceName : m.sourceLabel,
          verifiedSourceUrl: m.sourceUrl,
          roi: m.roi,
          simulated: true
        };

        // Pin marker onto live chart
        m.series.jumpMarkers.push({
          id: alert.id,
          ticker: m.ticker,
          label: alert.catalystLabel,
          delta: actualDelta,
          url: alert.catalystUrl,
          sourceName: alert.catalystSource,
          timestamps: { seconds: now, minutes: m.series.minutes[m.series.minutes.length - 1].ts, hours: m.series.hours[m.series.hours.length - 1].ts },
          prices: { seconds: next, minutes: next, hours: next }
        });
        if (m.series.jumpMarkers.length > 8) m.series.jumpMarkers.shift();

        this.allAlerts.unshift(alert);
        if (this.allAlerts.length > 60) this.allAlerts.pop();

        if (m.roi.qualified) {
          this.highRoiAlerts.unshift(alert);
          if (this.highRoiAlerts.length > 60) this.highRoiAlerts.pop();
          this.playAlertPing();
        }

        // Trigger automated simulated strategies
        this.runAutomatedStrategiesOnSwing(m, alert);
      }
    });

    this.recordEquitySnapshot(now);
    this.notify('tick', { tickCount: this.tickCount, now });
  }

  runAutomatedStrategiesOnSwing(market, alert) {
    const enabledStrategies = this.portfolio.strategies.filter((s) => s.enabled);
    enabledStrategies.forEach((strat) => {
      if (strat.topicFilter !== 'all' && strat.topicFilter !== market.topic) return;
      if (Math.abs(alert.delta) < (strat.minSwing || SWING_ALERT_THRESHOLD)) return;

      let side = 'YES';
      let shouldTrade = false;

      if (strat.rule === 'fade') {
        side = alert.delta > 0 ? 'NO' : 'YES';
        shouldTrade = true;
      } else if (strat.rule === 'follow') {
        side = alert.delta > 0 ? 'YES' : 'NO';
        shouldTrade = true;
      } else if (strat.rule === 'model-edge') {
        if (alert.roi && alert.roi.qualified && alert.roi.expectedRoiPct >= (strat.minExpectedRoi || 15)) {
          side = alert.roi.side;
          shouldTrade = true;
        }
      } else if (strat.rule === 'spread') {
        if (market.orderbook && market.orderbook.spread >= 0.02) {
          side = alert.roi.side || 'YES';
          shouldTrade = true;
        }
      }

      if (!shouldTrade) return;

      const price = side === 'YES' ? market.currentPrice : clampPrice(1 - market.currentPrice);
      const contracts = Math.min(strat.maxContracts || 15, Math.max(5, Math.floor(25 / Math.max(0.1, price))));
      const cost = contracts * price;
      if (cost > this.portfolio.cashBalance * 0.2) return;

      this.executePaperTrade({
        ticker: market.ticker,
        action: 'BUY',
        side,
        contracts,
        price,
        category: strat.category,
        strategyId: strat.id,
        note: `Auto [${strat.name}] on ${alert.delta >= 0 ? '+' : ''}$${alert.delta.toFixed(2)} swing`
      });
    });
  }

  executePaperTrade({ ticker, action = 'BUY', side = 'YES', contracts, price, category = 'Manual', strategyId = null, note = '' }) {
    const market = this.getMarket(ticker);
    if (!market) throw new Error('Market not found');
    const qty = Math.max(1, Math.round(Number(contracts)));
    const execPrice = clampPrice(price ?? (side === 'YES' ? market.currentPrice : 1 - market.currentPrice));
    const key = `${ticker}:${side}`;
    const now = Date.now();

    if (action === 'BUY') {
      const cost = +(qty * execPrice).toFixed(2);
      if (cost > this.portfolio.cashBalance) {
        throw new Error(`Insufficient demo cash balance ($${this.portfolio.cashBalance.toFixed(2)} available, need $${cost.toFixed(2)}).`);
      }
      this.portfolio.cashBalance = +(this.portfolio.cashBalance - cost).toFixed(2);
      const existing = this.portfolio.positions[key];
      if (existing) {
        const totalQty = existing.contracts + qty;
        const weighted = (existing.contracts * existing.avgPrice + qty * execPrice) / totalQty;
        existing.contracts = totalQty;
        existing.avgPrice = +weighted.toFixed(3);
      } else {
        this.portfolio.positions[key] = {
          ticker,
          topic: market.topic,
          side,
          contracts: qty,
          avgPrice: execPrice,
          category
        };
      }
      const trade = {
        id: `TRD-${now.toString().slice(-5)}`,
        ts: now,
        ticker,
        topic: market.topic,
        action: 'BUY',
        side,
        contracts: qty,
        price: execPrice,
        exitPrice: null,
        status: 'OPEN',
        pnl: 0,
        roiPct: 0,
        category,
        strategyId,
        mode: 'Paper Demo Simulation',
        note: note || `${action} ${qty} ${side} @ $${execPrice.toFixed(2)}`
      };
      this.portfolio.trades.unshift(trade);
      if (this.portfolio.trades.length > 120) this.portfolio.trades.pop();
      this.recordEquitySnapshot(now);
      this.saveState();
      this.notify('portfolio', trade);
      return trade;
    }

    // SELL / CLOSE existing position
    const pos = this.portfolio.positions[key];
    if (!pos || pos.contracts < qty) {
      throw new Error(`No open ${side} position of at least ${qty} contracts on ${ticker}.`);
    }
    const proceeds = +(qty * execPrice).toFixed(2);
    const costBasis = +(qty * pos.avgPrice).toFixed(2);
    const pnl = +(proceeds - costBasis).toFixed(2);
    const roiPct = costBasis > 0 ? +((pnl / costBasis) * 100).toFixed(1) : 0;

    this.portfolio.cashBalance = +(this.portfolio.cashBalance + proceeds).toFixed(2);
    pos.contracts -= qty;
    if (pos.contracts <= 0) delete this.portfolio.positions[key];

    const trade = {
      id: `TRD-${now.toString().slice(-5)}`,
      ts: now,
      ticker,
      topic: market.topic,
      action: 'SELL',
      side,
      contracts: qty,
      price: pos.avgPrice,
      exitPrice: execPrice,
      status: 'CLOSED',
      pnl,
      roiPct,
      category: category || pos.category || 'Manual',
      strategyId,
      mode: 'Paper Demo',
      note: note || `Closed ${qty} ${side} @ $${execPrice.toFixed(2)} (P&L ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`
    };
    this.portfolio.trades.unshift(trade);
    this.recordEquitySnapshot(now);
    this.saveState();
    this.notify('portfolio', trade);
    return trade;
  }

  /**
   * Simulate settling an open market to YES or NO to test lifecycle settlement payouts in Demo Mode.
   */
  simulateResolution(ticker, outcome) {
    const market = this.getMarket(ticker);
    if (!market || market.status === 'Resolved') return null;
    const winSide = outcome === 'YES' ? 'YES' : 'NO';
    market.status = 'Resolved';
    market.resolution = winSide;
    market.currentPrice = winSide === 'YES' ? 1.0 : 0.0;
    market.simulatedResolution = true;

    const settledTrades = [];
    ['YES', 'NO'].forEach((side) => {
      const key = `${ticker}:${side}`;
      const pos = this.portfolio.positions[key];
      if (!pos) return;
      const payoutPrice = side === winSide ? 1.0 : 0.0;
      const proceeds = +(pos.contracts * payoutPrice).toFixed(2);
      const costBasis = +(pos.contracts * pos.avgPrice).toFixed(2);
      const pnl = +(proceeds - costBasis).toFixed(2);
      const roiPct = costBasis > 0 ? +((pnl / costBasis) * 100).toFixed(1) : 0;

      this.portfolio.cashBalance = +(this.portfolio.cashBalance + proceeds).toFixed(2);
      const trade = {
        id: `SET-${Date.now().toString().slice(-5)}`,
        ts: Date.now(),
        ticker,
        topic: market.topic,
        action: 'SETTLE',
        side,
        contracts: pos.contracts,
        price: pos.avgPrice,
        exitPrice: payoutPrice,
        status: `RESOLVED ${winSide}`,
        pnl,
        roiPct,
        category: pos.category || 'Manual',
        strategyId: null,
        mode: 'Paper Demo Settlement',
        note: `Simulated resolution ${winSide}: payout $${payoutPrice.toFixed(2)}/contract`
      };
      this.portfolio.trades.unshift(trade);
      settledTrades.push(trade);
      delete this.portfolio.positions[key];
    });

    this.recordEquitySnapshot(Date.now());
    this.saveState();
    this.notify('resolution', { ticker, outcome: winSide, settledTrades });
    return { ticker, outcome: winSide, settledTrades };
  }

  getPortfolioSummary() {
    let positionsValue = 0;
    let unrealizedPnl = 0;
    const openPositions = Object.values(this.portfolio.positions).map((pos) => {
      const m = this.getMarket(pos.ticker);
      const mark = m ? (pos.side === 'YES' ? m.currentPrice : +(1 - m.currentPrice).toFixed(2)) : pos.avgPrice;
      const marketValue = +(pos.contracts * mark).toFixed(2);
      const costBasis = +(pos.contracts * pos.avgPrice).toFixed(2);
      const pnl = +(marketValue - costBasis).toFixed(2);
      const roiPct = costBasis > 0 ? +((pnl / costBasis) * 100).toFixed(1) : 0;
      positionsValue += marketValue;
      unrealizedPnl += pnl;
      return { ...pos, mark, marketValue, costBasis, pnl, roiPct, marketTitle: m ? m.title : pos.ticker };
    });

    const realizedPnl = +this.portfolio.trades
      .filter((t) => t.status !== 'OPEN')
      .reduce((acc, t) => acc + (t.pnl || 0), 0)
      .toFixed(2);

    const totalEquity = +(this.portfolio.cashBalance + positionsValue).toFixed(2);
    const totalPnl = +(totalEquity - this.portfolio.startingBalance).toFixed(2);
    const totalRoiPct = +((totalPnl / this.portfolio.startingBalance) * 100).toFixed(2);

    return {
      cashBalance: +this.portfolio.cashBalance.toFixed(2),
      positionsValue: +positionsValue.toFixed(2),
      totalEquity,
      realizedPnl,
      unrealizedPnl: +unrealizedPnl.toFixed(2),
      totalPnl,
      totalRoiPct,
      openPositions
    };
  }

  getCategoryAnalytics() {
    const stats = {};
    TRADE_CATEGORIES.forEach((cat) => {
      stats[cat] = { category: cat, totalTrades: 0, closedTrades: 0, wins: 0, pnl: 0, invested: 0 };
    });

    this.portfolio.trades.forEach((t) => {
      const cat = t.category || 'Manual';
      if (!stats[cat]) {
        stats[cat] = { category: cat, totalTrades: 0, closedTrades: 0, wins: 0, pnl: 0, invested: 0 };
      }
      const row = stats[cat];
      row.totalTrades += 1;
      row.invested += t.contracts * t.price;
      if (t.status !== 'OPEN') {
        row.closedTrades += 1;
        row.pnl += t.pnl || 0;
        if ((t.pnl || 0) > 0) row.wins += 1;
      } else {
        const m = this.getMarket(t.ticker);
        if (m) {
          const mark = t.side === 'YES' ? m.currentPrice : +(1 - m.currentPrice).toFixed(2);
          row.pnl += (mark - t.price) * t.contracts;
        }
      }
    });

    return Object.values(stats).map((row) => ({
      ...row,
      pnl: +row.pnl.toFixed(2),
      winRatePct: row.closedTrades > 0 ? +((row.wins / row.closedTrades) * 100).toFixed(1) : null,
      roiPct: row.invested > 0 ? +((row.pnl / row.invested) * 100).toFixed(1) : 0
    }));
  }

  toggleStrategy(strategyId) {
    const s = this.portfolio.strategies.find((x) => x.id === strategyId);
    if (!s) return;
    s.enabled = !s.enabled;
    this.saveState();
    this.notify('strategy', s);
  }

  addCustomStrategy({ name, category, topicFilter, minSwing, minExpectedRoi, maxContracts, rule, description }) {
    const strat = {
      id: `strat-custom-${Date.now()}`,
      name: name.trim(),
      category: category || 'Manual',
      topicFilter: topicFilter || 'all',
      enabled: true,
      minSwing: Math.max(0.05, Number(minSwing) || 0.10),
      minExpectedRoi: Number(minExpectedRoi) || 10,
      maxContracts: Math.max(1, Math.round(Number(maxContracts) || 20)),
      rule: rule || 'model-edge',
      description: description || `Custom automated strategy built from ${category} trade category.`
    };
    this.portfolio.strategies.push(strat);
    this.saveState();
    this.notify('strategy', strat);
    return strat;
  }

  recordEquitySnapshot(ts) {
    const summary = this.getPortfolioSummary();
    this.portfolio.equityCurve.push({ ts, equity: summary.totalEquity });
    if (this.portfolio.equityCurve.length > 80) this.portfolio.equityCurve.shift();
  }

  async fetchLiveOrderbook(ticker) {
    const market = this.getMarket(ticker);
    if (!market) return { ok: false, message: 'Market not found in catalog.' };
    const exactTicker = market.marketTicker || market.ticker;
    try {
      const ob = await this.client.getMarketOrderbook(exactTicker, 10);
      if (ob.totalYesContracts === 0 && ob.totalNoContracts === 0) {
        return {
          ok: false,
          emptyBook: true,
          message: `Kalshi Demo REST returned HTTP 200 with empty resting book for ${exactTicker} (see IRREG-05 / IRREG-22). Keeping Demo Simulated Depth.`
        };
      }
      market.orderbook = ob;
      this.notify('orderbook', { ticker: market.ticker, exactTicker, live: true });
      return {
        ok: true,
        message: `Loaded live Kalshi Demo REST orderbook for ${exactTicker} (${ob.totalYesContracts + ob.totalNoContracts} resting contracts; retained for 30s).`
      };
    } catch (err) {
      return {
        ok: false,
        message: `Live orderbook REST fetch blocked or unavailable for ${exactTicker} (${err.message}). Displaying Demo Simulated Depth (see IRREG-02 / IRREG-07).`
      };
    }
  }

  async executeLiveOrPaperTrade(orderParams, { useLiveDemoApi = false } = {}) {
    if (useLiveDemoApi && this.client.authenticated) {
      const targetMarket = this.getMarket(orderParams.ticker);
      const exactTicker = (targetMarket && targetMarket.marketTicker) || orderParams.ticker;
      const apiRes = await this.client.createOrderFromYesNo({
        ticker: exactTicker,
        action: orderParams.action,
        side: orderParams.side,
        contracts: orderParams.contracts,
        price: orderParams.price,
        postOnly: Boolean(orderParams.postOnly)
      });
      const mirrored = this.executePaperTrade({
        ...orderParams,
        note: `${orderParams.note || 'Live Demo Order'} [Kalshi Demo ${exactTicker} order_id: ${apiRes.order_id || 'submitted'}]`
      });
      mirrored.mode = 'Kalshi Demo REST (Live)';
      this.saveState();
      this.notify('portfolio', mirrored);
      return { trade: mirrored, liveApiResponse: apiRes };
    }
    const trade = this.executePaperTrade(orderParams);
    return { trade, liveApiResponse: null };
  }
}

// Singleton engine shared on the current page
export const engine = new TradebotEngine();
