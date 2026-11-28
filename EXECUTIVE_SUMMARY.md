# Executive Summary — Tradebot3 Kalshi Live-Event Dashboard

**Date:** 2026-11-28 (UTC)
**Repository:** `kanlerxz87-cyber/Tradebot3`
**Live site:** https://kanlerxz87-cyber.github.io/Tradebot3/
**Full page version:** [`executive-summary.html`](executive-summary.html) on the site.

## What this is

A static GitHub Pages dashboard fed by an automated data pipeline
(`scripts/fetch_kalshi_data.py` + `scripts/enrich_snapshot.py`, scheduled every
30 minutes by GitHub Actions) that scans the full open Kalshi catalog via
`GET /events?status=open&limit=200&with_nested_markets=true` and publishes only
values returned by Kalshi's official public Trade API into
`assets/data/snapshot.json`. No market number on the site is hard-coded.

**Measured, not assumed.** GitHub Actions delivered 16 runs between
2026-11-22T16:34Z and 2026-11-28T02:52Z — a **median gap of 8.79 hours**, not 30
minutes (`assets/data/refresh-history.json`, rendered on `verification.html` §8).
The dashboard therefore shows the snapshot's age (fresh < 2 h, aging < 8 h, else
stale) instead of describing every number as live.

## Scope

Exactly five topics — **gas prices, elections, culture, crypto, golf** — each
with its own page, events grouped within the topic. The snapshot tracks the
top 8 events per topic (by official contract volume `volume_fp`) with up to
5 markets each.

## Verified endpoints (official sources)

- Production REST (public data): `https://external-api.kalshi.com/trade-api/v2`
  — https://docs.kalshi.com/getting_started/api_environments
- Demo REST: `https://external-api.demo.kalshi.co/trade-api/v2`
  (also supported: `https://demo-api.kalshi.co/trade-api/v2`)
- Demo WebSocket: `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2`
  (also supported: `wss://demo-api.kalshi.co/trade-api/ws/v2`)
- Orderbook semantics (bids only, implied ask): https://docs.kalshi.com/getting_started/orderbook_responses
- Signing (Ed25519/RSA-PSS, path without query): https://docs.kalshi.com/getting_started/api_keys

## Features

- Dual scrolling alert feeds for ≥ $0.10 swings detected from official 24h
  1-minute and 72h 1-hour candlesticks on a unified single-basis mark (all
  events, plus a model-score filter).
- Interactive price chart (`20s · sec` live ticks, `1m`/`5m`/`15m` minutes,
  `1h`/`6h`/`1d` hours) with right-edge contract liquidity depth bars on the
  Y-axis, ≥ $0.10 jump markers with candidate primary-source links, and a full
  orderbook liquidity ladder.
- Resolution tracking: settled markets recorded with official YES/NO result and
  `settlement_value_dollars`; paper positions auto-settle at $1.00 or $0.00.
- Paper portfolio, custom strategy builder by trade category, and strategy lab
  (simulated trades by default, browser-local), plus an optional in-memory
  signed Kalshi demo panel (`GET /portfolio/balance|positions|fills` and
  `POST /portfolio/events/orders` V2 mock-funds orders, supporting both Ed25519
  and RSA-PSS keys).
- Verification and Flagged-for-Review pages: every row links to an official
  source; the previous 29-row catalogue was audited against the live API
  (3 of 29 tickers exist) and is published for review, never reused.
- **Measured link status.** The refresh job HTTP-checks every docs URL, every
  Kalshi category page and a sample of event pages it publishes, and records the
  status codes (`official_links` in the snapshot, `verification.html` §7) instead
  of assuming the links work.
- **Executable checks.** `node scripts/test_modules.mjs` runs 96 assertions on the
  pure logic — model score, spread-charged fills, settlement, backtest symmetry,
  swing detection and the demo-request signer — and runs in CI before each
  snapshot is committed. `scripts/render_pages.mjs` additionally boots all ten
  pages in jsdom and fails the build if any page renders empty or logs an error;
  it exists because a page-relative data path once left every topic page blank.
- **Every swing says what it measured.** Alerts publish the price basis (last
  trade close, bid/ask mid, or a single quote) and flag moves that came from
  quotes with no trade behind them, so a $0.10 step can be traced to a candle.

## Key caveats

Kalshi publishes contract volume, not dollar volume — dollar figures are
labelled estimates. Demo and production are separate books (divergence is
measured and published). A browser cannot open an authenticated Kalshi
WebSocket, so live updates are labelled REST polling. The scheduled refresh is
delivered far less often than its cron asks, so freshness is displayed rather
than promised. Full irregularity list: `COORDINATION.md` (IRREG-01…IRREG-12 and
IRREG-26…IRREG-42) and the Flagged for Review page.
