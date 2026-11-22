# Executive Summary — Tradebot3 Kalshi Demo Dashboard & Paper Strategy Lab

**Date:** 2026-11-22 (UTC)
**Repository:** `kanlerxz87-cyber/Tradebot3`
**Site:** https://kanlerxz87-cyber.github.io/Tradebot3/ (static GitHub Pages)
**Branch:** `arena/e9a6c584-tradebot3`

---

## 1. Objective & Strict Topic Scope

Tradebot3 organizes and analyzes a fixed catalog of Kalshi prediction markets across **five strictly
isolated topics**:

1. **Gas Prices** — AAA national and California/New York regular gasoline threshold markets
2. **Elections** — Senate control, 2028 presidential party, and 2028 nomination markets
3. **Culture** — Oscars, Rotten Tomatoes Tomatometer, and The Game Awards markets
4. **Crypto** — Bitcoin, Ethereum, and Solana year-end range and downside milestones
5. **Golf** — PGA Tour major and tournament-winner markets

Topics have separate pages and are never mixed in a table or KPI. Within a topic, rows are sorted by a
dated production **event-volume** snapshot, not by Demo liquidity.

## 2. Data Boundaries (post-audit)

| Data | Source | What it is not |
| --- | --- | --- |
| Catalog rows (ticker, event, contract, close window, settlement source) | Official Kalshi event pages, snapshot `2026-11-22` | Not a live market feed |
| Volume cell | Production event-page dollar volume, dated per row | Not contract volume, not Demo liquidity |
| Price / swing cells | Blank until a runtime Kalshi Demo REST read succeeds | Not production prices; no backfill or second-level history |
| Chart series | Best-effort Demo REST observations collected while the page is open | Not a WebSocket tick stream |
| Orderbook | One Demo REST `orderbook_fp` snapshot when the read succeeds | Not resting depth claims from a static file |
| Portfolio, trades, strategies, settlements | Local `localStorage` paper simulation | Not exchange fills or account positions |
| Article links | Context only | Not evidence of price causation |

Removed in the factual audit: all static `observedPrice` / `observedSwing` values, all model
`fairValue` inputs, all seeded catalyst swing markers, and the unused order-submission client method.

## 3. Verified Kalshi Demo API Architecture

