# Tradebot3 — Kalshi Demo Market Catalog & Paper-Simulation Lab

**Live GitHub Pages Site:** https://kanlerxz87-cyber.github.io/Tradebot3/

An interactive Kalshi market reference catalog, local alerting/portfolio simulator, and strategy test bench focused strictly on five topics: **Gas Prices**, **Elections**, **Culture**, **Crypto**, and **Golf**.

> **Session 2 re-verification (2026-11-22 UTC, `arena/83838475`):** all 29 market rows re-checked line by line
> against live official Kalshi pages; 22 rows updated with fresh verified prices/volumes/resolutions
> (12 resolved, 1 unverified volume left), API specs re-confirmed against docs.kalshi.com, and an opt-in
> desktop-notification + audio-ping toggle added to the landing dashboard. See
> `EXECUTIVE_SUMMARY.md` §0 and `COORDINATION.md` for the full correction log.
>
> **T-06 factual audit (2026-11-22 UTC, `arena/e9a6c584-tradebot3`, PR #15):** removed the optional
> demo-order toggle and the order-submitting client methods so the site matches its own paper-only copy,
> removed the model's quote-as-fair-value fallback, and clarified that catalog values, chart history and
> depth are snapshot or simulated data.

---

## Pages & Structure
- **`index.html`** — Landing page, Executive Summary, Highest-volume catalog events across the 5 topics, Dual scrolling paper-simulation alert chats (`>= $0.10` swings: All Events vs. an illustrative model filter), Interactive Price Chart (Seconds / Minutes / Hours + simulated jump markers with contextual source links), and Orderbook Liquidity Ladder.
- **`categories/gas-prices.html`** — Gas Prices dedicated subpage (static reference table + simulated chart & orderbook).
- **`categories/elections.html`** — Elections reference subpage (static data; simulated chart/depth).
- **`categories/culture.html`** — Culture reference subpage (static data; simulated chart/depth).
- **`categories/crypto.html`** — Crypto reference subpage (static data; simulated chart/depth).
- **`categories/golf.html`** — Golf reference subpage (static data; simulated chart/depth).
- **`portfolio.html`** — Kalshi Demo API connector (Ed25519/RSA-PSS Web Crypto signing for a read-only balance check + Paper Demo Mode), Paper Trade Simulator, local Portfolio Equity & Positions Tracker, Trade Categorization & Analysis, and paper strategy tester / custom strategy builder. No order is ever submitted.
- **`verification.html`** — Kalshi Demo API endpoint references, repository audit, and suggestions for future live upgrades.
- **`flagged-for-review.html`** — Transparent table of all flagged irregularities and unverified fields with official source links.
- **`EXECUTIVE_SUMMARY.md`** — Full executive summary document.
- **`COORDINATION.md`** — Shared task board, claims, official sources, verification log, and PR/deploy record.

---

## Kalshi Demo API Endpoints (Official Documentation)
Verified from [Kalshi Demo Environment Docs](https://docs.kalshi.com/getting_started/demo_env) and [API Environments](https://docs.kalshi.com/getting_started/api_environments):
- **REST Trade API (Recommended):** `https://external-api.demo.kalshi.co/trade-api/v2`
- **REST Trade API (Also Supported):** `https://demo-api.kalshi.co/trade-api/v2`
- **WebSocket API (Recommended):** `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2`
- **WebSocket API (Also Supported):** `wss://demo-api.kalshi.co/trade-api/ws/v2`

---

## Important Runtime Limitations

- The deployed GitHub Pages site is static: the catalog values are not refreshed from Kalshi. The charts, orderbook depth, ticks, and automated fills are local simulations.
- The portfolio trade ticket and strategies do not submit orders to Kalshi. The optional API connector tests public REST connectivity and can read the account balance with a user-supplied key; it is not a live execution integration.
- No authenticated WebSocket relay exists in this repository. A genuine live feed and live orders require a trusted backend/relay and must not expose private keys in a browser.
- Alert-linked external pages provide context only; the site does not establish that a source caused a particular price change.

## Local Preview & Verification
```bash
# Run automated data, topic-isolation, source-link, and internal-link verification
python3 scripts/verify_site.py

# Serve locally
python3 -m http.server 8080 --bind 0.0.0.0
```
