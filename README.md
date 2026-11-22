# Tradebot3 — Kalshi Demo Market Dashboard & Paper Strategy Lab

**GitHub Pages Site:** https://kanlerxz87-cyber.github.io/Tradebot3/

A static, browser-only dashboard for researching a fixed catalog of Kalshi markets across five topics
— **Gas Prices**, **Elections**, **Culture**, **Crypto**, and **Golf** — with best-effort Kalshi Demo
REST reads and a local paper-trading simulator.

## What This Site Actually Does

- **Catalog data is dated, not live.** Each of the 29 market rows links to its official Kalshi event page
  and carries one production *event-volume* snapshot dated `2026-11-22`. That figure is event volume, not
  contract volume, Demo liquidity, or a live feed.
- **Prices are blank until a Demo REST read succeeds.** Static observed prices, swings, and fair-value
  estimates were removed in the post-merge audit because no timestamped quote series backed them.
  Runtime prices come from public Kalshi Demo REST requests made by the page, which can be cached,
  rate-limited, blocked by CORS, or unmatched to a catalog contract.
- **No WebSocket stream is connected.** Kalshi requires `KALSHI-ACCESS-*` headers on the WS handshake,
  and a static browser page cannot attach them. Charts plot only the REST observations collected while
  the page is open; there is no second-level exchange history and no backfill.
- **Every trade is a local paper simulation.** Balances, positions, fills, settlements, and strategies are
  simulated in `localStorage`. The optional Demo API check performs one read-only
  `GET /portfolio/balance` request with a key the user pastes in page memory; it does not sync positions,
  and no page implements `POST /portfolio/events/orders`.
- **No model feed.** The "Model-Edge Rule" feed is empty by design: no independently sourced fair value is
  supplied, so the dashboard does not invent ROI scores or recommendations.
- **News links do not establish causation.** External article links are context only; chart markers appear
  only for observed price changes between two separate REST snapshots, or for explicitly labeled paper
  simulations.

## Pages

- **`index.html`** — Dashboard: topic KPIs, dated event-volume ranking, general `>= $0.10` change feed
  (REST snapshots and labeled paper tests), Demo REST price chart and orderbook snapshot, paper quick-trade ticket.
- **`categories/gas-prices.html`**, **`elections.html`**, **`culture.html`**, **`crypto.html`**,
  **`golf.html`** — One page per isolated topic, with its catalog table, chart, orderbook snapshot, and paper controls.
- **`portfolio.html`** — Local paper portfolio (`$10,000` simulated balance), paper trade/settlement ledger,
  paper strategy lab and custom strategy builder, plus the optional read-only Demo balance check.
- **`verification.html`** — Verified Kalshi Demo API endpoints and schemas, repository audit, and
  suggestions for future work.
- **`flagged-for-review.html`** — Every flagged irregularity, blank field, and unreconciled market with source links.
- **`EXECUTIVE_SUMMARY.md`** — Full project summary and limitations.
- **`COORDINATION.md`** — Task board, claims, sources, verification log, and PR/deploy record.

## Verified Kalshi Demo API References

Verified from [Demo Environment](https://docs.kalshi.com/getting_started/demo_env) and
[API Environments](https://docs.kalshi.com/getting_started/api_environments):
- **REST Trade API (recommended):** `https://external-api.demo.kalshi.co/trade-api/v2`
- **REST Trade API (also supported):** `https://demo-api.kalshi.co/trade-api/v2`
- **WebSocket API (recommended):** `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2`
- **WebSocket API (also supported):** `wss://demo-api.kalshi.co/trade-api/ws/v2`

## Local Preview & Verification

```bash
# Structural, link, DOM, catalog-boundary, paper-isolation and orderbook checks
python3 scripts/verify_site.py

# Serve locally (no build step; plain HTML/CSS/ES modules)
python3 -m http.server 8080 --bind 0.0.0.0
```

The verifier is an offline check of repository structure, data boundaries, and engine behavior. It does
not prove live Kalshi API availability, browser CORS behavior, or rendering in a real browser.
