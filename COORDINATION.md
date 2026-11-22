# COORDINATION.md — Shared Task Board & Verification Log

> **Repository:** `kanlerxz87-cyber/Tradebot3`
> **Live Site (GitHub Pages):** https://kanlerxz87-cyber.github.io/Tradebot3/
> **Active Session ID:** `arena-e9a6c584`
> **Working Branch:** `arena/e9a6c584-tradebot3` (Arena fixed session branch; branched from merged `main` at `08ad596f66ebccb189754df5fa6dadac6365989c`)
> **Last Updated:** 2026-11-22 (UTC) — T-06 post-merge factual audit complete

---

## Coordination Protocol Notes
- T-01..T-05 were claimed prior to editing and pushed immediately on `arena/3716ae8d-tradebot3`.
- T-06 (the post-merge factual audit) was claimed on a new fixed session branch, `arena/e9a6c584-tradebot3`, branched from `main` at `08ad596f`. All T-06 work is committed only to that branch.
- Because Arena binds each session to one branch, no branch was created or switched mid-session; the T-06 pull request targets `main` from `arena/e9a6c584-tradebot3`.
- Items marked `needs review` are published transparently on [`flagged-for-review.html`](flagged-for-review.html) with official source links and do not block integration or deployment.
- Every table row across the site links to an official verified source. Any value that could not be confirmed statically is left blank and flagged `Unverified`.

---

## Task Board

| Task ID | Task Description | Status | Owning Session | Branch | File Scope |
| --- | --- | --- | --- | --- | --- |
| T-01 | Repository audit & official Kalshi Demo API verification (REST, WebSocket, Auth, Orderbook, Candlesticks, Rate Limits) | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `COORDINATION.md`, `EXECUTIVE_SUMMARY.md`, `README.md` |
| T-02 | Verified 5-topic Kalshi market dataset (Gas Prices, Elections, Culture, Crypto, Golf ONLY) & flagged irregularities catalog | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `assets/js/data.js` |
| T-03 | Kalshi Demo API client (RSA-PSS signing + public REST + paper fallback), `>= $0.10` swing alert engine, dual chat feeds, lifecycle resolution tracker, paper strategy simulator & portfolio engine | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `assets/js/kalshi-client.js`, `assets/js/engine.js`, `assets/js/charts.js`, `assets/js/ui-common.js` |
| T-04 | GitHub Pages site: Landing Dashboard, 5 Separate Category Subpages, Portfolio/Strategy Lab, API Verification/Suggestions, and Flagged for Review page | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `.nojekyll`, `index.html`, `portfolio.html`, `verification.html`, `flagged-for-review.html`, `categories/*.html`, `assets/css/styles.css`, `assets/js/dashboard.js`, `assets/js/category-page.js`, `assets/js/portfolio-page.js`, `assets/js/verification-page.js` |
| T-05 | Automated verification script, link integrity check, live HTTP server testing, PR creation, merge to `main`, and GitHub Pages deploy confirmation | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `scripts/verify_site.py`, `COORDINATION.md` |
| T-06 | Post-merge factual audit: correct synthetic-data/live-status misrepresentation, verify live-data integration limits, re-run and document checks | `done` | `arena-e9a6c584` | `arena/e9a6c584-tradebot3` | `COORDINATION.md`, `assets/js/data.js`, `assets/js/engine.js`, `assets/js/dashboard.js`, `assets/js/category-page.js`, `assets/js/portfolio-page.js`, `assets/js/kalshi-client.js`, `assets/js/charts.js`, `assets/js/ui-common.js`, `assets/js/verification-page.js`, `categories/*.html`, `index.html`, `portfolio.html`, `verification.html`, `flagged-for-review.html`, `EXECUTIVE_SUMMARY.md`, `README.md`, `scripts/verify_site.py` |
| R-01 | Flagged Irregularities IRREG-01 through IRREG-08 & unverified static fields (published on `flagged-for-review.html`) | `needs review` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `flagged-for-review.html`, `assets/js/data.js` |

---

## Verified Official Sources Log

### Kalshi Official API Documentation
- Demo Environment & Recommended vs. Also Supported URLs: https://docs.kalshi.com/getting_started/demo_env
- API Environments & Endpoints (REST, WebSocket, User Fill WS): https://docs.kalshi.com/getting_started/api_environments
- Orderbook Responses (`orderbook_fp`, reciprocal YES/NO bid pricing, empty/unknown HTTP 200 behavior): https://docs.kalshi.com/getting_started/orderbook_responses
- Quick Start WebSockets (authenticated handshake headers & public/private channel list): https://docs.kalshi.com/getting_started/quick_start_websockets
- WebSocket API Reference: https://docs.kalshi.com/websockets
- Rate Limits & Tiers: https://docs.kalshi.com/getting_started/rate_limits
- API Changelog (Demo Basic tier batch orders): https://docs.kalshi.com/changelog
- OpenAPI Spec & Reference (Get Events, Get Markets, Get Balance, Create Order V2, Candlesticks): https://docs.kalshi.com/openapi.yaml
- Create Order (V2): https://docs.kalshi.com/api-reference/orders/create-order-v2
- Get Market Candlesticks (1m / 60m / 1440m valid intervals): https://docs.kalshi.com/api-reference/market/get-market-candlesticks
- Get Historical Market: https://docs.kalshi.com/api-reference/historical/get-historical-market

