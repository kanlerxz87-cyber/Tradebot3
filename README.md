# Market Pulse — Kalshi demo monitor

A static, read-only dashboard and source ledger for the Kalshi demo environment. Run `npm test` and `npm run build` to verify the dependency-free site. Serve the repository root with any static web server. GitHub Pages publishes from the `main` branch root.

## What works and what does not

The browser attempts to poll up to five pages of open demo events every 30 seconds using the public REST API. Only events whose returned category exactly matches one of the five requested topic labels are displayed. Rows are sorted by 24-hour **contract** volume, not dollar volume, and limited to 50. This is not a complete ranking; category coverage and browser CORS access are unverified. An API/network failure is visible and no sample data is substituted. Market prices and order books come directly from the demo API when accessible, with links to official endpoints.

Observed last-trade price changes of at least $0.10 between consecutive successful polls are shown in the activity feed. Polling can miss intra-poll swings. History and alerts are in memory while the tab is open, not persistent. Chart windows filter collected local observations; they do not retrieve historical candles. The model-selected feed, continuous settlement tracking, simulation, ROI analysis, account access and order execution are **not implemented**. There are no news or causal claims. See the site's Flagged for Review page for details.

GitHub Pages is static: never commit or enter API keys on the site. An authenticated, separately hosted backend is needed for WebSocket streaming, portfolio data and safe demo order execution. Demo and production credentials are separate. No orders are placed by this project.

## Official references

- [Kalshi demo environment](https://docs.kalshi.com/getting_started/demo_env)
- [API environments and endpoints](https://docs.kalshi.com/getting_started/api_environments)
- [Get events](https://docs.kalshi.com/api-reference/events/get-events)
- [Get markets](https://docs.kalshi.com/api-reference/market/get-markets)
- [Get order book](https://docs.kalshi.com/api-reference/market/get-market-orderbook)
- [WebSocket authentication](https://docs.kalshi.com/getting_started/quick_start_websockets)
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
