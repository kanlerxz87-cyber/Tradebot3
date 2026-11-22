/**
 * Tradebot3 — data layer.
 *
 * Two sources, never mixed silently:
 *   1. A committed snapshot (assets/data/snapshot.json) produced by
 *      scripts/fetch_kalshi_data.py from Kalshi's official public Trade API.
 *   2. Optional live polling of the same official API from the browser. If the
 *      browser cannot reach it (CORS/offline), the UI says so and keeps using
 *      the snapshot — it never fabricates prices.
 */

import { SITE, TOPIC_ORDER, parseTs, isNum } from './core.js';

export const TIMEFRAMES = [
  { id: '1m', label: '1 min', seconds: 60, source: 'm1' },
  { id: '5m', label: '5 min', seconds: 300, source: 'm1' },
  { id: '15m', label: '15 min', seconds: 900, source: 'm1' },
  { id: '1h', label: '1 hour', seconds: 3600, source: 'h1' },
  { id: '6h', label: '6 hours', seconds: 21600, source: 'h1' },
  { id: '1d', label: '1 day', seconds: 86400, source: 'h1' },
];

export class MarketData {
  constructor() {
    this.snapshot = null;
    this.markets = [];
    this.byTicker = new Map();
    this.eventByTicker = new Map();
    this.live = {
      enabled: false,
      state: 'idle', // idle | live | blocked | error
      lastPollAt: null,
      lastError: null,
      ticks: 0,
      pollMs: 20000,
    };
    this.ticks = new Map(); // ticker -> [{t, price}]
    this.listeners = { update: [], alert: [], status: [] };
    this._timer = null;
  }

  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
    return () => {
      this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== fn);
    };
  }

  _emit(event, payload) {
    for (const fn of this.listeners[event] || []) {
      try { fn(payload); } catch (err) { console.error(err); }
    }
  }

  async load() {
    const res = await fetch(`${SITE.dataFile}?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`snapshot HTTP ${res.status}`);
    const snap = await res.json();
    this.applySnapshot(snap);
    return snap;
  }

  applySnapshot(snap) {
    this.snapshot = snap;
    this.markets = snap.markets || [];
    this.byTicker = new Map(this.markets.map((m) => [m.ticker, m]));
    this.eventByTicker = new Map((snap.events || []).map((e) => [e.event_ticker, e]));
    this._emit('update', { reason: 'snapshot' });
  }

  get generatedAt() { return this.snapshot?.generated_at || null; }
  get warnings() { return this.snapshot?.warnings || []; }

  marketsFor(topic) {
    return this.markets.filter((m) => m.topic === topic);
  }

  eventsFor(topic) {
    const events = (this.snapshot?.events || []).filter((e) => e.topic === topic);
    return events.map((e) => ({
      ...e,
      markets: (e.market_tickers || []).map((t) => this.byTicker.get(t)).filter(Boolean),
    })).filter((e) => e.markets.length);
  }

  allEvents() {
    return (this.snapshot?.events || []).map((e) => ({
      ...e,
      markets: (e.market_tickers || []).map((t) => this.byTicker.get(t)).filter(Boolean),
    })).filter((e) => e.markets.length);
  }

  alerts() {
    return (this.snapshot?.alerts || []).slice();
  }

  resolutions() {
    return (this.snapshot?.resolutions || []).slice();
  }

  topicStats(topic) {
    const markets = this.marketsFor(topic);
    const events = this.eventsFor(topic);
    const volume = markets.reduce((s, m) => s + (m.volume || 0), 0);
    const volume24 = markets.reduce((s, m) => s + (m.volume_24h || 0), 0);
    return { markets: markets.length, events: events.length, volume, volume24 };
  }

  /** Best available YES price: orderbook mid, else last trade price. */
  bestPrice(market) {
    if (!market) return null;
    const ob = market.orderbook;
    if (ob && isNum(ob.best_yes_bid) && isNum(ob.best_yes_ask)) {
      return Math.round(((ob.best_yes_bid + ob.best_yes_ask) / 2) * 10000) / 10000;
    }
    if (ob && isNum(ob.best_yes_bid)) return ob.best_yes_bid;
    if (isNum(market.last_price)) return market.last_price;
    return null;
  }

  /**
   * Candle history for a market and timeframe.
   * Kalshi's public candlestick endpoint only offers 1m/60m/1440m buckets
   * (verified: docs.kalshi.com/api-reference/market/get-market-candlesticks),
   * so sub-minute views are built from live browser ticks — labelled in the UI.
   */
  candlesFor(ticker, timeframeId) {
    const market = this.byTicker.get(ticker);
    const tf = TIMEFRAMES.find((t) => t.id === timeframeId) || TIMEFRAMES[0];
    if (!market?.candles) return [];
    const source = tf.source === 'm1' ? market.candles.m1 : market.candles.h1;
    const bucketMs = tf.seconds * 1000;
    const buckets = new Map();
    for (const bar of source || []) {
      const [ts, bid, ask, price, vol] = bar;
      if (!ts) continue;
      const t = ts * 1000;
      const key = Math.floor(t / bucketMs) * bucketMs;
      const mark = isNum(ask) ? ask : isNum(bid) ? bid : price;
      if (!isNum(mark)) continue;
      const cur = buckets.get(key);
      if (!cur) {
        buckets.set(key, { t: key, open: mark, price: mark, high: mark, low: mark, volume: vol || 0 });
      } else {
        cur.price = mark;
        cur.high = Math.max(cur.high, mark);
        cur.low = Math.min(cur.low, mark);
        cur.volume += vol || 0;
      }
    }
    const live = this.ticks.get(ticker) || [];
    for (const tick of live) {
      const key = Math.floor(tick.t / bucketMs) * bucketMs;
      const cur = buckets.get(key);
      if (!cur) buckets.set(key, { t: key, open: tick.price, price: tick.price, high: tick.price, low: tick.price, volume: 0 });
      else { cur.price = tick.price; cur.high = Math.max(cur.high, tick.price); cur.low = Math.min(cur.low, tick.price); }
    }
    return [...buckets.values()].sort((a, b) => a.t - b.t);
  }

  /** Second-level series built only from browser ticks (clearly labelled). */
  liveSeries(ticker, windowSeconds = 120) {
    const ticks = (this.ticks.get(ticker) || []).filter((t) => Date.now() - t.t <= windowSeconds * 1000);
    return ticks.map((t) => ({ t: t.t, price: t.price }));
  }

  swingFor(ticker) {
    const market = this.byTicker.get(ticker);
    if (!market?.candles?.m1?.length) return null;
    const bars = market.candles.m1;
    for (let i = bars.length - 1; i > 0; i -= 1) {
      const [, bidA, askA] = bars[i];
      const [, bidB, askB] = bars[i - 1];
      const a = isNum(askA) ? askA : bidA;
      const b = isNum(askB) ? askB : bidB;
      if (isNum(a) && isNum(b) && Math.abs(a - b) >= SITE.swingThreshold) {
        return { ts: bars[i][0] * 1000, from: b, to: a, delta: Math.round((a - b) * 10000) / 10000 };
      }
    }
    return null;
  }

  /* ------------------------------------------------------------ live poll */

  startLive() {
    if (this.live.enabled) return;
    this.live.enabled = true;
    this._setStatus('connecting');
    this._poll();
    this._timer = setInterval(() => {
      if (document.hidden) return;
      this._poll();
    }, this.live.pollMs);
  }

  stopLive() {
    this.live.enabled = false;
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this._setStatus('paused');
  }

  _setStatus(state, error = null) {
    this.live.state = state;
    this.live.lastError = error;
    this._emit('status', this.live);
  }

  async _poll() {
    const tickers = this.markets
      .filter((m) => m.status === 'active')
      .sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0))
      .slice(0, 40)
      .map((m) => m.ticker);
    if (!tickers.length) return;

    const batches = [];
    for (let i = 0; i < tickers.length; i += 20) batches.push(tickers.slice(i, i + 20));

    let anyOk = false;
    for (const batch of batches) {
      const url = `${SITE.apiBase}/markets?tickers=${encodeURIComponent(batch.join(','))}&limit=200`;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data?.markets) {
          this.applyLiveMarkets(data.markets);
          anyOk = true;
        }
      } catch (err) {
        this.live.lastError = `${err.name === 'AbortError' ? 'timeout' : err.message}`;
      }
    }

    this.live.lastPollAt = Date.now();
    if (anyOk) {
      this.live.ticks += 1;
      this._setStatus('live');
    } else {
      this._setStatus(this.live.state === 'live' ? 'error' : 'blocked');
    }
  }

  applyLiveMarkets(rows) {
    for (const row of rows) {
      const market = this.byTicker.get(row.ticker);
      if (!market) continue;
      const prev = this.bestPrice(market);
      market.api_status = row.status;
      market.yes_bid = numOrNull(row.yes_bid_dollars);
      market.yes_ask = numOrNull(row.yes_ask_dollars);
      market.no_bid = numOrNull(row.no_bid_dollars);
      market.no_ask = numOrNull(row.no_ask_dollars);
      market.last_price = numOrNull(row.last_price_dollars);
      market.volume = numOrNull(row.volume_fp) ?? market.volume;
      market.volume_24h = numOrNull(row.volume_24h_fp) ?? market.volume_24h;
      market.open_interest = numOrNull(row.open_interest_fp) ?? market.open_interest;
      market.result = row.result || market.result;
      market.status = row.status || market.status;

      const next = this.bestPrice(market);
      if (!isNum(next)) continue;
      const arr = this.ticks.get(market.ticker) || [];
      arr.push({ t: Date.now(), price: next });
      if (arr.length > 400) arr.splice(0, arr.length - 400);
      this.ticks.set(market.ticker, arr);

      if (isNum(prev) && Math.abs(next - prev) + 1e-9 >= SITE.swingThreshold) {
        this._emit('alert', {
          ts: Date.now(),
          ticker: market.ticker,
          event_ticker: market.event_ticker,
          topic: market.topic,
          title: market.title,
          event_title: this.eventByTicker.get(market.event_ticker)?.title,
          from_price: prev,
          to_price: next,
          delta: Math.round((next - prev) * 10000) / 10000,
          direction: next > prev ? 'up' : 'down',
          interval: 'live tick',
          kalshi_url: market.kalshi_url,
          live: true,
        });
      }
    }
    this._emit('update', { reason: 'live' });
  }
}

function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function aggregateEventVolume(event) {
  return (event.markets || []).reduce((s, m) => s + (m.volume || 0), 0);
}

export function eventEstDollars(event) {
  return (event.markets || []).reduce((s, m) => s + (m.volume || 0) * (m.last_price || 0), 0);
}

export function sortedTopics() {
  return TOPIC_ORDER;
}
