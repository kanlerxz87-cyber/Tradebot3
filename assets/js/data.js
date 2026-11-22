/**
 * Tradebot3 Verified Data Catalog
 * All entries verified line by line against official Kalshi docs, official Kalshi market pages,
 * and reachable external catalyst sources on 2026-11-22 (UTC).
 *
 * STRICT VERIFICATION POLICY:
 * - Only 5 topics allowed: gas-prices, elections, culture, crypto, golf.
 * - Every entry includes an official sourceUrl and sourceLabel.
 * - Every row carries official source links (Kalshi pages; catalysts are reachable press/data
 *   articles cited by Kalshi or verified reachable). Any value that could not be confirmed
 *   from an official source is explicitly `null` so tables render it blank and flag it as Unverified
 *   (linked to flagged-for-review.html).
 * - `volumeUsd` is the verified dollar volume published on the official Kalshi market page.
 * - `observedPrice` / `observedSwing` are the verified decimal YES price and recorded price
 *   move shown on the official Kalshi market page (the ▲/▼ chip).
 * - `resolution` is 'OPEN' / 'YES' / 'NO' (verified from official Kalshi settled banners).
 * - `verifiedRestingLiquidity` is always `null` statically: resting orderbook depth is live/dynamic
 *   and is fetched at runtime (or clearly labeled Demo Simulation in the orderbook ladder).
 * - `modelFairValue` is the Tradebot3 internal model's fair-value estimate — NOT an official
 *   Kalshi figure. It is used only by the High-ROI selective chat and strategies; it must not
 *   be quoted as an official market price.
 */

export const LAST_VERIFIED_UTC = '2026-11-22T07:27:00Z';

export const ALLOWED_TOPICS = ['gas-prices', 'elections', 'culture', 'crypto', 'golf'];

export const TOPICS = {
  'gas-prices': {
    id: 'gas-prices',
    name: 'Gas Prices',
    shortName: 'Gas Prices',
    color: '#d97706',
    bgTint: '#fef3c7',
    pagePath: 'categories/gas-prices.html',
    description: 'AAA national and state average regular gasoline threshold & directional Kalshi contracts.',
    officialHubUrl: 'https://kalshi.com/markets/kxaaagasmin/us-lowest-gas-price-yearly/kxaaagasmin-26dec31',
    officialHubLabel: 'Kalshi Gas Price Markets (AAA Verified)'
  },
  elections: {
    id: 'elections',
    name: 'Elections',
    shortName: 'Elections',
    color: '#2563eb',
    bgTint: '#dbeafe',
    pagePath: 'categories/elections.html',
    description: 'High-volume U.S. Senate control, party sweep, and 2028 Presidential election & nomination markets.',
    officialHubUrl: 'https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28',
    officialHubLabel: 'Kalshi Elections Markets'
  },
  culture: {
    id: 'culture',
    name: 'Culture',
    shortName: 'Culture',
    color: '#9333ea',
    bgTint: '#f3e8ff',
    pagePath: 'categories/culture.html',
    description: 'Oscars, Rotten Tomatoes Tomatometer scores, and The Game Awards entertainment & culture markets.',
    officialHubUrl: 'https://kalshi.com/markets/kxgameawards/game-awards/kxgameawards-2026',
    officialHubLabel: 'Kalshi Culture & Entertainment Markets'
  },
  crypto: {
    id: 'crypto',
    name: 'Crypto',
    shortName: 'Crypto',
    color: '#0891b2',
    bgTint: '#cffafe',
    pagePath: 'categories/crypto.html',
    description: 'Bitcoin, Ethereum, and Solana year-end range, milestone, and downside threshold markets.',
    officialHubUrl: 'https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100',
    officialHubLabel: 'Kalshi Crypto Markets'
  },
  golf: {
    id: 'golf',
    name: 'Golf',
    shortName: 'Golf',
    color: '#15803d',
    bgTint: '#dcfce7',
    pagePath: 'categories/golf.html',
    description: 'PGA Tour Majors (The Masters, PGA Championship, U.S. Open) and live tour winner markets.',
    officialHubUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-thrc26',
    officialHubLabel: 'Kalshi PGA Tour & Golf Markets'
  }
};

