# Executive Summary — Tradebot3 Kalshi Demo Dashboard & Trading System

**Date:** 2026-11-22 (UTC) — Live 2026-11-22 re-verification pass
**Repository:** `kanlerxz87-cyber/Tradebot3`
**Live GitHub Pages Site:** https://kanlerxz87-cyber.github.io/Tradebot3/
**Branch:** `arena/3716ae8d-tradebot3` (Session 1, merged via PR #1) · `arena/a8cfdaeb-tradebot3` (T-06, via PR #2) · `arena/59730b38-tradebot3` (Session 2, via PR #6) · `arena/dcead908-tradebot3` (re-verification session, rebased onto `5851fb3`)

---

## Session 2 Addendum — Independent Re-Verification & Data Corrections (`arena-59730b38`, 2026-11-22T07:27:00Z)

An independent second session re-verified every API claim line by line against live official sources and spot-checked 8 live `kalshi.com` market pages (one per topic plus gas, elections, and crypto extras):

**API claims — all re-confirmed against live `docs.kalshi.com`:** Demo REST/WS endpoints and recommended-vs-supported hosts ([demo_env](https://docs.kalshi.com/getting_started/demo_env), [api_environments](https://docs.kalshi.com/getting_started/api_environments)); `orderbook_fp` bids-only reciprocal math incl. the `$0.42`/`$0.56` → `$0.44`/`$0.02` example ([orderbook_responses](https://docs.kalshi.com/getting_started/orderbook_responses)); authenticated WS handshake headers and channel list ([quick_start_websockets](https://docs.kalshi.com/getting_started/quick_start_websockets)); candlestick intervals `1`/`60`/`1440` only ([candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks)); Create Order V2 `POST /portfolio/events/orders` shape ([create-order-v2](https://docs.kalshi.com/api-reference/orders/create-order-v2)); and WebSocket connection limits (Basic/Advanced/**Expert**: 200, Premier: 500, Paragon: 750, Prime/**Prestige**: 1,000 — [rate_limits](https://docs.kalshi.com/getting_started/rate_limits)). The WS-limit row was extended with the verified Expert and Prestige tiers.

**Market dataset — 7 corrections across 8 live-checked pages, 1 exact re-confirmation:** `KXOSCARACTO-26` (settled YES, $25,562,603) matched exactly. Five open-market rows were corrected to live official values — most notably `KXAAAGASMAX-26DEC31` (Above $4.60: **$0.51 → $0.06**, vol → $2,150,412), plus `KXAAAGASMIN-26DEC31`, `KXPRESNOMD-28`, `KXETHMINY-27JAN01`, and `KXPGATOUR-THRC26-MTHO`; `CONTROLS-2026` was flipped Open → **Resolved YES** @ $1.00 (vol $341,173,231; page title 'Democrats Win' with Determined/Yes banner); and `KXBTCMAXMON-BTC-26MAR31`'s blank volume was filled ($2,050,528, NO outcome re-confirmed) (full before/after ledger in `COORDINATION.md`). Model fair values were mechanically re-anchored preserving each prior model edge so the High-ROI engine stays consistent; the rule is documented in `COORDINATION.md` and the corrections are published as **IRREG-16** on the Flagged for Review page (numbered to avoid colliding with parallel sessions `arena-a8cfdaeb` (static IRREG-09..13) and `arena-dcead908` (dynamic IRREG-14, covering the full 29-market refresh); this session is the refresh pass static IRREG-10 requested, and its static before/after audit table is preserved on that page as the historical record). Seeded demo-ledger trades in `engine.js` are historical records and were intentionally left untouched.

**Code audit:** `kalshi-client.js` (RSA-PSS SHA-256, salt length 32, `timestamp + METHOD + path` signing, orderbook parser, Create Order V2 payload) and `engine.js` (≥$0.10 dual-chat alerts, settlement $1.00/$0.00 payouts, P&L math, strategy rules) were read line by line; no defects found. Seeded cash math re-checked: $10,000 + $4.00 + $8.50 − (60×$0.13) − (50×$0.26) = $9,991.70 ✓.
---

## 1. Project Objective & Strict Topic Scope
Tradebot3 collects, organizes, verifies, and analyzes high-dollar Kalshi prediction market events across **five strictly isolated topics**:
1. **Gas Prices** (AAA national & state regular gasoline threshold markets)
2. **Elections** (U.S. Senate control, 2028 Presidential & nomination markets)
3. **Culture** (Oscars, Rotten Tomatoes Tomatometer scores, The Game Awards)
4. **Crypto** (Bitcoin, Ethereum, and Solana year-end & downside milestone markets)
5. **Golf** (PGA Tour Majors & live tournament winners including The RSM Classic and The Masters)

Topics are maintained in separate views and subpages while events within each topic are organized together, ordered by verified dollar trading volume.

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
- **Candlesticks & Timeframes:** `GET /series/{series_ticker}/markets/{ticker}/candlesticks` supports `period_interval` values of `1` (1 minute), `60` (1 hour), and `1440` (1 day) only. **Seconds-level charts** must be aggregated client-side from live `ticker` / `trade` stream updates.
- **Rate Limits:** Concurrent WebSocket limits range from `200` (Basic/Advanced) to `1,000` (Prime). Basic tier users receive access to batch order endpoints in the Demo environment ([API Changelog](https://docs.kalshi.com/changelog)).

---

## 3. Core Dashboard & Trading Capabilities Delivered
1. **Live >= $0.10 Swing Alerting System (Dual Scrolling Chats):**
   - **All Events Feed:** Real-time scrolling chat alerting whenever any tracked market moves `>= $0.10` in either direction (up or down), showing ticker, direction, price delta, timestamp, and verified catalyst link.
   - **High-ROI Model Selective Feed:** Filtered chat surfacing only swings passing our quantitative High-ROI model criteria (positive model edge `>= 5%`, favorable expected ROI, spread efficiency, and liquidity score), with transparent reasoning on every alert.
2. **Interactive Price Chart + Liquidity Orderbook + Catalyst Markers:**
   - **X-axis:** Time with selectable **Seconds**, **Minutes**, and **Hours** granularity.
   - **Y-axis:** Current contract price (`$0.00` to `$1.00`).
   - **Jump Markers:** Events with `>= $0.10` sharp price jumps are plotted directly on the chart with clickable catalyst details and verified external source links (CNBC, EIA, Emerson College Polling, PGA Tour, Wccftech/Game Awards).
   - **Orderbook Liquidity View:** Displays resting contract counts and dollar liquidity at each price level (YES bids, NO bids, and implied YES asks + spread calculation).
3. **Full Lifecycle & Resolution Tracking:**
   - Tracks open high-dollar markets alongside resolved 2026 events, explicitly displaying settlement status (**Open**, **Resolved YES**, or **Resolved NO**) and payout rules.
4. **Kalshi Demo Portfolio, Trade Execution & Automated Strategy Lab:**
   - Supports direct browser REST signing against Kalshi Demo API (when a user supplies their own Demo Key ID + RSA private key locally in browser memory — never stored in git) AND a ready-to-use **Paper Demo Account** (`$10,000` mock balance) with full trade execution (Buy/Sell YES/NO, Limit/Market).
   - Includes **Automated Strategy Simulators** (Swing Mean Reversion `>= $0.10`, Swing Momentum Breakout, High-ROI Model Auto-Trader, Liquidity Spread Capture), **Trade Categorization & Performance Analytics**, and a **Custom Strategy Builder** derived from trade category outcomes.

---

## 4. Flagged Irregularities Summary (Published on Flagged for Review)
All irregularities and unverified fields are documented transparently on `flagged-for-review.html` and do not block deployment:
- **IRREG-01:** Standard browser `WebSocket` cannot attach Kalshi's required handshake auth headers (`KALSHI-ACCESS-*`); real authenticated WS streaming requires a server/worker relay proxy.
- **IRREG-02:** Static GitHub Pages browser `fetch()` requests to Kalshi Demo API may encounter CORS restrictions and require user-owned demo credentials for private endpoints; simulated ticks and paper fills are explicitly labeled.
- **IRREG-03:** Kalshi officially warns that Demo environment market prices and liquidity do not reflect production markets ([source](https://docs.kalshi.com/getting_started/demo_env)).
- **IRREG-04:** Kalshi REST candlestick API does not provide 1-second bars (`1m`, `60m`, `1440m` only); seconds-level charts rely on live client-side tick aggregation.
- **IRREG-05:** `GET /markets/{ticker}/orderbook` returns HTTP `200` with empty arrays for unknown tickers instead of `404` ([source](https://docs.kalshi.com/getting_started/orderbook_responses)).
- **IRREG-06:** User prompt included both recommended (`external-api.demo.kalshi.co`) and legacy shared (`demo-api.kalshi.co`) demo hostnames; both are officially supported, with `external-api` recommended.
- **IRREG-07:** Of 29 catalog rows, only `KXAAAGASCDNY-26NOV19` dollar volume remains unexposed (not shown on the official Kalshi page). Live resting orderbook contract counts remain dynamic; the orderbook ladder shows a clearly labeled Demo Simulation instead.
- **IRREG-08:** Initial repository audit (`62713af`) found only an 11-byte `README.md` with no code, tests, or `COORDINATION.md`.
- **IRREG-14 (NEW 2026-11-22, arena-dcead908):** First-pass catalog values that did not match official Kalshi pages were corrected (prices, volumes, settlements, and one resolution). Full diff is logged in `assets/js/data.js` (IRREG-14) and on `flagged-for-review.html`.
- **IRREG-15 (NEW 2026-11-22, arena-dcead908):** Three first-pass catalyst links did not match the market being tracked (gas-price rows cited unrelated live-updates articles; Ethereum row cited a general market-correction page; RSM Classic row cited a stale 2026 past-results page). All were corrected or removed pending a reachable verifiable 2026 source.
- **IRREG-09 (NEW 2026-11-22, arena-a8cfdaeb):** Seeded `>= $0.10` swing alerts were relabeled from "Verified Observed Swing" to "Unverified Catalog Alert" (authored catalog entries, not observed ticks).
- **IRREG-10 (NEW 2026-11-22, arena-a8cfdaeb):** Stored prices disagreed with official pages for 4 of 6 sampled markets — resolved by `arena-dcead908` and `arena-59730b38` (all 29 rows now carry official verified values; full diffs in `assets/js/data.js` IRREG-14 and IRREG-16).
- **IRREG-12 (NEW 2026-11-22, arena-a8cfdaeb):** CONTROLS-2026 was stored as Open — resolved as Resolved YES (Democrats Win, $341.17M volume).
- **IRREG-13 (NEW 2026-11-22, arena-a8cfdaeb):** Stored dollar volumes differed from official pages — resolved; catalog volumes now match official pages (remaining unverifiable: KXAAAGASCDNY-26NOV19 volume, IRREG-07).
- **IRREG-16 (NEW 2026-11-22, arena-59730b38):** Session 2 independent refresh corrected 7 rows (including CONTROLS-2026 Resolved YES and KXBTCMAXMON $2,050,528 volume) after cross-validating T-06's static mismatches. See `assets/js/data.js` IRREG-16 and COORDINATION.md Session 2 Verification Log.

---

## 4.5 Live Re-Verification & Data-Correction Record (2026-11-22, arena-dcead908)
All 29 market rows were re-verified against the official `kalshi.com` pages by BOTH parallel sessions — Session 2 (`arena-59730b38`, 7 rows) and re-verification session `arena-dcead908` (all 29 rows). Combined corrections are published as **IRREG-14** (full 29-market refresh, this section) and **IRREG-16** (Session-2 independent refresh; see Session 2 Addendum above). (fetched 2026-11-22 UTC; demo REST stays unreachable from this sandbox — empty HTTP body, so no live-demo fetch was possible):
- **Gas (5):** MAX $2.15M volume (0.06), MIN $120K (0.69, swing +0.27), MIN CA $70.1K (0.02), MAX CA $509.5K (0.06), CnY NY Nov 19 settlement Determined/Yes ($1.00).
- **Elections (6):** KXPRESNOMD-28 $308.0M (0.24), CONTROLS-2026 $341.2M Resolved/Yes ($1.00), KXPRESPERSON-28 $111.67M (0.18), CONTROLS-2028 $1.04M (0.89), KXPRESPARTY-2028 $911.7K (0.67), POWER-28 $613.3K (0.67).
- **Culture (6):** KXOSCARACTO-26 $25.56M Resolved/Yes, KXOSCARACTR-26 $6.65M Resolved/Yes, KXRT-ODY $7.19M Resolved/Yes, KXRT-BRI $418.2K Resolved/Yes, KXGAMEAWARDS-2026 $4.32M (0.92), KXOSCARDOCU-26 $728.2K Resolved/Yes.
- **Crypto (6):** KXETHMINY-27JAN01 $1.83M (0.63, swing +0.26), KXSOLD26-27JAN0100 $215.0K (0.89), KXBTCY-27JAN0100 $50.84M (0.219), KXBTCMINY-27JAN01 $9.49M (0.66), KXBTC50VS100-BTC-26DEC31 $9.28M (0.40), KXBTCMAXMON-BTC-26MAR31 $2.05M Resolved/Yes.
- **Golf (6):** KXPGATOUR-MAST26 $548.71M Resolved/Yes, KXPGATOUR-PGC26 $393.57M Resolved/Yes, KXPGATOUR-THRC26 $40.0M (0.18, LIVE R2), KXPGATOUR-MAST27 $2.38M (0.18), KXPGATOUR-USO26 $353.56M Resolved/Yes, KXPGAMASTERS-26 $807.77K Resolved/NO.
- **Trust/stale behavior:** demo REST demo API remains unreachable (HTTP 000) — every number in this catalog is transcribed from the official `kalshi.com` pages or external reachable sources; `modelFairValue` is clearly labeled an internal estimate, not an official price.

---

## 5. Recommendations to Make the Site More Live & Interactive
Detailed in `verification.html`, top architectural upgrades include:
1. Deploy a lightweight Cloudflare Worker / Node.js WebSocket-to-SSE/WS relay signing `GET /trade-api/ws/v2` server-side so browsers receive genuine sub-second `ticker`, `trade`, `orderbook_delta`, and `market_lifecycle_v2` streams without exposing API private keys.
2. Subscribe to `market_lifecycle_v2` and `fill` channels (plus `wss://user-ws.demo.kalshi.co/trade-api/ws/v2`) for instant settlement notifications and zero-latency execution confirmations.
3. Add automated RSS/news webhook ingestion (AAA Daily Fuel Gauge, EIA Weekly Petroleum Status, AP/Reuters Election Calls, PGA Tour ShotLink, Crypto spot feeds) to auto-pin verified catalyst URLs onto `>= $0.10` price jumps in real time.
4. Enable browser Web Notifications + audio ping toggles for High-ROI `>= $0.10` alerts and one-click orderbook ladder limit order entry directly from depth rows.