### Kalshi Official Markets (Strict 5-Topic Scope) & Catalyst Sources
- **Gas Prices:**
  - https://kalshi.com/markets/kxaaagasmax/us-highest-gas-price-yearly/kxaaagasmax-26dec31
  - https://kalshi.com/markets/kxaaagasmin/us-lowest-gas-price-yearly/kxaaagasmin-26dec31
  - https://kalshi.com/markets/kxaaagasminca/california-lowest-gas-price-yearly
  - https://kalshi.com/markets/kxaaagasmaxca/california-highest-gas-price-yearly/kxaaagasmaxca-26dec31
  - https://kalshi.com/markets/kxaaagascdny/new-york-gas-price/kxaaagascdny-26nov19
  - Catalysts: https://www.cnbc.com/2026/11/09/stock-market-today-live-updates.html · https://www.eia.gov/todayinenergy/detail.php?id=66964 · https://www.eia.gov/todayinenergy/detail.php?id=66784
- **Elections:**
  - https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28
  - https://kalshi.com/markets/controls/senate-winner/controls-2026
  - https://kalshi.com/markets/kxpresperson/pres-person/kxpresperson-28
  - https://kalshi.com/markets/controls/senate-winner/controls-2028
  - https://kalshi.com/markets/kxpresparty/party-winning-presidency/kxpresparty-2028
  - https://kalshi.com/markets/power/party-power/power-28
  - Catalyst: https://emersoncollegepolling.com/national-poll-rubio-leads-2028-gop-nomination-contest-ossoff-rises-among-democrats/
- **Culture:**
  - https://kalshi.com/markets/kxoscaracto/oscar-for-best-actor/kxoscaracto-26
  - https://kalshi.com/markets/kxrt/rotten-tomatoes-scores/kxrt-ody
  - https://kalshi.com/markets/kxoscaractr/oscar-for-best-actress/kxoscaractr-26
  - https://kalshi.com/markets/kxgameawards/game-awards/kxgameawards-2026
  - https://kalshi.com/markets/kxoscardocu/oscar-for-best-documentary-feature/kxoscardocu-26
  - https://kalshi.com/markets/kxrt/rotten-tomatoes-scores/kxrt-bri
  - Catalyst: https://wccftech.com/grand-theft-auto-vi-the-game-awards-2026-nominations-clair-obscur-record/
- **Crypto:**
  - https://kalshi.com/markets/kxethminy/how-low-will-ethereum-fall-this-year/kxethminy-27jan01
  - https://kalshi.com/markets/kxsold26/sol-price-end-of-2026/kxsold26-27jan0100
  - https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100
  - https://kalshi.com/markets/kxbtcminy/how-low-will-bitcoin-fall-this-year/kxbtcminy-27jan01
  - https://kalshi.com/markets/kxbtc50vs100/will-btc-fall-below-50k-before-hitting-100k/kxbtc50vs100-btc-26dec31
  - https://kalshi.com/markets/kxbtcmaxmon/bitcoin-monthly-one-touch/kxbtcmaxmon-btc-26mar31
  - Catalysts: https://www.cnbc.com/2026/11/19/stock-market-today-live-updates.html · https://www.cnbc.com/amp/2026/11/20/bitcoin-price-gold-market-hedge.html
- **Golf:**
  - https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-mast26
  - https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-pgc26
  - https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-thrc26
  - https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-mast27
  - https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-uso26
  - https://kalshi.com/markets/kxpgamasters/golfers-to-participate-in-the-masters/kxpgamasters-26
  - Catalyst: https://www.pgatour.com/tournaments/2026/the-rsm-classic/R2026493/past-results

---

## Verification Performed

### T-06 factual audit (branch `arena/e9a6c584-tradebot3`, 2026-11-22)
- `node --check assets/js/*.js` — all nine ES modules parse cleanly.
- `python3 scripts/verify_site.py` — **ALL VERIFICATION CHECKS PASSED**:
  - All 23 required repository/site files exist.
  - 35 internal HTML links across 9 pages, 0 broken.
  - Every JS `getElementById()` reference resolves to a DOM ID on its page.
  - Strict 5-topic isolation across all 29 catalog rows; every row carries an official HTTPS source.
  - Every row has `catalogAsOf` and `volumeAsOf`; only `Resolved` rows assert YES/NO; the single `Needs Review` row (RSM Classic) asserts no result.
  - All static `observedPrice` / `observedSwing` values remain `null`; no `modelFairValue` and no seeded `catalysts` remain.
  - Official `orderbook_fp` reciprocal math: YES bid `$0.42` + NO bid `$0.56` => implied YES ask `$0.44`, spread `$0.02`.
  - Engine starts with zero alerts and no invented quotes; an explicit paper swing is labeled synthetic and leaves REST/catalog prices and lifecycle untouched.
  - Paper trades are tagged `Paper Simulation`, unmarked positions do not fabricate equity, and paper settlement does not mutate catalog lifecycle.
  - `evaluateModelEdge()` returns no signal without a sourced fair value; custom paper strategy creation works.
  - A synthetic fake-client Demo REST snapshot change produces exactly one non-simulated, REST-tagged `>= $0.10` alert and one REST-tagged orderbook.
  - No app module contains `createOrderV2` or a POST request; `POST /portfolio/events/orders` is documented only.
  - No stale live-feed, model-ROI, seconds-level chart, or order-execution claims remain in the 10 user-facing docs/pages.