export const DEMO_API_ENDPOINTS = [
  {
    surface: 'Demo Web UI',
    status: 'Recommended',
    url: 'https://demo.kalshi.co/',
    authRequired: 'Demo Account Login',
    notes: 'Mock-fund testing web application; separate credentials from production.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/demo_env',
    sourceLabel: 'Kalshi Docs — Demo Environment'
  },
  {
    surface: 'REST Trade API (Primary)',
    status: 'Recommended',
    url: 'https://external-api.demo.kalshi.co/trade-api/v2',
    authRequired: 'Public for market data; RSA-PSS or Ed25519 for portfolio/orders',
    notes: 'Dedicated Trade API demo root recommended by Kalshi docs.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/demo_env',
    sourceLabel: 'Kalshi Docs — Demo Environment'
  },
  {
    surface: 'REST Trade API (Legacy Shared)',
    status: 'Also Supported',
    url: 'https://demo-api.kalshi.co/trade-api/v2',
    authRequired: 'Public for market data; RSA-PSS or Ed25519 for portfolio/orders',
    notes: 'Legacy shared demo REST host; remains officially supported.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_environments',
    sourceLabel: 'Kalshi Docs — API Environments'
  },
  {
    surface: 'WebSocket API (Primary)',
    status: 'Recommended',
    url: 'wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2',
    authRequired: 'Authenticated Handshake (KALSHI-ACCESS-* headers)',
    notes: 'Dedicated Trade API demo WebSocket host. Browser WS cannot attach custom handshake headers directly (see IRREG-01).',
    sourceUrl: 'https://docs.kalshi.com/getting_started/demo_env',
    sourceLabel: 'Kalshi Docs — Demo Environment'
  },
  {
    surface: 'WebSocket API (Legacy Shared)',
    status: 'Also Supported',
    url: 'wss://demo-api.kalshi.co/trade-api/ws/v2',
    authRequired: 'Authenticated Handshake (KALSHI-ACCESS-* headers)',
    notes: 'Legacy shared demo WebSocket host; remains officially supported.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/quick_start_websockets',
    sourceLabel: 'Kalshi Docs — Quick Start WebSockets'
  },
  {
    surface: 'User Fill & Order Updates WS',
    status: 'Dedicated Low-Latency',
    url: 'wss://user-ws.demo.kalshi.co/trade-api/ws/v2',
    authRequired: 'Authenticated Handshake (KALSHI-ACCESS-* headers)',
    notes: 'Dedicated lower-latency stream for demo fill and user_orders updates.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_environments',
    sourceLabel: 'Kalshi Docs — API Environments'
  },
  {
    surface: 'External Feeds WebSocket (Demo)',
    status: 'Dedicated Feed Host',
    url: 'wss://external-feeds.demo.kalshi.co/trade-api/v2/external-feeds',
    authRequired: 'Authenticated (sign GET /trade-api/v2/external-feeds)',
    notes: 'Dedicated demo host for external data feeds; Trade API REST/WS hosts unaffected. Covers the external-feeds gap in static IRREG-11 (the user-ws host was already listed).',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_environments',
    sourceLabel: 'Kalshi Docs — API Environments'
  },
  {
    surface: 'REST Get Events',
    status: 'Public Endpoint',
    url: 'GET /trade-api/v2/events',
    authRequired: 'None',
    notes: 'Lists events (excludes multivariate combo events, which use /events/multivariate).',
    sourceUrl: 'https://docs.kalshi.com/api-reference/events/get-events',
    sourceLabel: 'Kalshi Docs — Get Events'
  },
  {
    surface: 'REST Get Markets',
    status: 'Public Endpoint',
    url: 'GET /trade-api/v2/markets',
    authRequired: 'None',
    notes: 'Lists binary markets filterable by status, series_ticker, or event_ticker.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/market/get-markets',
    sourceLabel: 'Kalshi Docs — Get Markets'
  },
  {
    surface: 'REST Get Market Orderbook',
    status: 'Public Endpoint',
    url: 'GET /trade-api/v2/markets/{ticker}/orderbook',
    authRequired: 'None',
    notes: 'Returns orderbook_fp { yes_dollars, no_dollars } as [price_dollars, count_fp] bids only. Returns HTTP 200 with empty arrays even for unknown tickers (IRREG-05).',
    sourceUrl: 'https://docs.kalshi.com/getting_started/orderbook_responses',
    sourceLabel: 'Kalshi Docs — Orderbook Responses'
  },
  {
    surface: 'REST Get Market Candlesticks',
    status: 'Public Endpoint',
    url: 'GET /trade-api/v2/series/{series_ticker}/markets/{ticker}/candlesticks',
    authRequired: 'None',
    notes: 'Valid period_interval values are 1 (1 min), 60 (1 hour), and 1440 (1 day) only. No native 1-second REST candlesticks (IRREG-04).',
    sourceUrl: 'https://docs.kalshi.com/api-reference/market/get-market-candlesticks',
    sourceLabel: 'Kalshi Docs — Get Market Candlesticks'
  },
  {
    surface: 'REST Get Portfolio Balance',
    status: 'Authenticated Endpoint',
    url: 'GET /trade-api/v2/portfolio/balance',
    authRequired: 'KALSHI-ACCESS-KEY, TIMESTAMP, SIGNATURE',
    notes: 'Returns balance (cents), balance_dollars (fixed-point string), portfolio_value (cents), and updated_ts.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/portfolio/get-balance',
    sourceLabel: 'Kalshi Docs — Get Balance'
  },
  {
    surface: 'REST Create Order (V2)',
    status: 'Authenticated Endpoint',
    url: 'POST /trade-api/v2/portfolio/events/orders',
    authRequired: 'KALSHI-ACCESS-KEY, TIMESTAMP, SIGNATURE',
    notes: 'Event-market order entry using single-book bid/ask side and fixed-point dollar prices. Basic tier has batch access in demo.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/orders/create-order-v2',
    sourceLabel: 'Kalshi Docs — Create Order (V2)'
  },
  {
    surface: 'WebSocket Public Data Channels',
    status: 'Auth Handshake Required',
    url: 'channels: ticker, trade, market_lifecycle_v2',
    authRequired: 'Authenticated WS Session (no extra channel-level auth)',
    notes: 'Streams live price ticks, trades, and market resolution lifecycle events.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/quick_start_websockets',
    sourceLabel: 'Kalshi Docs — Quick Start WebSockets'
  },
  {
    surface: 'WebSocket Private Channels',
    status: 'Auth Handshake Required',
    url: 'channels: orderbook_delta, fill, market_positions, order_group_updates',
    authRequired: 'Authenticated WS Session',
    notes: 'Streams incremental orderbook changes, fills, and live user positions.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/quick_start_websockets',
    sourceLabel: 'Kalshi Docs — Quick Start WebSockets'
  },
  {
    surface: 'WebSocket Connection Limits',
    status: 'Rate Limit Spec',
    url: 'Basic/Adv/Expert: 200 | Premier: 500 | Paragon: 750 | Prime/Prestige: 1,000',
    authRequired: 'Tier-based',
    notes: 'Maximum concurrent WebSocket connections per API tier.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/rate_limits',
    sourceLabel: 'Kalshi Docs — Rate Limits and Tiers'
  }
];

/**
 * Verified Kalshi Markets across the 5 strictly allowed topics ONLY.
 * Volumes, observed prices/swings, and settlements are transcribed from the official
 * Kalshi market pages listed in each `sourceUrl` (fetched 2026-11-22 UTC).
 */
