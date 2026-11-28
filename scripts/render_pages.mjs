#!/usr/bin/env node
/**
 * Tradebot3 — offline page-render smoke test.
 *
 * Why this exists: the browser modules are ES modules with no build step, so a
 * path or DOM mistake only shows up at runtime. That already happened once — the
 * data files were referenced page-relatively, so all five topic pages requested
 * `categories/assets/data/snapshot.json` and rendered an empty dashboard while
 * every static check passed. This harness boots each page against the real
 * snapshot and fails if a page renders nothing or logs an error.
 *
 * It needs jsdom, which is intentionally NOT a project dependency (the site
 * itself must stay dependency-free). CI installs it into a temp dir; locally:
 *
 *   npm install --no-save jsdom && node scripts/render_pages.mjs
 *
 * Exit code 1 on any page that fails to render.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let JSDOM;
try {
  ({ JSDOM } = await import('jsdom'));
} catch {
  console.error('SKIP: jsdom is not installed. Run: npm install --no-save jsdom');
  process.exit(0); // never fail a build for a missing optional tool
}

const HELPERS = ['core.js', 'market-data.js', 'chart.js', 'alerts.js', 'orderbook.js', 'paper.js', 'strategy.js'];
const PAGES = [
  'index.html',
  'portfolio.html',
  'verification.html',
  'flagged-for-review.html',
  'executive-summary.html',
  'categories/gas-prices.html',
  'categories/elections.html',
  'categories/culture.html',
  'categories/crypto.html',
  'categories/golf.html',
];

/** Strip ES-module syntax so the bundle can be evaluated in a jsdom window. */
function strip(src) {
  return src
    .replace(/import\.meta\.url/g, JSON.stringify(pathToFileURL(path.join(ROOT, 'assets/js/core.js')).href))
    .replace(/^\s*import\s+\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*import\s+\w+\s+from\s*['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*export\s+\{[^}]*\};?\s*$/gm, '')
    .replace(/^export\s+(const|let|var|function|class|async)/gm, '$1');
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];

for (const rel of PAGES) {
  const file = path.join(ROOT, rel);
  const errors = [];
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {
    url: `https://kanlerxz87-cyber.github.io/Tradebot3/${rel}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const win = dom.window;

  // jsdom has no canvas implementation; stub just enough for chart.js.
  win.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
    get: (t, p) => (p === 'measureText' ? () => ({ width: 10 })
      : p === 'createLinearGradient' ? () => ({ addColorStop() {} })
        : () => {}),
    set: () => true,
  });
  win.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ width: 600, height: 240, left: 0, top: 0 });
  win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  win.scrollTo = () => {};

  // Serve local files; external hosts (the Kalshi API) are unreachable here and
  // must degrade gracefully, which is exactly what the page is supposed to do.
  win.fetch = async (url) => {
    const raw = String(url);
    if (/^https?:/.test(raw) && !/kanlerxz87-cyber\.github\.io/.test(raw)) {
      return { ok: false, status: 0, json: async () => ({}), text: async () => '' };
    }
    const u = new URL(raw, `https://kanlerxz87-cyber.github.io/Tradebot3/${rel}`);
    // SITE.dataFile is module-relative, so under Node it is a file:// URL.
    const local = u.protocol === 'file:'
      ? fileURLToPath(u)
      : path.join(ROOT, decodeURIComponent(u.pathname).replace(/^\/Tradebot3\//, '').replace(/^\//, ''));
    if (!fs.existsSync(local) || fs.statSync(local).isDirectory()) {
      return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
    }
    const text = fs.readFileSync(local, 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text };
  };
  win.addEventListener('error', (e) => errors.push(`error: ${e.message}`));
  win.console.error = (...a) => errors.push(`console.error: ${a.map(String).join(' ').slice(0, 300)}`);

  const tags = [...win.document.querySelectorAll('script[type="module"]')];
  const pageScript = tags.map((t) => t.getAttribute('src')).filter(Boolean).pop();
  const inline = tags.filter((t) => !t.getAttribute('src')).map((t) => t.textContent).join('\n');
  const bundle = HELPERS.map((m) => strip(fs.readFileSync(path.join(ROOT, 'assets/js', m), 'utf8'))).join('\n;\n')
    + '\n;\n'
    + (pageScript
      ? strip(fs.readFileSync(path.join(ROOT, pageScript.replace(/^\.\.\//, '')), 'utf8'))
      : strip(inline));

  try {
    await win.eval(`(async function(){\n${bundle}\n})()`);
  } catch (err) {
    errors.push(`boot: ${err.message}`);
  }
  await wait(350);

  const doc = win.document;
  const text = doc.body.textContent || '';
  const placeholders = ['Loading…', 'Loading the official Kalshi snapshot', 'Loading audit results']
    .filter((t) => text.includes(t));
  const hasHeader = Boolean(doc.querySelector('.site-header .site-nav'));
  const externalLinks = doc.querySelectorAll('a[href^="https://"]').length;

  const problems = [];
  if (!hasHeader) problems.push('no navigation rendered');
  if (!doc.querySelector('.site-footer')) problems.push('no footer rendered');
  if (placeholders.length) problems.push(`placeholders left: ${placeholders.join(', ')}`);
  if (errors.length) problems.push(...errors);
  // Every page must render at least one real number from the snapshot.
  if (rel !== 'executive-summary.html' && !/[0-9]/.test(text.replace(/\s+/g, ''))) {
    problems.push('no numeric content rendered');
  }
  if (externalLinks < 2) problems.push(`only ${externalLinks} external source links`);
  // Pages that render a market picker must have populated it from the snapshot.
  for (const sel of ['#chart-market-select', '#pf-market', '#qt-market']) {
    const node = doc.querySelector(sel);
    if (node && node.tagName === 'SELECT' && node.options.length === 0) {
      problems.push(`${sel} is empty`);
    }
  }

  // Every rendered internal link (including JS-injected header/footer/table links)
  // must resolve to an existing file on disk (IRREG-36 regression pin).
  for (const a of doc.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') || '';
    if (!href || /^(https?:|mailto:|data:|#|javascript:)/.test(href)) continue;
    const resolved = new URL(href, `https://kanlerxz87-cyber.github.io/Tradebot3/${rel}`);
    const targetRel = decodeURIComponent(resolved.pathname).replace(/^\/Tradebot3\//, '').replace(/^\//, '');
    const targetPath = path.join(ROOT, targetRel || 'index.html');
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
      problems.push(`broken rendered link "${href}" -> ${targetRel}`);
    }
  }

  // Every non-empty rendered table row must include at least one clickable source link.
  for (const tr of doc.querySelectorAll('table.data tbody tr')) {
    if (tr.querySelector('.table-empty')) continue;
    if (!tr.querySelector('a[href]')) {
      problems.push(`table row missing source link: "${(tr.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70)}"`);
    }
  }

  const label = rel.padEnd(34);
  if (problems.length) {
    failures.push(`${rel}: ${problems.join(' | ')}`);
    console.log(`${label} FAIL`);
    for (const p of problems.slice(0, 4)) console.log('   !', p);
  } else {
    console.log(`${label} ok  (nav, footer, ${externalLinks} source links, no errors)`);
  }
}

if (failures.length) {
  console.error(`\nFAILED — ${failures.length} of ${PAGES.length} pages did not render cleanly:`);
  for (const f of failures) console.error('  x', f);
  process.exit(1);
}
console.log(`\nOK — all ${PAGES.length} pages booted and rendered with no errors.`);

// jsdom keeps the page's interval timers (the live poll) alive, so the event loop
// would never drain on its own. Exit explicitly once every page has been checked.
process.exit(0);
