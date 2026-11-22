/**
 * Controller for:
 * - verification.html (Verified Kalshi Demo API Endpoints, Repo Line-by-Line Audit, Live/Interactive Suggestions)
 * - flagged-for-review.html (All Flagged Irregularities & Unverified Market Fields with Source Links)
 */

import {
  DEMO_API_ENDPOINTS,
  REPO_AUDIT_ITEMS,
  INTERACTIVE_SUGGESTIONS,
  FLAGGED_IRREGULARITIES,
  VERIFIED_MARKETS,
  TOPICS
} from './data.js';
import {
  renderHeader,
  renderFooter,
  escapeHtml,
  formatSourceLink,
  formatTopicBadge,
  formatUnverifiedCell
} from './ui-common.js';

function renderVerificationPage() {
  const apiBody = document.getElementById('api-endpoints-body');
  if (apiBody) {
    apiBody.innerHTML = DEMO_API_ENDPOINTS.map(
      (ep) => `
      <tr>
        <td><strong>${escapeHtml(ep.surface)}</strong></td>
        <td><span class="badge ${ep.status.includes('Recommended') ? 'badge-yes' : 'badge-open'}">${escapeHtml(ep.status)}</span></td>
        <td class="mono small">${escapeHtml(ep.url)}</td>
        <td class="small">${escapeHtml(ep.authRequired)}</td>
        <td class="small">${escapeHtml(ep.notes)}</td>
        <td>${formatSourceLink(ep.sourceUrl, ep.sourceLabel)}</td>
      </tr>
    `
    ).join('');
  }

  const auditBody = document.getElementById('repo-audit-body');
  if (auditBody) {
    auditBody.innerHTML = REPO_AUDIT_ITEMS.map(
      (item) => `
      <tr>
        <td class="mono small"><strong>${escapeHtml(item.path)}</strong></td>
        <td><span class="badge badge-verified">${escapeHtml(item.checkType)}</span></td>
        <td class="small">${escapeHtml(item.finding)}</td>
        <td><span class="badge badge-yes">Verified</span></td>
        <td>${formatSourceLink(item.sourceUrl, item.sourceLabel)}</td>
      </tr>
    `
    ).join('');
  }

  const sugBody = document.getElementById('suggestions-body');
  if (sugBody) {
    sugBody.innerHTML = INTERACTIVE_SUGGESTIONS.map(
      (s) => `
      <tr>
        <td><span class="badge ${s.priority.startsWith('P1') ? 'badge-yes' : 'badge-open'}">${escapeHtml(s.priority)}</span></td>
        <td><strong>${escapeHtml(s.area)}</strong></td>
        <td><strong>${escapeHtml(s.suggestion)}</strong></td>
        <td class="small">${escapeHtml(s.rationale)}</td>
        <td>${formatSourceLink(s.sourceUrl, s.sourceLabel)}</td>
      </tr>
    `
    ).join('');
  }
}

function renderFlaggedPage() {
  const irregBody = document.getElementById('irregularities-body');
  if (irregBody) {
    irregBody.innerHTML = FLAGGED_IRREGULARITIES.map(
      (ir) => `
      <tr>
        <td class="mono"><strong>${escapeHtml(ir.id)}</strong></td>
        <td><span class="badge ${ir.severity === 'High' ? 'badge-no' : ir.severity === 'Medium' ? 'badge-unverified' : 'badge-open'}">${escapeHtml(ir.severity)}</span></td>
        <td><strong>${escapeHtml(ir.category)}</strong></td>
        <td>
          <strong>${escapeHtml(ir.item)}</strong>
          <div class="small muted" style="margin-top:3px;">${escapeHtml(ir.detail)}</div>
        </td>
        <td><span class="badge badge-unverified">${escapeHtml(ir.status)}</span></td>
        <td>${formatSourceLink(ir.sourceUrl, ir.sourceLabel)}</td>
      </tr>
    `
    ).join('');
  }

  const unverifiedBody = document.getElementById('unverified-fields-body');
  if (unverifiedBody) {
    const flaggedRows = VERIFIED_MARKETS.filter(
      (m) => m.volumeUsd === null || m.resolution === null || m.verifiedRestingLiquidity === null
    );
    unverifiedBody.innerHTML = flaggedRows
      .map((m) => {
        const missingFields = [];
        if (m.volumeUsd === null) missingFields.push('Dollar Volume (blank)');
        if (m.resolution === null) missingFields.push('Final YES/NO Settlement (blank)');
        if (m.verifiedRestingLiquidity === null) missingFields.push('Live Resting Orderbook Depth (dynamic)');
        return `
        <tr>
          <td class="mono"><strong>${escapeHtml(m.ticker)}</strong></td>
          <td>${formatTopicBadge(m.topic)}</td>
          <td>${escapeHtml(m.title)}</td>
          <td class="small">${escapeHtml(missingFields.join('; '))}</td>
          <td>${formatUnverifiedCell('Unverified')}</td>
          <td>${formatSourceLink(m.sourceUrl, m.sourceLabel)}</td>
        </tr>
      `;
      })
      .join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mode = document.body.dataset.pageMode || 'verification';
  renderHeader(mode === 'flagged' ? 'flagged' : 'verification');
  renderFooter();
  if (mode === 'flagged') renderFlaggedPage();
  else renderVerificationPage();
});