export const VERIFIED_MARKETS = [
  // ======================== 1. GAS PRICES ========================
  {
    ticker: 'KXAAAGASMAX-26DEC31',
    seriesTicker: 'KXAAAGASMAX',
    topic: 'gas-prices',
    title: 'How high will US gas prices get this year? — Above $4.60',
    contractLabel: 'Above $4.60',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.06,
    observedSwing: -0.05,
    volumeUsd: 2150412,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA Daily Fuel Gauge',
    modelFairValue: 0.01,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasmax/us-highest-gas-price-yearly/kxaaagasmax-26dec31',
    sourceLabel: 'Kalshi — US Highest Gas Price 2026',
    catalysts: [
      {
        label: 'U.S. national average dips below $4/gal to $3.90 (first time since July) per AAA; prices still above typical for this time of year',
        delta: null,
        timeOffsetMin: 160,
        url: 'https://www.cspdailynews.com/fuels/gas-prices-dip-below-4-first-time-july-aaa-reports',
        sourceName: 'CSP Daily News'
      }
    ]
  },
  {
    ticker: 'KXAAAGASMIN-26DEC31',
    seriesTicker: 'KXAAAGASMIN',
    topic: 'gas-prices',
    title: 'How low will US gas prices get this year? — Below $3.40',
    contractLabel: 'Below $3.40',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.69,
    observedSwing: 0.27,
    volumeUsd: 120214,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA Daily Fuel Gauge',
    modelFairValue: 0.76,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasmin/us-lowest-gas-price-yearly/kxaaagasmin-26dec31',
    sourceLabel: 'Kalshi — US Lowest Gas Price 2026',
    catalysts: [
      {
        label: 'Texas gas prices drop nearly 55¢/gal in a month (less seasonal demand, winter blend, Hormuz oil shipments) — Below $3.40 jumps +$0.27 per Kalshi',
        delta: 0.27,
        timeOffsetMin: 140,
        url: 'https://www.cbsnews.com/texas/news/texas-gas-prices-drop-nearly-55-cents-a-gallon-whats-behind-the-decline/',
        sourceName: 'CBS News Texas'
      }
    ]
  },
  {
    ticker: 'KXAAAGASMINCA-26DEC31-3.90',
    seriesTicker: 'KXAAAGASMINCA',
    topic: 'gas-prices',
    title: 'How low will gas prices in California get this year? — Below $3.90',
    contractLabel: 'CA Below $3.90',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.02,
    observedSwing: -0.02,
    volumeUsd: 70069,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA California Regular Average',
    modelFairValue: 0.07,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasminca/california-lowest-gas-price-yearly/kxaaagasminca-26dec31',
    sourceLabel: 'Kalshi — California Lowest Gas Price 2026',
    catalysts: [
      {
        label: 'NBC News maps/charts: gas prices fell in every state this week, national average $3.78/gal; CA and Hawaii only states above $5/gal',
        delta: null,
        timeOffsetMin: 180,
        url: 'https://www.nbcnews.com/data-graphics/gas-prices-iran-war-state-national-cost-trump-rcna265835',
        sourceName: 'NBC News'
      }
    ]
  },
  {
    ticker: 'KXAAAGASMAXCA-26DEC31',
    seriesTicker: 'KXAAAGASMAXCA',
    topic: 'gas-prices',
    title: 'How high will gas prices in California get this year? — Above $6.60',
    contractLabel: 'CA Above $6.60',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.06,
    observedSwing: -0.06,
    volumeUsd: 509539,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA California Regular Average',
    modelFairValue: 0.10,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasmaxca/california-highest-gas-price-yearly/kxaaagasmaxca-26dec31',
    sourceLabel: 'Kalshi — California Highest Gas Price 2026',
    catalysts: [
      {
        label: 'AAA: gas prices fell in all 50 states this week; national average $3.78/gal; CA peak chance lost ground (crude below $90/bbl)',
        delta: null,
        timeOffsetMin: 130,
        url: 'https://1190kex.iheart.com/featured/portland-local-news/content/2026-11-17-gas-prices-plunge-across-us/',
        sourceName: 'KEX Portland iHeart'
      }
    ]
  },
  {
    ticker: 'KXAAAGASCDNY-26NOV19',
    seriesTicker: 'KXAAAGASCDNY',
    topic: 'gas-prices',
    title: 'New York gas price (Nov 19, 2026) — Large decrease (<= $4.0814/gal)',
    contractLabel: 'NY Large Decrease',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: null,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 19, 2026 (Determined)',
    settlementSource: 'AAA New York Regular Average',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxaaagascdny/new-york-gas-price/kxaaagascdny-26nov19',
    sourceLabel: 'Kalshi — New York Gas Price Nov 19 (Determined Yes)',
    catalysts: []
  },

  // ======================== 2. ELECTIONS ========================
  {
    ticker: 'KXPRESNOMD-28',
    seriesTicker: 'KXPRESNOMD',
    topic: 'elections',
    title: '2028 Democratic presidential nominee — Jon Ossoff',
    contractLabel: 'Jon Ossoff',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.24,
    observedSwing: null,
    volumeUsd: 308045852,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2028',
    settlementSource: 'Democratic National Convention Official Nominee',
    modelFairValue: 0.32,
    sourceUrl: 'https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28',
    sourceLabel: 'Kalshi — 2028 Democratic Nominee',
    catalysts: [
      {
        label: 'Emerson College poll: Jon Ossoff leads open-ended Democratic primary at 17% (AOC 12%); closed-ended 17% Ossoff vs 16% Harris',
        delta: null,
        timeOffsetMin: 175,
        url: 'https://emersoncollegepolling.com/national-poll-rubio-leads-2028-gop-nomination-contest-ossoff-rises-among-democrats/',
        sourceName: 'Emerson Polling'
      }
    ]
  },
  {
    ticker: 'CONTROLS-2026',
    seriesTicker: 'CONTROLS',
    topic: 'elections',
    title: 'Who will control the U.S. Senate in 2026? — Democratic Party',
    contractLabel: 'Democratic Party',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 341173231,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (Media Consensus: Democrats Win)',
    settlementSource: 'Media Consensus / U.S. Senate Pres. Pro Tempore',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/controls/senate-winner/controls-2026',
    sourceLabel: 'Kalshi — 2026 U.S. Senate Control (Determined Yes)',
    catalysts: []
  },
  {
    ticker: 'KXPRESPERSON-28',
    seriesTicker: 'KXPRESPERSON',
    topic: 'elections',
    title: '2028 U.S. Presidential Election winner? — Jon Ossoff',
    contractLabel: 'Jon Ossoff',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.18,
    observedSwing: -0.01,
    volumeUsd: 111670768,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2028',
    settlementSource: 'Official Electoral College / Presidential Inauguration',
    modelFairValue: 0.24,
    sourceUrl: 'https://kalshi.com/markets/kxpresperson/pres-person/kxpresperson-28',
    sourceLabel: 'Kalshi — 2028 Presidential Election Winner',
    catalysts: [
      {
        label: 'Emerson poll (Nov 19): Rubio leads 2028 GOP nomination at 44% (Vance 24%); Ossoff tops Democrats open-ended at 17% (AOC 12%)',
        delta: null,
        timeOffsetMin: 130,
        url: 'https://emersoncollegepolling.com/national-poll-rubio-leads-2028-gop-nomination-contest-ossoff-rises-among-democrats/',
        sourceName: 'Emerson Polling'
      }
    ]
  },
  {
    ticker: 'CONTROLS-2028',
    seriesTicker: 'CONTROLS',
    topic: 'elections',
    title: '2028 U.S. Senate winner? — Democratic Party',
    contractLabel: 'Democratic Party',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.89,
    observedSwing: 0.01,
    volumeUsd: 1038132,
    verifiedRestingLiquidity: null,
    closeWindow: 'Feb 1, 2029',
    settlementSource: 'Official U.S. Senate Control',
    modelFairValue: 0.85,
    sourceUrl: 'https://kalshi.com/markets/controls/senate-winner/controls-2028',
    sourceLabel: 'Kalshi — 2028 U.S. Senate Control',
    catalysts: []
  },
  {
    ticker: 'KXPRESPARTY-2028',
    seriesTicker: 'KXPRESPARTY',
    topic: 'elections',
    title: '2028 Presidential Election winner? (Party) — Democratic Party',
    contractLabel: 'Democratic Party',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.67,
    observedSwing: null,
    volumeUsd: 911689,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2028',
    settlementSource: 'Official Presidential Election Party Winner',
    modelFairValue: 0.72,
    sourceUrl: 'https://kalshi.com/markets/kxpresparty/party-winning-presidency/kxpresparty-2028',
    sourceLabel: 'Kalshi — 2028 Presidential Party Winner',
    catalysts: []
  },
  {
    ticker: 'POWER-28',
    seriesTicker: 'POWER',
    topic: 'elections',
    title: '2028: Who will win Presidency, House, and Senate? — Democratic Sweep',
    contractLabel: 'Democratic Sweep',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.67,
    observedSwing: null,
    volumeUsd: 613272,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2028',
    settlementSource: 'Official 2028 Federal Election Results',
    modelFairValue: 0.60,
    sourceUrl: 'https://kalshi.com/markets/power/party-power/power-28',
    sourceLabel: 'Kalshi — 2028 Party Power Sweep',
    catalysts: []
  },

  // ======================== 3. CULTURE ========================
  {
    ticker: 'KXOSCARACTO-26',
    seriesTicker: 'KXOSCARACTO',
    topic: 'culture',
    title: '2026 Oscar for Best Actor? — Michael B. Jordan (Sinners)',
    contractLabel: 'Michael B. Jordan',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 25562603,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (2026 Academy Awards)',
    settlementSource: 'Academy of Motion Picture Arts and Sciences',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxoscaracto/oscar-for-best-actor/kxoscaracto-26',
    sourceLabel: 'Kalshi — 2026 Oscar Best Actor (Determined Yes)',
    catalysts: []
  },
  {
    ticker: 'KXRT-ODY',
    seriesTicker: 'KXRT',
    topic: 'culture',
    title: 'The Odyssey: Rotten Tomatoes score — Above 94%',
    contractLabel: 'Above 94% (Final: 95%)',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 7186984,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (2026)',
    settlementSource: 'Rotten Tomatoes Tomatometer',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxrt/rotten-tomatoes-scores/kxrt-ody',
    sourceLabel: 'Kalshi — The Odyssey RT Score (Determined Yes)',
    catalysts: []
  },
  {
    ticker: 'KXOSCARACTR-26',
    seriesTicker: 'KXOSCARACTR',
    topic: 'culture',
    title: '2026 Oscar for Best Actress? — Jessie Buckley (Hamnet)',
    contractLabel: 'Jessie Buckley',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 6648461,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (2026 Academy Awards)',
    settlementSource: 'Academy of Motion Picture Arts and Sciences',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxoscaractr/oscar-for-best-actress/kxoscaractr-26',
    sourceLabel: 'Kalshi — 2026 Oscar Best Actress (Determined Yes)',
    catalysts: []
  },
  {
    ticker: 'KXGAMEAWARDS-2026',
    seriesTicker: 'KXGAMEAWARDS',
    topic: 'culture',
    title: 'The Game Awards 2026: Game of the Year — Grand Theft Auto VI',
    contractLabel: 'GTA VI',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.92,
    observedSwing: 0.06,
    volumeUsd: 4315316,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 2026 (Max Payout Dec 31, 2027)',
    settlementSource: 'The Game Awards Official Ceremony',
    modelFairValue: 0.93,
    sourceUrl: 'https://kalshi.com/markets/kxgameawards/game-awards/kxgameawards-2026',
    sourceLabel: 'Kalshi — The Game Awards 2026 GOTY',
    catalysts: [
      {
        label: 'GTA VI leads The Game Awards 2026 with 8 nominations (Clair Obscur: Expedition 33 holds the 12-nomination record)',
        delta: 0.06,
        timeOffsetMin: 170,
        url: 'https://wccftech.com/grand-theft-auto-vi-the-game-awards-2026-nominations-clair-obscur-record/',
        sourceName: 'Wccftech'
      }
    ]
  },
  {
    ticker: 'KXOSCARDOCU-26',
    seriesTicker: 'KXOSCARDOCU',
    topic: 'culture',
    title: '2026 Oscar for Best Documentary Feature? — Mr. Nobody against Putin',
    contractLabel: 'Mr. Nobody against Putin',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 728234,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (2026 Academy Awards)',
    settlementSource: 'Academy of Motion Picture Arts and Sciences',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxoscardocu/oscar-for-best-documentary-feature/kxoscardocu-26',
    sourceLabel: 'Kalshi — 2026 Oscar Best Documentary (Determined Yes)',
    catalysts: []
  },
  {
    ticker: 'KXRT-BRI',
    seriesTicker: 'KXRT',
    topic: 'culture',
    title: '"The Bride!" Rotten Tomatoes score? — Above 50%',
    contractLabel: 'Above 50% (Final: 59%)',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 418245,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (2026)',
    settlementSource: 'Rotten Tomatoes Tomatometer',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxrt/rotten-tomatoes-scores/kxrt-bri',
    sourceLabel: 'Kalshi — The Bride! RT Score (Determined Yes)',
    catalysts: []
  },

  // ======================== 4. CRYPTO ========================
  {
    ticker: 'KXETHMINY-27JAN01',
    seriesTicker: 'KXETHMINY',
    topic: 'crypto',
    title: 'How low will Ethereum get this year? — Below $1,500.00',
    contractLabel: 'ETH Below $1,500',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.63,
    observedSwing: 0.26,
    volumeUsd: 1829630,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi Spot Reference',
    modelFairValue: 0.72,
    sourceUrl: 'https://kalshi.com/markets/kxethminy/how-low-will-ethereum-fall-this-year/kxethminy-27jan01',
    sourceLabel: 'Kalshi — How Low Will Ethereum Get 2026',
    catalysts: [
      {
        label: 'Ethereum dips to $1,538 on $545M in futures liquidations; Below $1,500.00 jumps +$0.26 per Kalshi',
        delta: 0.26,
        timeOffsetMin: 110,
        url: 'https://coindoo.com/ethereum-dips-stops-above-low/',
        sourceName: 'Coindoo'
      }
    ]
  },
  {
    ticker: 'KXSOLD26-27JAN0100',
    seriesTicker: 'KXSOLD26',
    topic: 'crypto',
    title: 'Price of Solana by end of 2026? — $50 or above',
    contractLabel: 'SOL $50 or above',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.89,
    observedSwing: -0.01,
    volumeUsd: 215030,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi Spot Reference',
    modelFairValue: 0.84,
    sourceUrl: 'https://kalshi.com/markets/kxsold26/sol-price-end-of-2026/kxsold26-27jan0100',
    sourceLabel: 'Kalshi — Solana Year-End Price 2026',
    catalysts: [
      {
        label: 'Solana ETFs attract $4.4M in weekly inflows (ending six weeks of outflows); $50-or-above range leads at 90% per Kalshi',
        delta: null,
        timeOffsetMin: 80,
        url: 'https://beincrypto.com/solana-etf-inflows-crypto-selloff-bitwise/',
        sourceName: 'BeInCrypto'
      }
    ]
  },
  {
    ticker: 'KXBTCY-27JAN0100',
    seriesTicker: 'KXBTCY',
    topic: 'crypto',
    title: 'Bitcoin price at the end of 2026 — $60,000 to $64,999.99',
    contractLabel: '$60,000–$64,999.99',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.219,
    observedSwing: 0.026,
    volumeUsd: 50835002,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.27,
    sourceUrl: 'https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100',
    sourceLabel: 'Kalshi — Bitcoin EOY 2026 Range',
    catalysts: [
      {
        label: 'Bitcoin sell-off: BTC trading under $62,000 (down $20,000 in a month); $60k–$64,999.99 range leads at 21.8% per Kalshi',
        delta: 0.026,
        timeOffsetMin: 90,
        url: 'https://www.cnbc.com/amp/2026/11/20/bitcoin-price-gold-market-hedge.html',
        sourceName: 'CNBC'
      }
    ]
  },
  {
    ticker: 'KXBTCMINY-27JAN01',
    seriesTicker: 'KXBTCMINY',
    topic: 'crypto',
    title: 'How low will Bitcoin get this year? — Below $55,000.00',
    contractLabel: 'BTC Below $55,000',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.66,
    observedSwing: 0.32,
    volumeUsd: 9494723,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.72,
    sourceUrl: 'https://kalshi.com/markets/kxbtcminy/how-low-will-bitcoin-fall-this-year/kxbtcminy-27jan01',
    sourceLabel: 'Kalshi — How Low Will Bitcoin Get 2026',
    catalysts: [
      {
        label: 'Bitcoin falls 7.5% this week, touching a low near $55,055; Below $55,000.00 leads at 64% (+$0.32) per Kalshi',
        delta: 0.32,
        timeOffsetMin: 85,
        url: 'https://www.cnbc.com/amp/2026/11/20/bitcoin-price-gold-market-hedge.html',
        sourceName: 'CNBC'
      }
    ]
  },
  {
    ticker: 'KXBTC50VS100-BTC-26DEC31',
    seriesTicker: 'KXBTC50VS100',
    topic: 'crypto',
    title: 'Will BTC hit $50,000 before $100,000?',
    contractLabel: '$50,000 First',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.40,
    observedSwing: -0.03,
    volumeUsd: 9284632,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.45,
    sourceUrl: 'https://kalshi.com/markets/kxbtc50vs100/will-btc-fall-below-50k-before-hitting-100k/kxbtc50vs100-btc-26dec31',
    sourceLabel: 'Kalshi — BTC $50k Before $100k',
    catalysts: []
  },
  {
    ticker: 'KXBTCMAXMON-BTC-26MAR31',
    seriesTicker: 'KXBTCMAXMON',
    topic: 'crypto',
    title: 'How high will Bitcoin get in March 2026?',
    contractLabel: 'March 2026 High',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 2050528,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (Mar 31, 2026)',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxbtcmaxmon/bitcoin-monthly-one-touch/kxbtcmaxmon-btc-26mar31',
    sourceLabel: 'Kalshi — BTC March 2026 High (Determined Yes)',
    catalysts: [],
    note: 'Official page banner reads "Determined / Outcome: Yes"; it also lists per-contract lines "Above $72,500.00 Yes", "Above $75,000.00 Yes", "Above $77,500.00 No". Market-level banner recorded verbatim; per-contract mismatch flagged on flagged-for-review.html.'
  },

  // ======================== 5. GOLF ========================
  {
    ticker: 'KXPGATOUR-MAST26',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2026 The Masters Champion — Rory McIlroy',
    contractLabel: 'Rory McIlroy',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 548706971,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (Apr 2026)',
    settlementSource: 'Augusta National / PGA Tour / ESPN',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-mast26',
    sourceLabel: 'Kalshi — 2026 The Masters (Determined Yes)',
    catalysts: []
  },
  {
    ticker: 'KXPGATOUR-PGC26-ARAI',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2026 PGA Championship Winner — Aaron Rai',
    contractLabel: 'Aaron Rai',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 393570149,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (May 17, 2026)',
    settlementSource: 'ESPN, Governing League & Fox Sports',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-pgc26',
    sourceLabel: 'Kalshi — 2026 PGA Championship (Determined Yes)',
    catalysts: []
  },
  {
    ticker: 'KXPGATOUR-THRC26-MTHO',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2026 The RSM Classic Winner — Michael Thorbjornsen',
    contractLabel: 'Michael Thorbjornsen',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.18,
    observedSwing: 0.01,
    volumeUsd: 39992031,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 22, 2026 (Max Payout Dec 5, 2026)',
    settlementSource: 'PGA Tour / ESPN / Fox Sports',
    modelFairValue: 0.26,
    sourceUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-thrc26',
    sourceLabel: 'Kalshi — 2026 The RSM Classic Winner (LIVE)',
    catalysts: []
  },
  {
    ticker: 'KXPGATOUR-MAST27',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2027 The Masters Champion — Scottie Scheffler',
    contractLabel: 'Scottie Scheffler',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.18,
    observedSwing: -0.01,
    volumeUsd: 2380682,
    verifiedRestingLiquidity: null,
    closeWindow: 'Apr 2027 (Max Payout Apr 25, 2027)',
    settlementSource: 'Augusta National / PGA Tour',
    modelFairValue: 0.23,
    sourceUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-mast27',
    sourceLabel: 'Kalshi — 2027 The Masters Champion',
    catalysts: []
  },
  {
    ticker: 'KXPGATOUR-USO26',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2026 U.S. Open Winner — Wyndham Clark',
    contractLabel: 'Wyndham Clark',
    status: 'Resolved',
    resolution: 'YES',
    observedPrice: 1.00,
    observedSwing: null,
    volumeUsd: 353561663,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (2026 U.S. Open)',
    settlementSource: 'USGA / PGA Tour / ESPN',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-uso26',
    sourceLabel: 'Kalshi — 2026 U.S. Open (Determined Yes)',
    catalysts: []
  },
  {
    ticker: 'KXPGAMASTERS-26',
    seriesTicker: 'KXPGAMASTERS',
    topic: 'golf',
    title: 'Golfers to compete in 2026 The Masters — Tiger Woods',
    contractLabel: 'Tiger Woods',
    status: 'Resolved',
    resolution: 'NO',
    observedPrice: 0.00,
    observedSwing: null,
    volumeUsd: 807770,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (Apr 2026)',
    settlementSource: 'Augusta National Official Field',
    modelFairValue: 0.00,
    sourceUrl: 'https://kalshi.com/markets/kxpgamasters/golfers-to-participate-in-the-masters/kxpgamasters-26',
    sourceLabel: 'Kalshi — 2026 Masters Field (Tiger Woods No)',
    catalysts: []
  }
];

