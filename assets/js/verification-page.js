/**
 * Controller for:
 * - verification.html (Verified Kalshi Demo API endpoints, repository audit, future-upgrade suggestions)
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
      (m) => m.volumeUsd === null || m.resolution === null || m.observedPrice === null || m.observedSwing === null || m.verifiedRestingLiquidity === null || m.status === 'Needs Review'
    );
    unverifiedBody.innerHTML = flaggedRows
      .map((m) => {
        const missingFields = [];
        if (m.volumeUsd === null) missingFields.push('Production event-volume snapshot (blank)');
        if (m.resolution === null || m.status === 'Needs Review') missingFields.push('Lifecycle / final YES-NO result (needs review)');
        if (m.observedPrice === null) missingFields.push('Historical observed price (blank; no timestamped catalog quote)');
        if (m.observedSwing === null) missingFields.push('Historical price swing (blank; no verified price series)');
        if (m.verifiedRestingLiquidity === null) missingFields.push('Resting depth (dynamic; shown only after successful Demo REST request)');
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
