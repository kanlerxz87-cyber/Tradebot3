# Tradebot3 — Kalshi live-event dashboard & paper trading lab

**Live site:** https://kanlerxz87-cyber.github.io/Tradebot3/

A static dashboard for live Kalshi prediction markets, limited to five topics — **gas prices**, **elections**,
**culture**, **crypto** and **golf**. Prices, volumes, orderbooks, candles and resolutions are pulled from Kalshi's
official public Trade API by a scheduled GitHub Action; the page then polls the same public API for live ticks.

Everything is paper money. Nothing on this site places a real order.

---

## What it does

| Page | Purpose |
| --- | --- |
| `index.html` | Dashboard: topic cards, highest-volume live events, two ≥ $0.10 alert chats, price chart with jump markers, orderbook ladder, paper ticket, resolution tracker. |
| `categories/*.html` | One page per topic — same tools, scoped to that topic, with events grouped and markets ordered by official volume. |
| `portfolio.html` | $10,000 paper account, positions, equity curve, trade log with categories, P&L by category/topic/side, built-in + custom strategy backtests, live auto-trade, optional in-memory Kalshi demo connection & V2 mock-funds order ticket. |
| `verification.html` | Endpoints and API behaviour verified line by line against Kalshi's docs, metric definitions, repository audit, automation description, suggestions. |
| `flagged-for-review.html` | Irregularities, the row-by-row audit of the previous dataset, values deliberately left blank, demo-vs-production spot check. |
| `executive-summary.html` | The one-page summary of scope, architecture, findings and recommendations. |

## Verified endpoints

| Environment | Surface | Recommended | Also supported |
| --- | --- | --- | --- |
| Production | REST | `https://external-api.kalshi.com/trade-api/v2` | `https://api.elections.kalshi.com/trade-api/v2` |
| Demo | REST | `https://external-api.demo.kalshi.co/trade-api/v2` | `https://demo-api.kalshi.co/trade-api/v2` |
| Production | WebSocket | `wss://external-api-ws.kalshi.com/trade-api/ws/v2` | `wss://api.elections.kalshi.com/trade-api/ws/v2` |
| Demo | WebSocket | `wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2` | `wss://demo-api.kalshi.co/trade-api/ws/v2` |

