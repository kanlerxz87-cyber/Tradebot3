/**
 * Tradebot3 — dependency-free canvas price chart.
 * X axis: time. Y axis: contract price in dollars (0.00–1.00).
 * Renders >= $0.10 jump markers with clickable catalyst popovers.
 */

import { fmtClock, fmtDate, fmtDelta, fmtPrice, esc } from './core.js';

const PAD = { left: 46, right: 14, top: 12, bottom: 26 };

export class PriceChart {
  constructor(canvas, { tooltipEl, popoverEl } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tooltipEl = tooltipEl;
    this.popoverEl = popoverEl;
    this.data = { series: [], markers: [], label: '', priceLabel: 'YES price' };
    this.hover = null;
    this.markerHits = [];
    this._bind();
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(canvas.parentElement || canvas);
  }

  _bind() {
    this.canvas.addEventListener('mousemove', (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      this.hover = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      this.draw();
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.hover = null;
      if (this.tooltipEl) this.tooltipEl.classList.remove('visible');
      this.draw();
    });
    this.canvas.addEventListener('click', (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const hit = this.markerHits.find((m) => Math.abs(m.x - x) < 10 && Math.abs(m.y - y) < 18);
      if (hit) this._showPopover(hit.marker, hit.x, hit.y, rect);
      else if (this.popoverEl) this.popoverEl.classList.remove('visible');
    });
  }

  _showPopover(marker, x, y, rect) {
    if (!this.popoverEl) return;
    const links = [];
    if (marker.kalshi_url) links.push(`<a href="${esc(marker.kalshi_url)}" target="_blank" rel="noopener noreferrer">Kalshi event page</a>`);
    for (const link of marker.catalyst_links || []) {
      links.push(`<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`);
    }
    this.popoverEl.innerHTML = `
      <h4>${marker.direction === 'up' ? '▲' : '▼'} ${fmtDelta(marker.delta)} move</h4>
      <div class="tiny">${esc(marker.title || marker.ticker)}</div>
      <div class="tiny" style="margin-top:4px">
        ${fmtPrice(marker.from_price)} → ${fmtPrice(marker.to_price)} ·
        ${new Date(marker.ts).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
        · ${esc(marker.interval || '')}
      </div>
      <ul>${links.map((l) => `<li>${l}</li>`).join('')}</ul>
      <div class="tiny" style="margin-top:6px">
        Links are the official event page and primary-source data pages for this topic.
        They are <em>candidates</em>, not confirmed causes.
      </div>`;
    this.popoverEl.classList.add('visible');
    const parentRect = this.popoverEl.parentElement.getBoundingClientRect();
    const left = Math.min(Math.max(x + rect.left - parentRect.left - 145, 4), parentRect.width - 300);
    this.popoverEl.style.left = `${left}px`;
    this.popoverEl.style.top = `${y + 18}px`;
  }

  setData(data) {
    this.data = { ...this.data, ...data };
    if (this.popoverEl) this.popoverEl.classList.remove('visible');
    this.draw();
  }

  _size() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(rect.width, 200);
    const h = Math.max(rect.height, 160);
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  draw() {
    const { ctx } = this;
    const { w, h } = this._size();
    ctx.clearRect(0, 0, w, h);
    const series = (this.data.series || []).filter((p) => Number.isFinite(p.price));
    const plotW = w - PAD.left - PAD.right;
    const plotH = h - PAD.top - PAD.bottom;

    if (!series.length) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No official candle data for this market yet.', w / 2, h / 2);
      this.markerHits = [];
      return;
    }

    const t0 = series[0].t;
    const t1 = Math.max(series[series.length - 1].t, t0 + 60000);
    const xOf = (t) => PAD.left + ((t - t0) / (t1 - t0)) * plotW;

    // Y domain: pad around observed prices but stay within 0..1
    let min = Math.min(...series.map((p) => p.price));
    let max = Math.max(...series.map((p) => p.price));
    const pad = Math.max((max - min) * 0.15, 0.02);
    min = Math.max(0, min - pad);
    max = Math.min(1, max + pad);
    if (max - min < 0.05) { min = Math.max(0, min - 0.025); max = Math.min(1, max + 0.025); }
    const yOf = (p) => PAD.top + plotH - ((p - min) / (max - min)) * plotH;

    // grid + y labels
    ctx.strokeStyle = '#eef2f6';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'right';
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i += 1) {
      const v = min + ((max - min) * i) / ySteps;
      const y = yOf(v);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(w - PAD.right, y);
      ctx.stroke();
      ctx.fillText(`$${v.toFixed(2)}`, PAD.left - 6, y + 3);
    }

    // x labels
    ctx.textAlign = 'center';
    const spanMs = t1 - t0;
    const ticks = 5;
    for (let i = 0; i <= ticks; i += 1) {
      const t = t0 + (spanMs * i) / ticks;
      const x = xOf(t);
      ctx.strokeStyle = '#f4f7fa';
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + plotH);
      ctx.stroke();
      const label = spanMs > 2 * 86400000
        ? fmtDate(t)
        : new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(label, x, h - 8);
    }

    // area + line
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
    grad.addColorStop(0, 'rgba(15,118,110,.18)');
    grad.addColorStop(1, 'rgba(15,118,110,0)');
    ctx.beginPath();
    series.forEach((p, i) => {
      const x = xOf(p.t);
      const y = yOf(p.price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(series[series.length - 1].t), PAD.top + plotH);
    ctx.lineTo(xOf(series[0].t), PAD.top + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    series.forEach((p, i) => {
      const x = xOf(p.t);
      const y = yOf(p.price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // last price label
    const last = series[series.length - 1];
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(xOf(last.t), yOf(last.price), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(fmtPrice(last.price), w - PAD.right - 2, yOf(last.price) - 7);

    // jump markers
    this.markerHits = [];
    for (const marker of this.data.markers || []) {
      if (marker.ts < t0 || marker.ts > t1) continue;
      const x = xOf(marker.ts);
      const y = yOf(marker.to_price);
      const color = marker.direction === 'up' ? '#047857' : '#b91c1c';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.28;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      this.markerHits.push({ x, y, marker });
    }

    // crosshair
    if (this.hover) {
      const { x, y } = this.hover;
      if (x >= PAD.left && x <= w - PAD.right) {
        const t = t0 + ((x - PAD.left) / plotW) * (t1 - t0);
        let nearest = series[0];
        for (const p of series) if (Math.abs(p.t - t) < Math.abs(nearest.t - t)) nearest = p;
        const nx = xOf(nearest.t);
        const ny = yOf(nearest.price);
        ctx.strokeStyle = '#94a3b8';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(nx, PAD.top);
        ctx.lineTo(nx, PAD.top + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();
        if (this.tooltipEl) {
          this.tooltipEl.innerHTML = `${fmtPrice(nearest.price)} · ${this.data.priceLabel}<br>${fmtClock(nearest.t)}`;
          this.tooltipEl.style.left = `${nx}px`;
          this.tooltipEl.style.top = `${Math.max(ny, 24)}px`;
          this.tooltipEl.classList.add('visible');
        }
        // keep the in-chart y value for hit testing
        this._lastY = y;
      }
    } else if (this.tooltipEl) {
      this.tooltipEl.classList.remove('visible');
    }
  }
}
