# Executive Summary — Tradebot3 Kalshi Demo Dashboard & Trading System

**Date:** 2026-11-22 (UTC)  
**Repository:** `kanlerxz87-cyber/Tradebot3`  
**Live GitHub Pages Site:** https://kanlerxz87-cyber.github.io/Tradebot3/  
**Branch:** `arena/83838475-tradebot3` (active: full 29-market refresh + notify toggle; priors merged on `main`: `arena/1a3afb37-tradebot3` T-07 paper-sim disclosure via PR #4, `arena/59730b38-tradebot3` Session 2 via PR #6/#8, `arena/3716ae8d-tradebot3` Session 1 via PR #1, `arena-a8cfdaeb` via PR #2/#3)

---

## Session 2 Addendum — Independent Re-Verification & Data Corrections (`arena-59730b38`, 2026-11-22T07:27:00Z)

An independent second session re-verified every API claim line by line against live official sources and spot-checked 8 live `kalshi.com` market pages (one per topic plus gas, elections, and crypto extras):

**API claims — all re-confirmed against live `docs.kalshi.com`:** Demo REST/WS endpoints and recommended-vs-supported hosts ([demo_env](https://docs.kalshi.com/getting_started/demo_env), [api_environments](https://docs.kalshi.com/getting_started/api_environments)); `orderbook_fp` bids-only reciprocal math incl. the `$0.42`/`$0.56` → `$0.44`/`$0.02` example ([orderbook_responses](https://docs.kalshi.com/getting_started/orderbook_responses)); authenticated WS handshake headers and channel list ([quick_start_websockets](https://docs.kalshi.com/getting_started/quick_start_websockets)); candlestick intervals `1`/`60`/`1440` only ([candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks)); Create Order V2 `POST /portfolio/events/orders` shape ([create-order-v2](https://docs.kalshi.com/api-reference/orders/create-order-v2)); and WebSocket connection limits (Basic/Advanced/**Expert**: 200, Premier: 500, Paragon: 750, Prime/**Prestige**: 1,000 — [rate_limits](https://docs.kalshi.com/getting_started/rate_limits)). The WS-limit row was extended with the verified Expert and Prestige tiers.

**Market dataset — 7 corrections across 8 live-checked pages, 1 exact re-confirmation:** `KXOSCARACTO-26` (settled YES, $25,562,603) matched exactly. Five open-market rows were corrected to live official values — most notably `KXAAAGASMAX-26DEC31` (Above $4.60: **$0.51 → $0.06**, vol → $2,150,412), plus `KXAAAGASMIN-26DEC31`, `KXPRESNOMD-28`, `KXETHMINY-27JAN01`, and `KXPGATOUR-THRC26-MTHO`; `CONTROLS-2026` was flipped Open → **Resolved YES** @ $1.00 (vol $341,173,231; page title 'Democrats Win' with Determined/Yes banner); and `KXBTCMAXMON-BTC-26MAR31`'s blank volume was filled ($2,050,528, NO outcome re-confirmed) (full before/after ledger in `COORDINATION.md`). Model fair values were mechanically re-anchored preserving each prior model edge so the High-ROI engine stays consistent; the rule is documented in `COORDINATION.md` and the corrections are published as **IRREG-14** on the Flagged for Review page (numbered to avoid colliding with parallel session `arena-a8cfdaeb`'s static IRREG-09..13; this session is the refresh pass its IRREG-10 requested, and its static before/after audit table is preserved on that page as the historical record). At the time of this addendum, seeded demo-ledger trades in `engine.js` had been left untouched; the later T-07 follow-up removed seeded trades and equity history from the current local paper-simulation baseline.

**Code audit:** `kalshi-client.js` (RSA-PSS SHA-256, salt length 32, `timestamp + METHOD + path` signing, orderbook parser, Create Order V2 payload) and `engine.js` (≥$0.10 dual-chat alerts, settlement $1.00/$0.00 payouts, P&L math, strategy rules) were read line by line; no defects found. Historical seeded cash math was re-checked in that earlier audit: $10,000 + $4.00 + $8.50 − (60×$0.13) − (50×$0.26) = $9,991.70 ✓; the T-07 local baseline is now clean at $10,000.

---

## Session 2b Addendum — Full 29-Market Refresh & Notify Toggle (`arena-83838475`, 2026-11-22 UTC)

Every row was re-verified line by line against live official sources — all **29 Kalshi market pages** individually
(headline chance %, Yes/No cents, ▲/▼ move, dollar volume, Determined/settlement banners), the Kalshi API docs
(demo env, environments, orderbook responses, WebSocket quick start, rate limits incl. WS connection caps
Basic/Adv/Expert 200 · Premier 500 · Paragon 750 · Prime/Prestige 1,000, candlesticks `1`/`60`/`1440`,
Create Order V2, Get Balance), and the Emerson College Nov-19 national poll toplines
(Ossoff 17% Dem #1, Rubio 44% vs Vance 24% GOP). Findings:

| # | Ticker | Correction Applied (old → freshly verified) | Official Source |
| --- | --- | --- | --- |
| 1 | KXAAAGASMAX-26DEC31 | Price 0.51 → **0.06** (Yes 6¢, ▼5); vol $1.84M → **$2,150,412** | [Kalshi](https://kalshi.com/markets/kxaaagasmax/us-highest-gas-price-yearly/kxaaagasmax-26dec31) |
| 2 | KXAAAGASMIN-26DEC31 | Price 0.55 → **0.67** (▲27); vol → **$120,214**; added +$0.27 catalyst | [Kalshi](https://kalshi.com/markets/kxaaagasmin/us-lowest-gas-price-yearly/kxaaagasmin-26dec31) |
| 3 | KXAAAGASMINCA-…-3.90 | Price 0.07 → **0.02** (▼2); vol → **$70,069** | [Kalshi](https://kalshi.com/markets/kxaaagasminca/california-lowest-gas-price-yearly) |
| 4 | KXAAAGASMAXCA-26DEC31 | Price 0.34 → **0.02** (▼6); vol blank → **$509,539** | [Kalshi](https://kalshi.com/markets/kxaaagasmaxca/california-highest-gas-price-yearly/kxaaagasmaxca-26dec31) |
| 5 | KXAAAGASCDNY-26NOV19 | Open/unverified → **Resolved YES** (Determined, Outcome Yes) | [Kalshi](https://kalshi.com/markets/kxaaagascdny/new-york-gas-price/kxaaagascdny-26nov19) |
| 6 | KXPRESNOMD-28 | Price 0.26 → **0.24**; vol → **$308,045,852** | [Kalshi](https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28) |
| 7 | CONTROLS-2026 | Open 97% → **Resolved YES** (Dem 100%, Determined); vol → **$341,173,231** | [Kalshi](https://kalshi.com/markets/controls/senate-winner/controls-2026) |
| 8 | KXPRESPERSON-28 | Price 0.18 → **0.17** (▼1); vol → **$111,670,768** | [Kalshi](https://kalshi.com/markets/kxpresperson/pres-person/kxpresperson-28) |
| 9 | CONTROLS-2028 | Price 0.89 → **0.90** (▲1); vol → **$1,038,132** | [Kalshi](https://kalshi.com/markets/controls/senate-winner/controls-2028) |
| 10 | KXPRESPARTY-2028 | Price 0.67 exact ✓; vol → **$911,689** | [Kalshi](https://kalshi.com/markets/kxpresparty/party-winning-presidency/kxpresparty-2028) |
| 11 | POWER-28 | Price 0.63 → **0.65**; vol → **$613,272** | [Kalshi](https://kalshi.com/markets/power/party-power/power-28) |
| 12 | KXGAMEAWARDS-2026 | Price 0.91 exact ✓ (▲6); vol → **$4,315,316**; GTA VI 8 noms + 99 Metacritic confirmed | [Kalshi](https://kalshi.com/markets/kxgameawards/game-awards/kxgameawards-2026) |
| 13 | KXETHMINY-27JAN01 | Price 0.42 → **0.63** (▲26); vol → **$1,829,630**; added +$0.26 catalyst (ETH $1,538) | [Kalshi](https://kalshi.com/markets/kxethminy/how-low-will-ethereum-fall-this-year/kxethminy-27jan01) |
| 14 | KXSOLD26-27JAN0100 | Price 0.89 → **0.90** ✓; vol → **$215,030** | [Kalshi](https://kalshi.com/markets/kxsold26/sol-price-end-of-2026/kxsold26-27jan0100) |
| 15 | KXBTCY-27JAN0100 | Price 0.19 → **0.22**; vol blank → **$50,835,002**; CNBC Nov-20 catalyst confirmed in-page | [Kalshi](https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100) |
| 16 | KXBTCMINY-27JAN01 | Price 0.58 → **0.64** (▲32); vol blank → **$9,494,723**; $55,055 low confirmed | [Kalshi](https://kalshi.com/markets/kxbtcminy/how-low-will-bitcoin-fall-this-year/kxbtcminy-27jan01) |
| 17 | KXBTC50VS100-BTC-26DEC31 | Price 0.18 → **0.37** (▼3); vol blank → **$9,284,632** | [Kalshi](https://kalshi.com/markets/kxbtc50vs100/will-btc-fall-below-50k-before-hitting-100k/kxbtc50vs100-btc-26dec31) |
| 18 | KXBTCMAXMON-BTC-26MAR31 | Settled NO ✓; vol blank → **$2,050,528** | [Kalshi](https://kalshi.com/markets/kxbtcmaxmon/bitcoin-monthly-one-touch/kxbtcmaxmon-btc-26mar31) |
| 19 | KXPGATOUR-THRC26-MTHO | Price 0.13 → **0.18** (LIVE Round 2); vol → **$39,992,031** | [Kalshi](https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-thrc26) |
| 20 | KXPGATOUR-MAST27 | Price 0.16 → **0.18** (▼1); vol → **$2,380,682** | [Kalshi](https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-mast27) |
| 21 | KXPGATOUR-USO26 | Settled YES (Clark) ✓; vol blank → **$353,561,663** | [Kalshi](https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-uso26) |
| 22 | KXPGAMASTERS-26 | Settled NO (Tiger) ✓; vol blank → **$807,770** | [Kalshi](https://kalshi.com/markets/kxpgamasters/golfers-to-participate-in-the-masters/kxpgamasters-26) |

Exact-match confirmations (untouched): Masters-2026 $548,706,971 YES · PGA Champ $393,570,149 YES ·
Oscar Actor $25,562,603 YES · Odyssey RT $7,186,984 YES (final 95%) · Oscar Actress $6,648,461 YES ·
Docu $728,234 YES · Bride RT $418,245 YES (final 59%).

New state: **12 resolved** (was 10), **1 unverified volume** remaining (was 8 — NY gas settled page shows no
figure), **13 data-driven flagged irregularities** (added IRREG-18 re-verification corrections, IRREG-19
Determined→Resolved mapping; renumbered twice because merged PR #6 owns IRREG-14 — which independently cross-validated
the same 7-row refresh with identical official values — and merged PR #4 owns IRREG-16/17). Also shipped: opt-in
**High-ROI desktop notification + audio ping toggle** (P2 suggestion) on the landing dashboard, and independently confirmed the External Feeds demo WebSocket endpoint row (16 API rows, merged via PR #6).

---

## 1. Project Objective & Strict Topic Scope
Tradebot3 organizes a static reference catalog and local paper simulation across **five strictly isolated Kalshi topics**:
1. **Gas Prices** (AAA national & state regular gasoline threshold markets)
2. **Elections** (U.S. Senate control, 2028 Presidential & nomination markets)
3. **Culture** (Oscars, Rotten Tomatoes Tomatometer scores, The Game Awards)
4. **Crypto** (Bitcoin, Ethereum, and Solana year-end & downside milestone markets)
5. **Golf** (PGA Tour Majors & tournament-winner market references including The RSM Classic and The Masters)

Topics are maintained in separate views and subpages while events within each topic are organized together, sorted by published volume snapshots where available; static values can become stale.

---

## 2. Verified Kalshi Demo API Architecture
Session 2 logged a line-by-line API documentation re-check and an 8-page market spot-check (not a complete 29-market refresh) ([Demo Environment](https://docs.kalshi.com/getting_started/demo_env), [API Environments](https://docs.kalshi.com/getting_started/api_environments), [Orderbook Responses](https://docs.kalshi.com/getting_started/orderbook_responses), [WebSockets Quick Start](https://docs.kalshi.com/getting_started/quick_start_websockets), [Rate Limits](https://docs.kalshi.com/getting_started/rate_limits)):

| Surface | Recommended Demo Endpoint | Also Supported (Legacy Shared) | Official Source |
| --- | --- | --- | --- |
| **REST Trade API** | `https://external-api.demo.kalshi.co/trade-api/v2` | `https://demo-api.kalshi.co/trade-api/v2` | [Kalshi Demo Env](https://docs.kalshi.com/getting_started/demo_env) |
| **WebSocket API** | `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2` | `wss://demo-api.kalshi.co/trade-api/ws/v2` | [Kalshi Demo Env](https://docs.kalshi.com/getting_started/demo_env) |
| **User Fill/Order WS** | `wss://user-ws.demo.kalshi.co/trade-api/ws/v2` | *(dedicated user stream)* | [API Environments](https://docs.kalshi.com/getting_started/api_environments) |
| **Demo Web App** | `https://demo.kalshi.co/` | — | [Kalshi Demo Env](https://docs.kalshi.com/getting_started/demo_env) |

### Key Verified Technical Details
- **Authentication:** Public market-data REST endpoints (`GET /events`, `GET /markets`, `GET /markets/{ticker}/orderbook`) require no authentication. Trading, portfolio, and **all WebSocket handshakes** require three headers: `KALSHI-ACCESS-KEY`, `KALSHI-ACCESS-TIMESTAMP` (Unix ms), and `KALSHI-ACCESS-SIGNATURE` (Base64 signature of `timestamp + METHOD + path_without_query` using RSA-PSS SHA-256 with salt length = digest length, or Ed25519).
- **Orderbook Mechanics (`orderbook_fp`):** Returns `yes_dollars` and `no_dollars` arrays of `[price_dollars, count_fp]` string pairs (bids only, ascending order; highest bid is last element). Because binary contracts sum to `$1.00`, a YES bid at price `X` equals a NO ask at `$1.00 - X`, and a NO bid at `Y` equals a YES ask at `$1.00 - Y`.
- **Candlesticks & Timeframes:** `GET /series/{series_ticker}/markets/{ticker}/candlesticks` supports `period_interval` values of `1` (1 minute), `60` (1 hour), and `1440` (1 day) only. **Seconds-level charts** require client-side aggregation of real `ticker` / `trade` stream updates; this site does not implement a live stream.
- **Rate Limits:** Concurrent WebSocket limits range from `200` (Basic/Advanced/Expert) to `1,000` (Prime/Prestige), with intermediate tiers documented in Kalshi’s rate-limit table. Basic tier users receive access to batch order endpoints in the Demo environment ([API Changelog](https://docs.kalshi.com/changelog)).

---

## 3. Core Dashboard & Trading Capabilities Delivered
1. **Local Paper-Simulation >= $0.10 Swing Alerts (Dual Scrolling Chats):**
   - **All Events Feed:** Scrolling chat alerts whenever the local simulator generates a tracked-market move `>= $0.10` in either direction (up or down), showing ticker, direction, price delta, timestamp, and contextual source link (causality not established).
   - **High-ROI Model Selective Feed:** Filtered chat surfacing only simulated swings passing illustrative model criteria (positive model edge `>= 5%`, favorable expected ROI, spread efficiency, and liquidity score), with transparent reasoning on every alert.
2. **Interactive Price Chart + Liquidity Orderbook + Catalyst Markers:**
   - **X-axis:** Time with selectable **Seconds**, **Minutes**, and **Hours** granularity.
   - **Y-axis:** Current contract price (`$0.00` to `$1.00`).
   - **Jump Markers:** Synthetic `>= $0.10` changes are plotted; linked pages are contextual references, not verified causes (CNBC, EIA, Emerson College Polling, PGA Tour, Wccftech/Game Awards).
   - **Orderbook Liquidity View:** Displays synthetic resting contract counts and dollar liquidity at each price level (not exchange liquidity) (YES bids, NO bids, and implied YES asks + spread calculation).
3. **Full Lifecycle & Resolution Tracking:**
   - Shows static catalog lifecycle labels; the site does not poll live lifecycle changes, explicitly displaying settlement status (**Open**, **Resolved YES**, or **Resolved NO**) and payout rules.
4. **Kalshi Demo Portfolio, Trade Execution & Automated Strategy Lab:**
   - Provides a local **Paper Demo Simulation** (`$10,000` starting balance) for Buy/Sell YES/NO and simulated settlement. The optional API connector tests REST access and may retrieve an account balance; trades are not sent to Kalshi. The previous sample seeded trades and equity history have been removed.
   - Includes **Automated Strategy Simulators** (Swing Mean Reversion `>= $0.10`, Swing Momentum Breakout, High-ROI Model Auto-Trader, Liquidity Spread Capture), **Trade Categorization & Performance Analytics**, and a **Custom Strategy Builder** derived from trade category outcomes.

---

## 4. Flagged Irregularities Summary (Published on Flagged for Review)
Known limitations and review items are published on `flagged-for-review.html`:
- **IRREG-01:** Standard browser `WebSocket` cannot attach Kalshi's required handshake auth headers (`KALSHI-ACCESS-*`); real authenticated WS streaming requires a server/worker relay proxy.
- **IRREG-02:** Static GitHub Pages browser `fetch()` requests to Kalshi Demo API may encounter CORS restrictions and require user-owned demo credentials for private endpoints; simulated ticks and paper fills are explicitly labeled.
- **IRREG-03:** Kalshi officially warns that Demo environment market prices and liquidity do not reflect production markets ([source](https://docs.kalshi.com/getting_started/demo_env)).
- **IRREG-04:** Kalshi REST candlestick API does not provide 1-second bars (`1m`, `60m`, `1440m` only); this site’s seconds-level charts are synthetic; real aggregation requires a connected feed.
- **IRREG-05:** `GET /markets/{ticker}/orderbook` returns HTTP `200` with empty arrays for unknown tickers instead of `404` ([source](https://docs.kalshi.com/getting_started/orderbook_responses)).
- **IRREG-06:** User prompt included both recommended (`external-api.demo.kalshi.co`) and legacy shared (`demo-api.kalshi.co`) demo hostnames; both are officially supported, with `external-api` recommended.
- **IRREG-07:** Specific market volumes and static resting contract depth that were not published in official static snapshots are left **blank** and tagged `Unverified` in verified tables.
- **IRREG-08:** Initial repository audit (`62713af`) found only an 11-byte `README.md` with no code, tests, or `COORDINATION.md`.
- **IRREG-09..13:** Prior T-06 session reverified 6 of 29 markets and documented seeded-alert and data mismatches; the sample table is retained on the review page.
- **IRREG-14:** Session 2 published the 8-page official market refresh and corrected data snapshots.
- **IRREG-16 (High):** This GitHub Pages UI is a local paper simulator, not a live Kalshi feed or order executor.
- **IRREG-17 (Medium):** Model fair values are illustrative and not validated forecasts; catalyst links do not prove causality.
- **IRREG-18 (session 2b `arena-83838475`):** Session-1 observed values irreconcilable with official live pages corrected to freshly verified values across all 29 markets (see Session 2b table); prior values preserved in git history. Supersedes static sample IRREG-10/12/13 with identical official values (renumbered: PR #6 owns IRREG-14, PR #4 owns IRREG-16/17).
- **IRREG-19 (session 2b `arena-83838475`):** Kalshi `Determined` (outcome known, payout pending) rows are displayed as Resolved YES/NO; final settlement timestamps remain unverified.
- **IRREG-20 (session 3 `arena-ff314ece`, PR #10):** Upgraded `kalshi-client.js` with Ed25519 (recommended default) + PKCS#1/PKCS#8 RSA-PSS signing, Create Order V2 YES/NO reciprocal mapping (`mapYesNoOrderToV2`), and live Demo REST orderbook pull (`getMarketOrderbook`); fixed Quick Trade NO-side price synchronization bug & 2026 PGA Tour RSM Classic leaderboard URL; added interactive chart hover crosshair tooltip, Alert Chat topic/search filters, master table status filter, optional authenticated Demo REST order toggle, and Trade Category Net P&L Bar Chart (preserving PR #4 paper-simulation disclosures & clean `$10,000` baseline and PR #7 High-ROI notifications).

---

## 5. Recommendations to Make the Site More Live & Interactive
Detailed in `verification.html`, top architectural upgrades include:
1. Deploy a lightweight Cloudflare Worker / Node.js WebSocket-to-SSE/WS relay signing `GET /trade-api/ws/v2` server-side so browsers receive real-time `ticker`, `trade`, `orderbook_delta`, and `market_lifecycle_v2` streams without exposing API private keys.
2. Subscribe to `market_lifecycle_v2` and `fill` channels (plus `wss://user-ws.demo.kalshi.co/trade-api/ws/v2`) for instant settlement notifications and execution confirmations.
3. Add automated RSS/news webhook ingestion (AAA Daily Fuel Gauge, EIA Weekly Petroleum Status, AP/Reuters Election Calls, PGA Tour ShotLink, Crypto spot feeds) to auto-pin verified catalyst URLs onto `>= $0.10` price jumps once a live authenticated backend exists.
4. Enable browser Web Notifications + audio ping toggles for High-ROI `>= $0.10` alerts (**implemented in session 2b (`arena-83838475`)** via the "Enable High-ROI Alerts" toggle with directional audio pings) and one-click orderbook ladder limit order entry directly from depth rows (price pre-fill on row click already implemented).
