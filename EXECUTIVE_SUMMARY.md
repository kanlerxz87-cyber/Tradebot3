# Executive Summary — Tradebot3 Kalshi Dashboard

**Review date:** 2026-11-22 (UTC)
**Repository:** https://github.com/kanlerxz87-cyber/Tradebot3
**GitHub Pages:** https://kanlerxz87-cyber.github.io/Tradebot3/

## Purpose and scope
Tradebot3 organizes Kalshi market pages into five requested categories: **Gas Prices, Elections, Culture, Crypto, and Golf**. Its static site provides a landing page, separate topic pages, API documentation/verification notes, a flagged-review page, and a portfolio/strategy sandbox.

## Current operating mode — read first
The published site is **not a live market-data terminal**. The browser app currently generates random local paper ticks every 2.2 seconds and synthetic charts/orderbook depth. The paper simulator has no authenticated Kalshi WebSocket subscription and does not refresh the displayed market values, account balance, fills, orders, or liquidity. The previous hard-coded quote/volume snapshot was demonstrably stale; those dynamic fields are now blank. Simulation seed values remain only to exercise the paper charts and strategies. Model values and catalyst annotations are not validated forecasts or proof of causality. See [IRREG-09 and IRREG-10 on Flagged for Review](flagged-for-review.html).

A live dashboard would need a backend/edge service to safely authenticate to Kalshi, fetch and reconcile markets, stream WebSocket data to the browser, persist historical points and fills, and enforce trading limits. Public REST reachability is not equivalent to syncing dashboard data. No API private key is embedded or stored in the repository.

## Official Demo API details verified from Kalshi docs
Kalshi's official [Demo Environment](https://docs.kalshi.com/getting_started/demo_env) says demo uses mock funds, its credentials are separate from production, and demo price/market behavior may not reflect real markets. Recommended and also-supported endpoints are documented at [API Environments](https://docs.kalshi.com/getting_started/api_environments):

| Interface | Recommended demo root | Also supported | Official source |
| --- | --- | --- | --- |
| REST Trade API | `https://external-api.demo.kalshi.co/trade-api/v2` | `https://demo-api.kalshi.co/trade-api/v2` | [Demo environment](https://docs.kalshi.com/getting_started/demo_env) |
| Trade WebSocket | `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2` | `wss://demo-api.kalshi.co/trade-api/ws/v2` | [Demo environment](https://docs.kalshi.com/getting_started/demo_env) |
| User fill/order WebSocket | `wss://user-ws.demo.kalshi.co/trade-api/ws/v2` | Dedicated user stream | [API environments](https://docs.kalshi.com/getting_started/api_environments) |

Technical behavior documented by Kalshi:
- WebSocket handshakes require `KALSHI-ACCESS-KEY`, `KALSHI-ACCESS-TIMESTAMP`, and `KALSHI-ACCESS-SIGNATURE`; see [Quick Start: WebSockets](https://docs.kalshi.com/getting_started/quick_start_websockets). The static site does not establish this stream.
- [Orderbook responses](https://docs.kalshi.com/getting_started/orderbook_responses) contain YES and NO bid levels; prices are dollars and counts are contract quantities. The reciprocal YES ask is `$1.00 − best NO bid`. The visible synthetic ladder in this app is not that API response.
- [Market candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks) accepts minute intervals `1`, `60`, and `1440`; a seconds chart would require stored/streamed tick data, which this build does not provide.
- [WebSocket connection limits](https://docs.kalshi.com/getting_started/rate_limits#websocket-connection-limits) currently list 200 concurrent connections for Basic/Advanced/Expert, 500 for Premier, 750 for Paragon, and 1,000 for Prime/Prestige.
- [Create Order V2](https://docs.kalshi.com/api-reference/orders/create-order-v2) is an authenticated order endpoint. The app's auto-strategies do **paper trades**, not automatic Kalshi order submission.

## Features currently delivered
- Separate category navigation and market-reference tables, with a source link on every market row.
- Current dynamic quote, price-change, volume, and resting-liquidity fields are blank; eight timestamped official Kalshi page snapshots (2026-11-22T07:27:00Z) are shown separately as historical snapshots, never as live data.
- Interactive paper-only charts, local random alert examples, synthetic orderbook depth, paper portfolio, and categorized strategy experiments.
- A “Flagged for Review” page that records source-backed caveats and the mismatches discovered during this independent audit.

## Recommendations for genuine live use
1. Add a server-side Kalshi API relay. Never place private keys in static files or expose them to browser code.
2. Use Kalshi market metadata and the authenticated WebSocket to populate timestamped quotes, fills, orderbook updates, and lifecycle results; reconcile with REST snapshots and show data freshness/source.
3. Keep paper and live account modes separate. Require explicit user confirmation, risk limits, and an audit log before any live-demo order route is enabled.
4. Store point-in-time quote/volume/settlement records. Only label a price jump with a news catalyst after verifying timestamp alignment; otherwise show links as context, not cause.
5. Validate fair-value/ROI assumptions with historical out-of-sample testing, fees, fill/slippage assumptions, and benchmarks before presenting any model as high-return.

## Prior verified page snapshots
A preceding audit session captured eight official market-page snapshots at `2026-11-22T07:27:00Z`, corrected the stale values, and confirmed the 2026 Senate control market as Resolved YES. In this dashboard those values are retained only in snapshot fields with the source timestamp and direct Kalshi link. The other 21 market rows have no such snapshot values, and no row is presented as a live feed. The complete before/after ledger and sources remain in [`COORDINATION.md`](COORDINATION.md) and the historical corrections are on [Flagged for Review](flagged-for-review.html).

## Review outcome and limitations
The inherited site passed its structural/link test, but the prior verification script only checked that source URLs began with `https://`; it did not verify dynamic field values or confirm every citation was official. This audit corrects the data labeling and adds checks for blank dynamic fields. Current dynamic fields remain blank rather than guessed. Eight earlier official-page observations are retained separately with a capture timestamp and explicit historical-snapshot labeling; they are not current quotes or data from a Demo account. Consult [Flagged for Review](flagged-for-review.html) and [API Verification](verification.html).