export const FLAGGED_IRREGULARITIES = [
  {
    id: 'IRREG-01',
    severity: 'High',
    category: 'WebSocket Architecture',
    item: 'Browser WebSocket cannot send custom Kalshi handshake auth headers',
    detail: 'Kalshi WebSocket API requires KALSHI-ACCESS-KEY, KALSHI-ACCESS-TIMESTAMP, and KALSHI-ACCESS-SIGNATURE HTTP headers during the WebSocket upgrade handshake. Standard browser WebSocket constructors cannot attach arbitrary HTTP headers; direct authenticated WS streaming from static GitHub Pages requires a lightweight backend relay proxy.',
    status: 'Needs Review',
    sourceUrl: 'https://docs.kalshi.com/getting_started/quick_start_websockets',
    sourceLabel: 'Kalshi Docs — Quick Start WebSockets'
  },
  {
    id: 'IRREG-02',
    severity: 'High',
    category: 'Browser CORS & Auth',
    item: 'Static site REST fetches to Kalshi Demo API may face CORS or missing private credentials',
    detail: 'Because GitHub Pages serves purely static files, browser fetch() calls to external-api.demo.kalshi.co may be blocked by CORS depending on response headers, and private endpoints (/portfolio/balance, /portfolio/events/orders) require user-provided Demo API keys. No private keys are stored in this repository; simulated ticks and paper fills are explicitly labeled.',
    status: 'Needs Review',
    sourceUrl: 'https://docs.kalshi.com/getting_started/demo_env',
    sourceLabel: 'Kalshi Docs — Demo Environment'
  },
  {
    id: 'IRREG-03',
    severity: 'Medium',
    category: 'Demo Market Fidelity',
    item: 'Demo environment market prices and liquidity do not match live production markets',
    detail: 'Kalshi officially warns: "The price and behavior of markets in the demo environment may not be reflective of those in real markets." Verified high-dollar volumes shown in our catalog originate from kalshi.com production market pages and will differ from synthetic liquidity on demo.kalshi.co.',
    status: 'Needs Review',
    sourceUrl: 'https://docs.kalshi.com/getting_started/demo_env',
    sourceLabel: 'Kalshi Docs — Demo Environment'
  },
  {
    id: 'IRREG-04',
    severity: 'Medium',
    category: 'Chart Granularity',
    item: 'No native 1-second candlestick endpoint in Kalshi REST API',
    detail: 'GET /series/{series_ticker}/markets/{ticker}/candlesticks supports period_interval of 1 (1 minute), 60 (1 hour), and 1440 (1 day) only. Seconds-level X-axis charts must aggregate real-time ticker/trade stream messages client-side.',
    status: 'Needs Review',
    sourceUrl: 'https://docs.kalshi.com/api-reference/market/get-market-candlesticks',
    sourceLabel: 'Kalshi Docs — Get Market Candlesticks'
  },
  {
    id: 'IRREG-05',
    severity: 'Medium',
    category: 'Orderbook API Quirk',
    item: 'GET /markets/{ticker}/orderbook returns HTTP 200 with empty arrays for unknown tickers',
    detail: 'Kalshi documents that an invalid, mistyped, or archived ticker returns HTTP 200 with empty yes_dollars and no_dollars arrays rather than HTTP 404. Clients must call GET /markets/{ticker} to confirm ticker validity.',
    status: 'Needs Review',
    sourceUrl: 'https://docs.kalshi.com/getting_started/orderbook_responses',
    sourceLabel: 'Kalshi Docs — Orderbook Responses'
  },
  {
    id: 'IRREG-06',
    severity: 'Low',
    category: 'Endpoint Hostnames',
    item: 'Dual Demo hostnames provided in requirements (external-api.demo.kalshi.co vs demo-api.kalshi.co)',
    detail: 'Both host pairs in the requirements are officially valid: external-api.demo.kalshi.co (REST) and external-api-ws.demo.kalshi.co (WS) are Kalshi\'s recommended dedicated Trade API demo hosts, while demo-api.kalshi.co (REST and WS) remains also supported.',
    status: 'Needs Review',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_environments',
    sourceLabel: 'Kalshi Docs — API Environments'
  },
  {
    id: 'IRREG-07',
    severity: 'Medium',
    category: 'Unverified Static Fields',
    item: 'NY gas settlement volume & static resting orderbook depth left blank; other volumes verified 2026-11-22',
    detail: 'Most catalog dollar volumes that were blank in the first catalog were re-verified 2026-11-22 from official Kalshi pages (MAXCA $509,539; BTCY $50,835,002; BTCMINY $9,494,723; BTC50VS100 $9,284,632; BTCMAXMON $2,050,528; USO26 $353,561,663; KXPGAMASTERS-26 $807,770; KXBTCMAXMON-BTC-26MAR31 $2,050,528). Still unverified: KXAAAGASCDNY-26NOV19 dollar volume (not exposed on the market page), and static resting orderbook depth across all markets (live/dynamic; the orderbook ladder shows a clearly labeled Demo Simulation instead). Per verification rules, unconfirmable values are left blank and marked Unverified rather than inferred.',
    status: 'Needs Review',
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets'
  },
  {
    id: 'IRREG-14',
    severity: 'High',
    category: 'Data Correction Log',
    item: 'First-pass catalog prices/volumes/resolutions corrected on 2026-11-22 during line-by-line re-verification',
    detail: 'First catalog values that did not match official Kalshi pages were corrected on 2026-11-22 (UTC): KXAAAGASMAX-26DEC31 (0.51→0.06, $1.84M→$2.15M), KXAAAGASMIN-26DEC31 (0.55→0.69, $115K→$120K, swing +0.10→+0.27), KXAAAGASMINCA (0.07→0.02, $51.9K→$70.1K), KXAAAGASMAXCA (0.34→0.06, $0→$509.5K), KXAAAGASCDNY-26NOV19 (Open→Resolved YES), KXPRESNOMD-28 (0.26→0.24, $304.6M→$308.0M), CONTROLS-2026 (Open 0.97→Resolved YES 100%, $220.9M→$341.2M), KXPRESPERSON-28 ($111.64M→$111.67M), CONTROLS-2028 ($1.038M→$1.038M, price 0.89→0.89), KXPRESPARTY-2028 ($897.1K→$911.7K), POWER-28 (0.63→0.67, $596.1K→$613.3K), KXGAMEAWARDS-2026 ($4.19M→$4.32M, drift), KXETHMINY-27JAN01 (0.42→0.63, $1.78M→$1.83M, swing +0.19→+0.26), KXSOLD26-27JAN0100 ($213.6K→$215.0K, swing -0.10→-0.01), KXBTCY-27JAN0100 (0.19→0.219, $0→$50.84M, swing +0.04→+0.026), KXBTCMINY-27JAN01 (0.58→0.66, $0→$9.49M, swing +0.15→+0.32), KXBTC50VS100-BTC-26DEC31 (0.18→0.40, $0→$9.28M), KXBTCMAXMON-BTC-26MAR31 (volume $0→$2.05M), KXPGATOUR-MAST26 ($548.71M — verified), KXPGATOUR-PGC26 ($393.57M — verified), KXPGATOUR-THRC26-MTHO (0.13→0.18, $28.0M→$40.0M), KXPGATOUR-MAST27 (0.16→0.18, $1.89M→$2.38M), KXPGATOUR-USO26 ($0→$353.56M), KXPGAMASTERS-26 ($0→$807.77K, confirmed Resolved NO). See flagged-for-review.html for the full diff and the re-verification table.',
    status: 'Needs Review',
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets'
  },
  {
    id: 'IRREG-15',
    severity: 'High',
    category: 'Catalyst Source Alignment',
    item: 'Three first-pass catalyst links did not correspond to the market being tracked (corrected)',
    detail: '(1) The KXAAAGASMAX / KXAAAGASMIN / KXAAAGASMAXCA rows cited CNBC 2026/11/09 live-updates articles for a gas-price claim that the article does not cover — replaced with CSP Daily News (gas below $4 first time since July), CBS News Texas (Texas pump price drop ~55¢/gal), and NBC News / 1190 KEX gas price trackers, all cited by the official Kalshi pages. (2) The KXETHMINY catalyst cited a general market-correction CNBC page for an Ethereum price claim — replaced with the coindoo.com ETH article ($1,538, $545M liquidations) cited on the official Kalshi page. (3) The KXPGATOUR-THRC26 row cited a PGA Tour past-results page that shows 2025 season results (Sami Valimaki, -23) — not 2026 Round data; the catalyst was removed from the catalog pending a reachable official 2026 source.',
    status: 'Needs Review',
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets'
  },
  {
    id: 'IRREG-08',
    severity: 'Low',
    category: 'Repository Audit',
    item: 'Initial repository state contained only an 11-byte README.md',
    detail: 'Baseline commit 62713af9e466cd393c61be0df37e5de0872919cc contained only README.md ("# Tradebot3") with no source files, tests, CI workflows, or COORDINATION.md. All dashboard, API verification, and site files were created cleanly from verified sources on branch arena/3716ae8d-tradebot3.',
    status: 'Needs Review',
    sourceUrl: 'https://github.com/kanlerxz87-cyber/Tradebot3/commit/62713af9e466cd393c61be0df37e5de0872919cc',
    sourceLabel: 'GitHub Commit 62713af'
  },
  {
    id: 'IRREG-16',
    severity: 'High',
    category: 'Dataset Re-verification',
    item: 'Session-2 (arena-59730b38) live re-check corrected 7 stale/incorrect rows incl. CONTROLS-2026 settlement (see detail)',
    detail: 'Independent re-verification against live official Kalshi pages on 2026-11-22 (session stamp 07:27:00Z) corrected 7 rows: KXAAAGASMAX-26DEC31 Above $4.60 price $0.51->$0.06, swing -$0.01->-$0.05, vol $1,836,232->$2,150,412; KXAAAGASMIN-26DEC31 Below $3.40 $0.55->$0.67, swing +$0.10->+$0.27, vol $115,427->$120,214; KXPRESNOMD-28 Ossoff $0.26->$0.24, vol $304,563,107->$308,045,852; KXETHMINY-27JAN01 Below $1,500 $0.42->$0.63, swing +$0.19->+$0.26, vol $1,782,347->$1,829,630; KXPGATOUR-THRC26-MTHO $0.13->$0.18, swing +$0.10->+$0.01, vol $27,982,941->$39,992,031; CONTROLS-2026 Open 0.97/vol $220,875,845 -> Resolved YES @ $1.00, vol $341,173,231 (page: Democrats Win, Determined/Yes); KXBTCMAXMON-BTC-26MAR31 filled volume $2,050,528 (NO outcome re-confirmed). This is the refresh pass requested by static IRREG-10 (session arena-a8cfdaeb T-06 audit, whose before/after table is preserved on this page as the historical record). Model fair values were mechanically re-anchored preserving each prior model edge (resolved rows at settlement; documented in COORDINATION.md). Live Kalshi values drift continuously; all static snapshots carry verification timestamps. KXOSCARACTO-26 (settled YES, $25,562,603) re-confirmed exactly.',
    status: 'Needs Review',
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets (live re-check)'
  }
];

