# COORDINATION.md — Shared Task Board & Verification Log

> **Repository:** `kanlerxz87-cyber/Tradebot3`
> **Live Site (GitHub Pages):** https://kanlerxz87-cyber.github.io/Tradebot3/
> **Active Session ID:** `arena-ff314ece` (prior completed session: `arena-3716ae8d`, PR #1 merged)
> **Working Branch:** `arena/ff314ece-tradebot3` (Arena fixed session branch; branched from `main` at `08ad596f66ebccb189754df5fa6dadac6365989c`)
> **Last Updated:** 2026-11-22 (UTC)

---

## Coordination Protocol Notes
- All tasks were claimed prior to editing and pushed immediately on the active session branch (`arena/ff314ece-tradebot3` for PR #2; prior session `arena/3716ae8d-tradebot3` for PR #1).
- Because Arena binds this session to `arena/ff314ece-tradebot3`, all commits, pushes, and PR #2 to `main` are performed on `arena/ff314ece-tradebot3` without creating or switching branches.
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
| R-01 | Flagged Irregularities IRREG-01 through IRREG-09 & unverified static fields (published on `flagged-for-review.html`) | `needs review` | `arena-ff314ece` | `arena/ff314ece-tradebot3` | `flagged-for-review.html`, `assets/js/data.js` |
| T-06 | Independent line-by-line repo review & official-source re-verification of Kalshi Demo API docs (14 pages), all 29 live `kalshi.com` markets, catalyst links, and irregularities | `done` | `arena-ff314ece` | `arena/ff314ece-tradebot3` | `COORDINATION.md`, `EXECUTIVE_SUMMARY.md`, `assets/js/data.js` |
| T-07 | Remediate PR #1 discrepancies (2 settlements, 7 volumes, 16 prices/catalysts, RSM Classic URL, Ed25519+PKCS#1 RSA client, Create Order V2 mapping, NO-side price sync) & add interactive upgrades (chart crosshair tooltip, live Demo orderbook pull, live Demo order toggle, Category P&L bar chart, alert search/filter & sound ping, status filter) | `done` | `arena-ff314ece` | `arena/ff314ece-tradebot3` | `assets/js/*.js`, `*.html`, `EXECUTIVE_SUMMARY.md`, `README.md` |
| T-08 | Expand automated verification suite (`verify_site.py` + `node --check`), live HTTP 200 verification, PR #2 to `main`, autonomous merge, and GitHub Pages deploy confirmation | `in progress` | `arena-ff314ece` | `arena/ff314ece-tradebot3` | `scripts/verify_site.py`, `COORDINATION.md` |

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

### Additional Verified Official Sources (Session `arena-ff314ece` — 2026-11-22 Re-Verification)
- Kalshi API Keys (Ed25519 recommended default + RSA-PSS + 30s clock window): https://docs.kalshi.com/getting_started/api_keys
- Kalshi Get Balance (dedicated rate-limit bucket 1/s Basic/Adv, 5/s Expert+): https://docs.kalshi.com/api-reference/portfolio/get-balance
- Kalshi Get Events & Get Markets: https://docs.kalshi.com/api-reference/events/get-events · https://docs.kalshi.com/api-reference/market/get-markets
- Verified Gas Catalysts: https://www.cspdailynews.com/fuels/gas-prices-dip-below-4-first-time-july-aaa-reports · https://www.cbsnews.com/texas/news/texas-gas-prices-drop-nearly-55-cents-a-gallon-whats-behind-the-decline/ · https://www.nbcnews.com/data-graphics/gas-prices-iran-war-state-national-cost-trump-rcna265835
- Verified Elections Catalysts: https://www.ms.now/news/2028-democratic-presidential-candidates-primary · https://nypost.com/2026/11/19/us-news/marco-rubio-surges-past-jd-vance-to-lead-2028-republican-primary-race-poll/ · https://thehill.com/homenews/campaign/6231607-marco-rubio-trump-successor-buzz/ · https://www.reuters.com/graphics/US-ELECTIONS/GRAPHICS-BLOG/akpelkldzvr/2026-11-16/future-senate/
- Verified Culture Catalysts: https://variety.com/2026/gaming/news/gta-6-reviews-highest-rated-video-game-1236951803/ · https://billboard.com/music/awards/2026-game-awards-nominations-list-grand-theft-auto-vi-1236384541
- Verified Crypto Catalysts: https://www.cnbc.com/2026/11/20/bitcoin-price-gold-market-hedge.html · https://coindoo.com/ethereum-dips-stops-above-low/ · https://beincrypto.com/solana-etf-inflows-crypto-selloff-bitwise/ · https://www.fool.com/investing/2026/11/21/msci-is-cutting-strategy-and-metaplanet-from-its-indexes-here-s-what-it-means-for-bitcoin-treasury-company-stocks/
- Verified Golf Catalyst (corrected from 2025 `/past-results` to live 2026 leaderboard): https://www.pgatour.com/tournaments/2026/the-rsm-classic/R2026493/leaderboard

---

## Verification Performed
- `python3 scripts/verify_site.py` (expanded in `arena-ff314ece`, 2026-11-22 UTC):
  - Confirmed all 23 required repository and site files exist.
  - Confirmed `node --check` passes cleanly on all 9 ES modules (`assets/js/*.js`).
  - Checked 35 internal HTML links across all 9 pages (`index.html`, `portfolio.html`, `verification.html`, `flagged-for-review.html`, and 5 `categories/*.html`) — **0 broken links**.
  - Verified all JS `getElementById()` references match DOM IDs across all 9 HTML pages.
  - Verified strict 5-topic isolation across all 29 Kalshi markets (`gas-prices`, `elections`, `culture`, `crypto`, `golf` ONLY).
  - Verified 100% of table rows across `DEMO_API_ENDPOINTS` (16), `VERIFIED_MARKETS` (29), `FLAGGED_IRREGULARITIES` (9), `REPO_AUDIT_ITEMS` (7), and `INTERACTIVE_SUGGESTIONS` (6) carry valid `https://` official source URLs.
  - Verified official Kalshi `orderbook_fp` reciprocal bid/ask math (`yes_dollars` best bid `$0.42` + `no_dollars` best bid `$0.56` => implied YES ask `$0.44`, spread `$0.02`).
  - Verified Create Order V2 single-book reciprocal mapping (`mapYesNoOrderToV2`) across all 4 BUY/SELL YES/NO combinations.
  - Verified 2026-11-22 settlement corrections (`CONTROLS-2026` Resolved YES @ `1.00`, `KXAAAGASCDNY-26NOV19` Resolved YES @ `1.00` with `volumeUsd: null`).
  - Verified live tick engine, `>= $0.10` dual-chat swing alerts, paper trade execution, YES/NO settlement payouts, trade category analytics, and custom strategy creation.
- Live HTTP server verification (`python3 -m http.server`): confirmed HTTP `200` on all 21 served routes (HTML, CSS, JS modules, Markdown docs).

---

## Flagged Irregularities Log (Published on `flagged-for-review.html`)
- **IRREG-01 (High):** Browser `WebSocket` API cannot attach Kalshi's required handshake headers (`KALSHI-ACCESS-KEY`, `KALSHI-ACCESS-TIMESTAMP`, `KALSHI-ACCESS-SIGNATURE`); direct authenticated WS streaming requires a server/edge relay proxy.
- **IRREG-02 (High):** Static GitHub Pages browser `fetch()` requests to Kalshi Demo API may encounter CORS blocks or require user-owned demo credentials; no keys are stored in git, and paper simulation mode is explicitly labeled.
- **IRREG-03 (Medium):** Kalshi officially warns Demo environment prices and market behavior do not reflect production markets.
- **IRREG-04 (Medium):** Kalshi REST candlestick API supports `1` (1m), `60` (1h), and `1440` (1d) intervals only; Seconds-level charting aggregates live stream/tick data client-side.
- **IRREG-05 (Medium):** `GET /markets/{ticker}/orderbook` returns HTTP `200` with empty arrays even for unknown/invalid tickers (not `404`).
- **IRREG-06 (Low):** Prompt listed both `external-api.demo.kalshi.co` (recommended dedicated host) and `demo-api.kalshi.co` (also supported legacy shared host); both verified and supported.
- **IRREG-07 (Medium — Updated 2026-11-22):** After live re-verification filled 7 previously blank volumes directly from official `kalshi.com` pages, only `KXAAAGASCDNY-26NOV19` volume (omitted on its settled page) and live dynamic orderbook depth remain statically unverified (`null` / blank + `Unverified`).
- **IRREG-08 (Low):** Initial repo commit `62713af` contained only an 11-byte `README.md`.
- **IRREG-09 (Medium — Remediated in PR #2):** Line-by-line audit of PR #1 caught and fixed 2 newly settled markets (`CONTROLS-2026`, `KXAAAGASCDNY-26NOV19`), 7 missing volumes, 16 stale prices/volumes/catalysts (including fixing the RSM Classic URL from 2025 `/past-results` to 2026 `/leaderboard`), Ed25519 + PKCS#1 RSA signing support, Create Order V2 YES/NO mapping, and the Quick Trade NO-side price synchronization bug.

---

## Pull Request & Deployment Record
- **Source Branch:** `arena/3716ae8d-tradebot3` -> `main`
- **PR URL:** https://github.com/kanlerxz87-cyber/Tradebot3/pull/1
- **Merge Method:** `gh pr merge 1 --merge` (merged into `main` on 2026-11-22 UTC after passing `scripts/verify_site.py` with 0 broken links)
- **GitHub Pages Live URL:** https://kanlerxz87-cyber.github.io/Tradebot3/
