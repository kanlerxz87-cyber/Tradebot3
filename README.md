# Tradebot3 — Kalshi Market Catalog & Paper Simulator

**GitHub Pages:** https://kanlerxz87-cyber.github.io/Tradebot3/

Tradebot3 is a static dashboard organized around five Kalshi topics: Gas Prices, Elections, Culture, Crypto, and Golf. It includes source-linked market listings, category pages, a local paper-trading portfolio, strategy experiments, price charts, an alert-chat UI, and a review page for unverified details.

> **Important:** This GitHub Pages build does not receive a continuous Kalshi feed. The alert ticks, paper chart history, model assumptions, orderbook depth and simulated portfolio trades are generated locally for testing; they are not current Kalshi prices, actual liquidity, actual fills, or investment signals. Dynamic official price, swing and volume cells are blank unless/until a synchronized data integration is built. “Test Demo REST API” only tests public endpoint reachability; it does not sync dashboard data or account state. See [`Flagged for Review`](flagged-for-review.html), especially IRREG-09 and IRREG-10.

## Pages
- [`index.html`](index.html) — overview, topic links, paper alert feeds, interactive simulated chart/depth, and source-linked market catalog.
- [`categories/`](categories/) — separate Gas Prices, Elections, Culture, Crypto and Golf pages.
- [`portfolio.html`](portfolio.html) — local paper portfolio, trade categories, simulated strategies, and a disabled account connector pending a secure backend relay.
- [`verification.html`](verification.html) — official API reference, repository review, and possible follow-up improvements.
- [`flagged-for-review.html`](flagged-for-review.html) — explicit limitations, unverified data, and source links.
- [`EXECUTIVE_SUMMARY.md`](EXECUTIVE_SUMMARY.md) — executive overview and verified architecture notes.

## Official Kalshi Demo API Roots
Checked against Kalshi's official documentation on 2026-11-22:
- Recommended REST: `https://external-api.demo.kalshi.co/trade-api/v2`
- Also supported REST: `https://demo-api.kalshi.co/trade-api/v2`
- Recommended WebSocket: `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2`
- Also supported WebSocket: `wss://demo-api.kalshi.co/trade-api/ws/v2`

Official references: [Demo environment](https://docs.kalshi.com/getting_started/demo_env), [API environments](https://docs.kalshi.com/getting_started/api_environments), [WebSocket quick start](https://docs.kalshi.com/getting_started/quick_start_websockets).

## Local Verification & Preview
```bash
python3 scripts/verify_site.py
python3 -m http.server 8080 --bind 0.0.0.0
```
