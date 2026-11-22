/**
 * Tradebot3 data, alerts, orderbook, paper portfolio, and strategy engine.
 *
 * Public market reads are best-effort Kalshi Demo REST snapshots (not production prices and not a
 * WebSocket stream). All portfolio trades and strategy executions are local paper simulations.
 * Random prices/depth are generated only after an explicit simulation action.
 */

import { VERIFIED_MARKETS, ALLOWED_TOPICS } from './data.js';
import { KalshiDemoClient } from './kalshi-client.js';

const STORAGE_KEY = 'tradebot3_paper_state_v2';
export const SWING_ALERT_THRESHOLD = 0.10;
export const REST_REFRESH_INTERVAL_MS = 60_000;

export const TRADE_CATEGORIES = [
  'Swing Mean-Reversion',
  'Momentum Breakout',
  'Model-Edge Rule',
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
    description: 'Paper-only strategy test that fades an observed or explicitly simulated >= $0.10 move.'
  },
  {
    id: 'strat-momentum',
    name: 'Momentum Breakout (>= $0.10)',
    category: 'Momentum Breakout',
    topicFilter: 'all',
    enabled: true,
    minSwing: 0.10,
    minExpectedRoi: 10,
    maxContracts: 20,
    rule: 'follow',
    description: 'Paper-only strategy test that follows an observed or explicitly simulated >= $0.10 move.'
  },
  {
    id: 'strat-high-roi',
    name: 'Model-Edge Rule Test (needs sourced fair value)',
    category: 'Model-Edge Rule',
    topicFilter: 'all',
    enabled: false,
    minSwing: 0.10,
    minExpectedRoi: 15,
    maxContracts: 35,
    rule: 'model-edge',
    description: 'Disabled by default: no independently sourced fair-value estimates are supplied, so this rule cannot produce a valid model signal.'
  },
  {
    id: 'strat-spread-capture',
    name: 'Liquidity Spread Capture (paper test)',
    category: 'Spread Capture',
    topicFilter: 'elections',
    enabled: false,
    minSwing: 0.05,
    minExpectedRoi: 6,
    maxContracts: 30,
    rule: 'spread',
    description: 'Paper-only spread rule; requires a successfully fetched Demo REST orderbook and never submits an exchange order.'
  }
];

function clampPrice(value) {
  return Math.max(0.01, Math.min(0.99, +Number(value).toFixed(2)));
}

function validApiPrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1) return null;
  return +number.toFixed(4);
}

function roundedDelta(next, previous) {
  return +Number(next - previous).toFixed(4);
}

function normalizeContractText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function findContractMarket(catalogMarket, apiMarkets) {
  if (!Array.isArray(apiMarkets) || !apiMarkets.length) return null;

  const tickerMatch = catalogMarket.ticker !== catalogMarket.eventTicker
    ? apiMarkets.find((item) => item.ticker === catalogMarket.ticker)
    : null;
  if (tickerMatch) return tickerMatch;

  const selectors = Array.isArray(catalogMarket.contractMatch)
    ? catalogMarket.contractMatch
    : [catalogMarket.contractMatch];
  const targets = selectors.map(normalizeContractText).filter(Boolean);
  if (!targets.length) return null;

  const matches = apiMarkets.filter((item) => {
    const fields = [item.yes_sub_title, item.subtitle, item.title, item.ticker];
    return fields.some((field) => targets.includes(normalizeContractText(field)));
  });
  return matches.length === 1 ? matches[0] : null;
}

function statusFromApi(rawStatus) {
  const status = String(rawStatus || '').toLowerCase();
  if (status === 'active') return 'Open';
  if (status === 'finalized' || status === 'settled') return 'Resolved';
  if (status === 'determined') return 'Determined';
  if (status === 'closed') return 'Closed';
  if (status === 'initialized' || status === 'unopened') return 'Upcoming';
  if (status === 'inactive' || status === 'deprecated') return 'Inactive';
  return rawStatus ? String(rawStatus) : 'Needs Review';
}

function resolutionFromApi(rawStatus, result) {
  const status = String(rawStatus || '').toLowerCase();
  const normalizedResult = String(result || '').toUpperCase();
  if (normalizedResult === 'YES' || normalizedResult === 'NO') return normalizedResult;
  if (status === 'active' || status === 'initialized' || status === 'unopened') return 'OPEN';
  return null;
}

function seedRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Construct deliberately synthetic depth for a user-triggered paper simulation only.
 * Never used as a fallback for missing Demo REST orderbook data.
 */
