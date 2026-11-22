/**
 * Canvas charts for timestamped Kalshi Demo REST observations and local paper equity.
 * The price chart intentionally does not fabricate history or mix paper simulation prices with
 * Demo REST observations. REST points are sampled only while the page is open.
 */

function formatAxisTime(ts, rangeHours) {
  const date = new Date(ts);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (rangeHours >= 24) return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
  if (rangeHours >= 6) return `${date.toLocaleDateString([], { weekday: 'short' })} ${time}`;
  return time;
}

export function renderPriceChart(canvas, market, rangeHours = 1, { onMarkerSelect = null } = {}) {
  if (!canvas || !market) return [];
  const devicePixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || 640));
  const height = Math.max(240, Math.floor(rect.height || 300));
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  const context = canvas.getContext('2d');
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  const pad = { top: 24, right: 24, bottom: 38, left: 56 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  const rangeMs = Math.max(1, Number(rangeHours) || 1) * 60 * 60 * 1000;
  const latestTimestamp = market.series?.snapshots?.length
    ? market.series.snapshots[market.series.snapshots.length - 1].ts
    : Date.now();
  const minTimestamp = latestTimestamp - rangeMs;
  const points = (market.series?.snapshots || []).filter((point) => point.ts >= minTimestamp && point.ts <= latestTimestamp);
  const span = Math.max(1, latestTimestamp - minTimestamp);
  const xFor = (ts) => pad.left + ((ts - minTimestamp) / span) * plotWidth;
  const yFor = (price) => pad.top + (1 - Math.max(0, Math.min(1, price))) * plotHeight;

  context.strokeStyle = '#e2e8f0';
  context.lineWidth = 1;
  context.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  context.fillStyle = '#475569';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((level) => {
    const y = yFor(level);
    context.beginPath();
    context.moveTo(pad.left, y);
    context.lineTo(width - pad.right, y);
    context.stroke();
    context.fillText(`$${level.toFixed(2)}`, pad.left - 8, y);
  });

  context.save();
  context.translate(14, pad.top + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.fillStyle = '#64748b';
  context.font = '600 11px system-ui, sans-serif';
  context.fillText('YES last price ($)', 0, 0);
  context.restore();

  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillStyle = '#475569';
  context.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  const ticks = 5;
  for (let index = 0; index <= ticks; index += 1) {
    const ratio = index / ticks;
    const timestamp = minTimestamp + ratio * span;
    const x = pad.left + ratio * plotWidth;
    context.strokeStyle = '#f1f5f9';
    context.beginPath();
    context.moveTo(x, pad.top);
    context.lineTo(x, pad.top + plotHeight);
    context.stroke();
    context.fillText(formatAxisTime(timestamp, Number(rangeHours) || 1), x, pad.top + plotHeight + 8);
  }

  if (!points.length) {
    context.fillStyle = '#475569';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.font = '13px system-ui, sans-serif';
    context.fillText('No timestamped Demo REST quote is loaded for this contract.', pad.left + 12, pad.top + 16);
    context.fillText('History begins after a successful browser request; no prices are fabricated.', pad.left + 12, pad.top + 38);
    canvas._hitRegions = [];
    canvas._onMarkerSelect = onMarkerSelect;
    return [];
  }

  const gradient = context.createLinearGradient(0, pad.top, 0, pad.top + plotHeight);
  gradient.addColorStop(0, 'rgba(15, 118, 110, 0.22)');
  gradient.addColorStop(1, 'rgba(15, 118, 110, 0.01)');
  context.beginPath();
  points.forEach((point, index) => {
    const x = xFor(point.ts);
    const y = yFor(point.price);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  if (points.length > 1) {
    context.lineTo(xFor(points[points.length - 1].ts), pad.top + plotHeight);
    context.lineTo(xFor(points[0].ts), pad.top + plotHeight);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
  }

  context.beginPath();
  points.forEach((point, index) => {
    const x = xFor(point.ts);
    const y = yFor(point.price);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = '#0f766e';
  context.lineWidth = 2.4;
  context.lineJoin = 'round';
  context.stroke();

  const lastPoint = points[points.length - 1];
  context.beginPath();
  context.arc(xFor(lastPoint.ts), yFor(lastPoint.price), 4.5, 0, Math.PI * 2);
  context.fillStyle = '#0f766e';
  context.fill();
  context.strokeStyle = '#ffffff';
  context.lineWidth = 2;
  context.stroke();

  const hitRegions = [];
  (market.series?.jumpMarkers || []).forEach((marker) => {
    if (marker.simulated || !marker.ts || marker.ts < minTimestamp || marker.ts > latestTimestamp) return;
    const x = xFor(marker.ts);
    const y = yFor(marker.price);
    const up = marker.delta >= 0;
    const color = up ? '#15803d' : '#dc2626';
    context.save();
    context.setLineDash([2, 3]);
    context.strokeStyle = up ? 'rgba(21,128,61,0.35)' : 'rgba(220,38,38,0.35)';
    context.beginPath();
    context.moveTo(x, pad.top);
    context.lineTo(x, pad.top + plotHeight);
    context.stroke();
    context.restore();

    context.save();
    context.translate(x, y);
    context.rotate(Math.PI / 4);
    context.fillStyle = color;
    context.fillRect(-5.5, -5.5, 11, 11);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 1.8;
    context.strokeRect(-5.5, -5.5, 11, 11);
    context.restore();

    const label = `${up ? '+' : ''}$${Number(marker.delta).toFixed(2)}`;
    context.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    const labelWidth = context.measureText(label).width + 10;
    const labelX = Math.max(pad.left + 4, Math.min(width - pad.right - labelWidth - 4, x - labelWidth / 2));
    const labelY = y > pad.top + 34 ? y - 26 : y + 12;
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(labelX, labelY, labelWidth, 18, 4);
    context.fill();
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, labelX + labelWidth / 2, labelY + 9);
    hitRegions.push({ x, y, radius: 16, marker });
  });

  canvas._hitRegions = hitRegions;
  canvas._onMarkerSelect = onMarkerSelect;
  if (!canvas._clickBound) {
    canvas._clickBound = true;
    canvas.addEventListener('click', (event) => {
      if (!canvas._onMarkerSelect || !canvas._hitRegions) return;
      const box = canvas.getBoundingClientRect();
      const clickX = event.clientX - box.left;
      const clickY = event.clientY - box.top;
      const hit = canvas._hitRegions.find((region) => Math.hypot(clickX - region.x, clickY - region.y) <= region.radius + 6);
      if (hit) canvas._onMarkerSelect(hit.marker);
    });
  }
  return hitRegions;
}

export function renderEquityChart(canvas, equityCurve = []) {
  if (!canvas) return;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || 560));
  const height = Math.max(190, Math.floor(rect.height || 220));
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  const context = canvas.getContext('2d');
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  const pad = { top: 20, right: 20, bottom: 32, left: 66 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  if (!equityCurve.length) {
    context.fillStyle = '#64748b';
    context.font = '13px system-ui, sans-serif';
    context.fillText('No local paper equity observations yet.', pad.left + 8, pad.top + 20);
    return;
  }

  const values = equityCurve.map((point) => point.equity);
  const minValue = Math.min(9980, ...values) - 10;
  const maxValue = Math.max(10020, ...values) + 10;
  const valueSpan = Math.max(1, maxValue - minValue);
  const minTimestamp = equityCurve[0].ts;
  const maxTimestamp = Math.max(minTimestamp + 1000, equityCurve[equityCurve.length - 1].ts);
  const xFor = (timestamp) => pad.left + ((timestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * plotWidth;
  const yFor = (value) => pad.top + (1 - (value - minValue) / valueSpan) * plotHeight;

  context.strokeStyle = '#e2e8f0';
  context.fillStyle = '#475569';
  context.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  for (let index = 0; index <= 4; index += 1) {
    const value = minValue + (valueSpan * index) / 4;
    const y = yFor(value);
    context.beginPath();
    context.moveTo(pad.left, y);
    context.lineTo(width - pad.right, y);
    context.stroke();
    context.fillText(`$${value.toFixed(0)}`, pad.left - 8, y);
  }

  const baselineY = yFor(10_000);
  if (baselineY >= pad.top && baselineY <= pad.top + plotHeight) {
    context.save();
    context.setLineDash([4, 4]);
    context.strokeStyle = '#94a3b8';
    context.beginPath();
    context.moveTo(pad.left, baselineY);
    context.lineTo(width - pad.right, baselineY);
    context.stroke();
    context.restore();
  }

  context.beginPath();
  equityCurve.forEach((point, index) => {
    const x = xFor(point.ts);
    const y = yFor(point.equity);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = values[values.length - 1] >= 10_000 ? '#15803d' : '#dc2626';
  context.lineWidth = 2.2;
  context.stroke();
  if (equityCurve.length === 1) {
    context.fillStyle = '#0f766e';
    context.beginPath();
    context.arc(pad.left, yFor(values[0]), 4, 0, Math.PI * 2);
    context.fill();
  }
}
