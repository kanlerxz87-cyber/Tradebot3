/**
 * Tradebot3 — flagged-for-review page: renders the legacy claim audit
 * produced by scripts/fetch_kalshi_data.py --audit-legacy.
 */

import { SITE, initChrome, qs, esc, fmtNum, fmtContracts, fmtDateTime, timeAgo, isNum } from './core.js';

initChrome({ active: 'flagged-for-review.html' });

function price(v) {
  return isNum(v) ? `$${v.toFixed(v < 0.1 ? 3 : 2)}` : '—';
}

async function load() {
  const status = qs('#flagged-status');
  let audit = null;
  try {
    const res = await fetch(`${SITE.legacyAuditFile}?v=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) audit = await res.json();
  } catch { /* handled below */ }

  if (!audit) {
    status.innerHTML = '<span class="status-warn">Audit JSON not available yet.</span> The scheduled Kalshi data job writes it; it appears after the first successful run.';
    return;
  }

  const found = audit.claims_found_in_api;
  const total = audit.claims_checked;
  const eventOnly = audit.claims_found_as_event_only
    ?? (audit.rows || []).filter((r) => r.api_event_found && !r.api_found).length;
  const absent = audit.claims_absent_from_api ?? (total - found - eventOnly);
  status.innerHTML = `
    <span><strong>Audit run</strong> ${esc(fmtDateTime(audit.generated_at))} UTC (${esc(timeAgo(audit.generated_at))})</span>
    <span class="sep">|</span>
    <span><strong>${fmtNum(found)}</strong> of <strong>${fmtNum(total)}</strong> claims are real Kalshi <em>markets</em></span>
    <span class="sep">|</span>
    <span><strong>${fmtNum(eventOnly)}</strong> are Kalshi <em>event</em> tickers (they exist, but the claimed market-level price/volume cannot be a market value)</span>
    <span class="sep">|</span>
    <span class="status-err">${fmtNum(absent)} match no Kalshi record at all</span>
    <span class="sep">|</span>
    <a href="${esc(audit.api_base)}" target="_blank" rel="noopener noreferrer">API used</a>`;

  qs('#audit-summary').innerHTML = status.innerHTML;

  const body = qs('#legacy-body');
  body.innerHTML = '';
  for (const row of audit.rows) {
    const tr = document.createElement('tr');
    const notes = (row.notes || []).map((n) => esc(n)).join('<br>');
    tr.innerHTML = `
      <td class="ticker">${esc(row.ticker)}</td>
      <td>${esc(row.topic || '—')}</td>
      <td class="num">${isNum(row.claimed_volume_usd) ? fmtContracts(row.claimed_volume_usd) : '<span class="tiny">blank</span>'}</td>
      <td class="num">${price(row.claimed_price)}</td>
      <td>${row.api_found
        ? '<span class="badge badge-up">market</span>'
        : row.api_event_found
          ? '<span class="badge badge-warn">event only</span>'
          : '<span class="badge badge-down">absent</span>'}</td>
      <td class="num">${price(row.api_last_price)}</td>
      <td class="num">${row.api_volume_contracts === null ? '—' : fmtContracts(row.api_volume_contracts)}</td>
      <td>${row.api_result ? `<span class="badge badge-${row.api_result === 'yes' ? 'yes' : 'no'}">${esc(String(row.api_result).toUpperCase())}</span>` : '—'}</td>
      <td class="num">${row.url_http_status === null ? '—' : esc(row.url_http_status)}</td>
      <td class="tiny">
        <a href="https://external-api.kalshi.com/trade-api/v2/markets/${encodeURIComponent(row.ticker || '')}" target="_blank" rel="noopener noreferrer">market API</a><br>
        <a href="https://kalshi.com/events/${encodeURIComponent((row.ticker || '').split('-').slice(0, 2).join('-'))}" target="_blank" rel="noopener noreferrer">event page</a>
      </td>
      <td class="tiny">${notes || '—'}</td>`;
    body.append(tr);
  }

  try {
    const res = await fetch(`${SITE.dataFile}?v=${Date.now()}`, { cache: 'no-store' });
    const snap = await res.json();
    const demoBody = qs('#demo-body');
    const rows = snap.demo_spot_check || [];
    demoBody.innerHTML = rows.length ? rows.map((r) => `<tr>
      <td class="ticker"><a href="https://kalshi.com/events/${encodeURIComponent(String(r.ticker).split('-').slice(0, 2).join('-'))}" target="_blank" rel="noopener noreferrer">${esc(r.ticker)}</a></td>
      <td class="num">${price(r.prod_last_price)}</td>
      <td class="num">${price(r.demo_last_price)}</td>
      <td class="num">${fmtContracts(r.prod_volume)}</td>
      <td class="num">${fmtContracts(r.demo_volume)}</td></tr>`).join('')
      : '<tr><td colspan="5" class="table-empty">No spot check in this refresh.</td></tr>';
  } catch {
    qs('#demo-body').innerHTML = '<tr><td colspan="5" class="table-empty">Snapshot unavailable.</td></tr>';
  }
}

load();
