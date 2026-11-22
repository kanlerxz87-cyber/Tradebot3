# Tradebot3 — Kalshi Demo Live Event Dashboard & Strategy Lab

**Live GitHub Pages Site:** https://kanlerxz87-cyber.github.io/Tradebot3/

A verified, interactive Kalshi Demo dashboard, alerting system, portfolio tracker, and automated trading strategy simulator focused strictly on five topics: **Gas Prices**, **Elections**, **Culture**, **Crypto**, and **Golf**.

---

## Pages & Structure
- **`index.html`** — Landing page, Executive Summary, Highest-Dollar Live Events across the 5 topics (with Live/Open vs. Resolved filter), Dual Real-Time Scrolling Alert Chats (`>= $0.10` swings: All Events vs. High-ROI Model, with topic/search filters & optional sound ping), Interactive Price Chart (Seconds / Minutes / Hours + hover crosshair tooltip + clickable verified jump catalyst markers), Orderbook Liquidity Ladder (with live Kalshi Demo REST pull button), and Quick Trade Ticket.
- **`categories/gas-prices.html`** — Gas Prices dedicated subpage (verified table + live chart & orderbook).
- **`categories/elections.html`** — Elections dedicated subpage.
- **`categories/culture.html`** — Culture dedicated subpage.
- **`categories/crypto.html`** — Crypto dedicated subpage.
- **`categories/golf.html`** — Golf dedicated subpage.
- **`portfolio.html`** — Kalshi Demo API connector (Web Crypto **Ed25519** recommended default + **RSA-PSS PKCS#1/PKCS#8** signing + optional live Create Order V2 submission + Paper Demo Mode), Trade Execution Ticket, Portfolio Equity & Positions Tracker, Trade Categorization Net P&L Bar Chart & Analysis, and Automated Strategy Simulator / Custom Strategy Builder.
- **`verification.html`** — Verified Kalshi Demo API endpoints & schemas (16 verified specs across REST, WebSockets, Auth, and all 7 Rate Limit tiers), line-by-line Repository Audit, and Interactive/Live Enhancement Suggestions.
- **`flagged-for-review.html`** — Transparent table of all flagged irregularities (`IRREG-01`–`IRREG-09`) and unverified static market fields with official source links.
- **`EXECUTIVE_SUMMARY.md`** — Full executive summary document.
- **`COORDINATION.md`** — Shared task board, claims, official sources, verification log, and PR/deploy record.

---

## Verified Kalshi Demo API Endpoints
Verified from [Kalshi Demo Environment Docs](https://docs.kalshi.com/getting_started/demo_env) and [API Environments](https://docs.kalshi.com/getting_started/api_environments):
- **REST Trade API (Recommended):** `https://external-api.demo.kalshi.co/trade-api/v2`
- **REST Trade API (Also Supported):** `https://demo-api.kalshi.co/trade-api/v2`
- **WebSocket API (Recommended):** `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2`
- **WebSocket API (Also Supported):** `wss://demo-api.kalshi.co/trade-api/ws/v2`
- **User Fill/Order WebSocket:** `wss://user-ws.demo.kalshi.co/trade-api/ws/v2`

---

## Local Preview & Verification
```bash
# Run automated data, topic-isolation, source-link, API signing, and internal-link verification
python3 scripts/verify_site.py

# Syntax-check all ES modules
node --check assets/js/*.js

# Serve locally
python3 -m http.server 8080 --bind 0.0.0.0
```
