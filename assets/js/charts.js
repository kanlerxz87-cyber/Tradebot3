/**
 * Lightweight High-DPI Interactive Canvas Charts (Zero External Dependencies)
 * - Live Contract Price Chart:
 *   - X-axis: Time (selectable: seconds, minutes, hours)
 *   - Y-axis: Current Contract Price ($0.00 - $1.00)
 *   - Interactive hover crosshair + live price/timestamp readout tooltip
 *   - Plots >= $0.10 sharp jump catalyst markers with click & hover inspection
 * - Portfolio Equity Curve Chart
 * - Trade Category P&L Bar Chart
 */

function formatAxisTime(ts, timeframe) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  if (timeframe === 'seconds') return `${hh}:${mm}:${ss}`;
  if (timeframe === 'minutes') return `${hh}:${mm}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()} ${hh}:00`;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawPriceChartFrame(canvas, market, timeframe, hoverX = null) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || 640));
  const height = Math.max(240, Math.floor(rect.height || 300));

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const points = (market.series && (market.series[timeframe] || market.series.minutes)) || [];
  const pad = { top: 24, right: 24, bottom: 38, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (points.length < 2) {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Awaiting price data...', pad.left + 12, pad.top + 30);
    return [];
  }

  const minTs = points[0].ts;
  const maxTs = points[points.length - 1].ts;
  const tsSpan = Math.max(1, maxTs - minTs);

  const xFor = (ts) => pad.left + ((ts - minTs) / tsSpan) * plotW;
  const yFor = (price) => pad.top + (1 - Math.max(0, Math.min(1, price))) * plotH;

  // Horizontal grid lines ($0.00 to $1.00 in $0.20 steps)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((lvl) => {
    const y = yFor(lvl);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(`$${lvl.toFixed(2)}`, pad.left - 8, y);
  });

  // Y-axis label
  ctx.save();
  ctx.translate(14, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('Contract Price ($)', 0, 0);
  ctx.restore();

  // X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#475569';
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  const ticks = 5;
  for (let i = 0; i <= ticks; i += 1) {
    const ratio = i / ticks;
    const ts = minTs + ratio * tsSpan;
    const x = pad.left + ratio * plotW;
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();
    ctx.fillText(formatAxisTime(ts, timeframe), x, pad.top + plotH + 8);
  }

  // Model Fair Value reference line (if open)
  if (market.status === 'Open' && typeof market.modelFairValue === 'number') {
    const fy = yFor(market.modelFairValue);
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(pad.left, fy);
    ctx.lineTo(width - pad.right, fy);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#6d28d9';
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Model Fair $${market.modelFairValue.toFixed(2)}`, width - pad.right - 4, Math.max(pad.top + 8, fy - 7));
  }

  // Area fill under price curve
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  grad.addColorStop(0, 'rgba(15, 118, 110, 0.22)');
  grad.addColorStop(1, 'rgba(15, 118, 110, 0.01)');

  ctx.beginPath();
  points.forEach((pt, idx) => {
    const x = xFor(pt.ts);
    const y = yFor(pt.price);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(xFor(points[points.length - 1].ts), pad.top + plotH);
  ctx.lineTo(xFor(points[0].ts), pad.top + plotH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Main price line
  ctx.beginPath();
  points.forEach((pt, idx) => {
    const x = xFor(pt.ts);
    const y = yFor(pt.price);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Current price dot
  const lastPt = points[points.length - 1];
  const lastX = xFor(lastPt.ts);
  const lastY = yFor(lastPt.price);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0f766e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Plot >= $0.10 jump catalyst markers
  const hitRegions = [];
  (market.series.jumpMarkers || []).forEach((marker) => {
    const mTs = marker.timestamps && marker.timestamps[timeframe];
    const mPrice = marker.prices && marker.prices[timeframe];
    if (!mTs || mTs < minTs || mTs > maxTs) return;
    const mx = xFor(mTs);
    const my = yFor(mPrice);
    const isUp = marker.delta >= 0;
    const color = isUp ? '#15803d' : '#dc2626';

    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = isUp ? 'rgba(21,128,61,0.35)' : 'rgba(220,38,38,0.35)';
    ctx.beginPath();
    ctx.moveTo(mx, pad.top);
    ctx.lineTo(mx, pad.top + plotH);
    ctx.stroke();
    ctx.restore();

    // Marker diamond
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.fillRect(-5.5, -5.5, 11, 11);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-5.5, -5.5, 11, 11);
    ctx.restore();

    const pillText = `${isUp ? '+' : ''}$${marker.delta.toFixed(2)}`;
    ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    const textW = ctx.measureText(pillText).width + 10;
    const pillX = Math.max(pad.left + 4, Math.min(width - pad.right - textW - 4, mx - textW / 2));
    const pillY = my > pad.top + 34 ? my - 26 : my + 12;

    ctx.fillStyle = color;
    drawRoundedRect(ctx, pillX, pillY, textW, 18, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pillText, pillX + textW / 2, pillY + 9);

    hitRegions.push({ x: mx, y: my, radius: 16, marker });
  });

  // Interactive Hover Crosshair + Price/Time Tooltip
  if (hoverX !== null && hoverX >= pad.left && hoverX <= width - pad.right) {
    let closest = points[0];
    let bestDist = Infinity;
    for (const pt of points) {
      const dist = Math.abs(xFor(pt.ts) - hoverX);
      if (dist < bestDist) {
        bestDist = dist;
        closest = pt;
      }
    }
    const cx = xFor(closest.ts);
    const cy = yFor(closest.price);

    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, pad.top);
    ctx.lineTo(cx, pad.top + plotH);
    ctx.moveTo(pad.left, cy);
    ctx.lineTo(width - pad.right, cy);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const tipText = `YES $${closest.price.toFixed(2)} (NO $${(1 - closest.price).toFixed(2)}) · ${formatAxisTime(closest.ts, timeframe)}`;
    ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    const tw = ctx.measureText(tipText).width + 16;
    const th = 22;
    const tx = Math.max(pad.left + 4, Math.min(width - pad.right - tw - 4, cx - tw / 2));
    const ty = Math.max(4, cy - 32);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    drawRoundedRect(ctx, tx, ty, tw, th, 5);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tipText, tx + tw / 2, ty + th / 2);
  }

  return hitRegions;
}

export function renderPriceChart(canvas, market, timeframe = 'minutes', { onMarkerSelect = null } = {}) {
  if (!canvas || !market || !market.series) return [];
  canvas._chartState = { market, timeframe };
  canvas._onMarkerSelect = onMarkerSelect;

  const hitRegions = drawPriceChartFrame(canvas, market, timeframe, canvas._hoverX ?? null);
  canvas._hitRegions = hitRegions;

  if (!canvas._eventsBound) {
    canvas._eventsBound = true;
    canvas.addEventListener('click', (evt) => {
      if (!canvas._onMarkerSelect || !canvas._hitRegions) return;
      const box = canvas.getBoundingClientRect();
      const cx = evt.clientX - box.left;
      const cy = evt.clientY - box.top;
      const hit = canvas._hitRegions.find((r) => Math.hypot(cx - r.x, cy - r.y) <= r.radius + 6);
      if (hit) canvas._onMarkerSelect(hit.marker);
    });

    canvas.addEventListener('mousemove', (evt) => {
      if (!canvas._chartState) return;
      const box = canvas.getBoundingClientRect();
      canvas._hoverX = evt.clientX - box.left;
      const { market: m, timeframe: tf } = canvas._chartState;
      canvas._hitRegions = drawPriceChartFrame(canvas, m, tf, canvas._hoverX);
    });

    canvas.addEventListener('mouseleave', () => {
      if (!canvas._chartState) return;
      canvas._hoverX = null;
      const { market: m, timeframe: tf } = canvas._chartState;
      canvas._hitRegions = drawPriceChartFrame(canvas, m, tf, null);
    });
  }

  return hitRegions;
}

export function renderEquityChart(canvas, equityCurve = []) {
  if (!canvas || !equityCurve.length) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || 560));
  const height = Math.max(190, Math.floor(rect.height || 220));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top: 20, right: 20, bottom: 32, left: 66 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const vals = equityCurve.map((p) => p.equity);
  const minVal = Math.min(9980, ...vals) - 10;
  const maxVal = Math.max(10020, ...vals) + 10;
  const span = Math.max(1, maxVal - minVal);
  const minTs = equityCurve[0].ts;
  const maxTs = Math.max(minTs + 1000, equityCurve[equityCurve.length - 1].ts);

  const xFor = (ts) => pad.left + ((ts - minTs) / (maxTs - minTs)) * plotW;
  const yFor = (v) => pad.top + (1 - (v - minVal) / span) * plotH;

  ctx.strokeStyle = '#e2e8f0';
  ctx.fillStyle = '#475569';
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i += 1) {
    const val = minVal + (span * i) / 4;
    const y = yFor(val);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(`$${val.toFixed(0)}`, pad.left - 8, y);
  }

  const baseY = yFor(10000);
  if (baseY >= pad.top && baseY <= pad.top + plotH) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(pad.left, baseY);
    ctx.lineTo(width - pad.right, baseY);
    ctx.stroke();
    ctx.restore();
  }

  const lastVal = vals[vals.length - 1];
  const color = lastVal >= 10000 ? '#15803d' : '#dc2626';
  ctx.beginPath();
  equityCurve.forEach((pt, idx) => {
    const x = xFor(pt.ts);
    const y = yFor(pt.equity);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.stroke();
}

/**
 * Simple horizontal bar chart comparing Net P&L across trade categories.
 */
export function renderCategoryBarChart(canvas, analytics = []) {
  if (!canvas || !analytics.length) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || 520));
  const height = Math.max(180, Math.floor(rect.height || 210));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const pad = { top: 14, right: 64, bottom: 18, left: 138 };
  const plotW = Math.max(80, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;

  const maxAbs = Math.max(5, ...analytics.map((r) => Math.abs(r.pnl || 0)));
  const zeroX = pad.left + plotW / 2;
  const rowH = plotH / analytics.length;

  // Zero axis line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(zeroX, pad.top);
  ctx.lineTo(zeroX, pad.top + plotH);
  ctx.stroke();

  analytics.forEach((row, idx) => {
    const yMid = pad.top + idx * rowH + rowH / 2;
    const barH = Math.max(10, Math.min(18, rowH - 8));
    const val = row.pnl || 0;
    const barW = (Math.abs(val) / maxAbs) * (plotW / 2 - 6);

    // Category label
    ctx.fillStyle = '#334155';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.category, pad.left - 8, yMid);

    // Bar
    ctx.fillStyle = val >= 0 ? '#15803d' : '#dc2626';
    const bx = val >= 0 ? zeroX : zeroX - barW;
    if (barW > 0.5) {
      drawRoundedRect(ctx, bx, yMid - barH / 2, barW, barH, 3);
      ctx.fill();
    }

    // Value label
    ctx.fillStyle = val >= 0 ? '#15803d' : '#dc2626';
    ctx.font = '700 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${val >= 0 ? '+' : ''}$${val.toFixed(2)}`, pad.left + plotW + 6, yMid);
  });
}
