# Executive Summary — Tradebot3 Kalshi Demo Paper-Simulation Dashboard

**Date:** 2026-11-22 (UTC)  
**Repository:** `kanlerxz87-cyber/Tradebot3`  
**Live GitHub Pages Site:** https://kanlerxz87-cyber.github.io/Tradebot3/  
**Branch:** `arena/a17ff2cd-tradebot3` (current fixed Arena branch; follow-up to merged Sessions 1 and 2)

> **Operational limitation:** The deployed GitHub Pages app is not a live-data or live-trading system. It uses simulated client-side ticks, chart history, resting orderbook depth, alerts, and a local mock portfolio. Catalog prices/volumes are static snapshots; Session 2 re-checked 8 pages and corrected stale fields, but the remaining market rows are not all independently re-fetched. Model ROI is unvalidated heuristic output. The optional API connector can test public REST or read an authenticated balance; the page's tickets do not send Kalshi Demo orders. See IRREG-15 through IRREG-18 on [Flagged for Review](flagged-for-review.html) and Kalshi's official [WebSocket guide](https://docs.kalshi.com/getting_started/quick_start_websockets).

---

## Session 2 Addendum — Independent Re-Verification & Data Corrections (`arena-59730b38`, 2026-11-22T07:27:00Z)

An independent second session re-verified every API claim line by line against live official sources and spot-checked 8 live `kalshi.com` market pages (one per topic plus gas, elections, and crypto extras):

**API claims — all re-confirmed against live `docs.kalshi.com`:** Demo REST/WS endpoints and recommended-vs-supported hosts ([demo_env](https://docs.kalshi.com/getting_started/demo_env), [api_environments](https://docs.kalshi.com/getting_started/api_environments)); `orderbook_fp` bids-only reciprocal math incl. the `$0.42`/`$0.56` → `$0.44`/`$0.02` example ([orderbook_responses](https://docs.kalshi.com/getting_started/orderbook_responses)); authenticated WS handshake headers and channel list ([quick_start_websockets](https://docs.kalshi.com/getting_started/quick_start_websockets)); candlestick intervals `1`/`60`/`1440` only ([candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks)); Create Order V2 `POST /portfolio/events/orders` shape ([create-order-v2](https://docs.kalshi.com/api-reference/orders/create-order-v2)); and WebSocket connection limits (Basic/Advanced/**Expert**: 200, Premier: 500, Paragon: 750, Prime/**Prestige**: 1,000 — [rate_limits](https://docs.kalshi.com/getting_started/rate_limits)). The WS-limit row was extended with the verified Expert and Prestige tiers.

**Market dataset — 7 corrections across 8 live-checked pages, 1 exact re-confirmation:** `KXOSCARACTO-26` (settled YES, $25,562,603) matched exactly. Five open-market rows were corrected to live official values — most notably `KXAAAGASMAX-26DEC31` (Above $4.60: **$0.51 → $0.06**, vol → $2,150,412), plus `KXAAAGASMIN-26DEC31`, `KXPRESNOMD-28`, `KXETHMINY-27JAN01`, and `KXPGATOUR-THRC26-MTHO`; `CONTROLS-2026` was flipped Open → **Resolved YES** @ $1.00 (vol $341,173,231; page title 'Democrats Win' with Determined/Yes banner); and `KXBTCMAXMON-BTC-26MAR31`'s blank volume was filled ($2,050,528, NO outcome re-confirmed) (full before/after ledger in `COORDINATION.md`). Model fair values were mechanically re-anchored preserving each prior model edge so the High-ROI engine stays consistent; the rule is documented in `COORDINATION.md` and the corrections are published as **IRREG-14** on the Flagged for Review page (numbered to avoid colliding with parallel session `arena-a8cfdaeb`'s static IRREG-09..13; this session is the refresh pass its IRREG-10 requested, and its static before/after audit table is preserved on that page as the historical record). At Session 2, seeded demo-ledger rows were retained as historical records. Session 3 removed seeded trades/positions from the fresh-account fallback; old browser-stored seed rows are labeled, while other local paper history is preserved.

**Code audit:** `kalshi-client.js` (RSA-PSS SHA-256, salt length 32, `timestamp + METHOD + path` signing, orderbook parser, Create Order V2 payload) and `engine.js` (≥$0.10 dual-chat alerts, settlement $1.00/$0.00 payouts, P&L math, strategy rules) were read line by line; no defects found. Seeded cash math re-checked: $10,000 + $4.00 + $8.50 − (60×$0.13) − (50×$0.26) = $9,991.70 ✓.

---

## Session 3 Follow-up — Simulation and Verification Boundaries (`arena/a17ff2cd-tradebot3`)

- Renamed the dashboard's apparent live stream to a paper-simulation control, marked catalog-seeded alerts as snapshots without invented timestamps, and labeled synthetic ticks/orderbook levels as simulated.
- Removed pre-populated performance/trade examples from the fresh local paper account. Legacy browser-stored seed rows are labeled as seeded examples; user-created local paper history remains local and is not a Kalshi account record.
- Added source links to portfolio analytics rows and strengthened the verification script's checks for clean mock-account state and truthful snapshot/simulation labels.
- Preserved Session 2's eight-market official spot-check, seven data corrections, rate-limit update, and IRREG-14. This follow-up did not independently re-check the remaining market-page values.
- Added IRREG-15..18: no live WS/orderbook feed is deployed, paper tickets do not place exchange orders, news links do not prove price causation, and model ROI outputs are unvalidated.

---

## 1. Project Objective & Strict Topic Scope
Tradebot3 collects, organizes, verifies, and analyzes high-dollar Kalshi prediction market events across **five strictly isolated topics**:
1. **Gas Prices** (AAA national & state regular gasoline threshold markets)
2. **Elections** (U.S. Senate control, 2028 Presidential & nomination markets)
3. **Culture** (Oscars, Rotten Tomatoes Tomatometer scores, The Game Awards)
4. **Crypto** (Bitcoin, Ethereum, and Solana year-end & downside milestone markets)
5. **Golf** (PGA Tour Majors & live tournament winners including The RSM Classic and The Masters)

Topics are maintained in separate views and subpages. Volume fields are static catalog snapshots and should be refreshed from their linked official market pages before use; Session 2 re-checked eight pages, while the remaining values are not all revalidated.

---

## 2. Verified Kalshi Demo API Architecture
Every API endpoint and schema was verified line by line against Kalshi's official documentation ([Demo Environment](https://docs.kalshi.com/getting_started/demo_env), [API Environments](https://docs.kalshi.com/getting_started/api_environments), [Orderbook Responses](https://docs.kalshi.com/getting_started/orderbook_responses), [WebSockets Quick Start](https://docs.kalshi.com/getting_started/quick_start_websockets), [Rate Limits](https://docs.kalshi.com/getting_started/rate_limits)):

| Surface | Recommended Demo Endpoint | Also Supported (Legacy Shared) | Official Source |
| --- | --- | --- | --- |
| **REST Trade API** | `https://external-api.demo.kalshi.co/trade-api/v2` | `https://demo-api.kalshi.co/trade-api/v2` | [Kalshi Demo Env](https://docs.kalshi.com/getting_started/demo_env) |
| **WebSocket API** | `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2` | `wss://demo-api.kalshi.co/trade-api/ws/v2` | [Kalshi Demo Env](https://docs.kalshi.com/getting_started/demo_env) |
| **User Fill/Order WS** | `wss://user-ws.demo.kalshi.co/trade-api/ws/v2` | *(dedicated user stream)* | [API Environments](https://docs.kalshi.com/getting_started/api_environments) |
| **Demo Web App** | `https://demo.kalshi.co/` | — | [Kalshi Demo Env](https://docs.kalshi.com/getting_started/demo_env) |

### Key Verified Technical Details
- **Authentication:** Public market-data REST endpoints (`GET /events`, `GET /markets`, `GET /markets/{ticker}/orderbook`) require no authentication. Trading, portfolio, and **all WebSocket handshakes** require three headers: `KALSHI-ACCESS-KEY`, `KALSHI-ACCESS-TIMESTAMP` (Unix ms), and `KALSHI-ACCESS-SIGNATURE` (Base64 signature of `timestamp + METHOD + path_without_query` using RSA-PSS SHA-256 with salt length = digest length, or Ed25519).
- **Orderbook Mechanics (`orderbook_fp`):** Returns `yes_dollars` and `no_dollars` arrays of `[price_dollars, count_fp]` string pairs (bids only, ascending order; highest bid is last element). Because binary contracts sum to `$1.00`, a YES bid at price `X` equals a NO ask at `$1.00 - X`, and a NO bid at `Y` equals a YES ask at `$1.00 - Y`.
- **Candlesticks & Timeframes:** `GET /series/{series_ticker}/markets/{ticker}/candlesticks` supports `period_interval` values of `1` (1 minute), `60` (1 hour), and `1440` (1 day) only. **Seconds-level live charts** require client-side aggregation of real `ticker` / `trade` messages; the current app instead uses simulation points.
- **Rate Limits:** Current documented concurrent WebSocket limits include Basic/Advanced/Expert `200`, Premier `500`, Paragon `750`, and Prime/Prestige `1,000` ([Rate Limits](https://docs.kalshi.com/getting_started/rate_limits)). The Demo batch-order availability is documented in the [API Changelog](https://docs.kalshi.com/changelog).

---

## 3. Dashboard & Paper-Simulation Capabilities Delivered
The controls demonstrate requested workflows but do **not** connect to live prices or exchange execution. Generated ticks, chart points, orderbook depth, and paper fills are simulations. See IRREG-15 through IRREG-18 for limitations.
1. **Simulated >= $0.10 Swing Alerting System (Dual Scrolling Chats):**
   - **All Events Feed:** Scrolling chat for generated `>= $0.10` moves, plus separately labeled catalog snapshots. Generated timestamps are simulation times, not observed exchange-alert times.
   - **High-ROI Model Selective Feed:** Toy heuristic filters generated/snapshot alerts using configured edge, ROI, and liquidity thresholds. No backtest, calibration, or live quote feed is provided; outputs are not validated forecasts.
2. **Interactive Price Chart + Liquidity Orderbook + Catalyst Markers:**
   - **X-axis:** Time with selectable **Seconds**, **Minutes**, and **Hours** granularity.
   - **Y-axis:** Current contract price (`$0.00` to `$1.00`).
   - **Jump Markers:** Generated or catalog-snapshot jumps can link to context pages; those links do not prove the cause or exact timing of a contract move.
   - **Orderbook Liquidity View:** Displays simulated depth in the GitHub Pages build. The client parser supports official `orderbook_fp` responses, but the dashboard does not populate this ladder from a live API response.
3. **Full Lifecycle & Resolution Tracking:**
   - Tracks open high-dollar markets alongside resolved 2026 events, explicitly displaying settlement status (**Open**, **Resolved YES**, or **Resolved NO**) and payout rules.
4. **Local Paper Portfolio & Strategy Lab:**
   - Starts with a `$10,000` mock balance and offers local simulated Buy/Sell YES/NO tickets, settlements, categories, and performance analytics. This is not the Kalshi Demo portfolio or order history.
   - An optional connector can test public REST or read account balance if a user enters credentials. The paper-trade ticket does not call the order endpoint. Automated strategies act on generated ticks, not live trading evidence.

---

## 4. Flagged Irregularities Summary (Published on Flagged for Review)
All irregularities and unverified fields are documented transparently on `flagged-for-review.html` and do not block deployment:
- **IRREG-01:** Standard browser `WebSocket` cannot attach Kalshi's required handshake auth headers (`KALSHI-ACCESS-*`); real authenticated WS streaming requires a server/worker relay proxy.
- **IRREG-02:** Static GitHub Pages browser `fetch()` requests to Kalshi Demo API may encounter CORS restrictions and require user-owned demo credentials for private endpoints; simulated ticks and paper fills are explicitly labeled.
- **IRREG-03:** Kalshi officially warns that Demo environment market prices and liquidity do not reflect production markets ([source](https://docs.kalshi.com/getting_started/demo_env)).
- **IRREG-04:** REST candlesticks support `1m`, `60m`, `1440m` only; this app's seconds chart uses simulated ticks until a live feed is implemented.
- **IRREG-05:** `GET /markets/{ticker}/orderbook` returns HTTP `200` with empty arrays for unknown tickers instead of `404` ([source](https://docs.kalshi.com/getting_started/orderbook_responses)).
- **IRREG-06:** User prompt included both recommended (`external-api.demo.kalshi.co`) and legacy shared (`demo-api.kalshi.co`) demo hostnames; both are officially supported, with `external-api` recommended.
- **IRREG-07:** Specific market volumes and static resting contract depth that were not published in official static snapshots are left **blank** and tagged `Unverified` in verified tables.
- **IRREG-08:** Initial repository audit (`62713af`) found only an 11-byte `README.md` with no code, tests, or `COORDINATION.md`.
- **IRREG-09–13:** Prior review identified seeded alerts mistakenly labeled observed, stale catalog prices/status/volumes, omitted external-feed endpoint documentation, and remaining unverified markets. The six-page review and subsequent corrections are preserved in the Flagged for Review page and coordination log.
- **IRREG-14:** Session 2 corrected seven fields across eight Kalshi market page checks and refreshed the documented WS rate limits; see the Session 2 source ledger in `COORDINATION.md`.
- **IRREG-15:** No live WebSocket or current orderbook feed is deployed; generated ticks, chart points, resting depth, and alert times are simulated/static.
- **IRREG-16:** Portfolio is local paper state; the UI ticket does not send orders to Kalshi Demo or sync account positions.
- **IRREG-17:** News/context links do not prove the cause or exact time of a contract price move.
- **IRREG-18:** Model fair values and ROI are unvalidated illustrative heuristics without calibration or backtesting.

---

## 5. Recommendations to Make the Site More Live & Interactive
Detailed in `verification.html`, top architectural upgrades include:
1. Deploy a lightweight Cloudflare Worker / Node.js WebSocket-to-SSE/WS relay signing `GET /trade-api/ws/v2` server-side so browsers receive genuine sub-second `ticker`, `trade`, `orderbook_delta`, and `market_lifecycle_v2` streams without exposing API private keys.
2. Subscribe to `market_lifecycle_v2` and `fill` channels (plus `wss://user-ws.demo.kalshi.co/trade-api/ws/v2`) for lower-latency lifecycle and fill updates; actual latency depends on the deployed relay and Kalshi service.
3. Add timestamped RSS/news/webhook ingestion (AAA, EIA, election calls, PGA Tour, and crypto sources) to show nearby candidate context for `>= $0.10` moves, without asserting causation unless a trusted source confirms it.
4. Enable browser Web Notifications + audio ping toggles for High-ROI `>= $0.10` alerts and one-click orderbook ladder limit order entry directly from depth rows.
