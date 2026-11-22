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
| `portfolio.html` | $10,000 paper account, positions, equity curve, trade log with categories, P&L by category/topic/side, four strategy backtests, live auto-trade, optional read-only Kalshi demo connection. |
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
.github/workflows/refresh-data.yml   (every 20 min + manual)
        └── scripts/fetch_kalshi_data.py
                ├── GET /series?category=…        discover the five topics' series
                ├── GET /markets?series_ticker=…  open + settled markets
                ├── GET /events/{ticker}          official event titles, settlement sources
                ├── GET /markets/{t}/orderbook    ten bid levels per side
                ├── GET /series/{s}/markets/{t}/candlesticks  1m + 60m
                ├── derive ≥ $0.10 close-to-close alerts
                └── audit the 29 legacy claims against GET /markets/{ticker}
        └── commits assets/data/snapshot.json + assets/data/legacy-audit.json
```

The browser reads `assets/data/snapshot.json` and then polls
`GET /markets?tickers=…` every 20 seconds. If the browser is blocked (CORS/offline), the header says so and the
timestamped snapshot remains in use. **No price is ever simulated.**

## Verification

```bash
python3 scripts/verify_site.py     # links, imports, DOM ids, snapshot schema, source coverage
python3 -m http.server 8080        # then open http://localhost:8080
```

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
* **≥ $0.10 move** — absolute close-to-close change between consecutive candles or live polls.
* **Book depth** — resting contracts across the ten best bid levels of both sides; implied asks use `YES ask = 1 − best NO bid`.
* **Model score** — 0–100 screen (liquidity 40, spread 20, price band 15, catalyst 15, runway 10). A screen, not a forecast.

## Known limitations

* Browsers cannot open an authenticated Kalshi WebSocket (handshake headers), so streaming is 20-second REST polling.
* Kalshi's candlestick API offers only 1/60/1440-minute periods, so sub-minute charts are browser ticks.
* Demo prices/volume differ from production by design; the demo connection is read-only.
* Paper P&L excludes fees and is labelled gross.
* Backtests use roughly two hours of 1-minute candles per market — small samples, illustrative only.

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