Source: [API environments](https://docs.kalshi.com/getting_started/api_environments) ·
[Demo environment](https://docs.kalshi.com/getting_started/demo_env).

## How the data stays current

```
.github/workflows/refresh-data.yml   (cron */30 * * * * — best effort, see below)
        └── scripts/fetch_kalshi_data.py
                ├── GET /series?category=…                          enumerate the five topics' series
                ├── GET /events?status=open&with_nested_markets=true full open catalog (no 250-series cap)
                ├── GET /events?status=settled&min_close_ts=…       recent settlements (21d window)
                ├── GET /markets/{t}/orderbook                      ten bid levels per side
                ├── GET /series/{s}/markets/{t}/candlesticks        24h 1m + 72h 60m (6h 1m published)
                ├── derive ≥ $0.10 single-basis mark alerts
                └── audit the 29 legacy claims against GET /markets/{ticker}
        └── scripts/enrich_snapshot.py                              link statuses, cadence, method notes
        └── commits assets/data/snapshot.json + assets/data/legacy-audit.json
```

The job also HTTP-checks every official link it publishes, appends each run to
`assets/data/refresh-history.json`, and writes the measured refresh gaps into the snapshot. The browser reads
`assets/data/snapshot.json` and then polls `GET /markets?tickers=…` every 20 seconds. If the browser is blocked
(CORS/offline), the header says so and the timestamped snapshot remains in use. **No price is ever simulated.**

### Refresh cadence — measured, not claimed

GitHub Actions throttles scheduled workflows. The cron asks for every 30 minutes; the delivered interval is far
longer and is therefore published rather than described as "live":

| Measurement | Value (2026-11-28) |
| --- | --- |
| Runs recorded | 16 (2026-11-22T16:34Z → 2026-11-28T02:52Z) |
| Median gap between runs | **8.79 h** |
| Mean / max gap | 8.69 h / 11.96 h |
| Runs closer together than 1 h | 0 of 15 |

Source: [`assets/data/refresh-history.json`](assets/data/refresh-history.json), written by the workflow itself;
rendered on `verification.html` §8 and surfaced on the dashboard as a snapshot-age badge (fresh < 2 h, aging < 8 h,
otherwise stale).

## Verification

```bash
python3 scripts/verify_site.py     # links, imports, DOM ids, snapshot schema, source coverage
node scripts/test_modules.mjs      # 92 executable checks on the pure logic (no dependencies)
npm install --no-save jsdom && node scripts/render_pages.mjs   # boots all 10 pages, fails on any error
python3 -m http.server 8080        # then open http://localhost:8080
```

`scripts/test_modules.mjs` imports the same ES modules the browser loads and asserts the arithmetic the published
numbers depend on: the model score sums to the displayed total, the paper account lifts the ask and hits the bid
(spread is charged), settlement through the resolution table, the backtester's fade/momentum symmetry, live-swing
detection, and the demo-request signer (Ed25519 vs RSA-PSS, including Kalshi's PKCS#1 PEM form). Both scripts run in
CI before the snapshot is committed.

`scripts/render_pages.mjs` boots every page in jsdom against the committed snapshot and fails if a page renders nothing,
leaves a loading placeholder, or logs an error. It exists because a page-relative data path silently 404'd on all five
topic pages (`categories/assets/data/snapshot.json`) while every static check still passed. All three scripts run in CI.

`scripts/verify_site.py` fails the build if any table row lacks an official Kalshi source URL, if any market falls
outside the five topics, if an alert is below the $0.10 threshold, or if an internal link is broken.

## Topic inclusion rules

Membership is decided by documented series-ticker prefixes and title keywords, written into `snapshot.json` under
`topics.<id>.prefixes|keywords|inclusion_rule`. Kalshi's own categories are broad (a NATO Secretary-General market is
filed under "Elections"), so the rules are published rather than implied. Every market also records `topic_rule` —
the exact reason it was included.

## Metrics

* **Volume (ct)** — `volume_fp` (contracts). **24h volume** — `volume_24h_fp`. **Open interest** — `open_interest_fp`.
* **Est. $ traded** — contracts × last price. Kalshi publishes no dollar-volume field; this is an estimate and is labelled as one.
* **≥ $0.10 move** — absolute change between consecutive candle marks (`price.close_dollars` if traded, else closing bid/ask mid, else single quote) or live 20s polls.
* **Book depth** — resting contracts across the ten best bid levels of both sides; implied asks use `YES ask = 1 − best NO bid` (also overlaid along the chart Y-axis).
* **Model score** — 0–100 screen (liquidity 40, spread 20, price band 15, catalyst 15, runway 10). A screen, not a forecast.

## Known limitations

* Browsers cannot open an authenticated Kalshi WebSocket (handshake headers), so streaming is 20-second REST polling.
* Kalshi's candlestick API offers only 1/60/1440-minute periods, so sub-minute (`20s · sec`) charts use browser-polled ticks.
* Demo prices/volume differ from production by design; demo credentials stay in browser memory for mock-funds demo checks/orders only.
* Paper P&L excludes fees and is labelled gross.
* Backtests use the 6 hours of published 1-minute candles per market — small samples, illustrative only.

Full disclosures: [`flagged-for-review.html`](flagged-for-review.html).

## Repository layout

```
index.html, portfolio.html, verification.html, flagged-for-review.html, executive-summary.html
categories/             five topic pages
assets/css/styles.css   design system (no external fonts/assets)
assets/js/              core, market-data, chart, alerts, orderbook, paper, strategy, page controllers
assets/data/            generated snapshot + legacy audit (committed by the data workflow)
scripts/                data fetcher, site verifier, legacy claim list
archive/                the previous dataset, preserved for audit only (not used by the site)
.github/workflows/      scheduled data refresh
```

Not affiliated with Kalshi. Paper trading only.