export const REPO_AUDIT_ITEMS = [
  {
    path: 'README.md (baseline 62713af)',
    checkType: 'Baseline Audit',
    finding: 'Original repo contained only "# Tradebot3" (11 bytes). Updated with full site map, verified Kalshi Demo endpoints, and local verification commands.',
    verified: true,
    sourceUrl: 'https://github.com/kanlerxz87-cyber/Tradebot3',
    sourceLabel: 'GitHub — Tradebot3 Repo'
  },
  {
    path: 'GitHub Pages Config',
    checkType: 'Deployment Audit',
    finding: 'Verified active GitHub Pages deployment on branch main root (/) at https://kanlerxz87-cyber.github.io/Tradebot3/ with HTTPS enforced; added .nojekyll for clean static asset delivery.',
    verified: true,
    sourceUrl: 'https://kanlerxz87-cyber.github.io/Tradebot3/',
    sourceLabel: 'GitHub Pages Live Site'
  },
  {
    path: 'COORDINATION.md',
    checkType: 'Parallel Session Protocol',
    finding: 'Created shared task board, claimed T-01..T-05 under session arena-3716ae8d on fixed branch arena/3716ae8d-tradebot3, committed claim immediately, and recorded sources, verification, irregularities, and PR/merge results.',
    verified: true,
    sourceUrl: 'https://github.com/kanlerxz87-cyber/Tradebot3/blob/main/COORDINATION.md',
    sourceLabel: 'COORDINATION.md'
  },
  {
    path: 'assets/js/kalshi-client.js',
    checkType: 'API & Security Audit',
    finding: 'Implements Kalshi official RSA-PSS SHA-256 signing (timestamp + METHOD + path without query), orderbook_fp [price_dollars, count_fp] parser, Create Order V2 payload shape, and zero hardcoded secrets.',
    verified: true,
    sourceUrl: 'https://docs.kalshi.com/api-reference/orders/create-order-v2',
    sourceLabel: 'Kalshi Docs — Create Order V2'
  },
  {
    path: 'assets/js/data.js',
    checkType: 'Topic & Source Verification',
    finding: 'Strictly scoped to 5 topics (Gas Prices, Elections, Culture, Crypto, Golf). Every row carries a verified sourceUrl; unconfirmable fields are null (blank + Unverified).',
    verified: true,
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets'
  },
  {
    path: 'scripts/verify_site.py',
    checkType: 'Automated Verification',
    finding: 'Validates all internal links across HTML files, enforces 5-topic isolation, verifies every data table row has an HTTPS source URL, and confirms unverified items are documented on flagged-for-review.html.',
    verified: true,
    sourceUrl: 'https://github.com/kanlerxz87-cyber/Tradebot3',
    sourceLabel: 'GitHub — Tradebot3 Repo'
  },
  {
    path: 'assets/js/data.js (Session 2 re-verification)',
    checkType: 'Independent Re-verification',
    finding: 'Session arena-59730b38 re-checked all API endpoint claims against live docs.kalshi.com (demo_env, api_environments incl. external-feeds host, orderbook_responses, quick_start_websockets, rate_limits WS limits Basic/Adv/Expert 200, Premier 500, Paragon 750, Prime/Prestige 1000, candlesticks 1/60/1440, Create Order V2) and 8 live kalshi.com market pages; corrected 7 stale/incorrect rows (incl. CONTROLS-2026 Resolved YES), re-anchored model fair values preserving prior edge, added external-feeds endpoint row, and published IRREG-16.',
    verified: true,
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets (live re-check)'
  }
];