Every endpoint and schema below was checked against Kalshi's official documentation
([Demo Environment](https://docs.kalshi.com/getting_started/demo_env),
[API Environments](https://docs.kalshi.com/getting_started/api_environments),
[Orderbook Responses](https://docs.kalshi.com/getting_started/orderbook_responses),
[WebSockets Quick Start](https://docs.kalshi.com/getting_started/quick_start_websockets),
[Rate Limits](https://docs.kalshi.com/getting_started/rate_limits)).

| Surface | Recommended demo endpoint | Also supported | Official source |
| --- | --- | --- | --- |
| **REST Trade API** | `https://external-api.demo.kalshi.co/trade-api/v2` | `https://demo-api.kalshi.co/trade-api/v2` | [Demo Env](https://docs.kalshi.com/getting_started/demo_env) |
| **WebSocket API** | `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2` | `wss://demo-api.kalshi.co/trade-api/ws/v2` | [Demo Env](https://docs.kalshi.com/getting_started/demo_env) |
| **User Fill/Order WS** | `wss://user-ws.demo.kalshi.co/trade-api/ws/v2` | — | [API Environments](https://docs.kalshi.com/getting_started/api_environments) |
| **Demo Web App** | `https://demo.kalshi.co/` | — | [Demo Env](https://docs.kalshi.com/getting_started/demo_env) |

### Key verified technical details

- **Authentication:** public market-data REST endpoints need no auth. Private endpoints and **all**
  WebSocket handshakes require `KALSHI-ACCESS-KEY`, `KALSHI-ACCESS-TIMESTAMP` (Unix ms), and
  `KALSHI-ACCESS-SIGNATURE` — a Base64 RSA-PSS SHA-256 signature (salt length = digest length) or Ed25519
  over `timestamp + METHOD + path_without_query`.
- **Orderbook (`orderbook_fp`):** `yes_dollars` and `no_dollars` are arrays of `[price_dollars, count_fp]`
  string pairs containing **bids only**. A YES bid at `X` implies a NO ask at `$1.00 - X`, and vice versa.
  Unknown tickers return HTTP `200` with empty arrays.
- **Candlesticks:** `GET /series/{series_ticker}/markets/{ticker}/candlesticks` supports
  `period_interval` `1`, `60`, and `1440` minutes only. There is no native one-second REST candle.
- **Rate limits:** concurrent WebSocket connections range from `200` (Basic/Advanced) to `1,000` (Prime).
- **Demo fidelity:** Kalshi warns that Demo prices and market behavior do not reflect production markets.

## 4. What the Site Provides

1. **Dashboard (`index.html`)** — topic KPIs, dated event-volume ranking, a general `>= $0.10` change feed
   that separates observed Demo REST snapshot changes from explicitly labeled paper tests, a Demo REST
   price chart, and a single-snapshot orderbook ladder (YES bids, NO bids, implied YES asks, spread).
2. **Five topic pages** — isolated catalog tables with lifecycle badges, per-topic chart/orderbook, and
   paper quick-trade controls.
3. **Paper portfolio and strategy lab (`portfolio.html`)** — `$10,000` simulated balance, paper
   buy/sell ledger with YES/NO settlement payouts, category analytics, and paper-only strategy rules
   (mean reversion, momentum, spread capture, disabled model-edge rule). An optional read-only
   `GET /portfolio/balance` check uses a demo key the user pastes in page memory; nothing is persisted.
4. **Lifecycle tracking** — catalog rows carry Open / Finalized / Needs Review status; unresolved or
   unreconciled markets stay blank and are listed on `flagged-for-review.html`.
5. **Verification surface** — `verification.html` documents the API schemas, the repository audit, and
   concrete upgrade paths; `flagged-for-review.html` lists every known gap.

## 5. Flagged Irregularities (published on `flagged-for-review.html`)

- **IRREG-01 (High):** browsers cannot attach Kalshi's required handshake headers to a WebSocket upgrade;
  authenticated streaming needs a server or edge relay.
- **IRREG-02 (High):** static-page REST reads may be blocked by CORS, cached, or unmatched to catalog
  contracts; private calls need user-owned demo credentials. No keys are stored in git.
- **IRREG-03 (Medium):** Demo prices and liquidity are not production prices or liquidity.
- **IRREG-04 (Medium):** no native one-second REST candlesticks; no streaming or backfill here.
- **IRREG-05 (Medium):** `GET /markets/{ticker}/orderbook` returns HTTP `200` with empty arrays for
  unknown tickers instead of `404`.
- **IRREG-06 (Low):** both the recommended dedicated and legacy shared demo hostnames are officially supported.
- **IRREG-07 (Medium):** static quote/swing fields and resting depth are blank unless observed at runtime.
- **IRREG-08 (Low):** the initial repository contained only an 11-byte `README.md`.
- **IRREG-09 (Medium):** the RSM Classic contract's ticker, lifecycle, price, and event volume remain
  unreconciled; the row is `Needs Review`.
- **IRREG-10 (Medium):** volume cells are dated event snapshots, not contract volume or Demo liquidity;
  three events still publish no volume and stay blank.
- **IRREG-11 (Low):** order submission is documented for reference but not implemented; every trade is paper.

## 6. Recommended Next Steps

1. Deploy a small authenticated relay (Cloudflare Worker or Node service) that signs the Kalshi WS
   handshake server-side and fans out `ticker`, `trade`, `orderbook_delta`, and `market_lifecycle_v2`
   messages to the static site.
2. Backfill charts from the official historical candlestick and trade endpoints instead of in-page observations.
3. Pin verified news and official-release links to observed `>= $0.10` moves, with explicit timestamps and
   no causal claims.
4. Reconcile the remaining blank fields (RSM Classic, three events without published volume) against
   fresh official event pages before showing any value.
5. If a model feed is ever enabled, publish the fair-value methodology and source data first; until then
   the model-edge feed stays empty.
6. Add browser notification and threshold controls for the general change feed.
