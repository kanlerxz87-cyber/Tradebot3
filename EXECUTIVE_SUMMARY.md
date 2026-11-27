# Executive Summary — Tradebot3 Kalshi Live-Event Dashboard

**Date:** 2026-11-27 (UTC)
**Repository:** `kanlerxz87-cyber/Tradebot3`
**Live site:** https://kanlerxz87-cyber.github.io/Tradebot3/
**Full page version:** [`executive-summary.html`](executive-summary.html) on the site.

## What this is

A static GitHub Pages dashboard fed by an automated data pipeline
(`scripts/fetch_kalshi_data.py`, scheduled every 30 minutes by GitHub Actions)
that publishes only values returned by Kalshi's official public Trade API into
`assets/data/snapshot.json`. No market number on the site is hard-coded.

**Measured, not assumed.** GitHub Actions delivered 14 runs between
2026-11-22T16:34Z and 2026-11-27T10:40Z — a **median gap of 8.8 hours**, not 30
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

- Dual scrolling alert feeds for ≥ $0.10 close-to-close swings detected from
  official 1-minute/1-hour candlesticks (all events, plus a model-score filter).
- Interactive price chart (seconds/minutes/hours windows) and orderbook
  liquidity ladder from the official orderbook endpoint.
- Resolution tracking: settled markets recorded with YES/NO result.
- Paper portfolio and strategy lab (simulated trades only, browser-local),
  plus a read-only signed demo panel (`GET /portfolio/balance|positions|fills`).
  No order placement is shipped (IRREG-12).
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
  snapshot is committed.

## Key caveats

Kalshi publishes contract volume, not dollar volume — dollar figures are
labelled estimates. Demo and production are separate books (divergence is
measured and published). A browser cannot open an authenticated Kalshi
WebSocket, so live updates are labelled REST polling. The scheduled refresh is
delivered far less often than its cron asks, so freshness is displayed rather
than promised. Full irregularity list: `COORDINATION.md` (IRREG-01…IRREG-12 and
IRREG-26…IRREG-32) and the Flagged for Review page.