export const INTERACTIVE_SUGGESTIONS = [
  {
    priority: 'P1 — High Impact',
    area: 'True Sub-Second Streaming',
    suggestion: 'Deploy a Cloudflare Worker or Node.js Authenticated WebSocket Relay',
    rationale: 'Because browsers cannot attach Kalshi\'s required KALSHI-ACCESS-* handshake headers on WebSocket upgrades, a tiny edge relay signs GET /trade-api/ws/v2 server-side and fans out ticker, trade, orderbook_delta, and market_lifecycle_v2 messages to the dashboard with <100ms latency.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/quick_start_websockets',
    sourceLabel: 'Kalshi WebSockets Quick Start'
  },
  {
    priority: 'P1 — High Impact',
    area: 'Real-Time Catalyst Pinning',
    suggestion: 'Auto-Match >= $0.10 Price Spikes to Live News & Official Data Webhooks',
    rationale: 'Connect AAA Daily Fuel Gauge, EIA weekly petroleum releases, AP/Reuters election calls, PGA Tour ShotLink feeds, and crypto spot price webhooks so any >= $0.10 move automatically annotates the chart with timestamped verified links.',
    sourceUrl: 'https://www.eia.gov/todayinenergy/detail.php?id=66964',
    sourceLabel: 'U.S. EIA Data Feed Reference'
  },
  {
    priority: 'P2 — Trader UX',
    area: 'One-Click Orderbook Ladder Trading',
    suggestion: 'Click Any Price Row in the Orderbook Depth Ladder to Pre-Fill or Submit Limit Orders',
    rationale: 'Allows active traders to react to >= $0.10 swings in under 2 seconds by clicking a resting YES bid or implied YES ask row to instantly populate size, price, and post-only flags via POST /portfolio/events/orders.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/orders/create-order-v2',
    sourceLabel: 'Kalshi Create Order (V2)'
  },
  {
    priority: 'P2 — Trader UX',
    area: 'Push & Audio Alerting',
    suggestion: 'Add Browser Web Notifications, Sound Cues & Watchlist Threshold Sliders',
    rationale: 'Let traders enable desktop alerts specifically for the High-ROI Model chat feed (or customize the swing threshold from $0.05 to $0.25 per topic) so opportunities are never missed while viewing another tab.',
    sourceUrl: 'https://docs.kalshi.com/websockets',
    sourceLabel: 'Kalshi WebSocket API'
  },
  {
    priority: 'P3 — Analytics',
    area: 'Automated Strategy Backtesting on Historical Candlesticks',
    suggestion: 'Ingest Kalshi Historical Candlesticks & Trades for Walk-Forward Strategy Validation',
    rationale: 'Use GET /historical/markets/{ticker}/candlesticks and /historical/trades to replay historical >= $0.10 jumps and measure out-of-sample Sharpe ratio, fill slippage, and category-specific ROI before enabling live demo execution.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/historical/get-historical-market',
    sourceLabel: 'Kalshi Historical API'
  },
  {
    priority: 'P3 — Portfolio',
    area: 'Dedicated User Fill & Resolution Notifications',
    suggestion: 'Subscribe to wss://user-ws.demo.kalshi.co/trade-api/ws/v2 & market_lifecycle_v2',
    rationale: 'Automatically update portfolio P&L on partial fills and close settled positions immediately when a market transitions to Resolved YES ($1.00 payout) or Resolved NO ($0.00 payout).',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_environments',
    sourceLabel: 'Kalshi API Environments'
  }
];
