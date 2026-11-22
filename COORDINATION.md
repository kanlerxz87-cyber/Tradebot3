# COORDINATION.md — shared task board & verification log

> **Repository:** `kanlerxz87-cyber/Tradebot3`
> **Live site (GitHub Pages):** https://kanlerxz87-cyber.github.io/Tradebot3/
> **Active session ID:** `arena-cd42444b`
> **Working branch:** `arena/cd42444b-tradebot3` (Arena session branch, branched from `08ad596` on `main`)
> **Last updated:** 2026-11-22 (UTC)

## Protocol notes

- Arena binds this session to `arena/cd42444b-tradebot3`, so every commit, push and the pull request are made on that
  branch. No other branch is created or pushed.
- Tasks were claimed here before files were edited, and the claim was pushed immediately.
- This session found no other live claim in this file when it started (the board only described the previous session,
  `arena-3716ae8d`, whose work was already merged into `main` as PR #1). All items below are therefore owned by
  `arena-cd42444b` and their file scopes do not overlap that earlier work, which is preserved in `archive/`.
- `needs review` items are published on [`flagged-for-review.html`](flagged-for-review.html) with source links and do
  not block integration or deployment.
- Every published market row carries an official Kalshi URL plus its raw API URL. Values that could not be confirmed
  are blank and listed as unverified.

## Task board

| Task | Description | Status | Owner | Branch | File scope |
| --- | --- | --- | --- | --- | --- |
| T-01 | Repository audit of the previous build (29 claimed markets, model fields, news claims) | `done` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `scripts/legacy_claims.json`, `archive/legacy-dataset-2026-11-22.json`, `flagged-for-review.html` |
| T-02 | Official Kalshi API verification (environments, auth, orderbook, candles, WebSockets, rate limits) | `done` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `verification.html`, `EXECUTIVE_SUMMARY.md`, `README.md` |
| T-03 | Automated data pipeline: series discovery → markets → orderbooks → candles → alerts → settlements → legacy audit | `done` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `scripts/fetch_kalshi_data.py`, `.github/workflows/refresh-data.yml`, `assets/data/*` |
| T-04 | Dashboard rebuild: five topic pages, dual ≥ $0.10 alert chats, chart with jump markers, liquidity ladder, resolution tracker | `done` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `index.html`, `categories/*.html`, `assets/js/{dashboard,category,market-data,chart,alerts,orderbook,core}.js`, `assets/css/styles.css` |
| T-05 | Portfolio, trade categorisation, strategy lab, paper settlement, optional read-only demo connection | `done` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `portfolio.html`, `assets/js/{portfolio,paper,strategy}.js` |
| T-06 | Verification: `scripts/verify_site.py` (links, imports, DOM ids, schema, source coverage, topic isolation) | `done` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `scripts/verify_site.py` |
| R-01 | Flagged irregularities IRREG-01…12 and the 29-row legacy audit | `needs review` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `flagged-for-review.html`, `assets/data/legacy-audit.json` |
| T-07 | PR to `main`, merge, confirm Pages deploy, record result | `in progress` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `COORDINATION.md` |

## Official sources used

### Kalshi API documentation
- API environments & endpoints: https://docs.kalshi.com/getting_started/api_environments
- Demo environment: https://docs.kalshi.com/getting_started/demo_env
- API keys / request signing: https://docs.kalshi.com/getting_started/api_keys
- Orderbook responses: https://docs.kalshi.com/getting_started/orderbook_responses
- WebSockets quick start: https://docs.kalshi.com/getting_started/quick_start_websockets
- Rate limits: https://docs.kalshi.com/getting_started/rate_limits
- Get market candlesticks: https://docs.kalshi.com/api-reference/market/get-market-candlesticks
- Get markets: https://docs.kalshi.com/api-reference/market/get-markets
- Create order V2 (not used, schema unverified here): https://docs.kalshi.com/api-reference/orders/create-order-v2
- Historical data: https://docs.kalshi.com/getting_started/historical_data

### Kalshi public API endpoints exercised (no credentials)
- `GET https://external-api.kalshi.com/trade-api/v2/series?category=…`
- `GET …/markets?series_ticker=…&status=open|settled`
- `GET …/markets/{ticker}` and `…/markets?tickers=…`
- `GET …/markets/{ticker}/orderbook?depth=10`
- `GET …/series/{series}/markets/{ticker}/candlesticks?period_interval=1|60`
- `GET …/events/{event_ticker}`
- `GET https://external-api.demo.kalshi.co/trade-api/v2/markets/{ticker}` (demo spot check)
- `GET https://external-api.demo.kalshi.co/trade-api/v2/exchange/status`

## Verification performed

- `python3 scripts/verify_site.py` (run before the pull request) checks: required files; internal links; ES-module
  imports; DOM ids used by each page script; snapshot schema; five-topic isolation; official `https://*.kalshi.com|co`
  source URLs on every market, event, alert and resolution; `|Δ| ≥ $0.10` on every alert; 29-row legacy audit; and that
  no removed legacy module is referenced.
- Node sanity harness executed the scoring, paper-account (buy → mark → close → settle) and backtest paths against
  fixtures; spread is charged on exit (`buy` lifts the ask, `sell` hits the bid).
- Data provenance: every market row records `api_url` and `field_source`; the snapshot records `generated_at`,
  `api_base` and the metric definitions.

## Flagged irregularities (full detail on `flagged-for-review.html`)

- **IRREG-01 (High):** a browser cannot open an authenticated Kalshi WebSocket — the handshake needs
  `KALSHI-ACCESS-*` headers a page cannot set. Streaming is 20-second REST polling and is labelled as such.
- **IRREG-02 (Medium):** CORS for browser calls to Kalshi is undocumented and untestable from this environment; the
  live badge reports the real browser state and the snapshot is the fallback.
- **IRREG-03 (Medium):** demo and production are separate books; measured divergence is published in `demo_spot_check`.
- **IRREG-04 (Medium):** the public API has contract volume, not dollar volume; the dollar column is an estimate.
- **IRREG-05 (Medium):** candlesticks exist only at 1/60/1440-minute periods (5,000 periods per request); seconds
  charts are browser ticks.
- **IRREG-06 (Low):** unknown tickers return HTTP 200 with an empty orderbook, not 404.
- **IRREG-07 (Low):** several demo hosts were named in the request; the `external-api` hosts are recommended and the
  shared hosts remain supported.
- **IRREG-08 (Medium):** topic membership requires judgement because Kalshi's own categories are broad; the exact
  prefix/keyword rules are published in `snapshot.json`.
- **IRREG-09 (High):** the previous build's `modelFairValue`, `observedSwing` and “verified resting liquidity” had no
  official source. Removed.
- **IRREG-10 (High):** most tickers in the previous 29-row catalogue do not resolve in the live API. The catalogue was
  replaced with API-sourced markets; the old rows are published for review only.
- **IRREG-11 (Medium):** previously, news links were asserted as the causes of specific moves. Removed; charts list
  official topic sources as candidates without causal claims.
- **IRREG-12 (Low):** fees are excluded from paper P&L, and demo order placement is not shipped because its request
  schema could not be verified here.

## Pull request & deployment record

- **Source branch:** `arena/cd42444b-tradebot3` → `main`
- **PR:** _to be recorded after creation_
- **Merge:** _to be recorded_
- **Pages deploy:** _to be confirmed against https://kanlerxz87-cyber.github.io/Tradebot3/_
