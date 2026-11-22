# Tradebot3 — Kalshi Demo Paper-Simulation Dashboard & Strategy Lab

**Live GitHub Pages Site:** https://kanlerxz87-cyber.github.io/Tradebot3/

An interactive **paper-simulation prototype** for a Kalshi Demo dashboard and strategy lab focused on **Gas Prices**, **Elections**, **Culture**, **Crypto**, and **Golf**.

> **Important:** The GitHub Pages site does not currently stream live Kalshi markets. Price ticks, chart history, orderbook depth, alerts, and trade execution in the UI are simulated; catalog values are static snapshots. Portfolio values are local mock state and are not connected to a Kalshi Demo account. Do not treat the displayed model outputs as verified forecasts or trading advice. See [Flagged for Review](flagged-for-review.html) for limitations.

---

## Pages & Structure
- **`index.html`** — Landing page, Executive Summary, static sourced catalog across the 5 topics, dual paper-simulation alert chats (`>= $0.10`), simulated interactive price chart, and simulated orderbook ladder.
- **`categories/gas-prices.html`** — Gas Prices catalog subpage (static sourced table + simulated chart & orderbook).
- **`categories/elections.html`**, **`categories/culture.html`**, **`categories/crypto.html`**, **`categories/golf.html`** — Separate category catalogs with simulated charts and orderbooks.
- **`portfolio.html`** — Optional API connectivity/balance test plus local-only paper trades, mock equity, categorization, and strategy simulation. The trade ticket does not place exchange orders.
- **`verification.html`** — Official API documentation references, automated repository checks, and recommendations for a future live integration.
- **`flagged-for-review.html`** — Transparent table of all flagged irregularities and unverified fields with official source links.
- **`EXECUTIVE_SUMMARY.md`** — Full executive summary document.
- **`COORDINATION.md`** — Shared task board, claims, official sources, verification log, and PR/deploy record.

---

## Verified Kalshi Demo API Endpoints
Verified from [Kalshi Demo Environment Docs](https://docs.kalshi.com/getting_started/demo_env) and [API Environments](https://docs.kalshi.com/getting_started/api_environments):
- **REST Trade API (Recommended):** `https://external-api.demo.kalshi.co/trade-api/v2`
- **REST Trade API (Also Supported):** `https://demo-api.kalshi.co/trade-api/v2`
- **WebSocket API (Recommended):** `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2`
- **WebSocket API (Also Supported):** `wss://demo-api.kalshi.co/trade-api/ws/v2`

---

## Local Preview & Verification
```bash
# Run automated data, topic-isolation, source-link, and internal-link verification
python3 scripts/verify_site.py

# Serve locally
python3 -m http.server 8080 --bind 0.0.0.0
```
