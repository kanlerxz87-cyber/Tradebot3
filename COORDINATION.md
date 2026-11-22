# COORDINATION.md — Shared Task Board & Verification Log

> **Repository:** `kanlerxz87-cyber/Tradebot3`
> **Live Site (GitHub Pages):** https://kanlerxz87-cyber.github.io/Tradebot3/
> **Active Session ID:** `arena-3716ae8d`
> **Working Branch:** `arena/3716ae8d-tradebot3` (Arena fixed session branch; branched from `main` at `62713af9e466cd393c61be0df37e5de0872919cc`)
> **Last Updated:** 2026-11-22 (UTC)

---

## Coordination Protocol Notes
- All tasks were claimed prior to editing and pushed immediately on `arena/3716ae8d-tradebot3`.
- Because Arena binds this session to `arena/3716ae8d-tradebot3`, all commits, pushes, and the pull request to `main` are performed on `arena/3716ae8d-tradebot3` without creating or switching branches.
- Items marked `needs review` are published transparently on [`flagged-for-review.html`](flagged-for-review.html) with official source links and do not block integration or deployment.
- Every table row across the site links to an official verified source. Any value that could not be confirmed statically is left blank and flagged `Unverified`.

---

## Task Board

| Task ID | Task Description | Status | Owning Session | Branch | File Scope |
| --- | --- | --- | --- | --- | --- |
| T-01 | Repository audit & official Kalshi Demo API verification (REST, WebSocket, Auth, Orderbook, Candlesticks, Rate Limits) | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `COORDINATION.md`, `EXECUTIVE_SUMMARY.md`, `README.md` |
| T-02 | Verified 5-topic Kalshi market dataset (Gas Prices, Elections, Culture, Crypto, Golf ONLY) & flagged irregularities catalog | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `assets/js/data.js` |
| T-03 | Kalshi Demo API client (RSA-PSS signing + public REST + paper fallback), `>= $0.10` swing alert engine, dual chat feeds, lifecycle resolution tracker, automated strategy simulator & portfolio engine | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `assets/js/kalshi-client.js`, `assets/js/engine.js`, `assets/js/charts.js`, `assets/js/ui-common.js` |
| T-04 | GitHub Pages site: Landing Dashboard, 5 Separate Category Subpages, Portfolio/Strategy Lab, API Verification/Suggestions, and Flagged for Review page | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `.nojekyll`, `index.html`, `portfolio.html`, `verification.html`, `flagged-for-review.html`, `categories/*.html`, `assets/css/styles.css`, `assets/js/dashboard.js`, `assets/js/category-page.js`, `assets/js/portfolio-page.js`, `assets/js/verification-page.js` |
| T-05 | Automated verification script, link integrity check, live HTTP server testing, PR creation, merge to `main`, and GitHub Pages deploy confirmation | `done` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `scripts/verify_site.py`, `COORDINATION.md` |
| R-01 | Flagged Irregularities IRREG-01 through IRREG-08 & unverified static fields (published on `flagged-for-review.html`) | `needs review` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `flagged-for-review.html`, `assets/js/data.js` |
| T-06 | Audit and correct unverifiable catalog snapshots and simulated-vs-live claims; mark unverifiable metrics blank and make paper simulation explicit | `in progress` | `arena/355115ca-tradebot3` | `arena/355115ca-tradebot3` | `COORDINATION.md`, `EXECUTIVE_SUMMARY.md`, `README.md`, `index.html`, `portfolio.html`, `assets/js/data.js`, `assets/js/engine.js`, `assets/js/dashboard.js`, `assets/js/category-page.js`, `assets/js/portfolio-page.js`, `assets/js/ui-common.js`, `flagged-for-review.html`, `scripts/verify_site.py` |

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
- `python3 scripts/verify_site.py`:
  - Confirmed all 23 required repository and site files exist.
  - Checked 35 internal HTML links across all 9 pages (`index.html`, `portfolio.html`, `verification.html`, `flagged-for-review.html`, and 5 `categories/*.html`) — **0 broken links**.
  - Verified all JS `getElementById()` references match DOM IDs across all 9 HTML pages.
  - Verified strict 5-topic isolation across all 29 Kalshi markets (`gas-prices`, `elections`, `culture`, `crypto`, `golf` ONLY).
  - Verified 100% of table rows across `DEMO_API_ENDPOINTS` (15), `VERIFIED_MARKETS` (29), `FLAGGED_IRREGULARITIES` (8), `REPO_AUDIT_ITEMS` (6), and `INTERACTIVE_SUGGESTIONS` (6) carry valid `https://` official source URLs.
  - Verified official Kalshi `orderbook_fp` reciprocal bid/ask math (`yes_dollars` best bid `$0.42` + `no_dollars` best bid `$0.56` => implied YES ask `$0.44`, spread `$0.02`).
  - Verified live tick engine, `>= $0.10` dual-chat swing alerts, paper trade execution, YES/NO settlement payouts, trade category analytics, and custom strategy creation.
- Live HTTP server verification (`python3 -m http.server 8080 --bind 0.0.0.0`): confirmed HTTP `200` on all 21 served routes (HTML, CSS, JS modules, Markdown docs) and `node --check assets/js/*.js` clean syntax check.

---

## Flagged Irregularities Log (Published on `flagged-for-review.html`, Status: `needs review`)
- **IRREG-01 (High):** Browser `WebSocket` API cannot attach Kalshi's required handshake headers (`KALSHI-ACCESS-KEY`, `KALSHI-ACCESS-TIMESTAMP`, `KALSHI-ACCESS-SIGNATURE`); direct authenticated WS streaming requires a server/edge relay proxy.
- **IRREG-02 (High):** Static GitHub Pages browser `fetch()` requests to Kalshi Demo API may encounter CORS blocks or require user-owned demo credentials; no keys are stored in git, and paper simulation mode is explicitly labeled.
- **IRREG-03 (Medium):** Kalshi officially warns Demo environment prices and market behavior do not reflect production markets.
- **IRREG-04 (Medium):** Kalshi REST candlestick API supports `1` (1m), `60` (1h), and `1440` (1d) intervals only; Seconds-level charting aggregates live stream/tick data client-side.
- **IRREG-05 (Medium):** `GET /markets/{ticker}/orderbook` returns HTTP `200` with empty arrays even for unknown/invalid tickers (not `404`).
- **IRREG-06 (Low):** Prompt listed both `external-api.demo.kalshi.co` (recommended dedicated host) and `demo-api.kalshi.co` (also supported legacy shared host); both verified and supported.
- **IRREG-07 (Medium):** 8 markets with unexposed static dollar volumes, 1 post-Nov-19 NY gas settlement without confirmed official close banner, and dynamic live resting orderbook contract counts are left **blank** and tagged `Unverified` in verified catalog tables.
- **IRREG-08 (Low):** Initial repo commit `62713af` contained only an 11-byte `README.md`.

---

## Pull Request & Deployment Record
- **Source Branch:** `arena/3716ae8d-tradebot3` -> `main`
- **PR URL:** https://github.com/kanlerxz87-cyber/Tradebot3/pull/1
- **Merge Method:** `gh pr merge 1 --merge` (merged into `main` on 2026-11-22 UTC after passing `scripts/verify_site.py` with 0 broken links)
- **GitHub Pages Live URL:** https://kanlerxz87-cyber.github.io/Tradebot3/
