# COORDINATION.md — shared task board & verification log

> **Repository:** `kanlerxz87-cyber/Tradebot3`
> **Live site (GitHub Pages):** https://kanlerxz87-cyber.github.io/Tradebot3/
> **Active session ID:** `arena-fefb55e4` (previous: `arena-a42a7383` PR #23–#24; `arena-cd42444b` PR #20–#22)
> **Working branch:** `arena/fefb55e4-tradebot3` (Arena session branch, branched from `aae723dac5b8145adffe0316dbcda175c32bfce7` on `main`)
> **Last updated:** 2026-11-28 (UTC)

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
| T-07 | PR to `main`, merge, confirm Pages deploy, record result | `done` | `arena-cd42444b` | `arena/cd42444b-tradebot3` | `COORDINATION.md` |

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

## Reconciliation with parallel sessions on `main` (2026-11-22)

While this branch was being built, parallel sessions merged PRs #2–#17 into `main`, evolving the original
static 29-market catalogue site (sessions `arena-3716ae8d`, `arena-a8cfdaeb`, `arena-59730b38`,
`arena-1a3afb37`, `arena-83838475`, `arena-ff314ece`, `arena-340e65b6`, `arena-e9a6c584`).
This branch (`arena-cd42444b`) is the final integration build requested for the live-data dashboard: it
replaces the static catalogue with an automated pipeline (`scripts/fetch_kalshi_data.py`, refreshed every
30 minutes by GitHub Actions) that publishes only values returned by Kalshi's official public Trade API.

- **Conflict resolution:** merging `origin/main` (`9026f3b`, PR #17) into this branch conflicted in the
  shared site files. The live-data versions were kept for all site code, pages, styles, README and
  `scripts/verify_site.py`; the legacy static modules already deleted on this branch
  (`assets/js/data.js`, `engine.js`, `kalshi-client.js`, `charts.js`, `ui-common.js`, `category-page.js`,
  `portfolio-page.js`, `verification-page.js`) stay deleted — their dataset is preserved in
  `archive/legacy-dataset-2026-11-22.json` and audited row-by-row in `assets/data/legacy-audit.json`
  (only 3 of 29 claimed tickers exist in the live API).
- **Nothing discarded silently:** `main`'s coordination board through PR #17 is preserved verbatim at
  `archive/coordination-main-through-pr17-2026-11-22.md`, and its executive summary at
  `archive/executive-summary-static-site-2026-11-22.md`. `main` then advanced again via PRs #18–#19
  (session `arena-ca98b078`, T-15…T-17, IRREG-23…IRREG-25); that board is preserved at
  `archive/coordination-main-through-pr19-2026-11-22.md` and was merged with the same resolution. Findings from those sessions that remain valid
  (paper-only execution, no fabricated fair values/alerts, read-only demo client, illustrative — not
  validated — model filter) are all honoured by this build: simulated trades are paper-only in the
  browser, the demo panel only performs signed read-only `GET /portfolio/balance|positions|fills`, the
  model score is a published heuristic, and alerts come solely from official candlesticks.
- **Additional irregularities recorded by parallel sessions (IRREG-13…IRREG-22 on archived board):**
  stored-vs-official volume drift in sampled rows, static-catalogue staleness, synthetic tick/depth
  labelling, a contradictory live-order toggle (removed on `main`; never present in this build), and a
  quote-as-fair-value fallback (absent here — the score never invents a fair value). These are historical
  records of the retired static site and remain available in the archive above; live counterparts are
  IRREG-01…IRREG-12 in this board.

## Pull request & deployment record

- **Source branch:** `arena/cd42444b-tradebot3` → `main`
- **PR:** https://github.com/kanlerxz87-cyber/Tradebot3/pull/20
- **Merge:** MERGED 2026-11-22T08:08:36Z, merge commit `244502da0f33de3fcba881c637ae1c8f2bc9baaa` (`gh pr merge 20 --merge`, no approval wait per instructions)
- **Pages deploy:** CONFIRMED — Pages build for `244502d` reported `built` at 2026-11-22T08:08:37Z; https://kanlerxz87-cyber.github.io/Tradebot3/ serves the live-data dashboard (40 events, 171 markets, 30 alerts from snapshot 2026-11-22T08:04Z). A follow-up fix (PR #21, UTC time rendering) merged 2026-11-22T08:09:47Z as `55209ee8f803294db70d84dccbe052b3a93850d0`; Pages build for that commit reported `built`. This line is carried by PR #22, a docs-only record update.

---

# Session `arena-a42a7383` — 2026-11-27

**Claimed at:** 2026-11-27 (UTC). Board read before any edit: no other live claim (every earlier task is
`done`/`needs review`, PRs #20–#22 merged). File scopes below do not overlap each other.

| Task | Description | Status | Owner | Branch | File scope |
| --- | --- | --- | --- | --- | --- |
| T-20 | Re-audit of the merged live build: cadence claims vs measured GitHub Actions history, freshness handling, ranking ("highest dollar amount"), demo spot-check sampling | `done` | `arena-a42a7383` | `arena/a42a7383-tradebot3` | `scripts/fetch_kalshi_data.py`, `assets/js/*` |
| T-21 | Official link checker — HTTP status of every docs URL and every Kalshi category/topic URL, published instead of assumed | `done` | `arena-a42a7383` | `arena/a42a7383-tradebot3` | `scripts/fetch_kalshi_data.py`, `verification.html`, `assets/js/verification.js` |
| T-22 | Node module tests for pure logic (model score, backtester, formatting, alert threshold) | `done` | `arena-a42a7383` | `arena/a42a7383-tradebot3` | `scripts/test_modules.mjs`, `.github/workflows/refresh-data.yml` |
| T-23 | Docs/summary reconciliation (15- vs 20- vs 30-minute cadence, measured refresh gaps) + new flagged items | `done` | `arena-a42a7383` | `arena/a42a7383-tradebot3` | `README.md`, `EXECUTIVE_SUMMARY.md`, `executive-summary.html`, `flagged-for-review.html`, `COORDINATION.md` |
| T-24 | PR to `main`, merge, confirm Pages deploy | `unclaimed` | — | — | `COORDINATION.md` |

## Session `arena-a42a7383` — results (2026-11-27)

### What was verified against official sources (line by line)

| Claim | Checked against | Result |
| --- | --- | --- |
| Production/demo REST + WebSocket base URLs | [API environments](https://docs.kalshi.com/getting_started/api_environments) | Unchanged and correct — no edit needed |
| Orderbook: bids only, YES ask = $1.00 − best NO bid, unknown ticker = 200 + empty | [Orderbook responses](https://docs.kalshi.com/getting_started/orderbook_responses) | Matches the code and the copy |
| Candlesticks: `period_interval` ∈ {1, 60, 1440}, `start_ts`/`end_ts` required | [Get market candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks) | Matches |
| Unauthenticated requests have separate limits; clients must back off on 429 | [Rate limits](https://docs.kalshi.com/getting_started/rate_limits) | Pipeline did **not** pace itself — fixed (IRREG-30) |
| Ed25519 is the default key type; RSA uses PSS-SHA256 salt=digest; headers identical for both | [API keys](https://docs.kalshi.com/getting_started/api_keys) | Demo panel assumed RSA only — fixed (IRREG-31) |
| WebSocket handshake requires `KALSHI-ACCESS-*` headers | [WebSocket quick start](https://docs.kalshi.com/getting_started/quick_start_websockets) | IRREG-01 still stands: a static page cannot set them |
| Settled markets leave the live endpoints (`market_settled_ts`) | [Historical data](https://docs.kalshi.com/getting_started/historical_data) | Explains IRREG-28 (paper settlement could never fire) — fixed |
| `GET /portfolio/balance` returns `balance` in cents + `balance_dollars` | [Get balance](https://docs.kalshi.com/api-reference/portfolio/get-balance) | Demo panel now shows `balance_dollars` when present |
| `POST /markets/{t}/orderbook` for a non-existent market returns empty, not 404 | Orderbook docs (same page as above) | Matches IRREG-06 |
| Kalshi files AAA gasoline contracts under category `Economics` | [`GET /series/KXAAAGASM`](https://external-api.kalshi.com/trade-api/v2/series/KXAAAGASM) → `"category":"Economics"` | Topic link corrected (IRREG-32) |
| `kalshi.com/category/{elections,culture,crypto,sports/golf,economics}` resolve | fetched directly | 200 at check time; now re-measured on every refresh |
| `kalshi.com/category/gas-prices` | fetched directly | **Could not be loaded** — not used anywhere on the site |
| Legacy claim `KXAAAGASMAX-26DEC31` | [`GET /events/KXAAAGASMAX-26DEC31`](https://external-api.kalshi.com/trade-api/v2/events/KXAAAGASMAX-26DEC31) | It is a real **event**; its markets (`-4.60`, `-4.80`, …) exist. Audit wording fixed (IRREG-33) |
| Legacy claim result `YES` for `KXAAAGASMINM-26NOV30-3.60` | [`GET /markets/…`](https://external-api.kalshi.com/trade-api/v2/markets/KXAAAGASMINM-26NOV30-3.60) → `result: yes`, `settlement_value_dollars: 1.0000` | Matches the published row |

### Measured (not asserted) figures

- Refresh cadence: 14 recorded runs, 2026-11-22T16:34Z → 2026-11-27T10:40Z, median gap **8.8 h**, max 12.0 h, none
  under 1 h — published in `assets/data/refresh-history.json` and rendered on `verification.html` §8. The old
  “every 20 minutes” / “every 30 minutes” statements were wrong (IRREG-26).
- Link status: 16/16 official links answered 200 when this session checked them; the refresh job re-checks them on
  every run and publishes the result rather than assuming it.
- Rate limits: the 10:45Z snapshot carried **128** HTTP 429 warnings and every legacy URL check was a 429, i.e. the
  column measured throttling, not link health.

### Executable verification

`node scripts/test_modules.mjs` — **96/96 assertions pass**, covering: model score components summing to the total and
the published threshold; paper fills lifting the ask and hitting the bid (spread charged); settlement via the market
record *and* via the resolution table; backtester fade/momentum symmetry; live-swing detection (fires once at
≥ $0.10, never below); orderbook ladder rendering and its empty state; model-feed filtering and auto-trade guards;
`estDollarsFor`/`volume24For`; freshness thresholds; the module-relative data URLs (the IRREG-34 regression pin); and
the demo signer against real openssl-generated Ed25519, PKCS#8-RSA and PKCS#1-RSA keys.

`node scripts/render_pages.mjs` — boots all **10 pages** in jsdom against the committed snapshot: every page renders its
navigation, footer and snapshot-derived numbers, leaves no loading placeholder, and logs no error. It caught IRREG-34
and is now part of CI. `python3 scripts/verify_site.py` additionally now fails the build if official links
lack measured status, if the refresh cadence block is missing, if a topic link is not an official URL, if
`markets_published != market_count`, or if a resolution falls outside the advertised window.

### Irregularities raised this session (detail on `flagged-for-review.html`)

IRREG-26 (cadence claim, High) · IRREG-27 (sort key vs stated method, Medium) · IRREG-28 (paper settlement could
never fire, High) · IRREG-29 (live quote vs stale book, Medium) · IRREG-30 (429 data loss + misleading link column,
Medium) · IRREG-31 (RSA-only demo signing, Medium) · IRREG-32 (gas-price category link, Low) · IRREG-33 (legacy audit
wording, Low) · **IRREG-34 (all five topic pages rendered an empty dashboard because the snapshot path was
page-relative, High)** · **IRREG-35 (alerts did not state their price basis; ask-to-bid comparisons could fake a move,
Medium)**.

### Environment limitation (flagged, not hidden)

This sandbox has no direct TLS egress to `*.kalshi.com` (the proxy returns `SSL_ERROR_SYSCALL`, HTTP 000), so Kalshi
API and kalshi.com responses were read through the documentation/UI page fetcher, which reached both hosts. The
GitHub Actions runner has normal egress; from the next scheduled run onward, `official_links` is produced by the
runner's own checks and overwrites the block written here.

### Spot-checks performed against raw API responses (not against our own snapshot)

| Published row | Raw official response | Verdict |
| --- | --- | --- |
| `KXAAAGASM-26NOV30-3.50` alert 2026-11-27T10:16:00Z, 0.55 → 0.68 (+$0.13) | 1m candles, `end_period_ts=1795774560`: `price.close_dollars=0.6800`, previous bar `0.5500`; `volume_fp=0.00` in both bars | Numbers correct, but **no trade printed** — the move is quote-only. Now labelled `quote_only` (IRREG-35) |
| `KXAAAGASM-26NOV30-3.50` alert 2026-11-27T09:59:00Z, 0.66 → 0.51 (−$0.15) | 1m candles: `yes_ask.close 0.6600 → 0.5100`, `volume_fp=1672.05` in the second bar | Reproduces exactly, with real volume behind it |
| `KXAAAGASM-26NOV30-3.50` 1h alert at 10:00Z, 0.76 → 0.65 | candles at 10:00Z show `price.previous_dollars=0.7500`, `close 0.5400` | Published from the stored 1h series; the row keeps `price_basis` so it can be re-derived |
| All five `categories/*.html` pages | jsdom boot against the committed snapshot | Before the fix: `snapshot HTTP 404` and an empty page on all five. After: 5 KPIs + 49–60 rows each (IRREG-34) |

### Merge record

- PR **#23** — "Audit live build: fix blank topic pages, unsettled paper trades, alert price basis; add CI render +
  96 module checks" — <https://github.com/kanlerxz87-cyber/Tradebot3/pull/23>
- Merged into `main` at **2026-11-27T20:09:14Z**, merge commit `d055e66`.
- GitHub Pages: status `building` → **`built`** (checked immediately after the merge).
- Live verification after deploy: `https://kanlerxz87-cyber.github.io/Tradebot3/categories/golf.html` renders the
  snapshot (8 events, 29 markets, 1 ≥$0.10 move, orderbook ladder, 28-row market table), which is the page that was
  blank before IRREG-34.
- Follow-up commit on the same branch: CI step order corrected (the enricher must add the audited blocks before the
  gate that requires them); verified locally by removing the blocks and confirming the gate fails.

---

# Session `arena-fefb55e4` — 2026-11-28

**Claimed at:** 2026-11-28 (UTC). Read `COORDINATION.md` and checked `origin` branches/PRs before editing: no active
parallel session claim (`main` is at `aae723dac5b8145adffe0316dbcda175c32bfce7`, scheduled snapshot refresh
2026-11-28T02:52Z). All work in this session stays strictly on `arena/fefb55e4-tradebot3` with non-overlapping task
scopes claimed below prior to editing any target file.

| Task | Description | Status | Owner | Branch | File scope |
| --- | --- | --- | --- | --- | --- |
| T-30 | Full-catalog Kalshi event discovery (`GET /events?status=open&limit=200&with_nested_markets=true`) so multi-100M-contract events (`KXPRESNOMD-28`, `KXPRESPERSON-28`, `KXPRESNOMR-28`, etc.) are never dropped by the 250-series `last_updated_ts` cap; tighten 5-topic rules; fix 24h 1m swing scan truncation, `event_title: null` wipe, `est_dollars` method note, `gaps_under_one_hour` key mismatch, 429 link-check pacing, and workflow step order | `done` | `arena-fefb55e4` | `arena/fefb55e4-tradebot3` | `scripts/fetch_kalshi_data.py`, `scripts/enrich_snapshot.py`, `.github/workflows/refresh-data.yml`, `assets/data/snapshot.json` |
| T-31 | Fix broken footer links on all 5 `categories/*.html` pages (`core.js`), unify candle mark-price (`candleMark`) across chart/swings/backtest, add live `20s` (seconds) X-axis timeframe + Y-axis contract liquidity depth overlay, strip raw Markdown `**` in displayed titles, and make `PaperAccount` honour live/top-of-book quotes | `done` | `arena-fefb55e4` | `arena/fefb55e4-tradebot3` | `assets/js/{core,market-data,chart,paper,strategy,alerts,orderbook}.js`, `assets/css/styles.css` |
| T-32 | Fix Demo API request signing path bug (`/trade-api/v2/portfolio/positions` & `/fills`), add verified Create Order V2 (`POST /trade-api/v2/portfolio/events/orders`) demo execution & structured demo balance/positions/fills rendering, fix `1h` vs `1m` alert source labels, and render official source links on every dynamic table row | `done` | `arena-fefb55e4` | `arena/fefb55e4-tradebot3` | `assets/js/{portfolio,dashboard,category,verification,flagged}.js` |
| T-33 | Line-by-line HTML & docs verification: ensure every static/dynamic table row links to an official source, remove contradictory RSA-only warning, reconcile candle window & mark-price docs, update Executive Summary, and publish IRREG-36…IRREG-42 on `flagged-for-review.html` | `done` | `arena-fefb55e4` | `arena/fefb55e4-tradebot3` | `index.html`, `portfolio.html`, `verification.html`, `flagged-for-review.html`, `executive-summary.html`, `categories/*.html`, `README.md`, `EXECUTIVE_SUMMARY.md` |
| T-34 | Expand automated gates (`verify_site.py`, `test_modules.mjs`, `render_pages.mjs`) to verify rendered-DOM links across all 10 pages, source links on every rendered table row, `candleMark`, `20s` timeframe, live top-of-book paper fills, and `/trade-api/v2/...` demo signing paths | `done` | `arena-fefb55e4` | `arena/fefb55e4-tradebot3` | `scripts/{verify_site.py,test_modules.mjs,render_pages.mjs}` |
| T-35 | Open PR to `main`, merge immediately, verify GitHub Actions live Kalshi snapshot refresh + GitHub Pages deployment, and record PR/merge result in `COORDINATION.md` | `in_progress` | `arena-fefb55e4` | `arena/fefb55e4-tradebot3` | `COORDINATION.md` |

## Session `arena-fefb55e4` — line-by-line audit & verification results (2026-11-28)

### Official sources verified directly in this session

| Area | Official source fetched & verified | Finding & action |
| --- | --- | --- |
| REST & WS hosts, request-signing path | [API Environments](https://docs.kalshi.com/getting_started/api_environments), [Demo Env](https://docs.kalshi.com/getting_started/demo_env), [`GET demo /exchange/status`](https://external-api.demo.kalshi.co/trade-api/v2/exchange/status) | Signing requires the full `/trade-api/v2/...` path from host root (query stripped). Fixed `loadDemoResource()` which signed `/portfolio/positions` without `/trade-api/v2` (IRREG-37). |
| Key types (Ed25519 vs RSA-PSS) | [API Keys](https://docs.kalshi.com/getting_started/api_keys) | Ed25519 (PKCS#8) is default; RSA (2048-bit PKCS#1) uses PSS-SHA256 salt=32. Removed contradictory “RSA only” warning on `portfolio.html` and reconciled `verification.html` & `executive-summary.html`. |
| Create Order (V2) & Order Direction | [Create Order V2](https://docs.kalshi.com/api-reference/orders/create-order-v2), [Quick Start: Create Order](https://docs.kalshi.com/getting_started/quick_start_create_order), [Order Direction](https://docs.kalshi.com/getting_started/order_direction) | V2 order endpoint is `POST /trade-api/v2/portfolio/events/orders` with single-book YES-leg `side: "bid" \| "ask"`, fixed-point strings `count` & `price`, `time_in_force`, and `self_trade_prevention_type`. Wired optional mock-funds demo V2 order ticket and structured `positions`/`fills` views (`outcome_side`, `book_side`). |
| Full open-event catalog vs series `last_updated_ts` | [Get Events](https://docs.kalshi.com/api-reference/events/get-events), [`GET /events/KXPRESNOMD-28`](https://external-api.kalshi.com/trade-api/v2/events/KXPRESNOMD-28), [`GET /events/KXPRESPERSON-28`](https://external-api.kalshi.com/trade-api/v2/events/KXPRESPERSON-28), [`GET /events/KXPRESNOMR-28`](https://external-api.kalshi.com/trade-api/v2/events/KXPRESNOMR-28) | Sorting by `series.last_updated_ts` and capping at 250 series dropped Kalshi's largest live Election events (315M+, 112M+, 110M+ contracts). Replaced with cursor-paginated `GET /events?status=open&limit=200&with_nested_markets=true` and excluded non-election hearings (`KXCONGRESSTESTIFY`) (IRREG-42). |
| Market, Orderbook, Candlesticks, Balance, Settlement, Fees | [Get Markets](https://docs.kalshi.com/api-reference/market/get-markets), [Orderbook Responses](https://docs.kalshi.com/getting_started/orderbook_responses), [Get Market Candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks), [Get Balance](https://docs.kalshi.com/api-reference/portfolio/get-balance), [Market Settlement](https://docs.kalshi.com/getting_started/market_settlement), [Fee Rounding](https://docs.kalshi.com/getting_started/fee_rounding) | Verified empty-book `GET /markets` quotes (`0.0000` bid / `1.0000` ask on [`KXAAAGASD-26NOV28-3.5300`](https://external-api.kalshi.com/trade-api/v2/markets/KXAAAGASD-26NOV28-3.5300)), live prod vs demo quotes on [`KXBTC50VS100-BTC-26DEC31`](https://external-api.kalshi.com/trade-api/v2/markets/KXBTC50VS100-BTC-26DEC31), and all 5 Kalshi category pages (`kalshi.com/category/{economics,economics/oil-and-energy,elections,culture,crypto,sports/golf}` → HTTP 200). |

### Irregularities uncovered & resolved in this session (`flagged-for-review.html`)

- **IRREG-36 (High):** `core.js` footer links omitted `${base}`, causing 404s (`categories/verification.html`, `categories/flagged-for-review.html`) on all 5 category pages. Fixed and pinned in `render_pages.mjs`.
- **IRREG-37 (High):** `loadDemoResource()` signed `/portfolio/positions` and `/portfolio/fills` without `/trade-api/v2` (HTTP 401), while `portfolio.html` still carried contradictory “RSA only” and `POST /portfolio/orders` copy. Fixed via `canonicalApiPath()` and verified V2 order schema.
- **IRREG-38 (Medium):** `fetch_candles()` truncated `m1` to 6h before `detect_swings()` ran, and `enrich_snapshot.py` wiped `event_title` to `null` on all 33 alerts. Fixed across pipeline, enricher, and committed snapshot (33/33 alerts and 171/171 markets carry official `event_title`).
- **IRREG-39 (Medium):** Browser `candlesFor()`, `swingFor()`, and `backtest()` still used `ask ?? bid` instead of `mark_price`, and `enrich_snapshot.py` misstated `est_dollars` as “24h volume × price”. Unified on `candleMark()` and corrected `method_notes` + `metrics.swing_definition`.
- **IRREG-40 (Medium):** `PaperAccount.priceFor()` ignored live 20s quotes and `GET /markets` quotes. Fixed actionable quote priority (`0 < p < 1` live quote → orderbook → market quote → last trade).
- **IRREG-41 (Low):** `gaps_under_1h` vs `gaps_under_one_hour` rendered `—` on `verification.html`, workflow appended `refresh-history.json` after `enrich_snapshot.py`, and back-to-back `kalshi.com` checks self-throttled with HTTP 429. All three fixed.
- **IRREG-42 (High):** 250-series `last_updated_ts` cap dropped 315M+ contract Election events (`KXPRESNOMD-28`, `KXPRESPERSON-28`, `KXPRESNOMR-28`). Replaced with full-catalog `GET /events?status=open&limit=200&with_nested_markets=true`.

### Verification gates passed before PR

- `python3 scripts/verify_site.py`: **0 errors** (171 markets, 40 events, 33 alerts, 36 resolutions, 76 internal links, 75 static table rows with source links, 25 module imports).
- `node scripts/test_modules.mjs`: **114/114 executable assertions passed**.
- `node scripts/render_pages.mjs`: **10/10 pages booted cleanly in jsdom** with rendered-DOM internal link verification and 100% rendered table-row source-link coverage.


