export const API = 'https://external-api.demo.kalshi.co/trade-api/v2';
export const DOCS = 'https://docs.kalshi.com/api-reference/events/get-events';
export const TOPICS = {'gas-prices':'Gas prices',elections:'Elections',culture:'Culture',crypto:'Crypto',golf:'Golf'};
export function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function number(value) { if (value === null || value === undefined || value === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
export function price(value) { const n = number(value); return n === null ? '—' : `$${n.toFixed(2)}`; }
// Only exact API category labels are used; no keyword-based category inference.
export function category(event) { const label = String(event.category || '').trim().toLowerCase(); return Object.keys(TOPICS).find(k => TOPICS[k].toLowerCase() === label) || null; }
export function priceChange(before, after) { const a = number(before), b = number(after); if (a === null || b === null) return null; const delta = Math.round((b - a) * 10000) / 10000; return Math.abs(delta) >= .1 ? delta : null; }
export function marketUrl(ticker) { return `${API}/markets/${encodeURIComponent(ticker)}`; }
export function marketRows(events, topic) { return events.flatMap(e => {const key = category(e); if (!key || (topic && key !== topic)) return []; return (Array.isArray(e.markets) ? e.markets : []).filter(m => m.ticker).map(m => ({...m, eventTitle:e.title, topic:key})); }); }