- Data reconciliation completed in this pass: gas and California volume cells were restated to their dated production event volumes; NY gas (`KXAAAGASCDNY-26NOV19`) and `CONTROLS-2026` are `Resolved` YES; the March 2026 BTC one-touch is `Resolved` NO; the RSM Classic row is `Needs Review` with blank price, volume, and result; three events still publish no volume and remain blank.
- **Not tested:** a live browser session against the real Kalshi Demo API, real CORS behavior, WebSocket behavior, or rendered layout in a browser. The verifier is an offline structural/behavioral check, not a browser or network test.

### T-05 baseline (historical, superseded by T-06)
- Earlier checks covered file presence, internal links, DOM IDs, topic isolation, source URLs, orderbook math, and an `http.server` smoke test. The T-06 run above replaces those claims; the prior wording ("live tick engine", "real-time", "automated order submission") no longer describes the code.

## Flagged Irregularities Log (Published on `flagged-for-review.html`, Status: `needs review`)

Eleven entries: IRREG-01 through IRREG-11. T-06 added IRREG-10 (dated event-volume snapshots) and IRREG-11 (no order submission anywhere in the app).
- **IRREG-01 (High):** Browser `WebSocket` API cannot attach Kalshi's required handshake headers (`KALSHI-ACCESS-KEY`, `KALSHI-ACCESS-TIMESTAMP`, `KALSHI-ACCESS-SIGNATURE`); direct authenticated WS streaming requires a server/edge relay proxy.
- **IRREG-02 (High):** Static GitHub Pages browser `fetch()` requests to Kalshi Demo API may encounter CORS blocks or require user-owned demo credentials; no keys are stored in git, and paper simulation mode is explicitly labeled.
- **IRREG-03 (Medium):** Kalshi officially warns Demo environment prices and market behavior do not reflect production markets.
- **IRREG-04 (Medium):** Kalshi REST candlestick API supports `1` (1m), `60` (1h), and `1440` (1d) intervals only. This static site neither streams nor backfills second-level data; its chart plots only in-page Demo REST observations.
- **IRREG-05 (Medium):** `GET /markets/{ticker}/orderbook` returns HTTP `200` with empty arrays even for unknown/invalid tickers (not `404`).
- **IRREG-06 (Low):** Prompt listed both `external-api.demo.kalshi.co` (recommended dedicated host) and `demo-api.kalshi.co` (also supported legacy shared host); both verified and supported.
- **IRREG-07 (Medium):** Static quote/swing fields and resting orderbook depth are left **blank** unless observed from a runtime Demo REST response; volume cells are blank only where no event volume is published.
- **IRREG-08 (Low):** Initial repo commit `62713af` contained only an 11-byte `README.md`.
- **IRREG-09 (Medium):** The RSM Classic row (`KXPGATOUR-THRC26-MTHO`) has an unreconciled ticker/lifecycle/volume and is marked `Needs Review`.
- **IRREG-10 (Medium):** Volume cells are one dated production event-volume snapshot (`2026-11-22`), not contract volume or Demo liquidity; three events publish no volume and stay blank.
- **IRREG-11 (Low):** Order creation is documented for reference but not implemented; every trade, strategy run, and settlement is local paper.

---

## Pull Request & Deployment Record

### T-06
- **Source Branch:** `arena/e9a6c584-tradebot3` -> `main`
- **PR URL:** https://github.com/kanlerxz87-cyber/Tradebot3/pull/15
- **Commits:** `0a6dc10` (claim), `ab717dc` (audit implementation)
- **Scope:** factual corrections to docs, labels, catalog volume/lifecycle reconciliation, removal of the unused order-submission client method, and expanded verification checks.
- **Status:** `done` — pushed and opened for review; merge into `main` left to the reviewer.

### T-05 (historical)
- **Source Branch:** `arena/3716ae8d-tradebot3` -> `main`
- **PR URL:** https://github.com/kanlerxz87-cyber/Tradebot3/pull/1
- **Merge Method:** `gh pr merge 1 --merge` (merged into `main` on 2026-11-22 UTC after passing `scripts/verify_site.py` with 0 broken links)
- **GitHub Pages Live URL:** https://kanlerxz87-cyber.github.io/Tradebot3/
