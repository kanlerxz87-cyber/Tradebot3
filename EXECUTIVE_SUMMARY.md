# Executive Summary — Tradebot3 Kalshi Live-Event Dashboard

**Date:** 2026-11-22 (UTC)
**Repository:** `kanlerxz87-cyber/Tradebot3`
**Live site:** https://kanlerxz87-cyber.github.io/Tradebot3/
**Full page version:** [`executive-summary.html`](executive-summary.html) on the site.

## What this is

A static GitHub Pages dashboard fed by an automated data pipeline
(`scripts/fetch_kalshi_data.py`, run every 30 minutes by GitHub Actions) that
publishes only values returned by Kalshi's official public Trade API into
`assets/data/snapshot.json`. No market number on the site is hard-coded.

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

## Key caveats

Kalshi publishes contract volume, not dollar volume — dollar figures are
labelled estimates. Demo and production are separate books (divergence is
measured and published). A browser cannot open an authenticated Kalshi
WebSocket, so live updates are labelled REST polling. Full irregularity list:
`COORDINATION.md` (IRREG-01…IRREG-12) and the Flagged for Review page.