export function buildSimulatedOrderbook(price, volumeUsd = null, tickerSeed = 1) {
  const p = clampPrice(price);
  const volumeFactor = volumeUsd
    ? Math.min(25, Math.max(2, Math.log10(volumeUsd + 10) * 3))
    : 4;
  const spread = volumeUsd && volumeUsd > 10_000_000 ? 0.01 : volumeUsd && volumeUsd > 500_000 ? 0.02 : 0.03;
  const bestYesBid = clampPrice(p - spread / 2);
  const bestYesAsk = clampPrice(Math.max(bestYesBid + 0.01, p + spread / 2));
  const bestNoBid = clampPrice(1 - bestYesAsk);
  const yesBids = [];
  const noBids = [];

  for (let level = 0; level < 6; level += 1) {
    const yesPrice = clampPrice(bestYesBid - level * 0.01);
    const yesCount = Math.round((40 + seedRandom(tickerSeed + level * 7.1) * 180) * volumeFactor);
    if (yesPrice > 0.01 && (!yesBids.length || yesPrice < yesBids[yesBids.length - 1].price)) {
      yesBids.push({ price: yesPrice, count: yesCount, dollars: +(yesPrice * yesCount).toFixed(2) });
    }

    const noPrice = clampPrice(bestNoBid - level * 0.01);
    const noCount = Math.round((40 + seedRandom(tickerSeed + level * 11.3 + 50) * 180) * volumeFactor);
    if (noPrice > 0.01 && (!noBids.length || noPrice < noBids[noBids.length - 1].price)) {
      noBids.push({ price: noPrice, count: noCount, dollars: +(noPrice * noCount).toFixed(2) });
    }
  }

  const impliedYesAsks = noBids
    .map((level) => ({
      price: +Math.max(0, 1 - level.price).toFixed(4),
      noBidPrice: level.price,
      count: level.count,
      dollars: +((1 - level.price) * level.count).toFixed(2)
    }))
    .sort((a, b) => a.price - b.price);
  const totalYesContracts = yesBids.reduce((sum, level) => sum + level.count, 0);
  const totalNoContracts = noBids.reduce((sum, level) => sum + level.count, 0);
  const totalDollarLiquidity = +(
    yesBids.reduce((sum, level) => sum + level.dollars, 0) +
    impliedYesAsks.reduce((sum, level) => sum + level.dollars, 0)
  ).toFixed(2);
  const bestAsk = impliedYesAsks.length ? impliedYesAsks[0].price : clampPrice(p + 0.02);
  const bestBid = yesBids.length ? yesBids[0].price : p;

  return {
    simulated: true,
    source: 'paper-simulation',
    yesBids,
    noBids,
    impliedYesAsks,
    bestYesBid: bestBid,
    bestYesAsk: bestAsk,
    spread: +(bestAsk - bestBid).toFixed(4),
    totalYesContracts,
    totalNoContracts,
    totalDollarLiquidity
  };
}

/** No model fair value is supplied; the function must not invent one from the market quote. */
export function evaluateModelEdge(market, currentPrice, _delta = 0, _orderbook = null) {
  if (!market || market.status === 'Resolved') {
    return { qualified: false, side: 'NONE', expectedRoiPct: null, reason: 'Market is resolved or unavailable.' };
  }
  if (validApiPrice(currentPrice) === null) {
    return { qualified: false, side: 'NONE', expectedRoiPct: null, reason: 'No valid Demo REST quote is loaded.' };
  }
  if (!Number.isFinite(market.modelFairValue)) {
    return {
      qualified: false,
      side: 'NONE',
      expectedRoiPct: null,
      reason: 'No independently sourced fair value is available; this is not a forecast or ROI recommendation.'
    };
  }
  return { qualified: false, side: 'NONE', expectedRoiPct: null, reason: 'Model signal disabled pending a sourced fair-value methodology.' };
}

function freshPaperState() {
  const now = Date.now();
  return {
    cashBalance: 10_000,
    startingBalance: 10_000,
    positions: {},
    trades: [],
    strategies: JSON.parse(JSON.stringify(DEFAULT_STRATEGIES)),
    equityCurve: [{ ts: now, equity: 10_000 }]
  };
}

export class TradebotEngine {
  constructor(options = {}) {
    this.client = options.client || new KalshiDemoClient();
    this.listeners = new Set();
    this.running = false;
    this.refreshTimer = null;
    this.refreshPromise = null;
    this.simulationCount = 0;
    this.markets = [];
    this.allAlerts = [];
    this.modelEdgeAlerts = [];
    this.marketDataStatus = {
      connected: false,
      refreshing: false,
      fetched: 0,
      total: 0,
      failed: 0,
      unmatched: 0,
      endpoint: this.client.baseUrl,
      lastChecked: null,
      message: 'No tracked Kalshi Demo REST snapshot has loaded. REST quotes stay blank until a request succeeds.'
    };
    this.portfolio = this.loadState();
    this.initMarkets();
  }

