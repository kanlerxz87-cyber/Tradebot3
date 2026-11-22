/**
 * Tradebot3 — >= $0.10 swing alert feeds.
 *
 * Two chats:
 *   • "all"   — every detected move of at least $0.10 in either direction.
 *   • "model" — only moves whose market passes the transparent score in
 *               core.js (liquidity, spread, price band, catalyst, runway).
 *
 * Alerts come from two sources and are labelled:
 *   • snapshot — rebuild from official Kalshi 1-minute / 1-hour candles.
 *   • live tick — detected by this browser while polling the official API.
 */

import { el, fmtClock, fmtDelta, fmtPrice, esc, timeAgo, scoreMarket, SITE, TOPICS } from './core.js';

export class AlertFeed {
  constructor({ container, counter, mode = 'all', data, onSelect = null, limit = 120 }) {
    this.container = container;
    this.counter = counter;
    this.mode = mode;
    this.data = data;
    this.onSelect = onSelect;
    this.limit = limit;
    this.items = [];
    this.keys = new Set();
    this.topic = 'all';
    this.paused = false;
    this.queued = 0;
  }

  add(alert) {
    const key = `${alert.ticker}|${Math.round((alert.ts || 0) / 1000)}|${alert.direction}`;
    if (this.keys.has(key)) return;
    this.keys.add(key);

    const market = this.data.byTicker.get(alert.ticker);
    const score = market ? scoreMarket(market, { recentSwing: { delta: alert.delta, ts: alert.ts } }) : null;
    const enriched = { ...alert, market, score };
    if (this.mode === 'model' && !(score && score.qualifies)) return;

    this.items.push(enriched);
    this.items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (this.items.length > this.limit) this.items.length = this.limit;
    if (this.paused) this.queued += 1;
    else this.render();
  }

  addMany(alerts) {
    for (const a of alerts || []) this.add(a);
    this.render();
  }

  setTopic(topic) {
    this.topic = topic;
    this.render();
  }

  setPaused(paused) {
    this.paused = paused;
    this.queued = 0;
    if (!paused) this.render();
  }

  visible() {
    return this.items.filter((a) => this.topic === 'all' || a.topic === this.topic);
  }

  render() {
    if (!this.container) return;
    const rows = this.visible();
    if (this.counter) this.counter.textContent = String(rows.length);
    if (this.paused) {
      this.container.innerHTML = '';
      this.container.append(el('div', { class: 'chat-empty', text: `Feed paused — ${this.queued} new alert(s) waiting.` }));
      return;
    }
    if (!rows.length) {
      this.container.innerHTML = '';
      this.container.append(el('div', { class: 'chat-empty' },
        this.mode === 'model'
          ? `No qualifying moves yet. The model needs a score of ${SITE.modelThreshold}+ on a market that just moved ≥ $0.10.`
          : 'No ≥ $0.10 moves in the current data window (last ~2h of 1-minute candles).',
      ));
      return;
    }

    const frag = document.createDocumentFragment();
    for (const row of rows) frag.append(this._row(row));
    this.container.innerHTML = '';
    this.container.append(frag);
  }

  _row(alert) {
    const dir = alert.direction === 'up' ? 'is-up' : 'is-down';
    const market = alert.market;
    const eventTitle = alert.event_title || market?.event_title || '';
    const descriptors = [];
    if (alert.interval === 'live tick') descriptors.push('<span class="badge badge-live"><span class="dot"></span>live tick</span>');
    else if (alert.interval) descriptors.push(`<span class="badge badge-neutral">${esc(alert.interval)} candle</span>`);

    const links = [];
    if (alert.kalshi_url || market?.kalshi_url) {
      links.push(`<a href="${esc(alert.kalshi_url || market.kalshi_url)}" target="_blank" rel="noopener noreferrer">Kalshi</a>`);
    }
    const refs = this.data.snapshot?.topics?.[alert.topic]?.reference_links || [];
    for (const ref of refs.filter((r) => r.reachable).slice(0, 2)) {
      links.push(`<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.label)}</a>`);
    }

    const modelChip = alert.score
      ? `<span class="badge ${alert.score.qualifies ? 'badge-info' : 'badge-neutral'}" title="${esc(alert.score.parts.map((p) => `${p.label} ${p.value}/${p.max}`).join(' · '))}">model ${alert.score.total}</span>`
      : '';

    const node = el('div', { class: `chat-msg ${dir}`, role: 'listitem', tabindex: '0' });
    node.innerHTML = `
      <div class="time" title="${esc(new Date(alert.ts).toISOString())}">${fmtClock(alert.ts)}</div>
      <div>
        <div class="msg-title">${esc(eventTitle || alert.title || alert.ticker)}</div>
        <div class="msg-meta">
          ${market?.subtitle ? `${esc(market.subtitle)} · ` : ''}
          ${esc(TOPICS[alert.topic]?.name || alert.topic)}
          · ${fmtPrice(alert.from_price)} → ${fmtPrice(alert.to_price)}
          · <span style="font-family:var(--mono)">${esc(alert.ticker)}</span>
        </div>
        <div class="msg-meta" style="margin-top:3px">
          ${descriptors.join(' ')} ${modelChip}
          ${links.length ? `· ${links.join(' · ')}` : ''}
          ${alert.source_note ? `· <span class="tiny">${esc(alert.source_note)}</span>` : ''}
        </div>
      </div>
      <div class="delta">${fmtDelta(alert.delta)}<div class="tiny" style="font-weight:400">${timeAgo(alert.ts)}</div></div>`;
    if (this.onSelect && market) {
      const go = () => this.onSelect(alert.ticker);
      node.addEventListener('click', go);
      node.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') go(); });
    }
    return node;
  }
}

/** Decide whether a live swing should be auto-traded by a strategy. */
export function shouldAutoTrade(strategy, alert, score) {
  if (!strategy || !strategy.enabled) return false;
  if (Math.abs(alert.delta) < (strategy.minSwing || SITE.swingThreshold)) return false;
  if (strategy.topicFilter && strategy.topicFilter !== 'all' && strategy.topicFilter !== alert.topic) return false;
  if (strategy.rule === 'model' && !(score && score.total >= (strategy.minScore || SITE.modelThreshold))) return false;
  return true;
}