  loadState() {
    const fallback = freshPaperState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.cashBalance !== 'number' || !Array.isArray(parsed.trades)) return fallback;
      if (!parsed.positions || typeof parsed.positions !== 'object') parsed.positions = {};
      // T-06 migration: the retired "High-ROI Model" label implied a fair-value model that does not exist.
      const renameCategory = (row) => {
        if (row && row.category === 'High-ROI Model') row.category = 'Model-Edge Rule';
      };
      parsed.trades.forEach(renameCategory);
      if (Array.isArray(parsed.strategies)) parsed.strategies.forEach(renameCategory);
      Object.values(parsed.positions).forEach(renameCategory);
      if (!Array.isArray(parsed.strategies)) parsed.strategies = fallback.strategies;
      if (!Array.isArray(parsed.equityCurve)) parsed.equityCurve = fallback.equityCurve;
      if (typeof parsed.startingBalance !== 'number') parsed.startingBalance = 10_000;
      return parsed;
    } catch (_) {
      return fallback;
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.portfolio));
    } catch (_) {
      // Storage may be disabled in private browsing; the current page still works in memory.
    }
  }

  resetPortfolio() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Ignore storage errors.
    }
    this.portfolio = freshPaperState();
    this.notify('portfolio');
  }

  initMarkets() {
    this.markets = VERIFIED_MARKETS
      .filter((market) => ALLOWED_TOPICS.includes(market.topic))
      .map((catalogMarket) => ({
        ...catalogMarket,
        catalogStatus: catalogMarket.status,
        catalogResolution: catalogMarket.resolution,
        dataStatus: 'catalog',
        dataError: '',
        marketTicker: catalogMarket.ticker !== catalogMarket.eventTicker ? catalogMarket.ticker : null,
        apiStatus: null,
        currentPrice: null,
        prevPrice: null,
        lastDelta: null,
        lastFetchedAt: null,
        dataSourceUrl: null,
        orderbook: null,
        simulatedOrderbook: null,
        simulationPrice: null,
        series: { snapshots: [], simulationSnapshots: [], jumpMarkers: [] },
        roi: evaluateModelEdge(catalogMarket, null),
        lastUpdated: null
      }));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(eventType = 'tick', payload = null) {
    this.listeners.forEach((listener) => {
      try {
        listener(eventType, payload);
      } catch (error) {
        console.error('TradebotEngine listener error:', error);
      }
    });
  }

  getMarket(ticker) {
    if (!ticker) return undefined;
    return this.markets.find((market) =>
      market.ticker === ticker || market.eventTicker === ticker || market.marketTicker === ticker
    );
  }

  getMarketsByTopic(topic) {
    return this.markets
      .filter((market) => topic === 'all' || market.topic === topic)
      .sort((a, b) => (b.volumeUsd || 0) - (a.volumeUsd || 0));
  }

  start() {
    if (this.refreshTimer) return;
    this.running = true;
    void this.refreshMarketData();
    this.refreshTimer = setInterval(() => void this.refreshMarketData(), REST_REFRESH_INTERVAL_MS);
    this.notify('status');
  }

  stop() {
    this.running = false;
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.notify('status');
  }

  toggleLive() {
    if (this.running) this.stop();
    else this.start();
    return this.running;
  }

  async refreshMarketData() {
    if (this.refreshPromise) return this.refreshPromise;

    this.marketDataStatus = {
      ...this.marketDataStatus,
      refreshing: true,
      endpoint: this.client.baseUrl,
      message: 'Fetching tracked event snapshots from Kalshi Demo REST. This is best-effort polling, not a live WebSocket stream.'
    };
    this.notify('data-status', this.marketDataStatus);

    this.refreshPromise = (async () => {
      let cursor = 0;
      let fetched = 0;
      let failed = 0;
      let unmatched = 0;
      const workers = Math.min(5, this.markets.length);

      const fetchNext = async () => {
        while (cursor < this.markets.length) {
          const market = this.markets[cursor];
          cursor += 1;
          try {
            if (!market.eventTicker || !market.contractMatch) {
              unmatched += 1;
              market.dataStatus = 'unmatched';
              market.dataError = 'Catalog row lacks a verified event or contract selector.';
              continue;
            }
            const payload = await this.client.getEvent(market.eventTicker);
            const apiMarket = findContractMarket(market, payload.markets);
            if (!apiMarket) {
              unmatched += 1;
              market.dataStatus = 'unmatched';
              market.dataError = 'The event response did not contain one unambiguous matching contract.';
              market.dataSourceUrl = this.client.getEventUrl(market.eventTicker);
              continue;
            }

            const now = Date.now();
            const previousPrice = market.currentPrice;
            const currentPrice = validApiPrice(apiMarket.last_price_dollars);
            market.marketTicker = apiMarket.ticker || market.marketTicker;
            market.apiStatus = apiMarket.status || null;
            market.status = statusFromApi(apiMarket.status);
            market.resolution = resolutionFromApi(apiMarket.status, apiMarket.result);
            market.dataStatus = 'demo-rest';
            market.dataError = '';
            market.dataSourceUrl = this.client.getEventUrl(market.eventTicker);
            market.lastFetchedAt = now;
            market.lastUpdated = now;

            if (currentPrice !== null) {
              market.prevPrice = previousPrice;
              market.currentPrice = currentPrice;
              market.lastDelta = previousPrice === null ? null : roundedDelta(currentPrice, previousPrice);
              market.series.snapshots.push({ ts: now, price: currentPrice });
              if (market.series.snapshots.length > 1440) market.series.snapshots.shift();
              market.roi = evaluateModelEdge(market, currentPrice, market.lastDelta || 0, market.orderbook);

              if (previousPrice !== null && Math.abs(market.lastDelta) >= SWING_ALERT_THRESHOLD) {
                this.addRestSnapshotAlert(market, previousPrice, currentPrice, market.lastDelta, now);
              }
            }
            fetched += 1;
          } catch (error) {
            failed += 1;
            market.dataError = error && error.message ? error.message : 'Unknown REST request error';
            market.dataStatus = market.lastFetchedAt ? 'stale' : 'unavailable';
          }
        }
      };

      await Promise.all(Array.from({ length: workers }, () => fetchNext()));
      const checkedAt = Date.now();
      const currentCount = this.markets.filter((market) => market.dataStatus === 'demo-rest').length;
      const staleCount = this.markets.filter((market) => market.dataStatus === 'stale').length;
      const messages = [];
      if (fetched) messages.push(`${fetched}/${this.markets.length} tracked contracts matched in this response batch`);
      if (unmatched) messages.push(`${unmatched} contract selectors unmatched`);
      if (failed) messages.push(`${failed} REST requests failed`);
      if (staleCount) messages.push(`${staleCount} prior snapshots are stale`);
      if (!fetched && !staleCount) messages.push('No tracked Demo REST market data loaded; dated catalog rows remain separate');

      const connected = currentCount > 0 || staleCount > 0;
      this.marketDataStatus = {
        connected,
        refreshing: false,
        fetched,
        total: this.markets.length,
        failed,
        unmatched,
        endpoint: this.client.baseUrl,
        lastChecked: checkedAt,
        message: `${messages.join(' · ')}. REST is best-effort and may be cached; no WebSocket stream is active.`
      };
      if (fetched > 0) {
        this.client.lastStatus = {
          connected: true,
          mode: 'demo-public-rest',
          endpoint: this.client.baseUrl,
          message: this.marketDataStatus.message,
          lastChecked: new Date(checkedAt).toISOString()
        };
      }
      this.notify('data-status', this.marketDataStatus);
      this.notify('market-data', { status: this.marketDataStatus });
      return this.marketDataStatus;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  addRestSnapshotAlert(market, fromPrice, toPrice, delta, ts) {
    const alert = {
      id: `REST-${market.marketTicker}-${ts}`,
      ts,
      ticker: market.ticker,
      title: market.title,
      topic: market.topic,
      fromPrice,
      toPrice,
      delta,
      direction: delta >= 0 ? 'UP' : 'DOWN',
      catalystLabel: 'YES last-price change between separate Kalshi Demo REST snapshots; not a streaming tick.',
      catalystUrl: market.dataSourceUrl || market.sourceUrl,
      catalystSource: 'Kalshi Demo REST',
      verifiedSourceUrl: market.sourceUrl,
      roi: evaluateModelEdge(market, toPrice, delta, market.orderbook),
      simulated: false,
      sourceMode: 'demo-rest'
    };
    this.allAlerts.unshift(alert);
    if (this.allAlerts.length > 100) this.allAlerts.pop();
    if (alert.roi.qualified) {
      this.modelEdgeAlerts.unshift(alert);
      if (this.modelEdgeAlerts.length > 100) this.modelEdgeAlerts.pop();
    }

    market.series.jumpMarkers.push({
      id: alert.id,
      ticker: market.ticker,
      label: alert.catalystLabel,
      delta,
      url: alert.catalystUrl,
      sourceName: alert.catalystSource,
      ts,
      price: toPrice,
      simulated: false
    });
    if (market.series.jumpMarkers.length > 100) market.series.jumpMarkers.shift();
    this.runAutomatedStrategiesOnSwing(market, alert, 'Demo REST snapshot change');
    this.notify('alert', alert);
  }

  /** Explicitly create one synthetic swing for UI/testing; never changes REST/catalog prices. */
  simulateSwing(forceTicker = null) {
    const openMarkets = this.markets.filter((market) => market.status === 'Open');
    const market = forceTicker
      ? this.getMarket(forceTicker)
      : openMarkets[Math.floor(Math.random() * openMarkets.length)];
    if (!market || market.status !== 'Open' || market.catalogStatus === 'Needs Review') return null;

    this.simulationCount += 1;
    const basePrice = market.simulationPrice ?? market.currentPrice ?? 0.5;
    let delta = (Math.random() > 0.5 ? 1 : -1) * +(0.10 + Math.random() * 0.07).toFixed(2);
    if (basePrice + delta > 0.96 || basePrice + delta < 0.04) delta = -delta;
    const nextPrice = clampPrice(basePrice + delta);
    const actualDelta = roundedDelta(nextPrice, basePrice);
    const now = Date.now();
    market.simulationPrice = nextPrice;
    market.simulatedOrderbook = buildSimulatedOrderbook(nextPrice, market.volumeUsd, this.simulationCount + 11);
    market.series.simulationSnapshots.push({ ts: now, price: nextPrice });
    if (market.series.simulationSnapshots.length > 120) market.series.simulationSnapshots.shift();

    const alert = {
      id: `SIM-${now}-${this.simulationCount}`,
      ts: now,
      ticker: market.ticker,
      title: market.title,
      topic: market.topic,
      fromPrice: basePrice,
      toPrice: nextPrice,
      delta: actualDelta,
      direction: actualDelta >= 0 ? 'UP' : 'DOWN',
      catalystLabel: 'Synthetic paper-simulation swing. Not an observed Kalshi price move.',
      catalystUrl: market.sourceUrl,
      catalystSource: 'Paper Simulation',
      verifiedSourceUrl: market.sourceUrl,
      roi: evaluateModelEdge(market, market.currentPrice, actualDelta, market.simulatedOrderbook),
      simulated: true,
      sourceMode: 'paper-simulation'
    };
    this.allAlerts.unshift(alert);
    if (this.allAlerts.length > 100) this.allAlerts.pop();
    if (alert.roi.qualified) {
      this.modelEdgeAlerts.unshift(alert);
      if (this.modelEdgeAlerts.length > 100) this.modelEdgeAlerts.pop();
    }
    this.runAutomatedStrategiesOnSwing(market, alert, 'explicit paper simulation');
    this.recordEquitySnapshot(now);
    this.notify('simulation', alert);
    return alert;
  }

  // Backward-compatible test hook; callers should use the explicitly named simulateSwing method.
  runTick(forceTicker = null) {
    return this.simulateSwing(forceTicker);
  }

  async refreshOrderbook(ticker) {
    const market = this.getMarket(ticker);
    if (!market || !market.marketTicker) {
      return { ok: false, message: 'No verified contract ticker is available for this Demo REST orderbook request.' };
    }
    try {
      const orderbook = await this.client.getMarketOrderbook(market.marketTicker, 10);
      market.orderbook = { ...orderbook, simulated: false, source: 'demo-rest', fetchedAt: Date.now() };
      market.orderbookError = '';
      market.orderbookFetchedAt = Date.now();
      market.roi = evaluateModelEdge(market, market.currentPrice, market.lastDelta || 0, market.orderbook);
      this.notify('orderbook', market);
      return { ok: true, orderbook: market.orderbook };
    } catch (error) {
      market.orderbook = null;
      market.orderbookError = error && error.message ? error.message : 'Unknown orderbook request error';
      this.notify('orderbook', market);
      return { ok: false, message: market.orderbookError };
    }
  }

  runAutomatedStrategiesOnSwing(market, alert, triggerSource) {
    this.portfolio.strategies.filter((strategy) => strategy.enabled).forEach((strategy) => {
      if (strategy.topicFilter !== 'all' && strategy.topicFilter !== market.topic) return;
      if (Math.abs(alert.delta) < (strategy.minSwing || SWING_ALERT_THRESHOLD)) return;

      let side = 'YES';
      let shouldTrade = false;
      if (strategy.rule === 'fade') {
        side = alert.delta > 0 ? 'NO' : 'YES';
        shouldTrade = true;
      } else if (strategy.rule === 'follow') {
        side = alert.delta > 0 ? 'YES' : 'NO';
        shouldTrade = true;
      } else if (strategy.rule === 'model-edge') {
        const signal = alert.roi;
        if (signal && signal.qualified && signal.expectedRoiPct >= (strategy.minExpectedRoi || 15)) {
          side = signal.side;
          shouldTrade = true;
        }
      } else if (strategy.rule === 'spread') {
        if (market.orderbook && !market.orderbook.simulated && market.orderbook.spread !== null && market.orderbook.spread >= 0.02) {
          side = alert.delta > 0 ? 'NO' : 'YES';
          shouldTrade = true;
        }
      }
      if (!shouldTrade) return;

      const quotePrice = market.currentPrice;
      const referencePrice = quotePrice === null
        ? (market.simulationPrice ?? alert.toPrice)
        : quotePrice;
      const paperPrice = side === 'YES' ? referencePrice : 1 - referencePrice;
      const contracts = Math.min(strategy.maxContracts || 15, Math.max(1, Math.floor(25 / Math.max(0.1, paperPrice))));
      const cost = contracts * paperPrice;
      if (cost > this.portfolio.cashBalance * 0.2) return;

      try {
        this.executePaperTrade({
          ticker: market.ticker,
          action: 'BUY',
          side,
          contracts,
          price: paperPrice,
          category: strategy.category,
          strategyId: strategy.id,
          note: `Paper strategy [${strategy.name}] triggered by ${triggerSource}; no exchange order was submitted.`
        });
      } catch (_) {
        // Strategy simulation is best-effort and must not interrupt market-data rendering.
      }
    });
  }

  executePaperTrade({ ticker, action = 'BUY', side = 'YES', contracts, price, category = 'Manual', strategyId = null, note = '' }) {
    const market = this.getMarket(ticker);
    if (!market) throw new Error('Market not found in the five-topic paper catalog.');
    const normalizedSide = String(side).toUpperCase();
    if (!['YES', 'NO'].includes(normalizedSide)) throw new Error('Choose YES or NO.');
    const qty = Math.floor(Number(contracts));
    if (!Number.isFinite(qty) || qty < 1) throw new Error('Enter at least one contract.');
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0.01 || numericPrice > 0.99) {
      throw new Error('Enter a paper contract price between $0.01 and $0.99.');
    }
    const execPrice = +numericPrice.toFixed(2);
    const normalizedAction = String(action).toUpperCase();
    if (!['BUY', 'SELL'].includes(normalizedAction)) throw new Error('Choose BUY or SELL.');
    const key = `${market.ticker}:${normalizedSide}`;
    const now = Date.now();

    if (normalizedAction === 'BUY') {
      const cost = +(qty * execPrice).toFixed(2);
      if (cost > this.portfolio.cashBalance) {
        throw new Error(`Insufficient paper cash balance ($${this.portfolio.cashBalance.toFixed(2)} available, need $${cost.toFixed(2)}).`);
      }
      this.portfolio.cashBalance = +(this.portfolio.cashBalance - cost).toFixed(2);
      const position = this.portfolio.positions[key];
      if (position) {
        const totalQty = position.contracts + qty;
        position.avgPrice = +((position.contracts * position.avgPrice + qty * execPrice) / totalQty).toFixed(4);
        position.contracts = totalQty;
      } else {
        this.portfolio.positions[key] = {
          ticker: market.ticker,
          topic: market.topic,
          side: normalizedSide,
          contracts: qty,
          avgPrice: execPrice,
          category
        };
      }
      const trade = {
        id: `PAPER-${now}-${Math.floor(Math.random() * 1000)}`,
        ts: now,
        ticker: market.ticker,
        topic: market.topic,
        action: 'BUY',
        side: normalizedSide,
        contracts: qty,
        price: execPrice,
        exitPrice: null,
        status: 'OPEN',
        pnl: 0,
        roiPct: 0,
        category,
        strategyId,
        mode: 'Paper Simulation',
        note: note || `Paper BUY ${qty} ${normalizedSide} @ $${execPrice.toFixed(2)}; not sent to Kalshi.`
      };
      this.portfolio.trades.unshift(trade);
      if (this.portfolio.trades.length > 300) this.portfolio.trades.pop();
      this.recordEquitySnapshot(now);
      this.saveState();
      this.notify('portfolio', trade);
      return trade;
    }

    const position = this.portfolio.positions[key];
    if (!position || position.contracts < qty) {
      throw new Error(`No open paper ${normalizedSide} position of at least ${qty} contracts on ${market.ticker}.`);
    }
    const proceeds = +(qty * execPrice).toFixed(2);
    const costBasis = +(qty * position.avgPrice).toFixed(2);
    const pnl = +(proceeds - costBasis).toFixed(2);
    const roiPct = costBasis > 0 ? +((pnl / costBasis) * 100).toFixed(1) : 0;
    this.portfolio.cashBalance = +(this.portfolio.cashBalance + proceeds).toFixed(2);
    position.contracts -= qty;
    if (position.contracts <= 0) delete this.portfolio.positions[key];

    const trade = {
      id: `PAPER-${now}-${Math.floor(Math.random() * 1000)}`,
      ts: now,
      ticker: market.ticker,
      topic: market.topic,
      action: 'SELL',
      side: normalizedSide,
      contracts: qty,
      price: position.avgPrice,
      exitPrice: execPrice,
      status: 'CLOSED',
      pnl,
      roiPct,
      category: category || position.category || 'Manual',
      strategyId,
      mode: 'Paper Simulation',
      note: note || `Paper close ${qty} ${normalizedSide} @ $${execPrice.toFixed(2)}; not sent to Kalshi.`
    };
    this.portfolio.trades.unshift(trade);
    if (this.portfolio.trades.length > 300) this.portfolio.trades.pop();
    this.recordEquitySnapshot(now);
    this.saveState();
    this.notify('portfolio', trade);
    return trade;
  }

  /** Settle a paper position for testing; does not change the Kalshi market's lifecycle/result. */
  simulateResolution(ticker, outcome) {
    const market = this.getMarket(ticker);
    if (!market) return null;
    const winSide = String(outcome).toUpperCase() === 'YES' ? 'YES' : 'NO';
    const settledTrades = [];
    ['YES', 'NO'].forEach((side) => {
      const key = `${market.ticker}:${side}`;
      const position = this.portfolio.positions[key];
      if (!position) return;
      const payoutPrice = side === winSide ? 1 : 0;
      const proceeds = +(position.contracts * payoutPrice).toFixed(2);
      const costBasis = +(position.contracts * position.avgPrice).toFixed(2);
      const pnl = +(proceeds - costBasis).toFixed(2);
      const roiPct = costBasis > 0 ? +((pnl / costBasis) * 100).toFixed(1) : 0;
      this.portfolio.cashBalance = +(this.portfolio.cashBalance + proceeds).toFixed(2);
      const trade = {
        id: `PAPER-SET-${Date.now()}-${settledTrades.length}`,
        ts: Date.now(),
        ticker: market.ticker,
        topic: market.topic,
        action: 'SETTLE',
        side,
        contracts: position.contracts,
        price: position.avgPrice,
        exitPrice: payoutPrice,
        status: `PAPER SETTLED ${winSide}`,
        pnl,
        roiPct,
        category: position.category || 'Manual',
        strategyId: null,
        mode: 'Paper Simulation',
        note: `Paper-only resolution test: ${winSide} pays $${payoutPrice.toFixed(2)}/contract. Kalshi market state was not changed.`
      };
      this.portfolio.trades.unshift(trade);
      settledTrades.push(trade);
      delete this.portfolio.positions[key];
    });
    this.recordEquitySnapshot(Date.now());
    this.saveState();
    this.notify('paper-resolution', { ticker: market.ticker, outcome: winSide, settledTrades });
    return { ticker: market.ticker, outcome: winSide, settledTrades };
  }

  getPortfolioSummary() {
    let knownPositionsValue = 0;
    let knownUnrealizedPnl = 0;
    let unpricedPositionCount = 0;
    const openPositions = Object.values(this.portfolio.positions).map((position) => {
      const market = this.getMarket(position.ticker);
      const yesPrice = market ? validApiPrice(market.currentPrice) : null;
      const mark = yesPrice === null ? null : position.side === 'YES' ? yesPrice : +(1 - yesPrice).toFixed(4);
      const marketValue = mark === null ? null : +(position.contracts * mark).toFixed(2);
      const costBasis = +(position.contracts * position.avgPrice).toFixed(2);
      const pnl = marketValue === null ? null : +(marketValue - costBasis).toFixed(2);
      const roiPct = pnl === null || costBasis === 0 ? null : +((pnl / costBasis) * 100).toFixed(1);
      if (marketValue === null || pnl === null) {
        unpricedPositionCount += 1;
      } else {
        knownPositionsValue += marketValue;
        knownUnrealizedPnl += pnl;
      }
      return {
        ...position,
        mark,
        marketValue,
        costBasis,
        pnl,
        roiPct,
        marketTitle: market ? market.title : position.ticker,
        quoteSource: market && market.dataStatus === 'demo-rest' ? 'Kalshi Demo REST' : null
      };
    });

    const realizedPnl = +this.portfolio.trades
      .filter((trade) => trade.status !== 'OPEN')
      .reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0)
      .toFixed(2);
    const fullyPriced = unpricedPositionCount === 0;
    const positionsValue = fullyPriced ? +knownPositionsValue.toFixed(2) : null;
    const unrealizedPnl = fullyPriced ? +knownUnrealizedPnl.toFixed(2) : null;
    const totalEquity = fullyPriced ? +(this.portfolio.cashBalance + knownPositionsValue).toFixed(2) : null;
    const totalPnl = totalEquity === null ? null : +(totalEquity - this.portfolio.startingBalance).toFixed(2);
    const totalRoiPct = totalPnl === null
      ? null
      : +((totalPnl / this.portfolio.startingBalance) * 100).toFixed(2);

    return {
      cashBalance: +this.portfolio.cashBalance.toFixed(2),
      positionsValue,
      totalEquity,
      realizedPnl,
      unrealizedPnl,
      totalPnl,
      totalRoiPct,
      unpricedPositionCount,
      openPositions
    };
  }

  getCategoryAnalytics() {
    const stats = {};
    TRADE_CATEGORIES.forEach((category) => {
      stats[category] = { category, totalTrades: 0, closedTrades: 0, wins: 0, pnl: 0, invested: 0, unpricedOpenTrades: 0 };
    });

    this.portfolio.trades.forEach((trade) => {
      const category = trade.category || 'Manual';
      if (!stats[category]) {
        stats[category] = { category, totalTrades: 0, closedTrades: 0, wins: 0, pnl: 0, invested: 0, unpricedOpenTrades: 0 };
      }
      const row = stats[category];
      row.totalTrades += 1;
      row.invested += trade.contracts * trade.price;
      if (trade.status !== 'OPEN') {
        row.closedTrades += 1;
        row.pnl += Number(trade.pnl) || 0;
        if ((Number(trade.pnl) || 0) > 0) row.wins += 1;
      } else {
        const market = this.getMarket(trade.ticker);
        const yesPrice = market ? validApiPrice(market.currentPrice) : null;
        if (yesPrice === null) {
          row.unpricedOpenTrades += 1;
        } else {
          const mark = trade.side === 'YES' ? yesPrice : 1 - yesPrice;
          row.pnl += (mark - trade.price) * trade.contracts;
        }
      }
    });

    return Object.values(stats).map((row) => ({
      ...row,
      pnl: row.unpricedOpenTrades > 0 ? null : +row.pnl.toFixed(2),
      winRatePct: row.closedTrades > 0 ? +((row.wins / row.closedTrades) * 100).toFixed(1) : null,
      roiPct: row.invested > 0 && row.unpricedOpenTrades === 0 ? +((row.pnl / row.invested) * 100).toFixed(1) : null
    }));
  }

  toggleStrategy(strategyId) {
    const strategy = this.portfolio.strategies.find((item) => item.id === strategyId);
    if (!strategy) return;
    strategy.enabled = !strategy.enabled;
    this.saveState();
    this.notify('strategy', strategy);
  }

  addCustomStrategy({ name, category, topicFilter, minSwing, minExpectedRoi, maxContracts, rule, description }) {
    const strategy = {
      id: `strat-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: String(name || '').trim(),
      category: category || 'Manual',
      topicFilter: topicFilter || 'all',
      enabled: true,
      minSwing: Math.max(0.05, Number(minSwing) || 0.10),
      minExpectedRoi: Math.max(0, Number(minExpectedRoi) || 0),
      maxContracts: Math.max(1, Math.round(Number(maxContracts) || 20)),
      rule: rule || 'model-edge',
      description: description || `Paper-only strategy created from ${category || 'Manual'} trade category.`
    };
    if (!strategy.name) throw new Error('Enter a strategy name.');
    this.portfolio.strategies.push(strategy);
    this.saveState();
    this.notify('strategy', strategy);
    return strategy;
  }

  recordEquitySnapshot(ts) {
    const summary = this.getPortfolioSummary();
    if (summary.totalEquity === null) return;
    this.portfolio.equityCurve.push({ ts, equity: summary.totalEquity });
    if (this.portfolio.equityCurve.length > 300) this.portfolio.equityCurve.shift();
  }
}

// One engine instance is shared by the modules loaded on each page.
export const engine = new TradebotEngine();
