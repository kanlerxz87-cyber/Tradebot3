/**
 * Tradebot3 Verified Data Catalog
 * All entries verified line by line against official Kalshi docs, official Kalshi market pages,
 * and verified external sources on 2026-11-22 (UTC).
 *
 * STRICT VERIFICATION POLICY:
 * - Only 5 topics allowed: gas-prices, elections, culture, crypto, golf.
 * - Every entry includes an official sourceUrl and sourceLabel.
 * - Any value that could not be confirmed from an official source is explicitly `null`
 *   so tables render it blank and flag it as Unverified (linked to flagged-for-review.html).
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
 * - `volumeUsd`: verified dollar volume from official Kalshi market page, or `null` (blank + Unverified).
 * - `verifiedRestingLiquidity`: `null` statically because resting orderbook depth is live/dynamic;
 *   live orderbook fetch or clearly labeled Demo Simulation supplies interactive ladder depth.
 * - `observedPrice`: verified observed YES probability/price ($0.00-$1.00) from official Kalshi page.
 * - `observedSwing`: verified price move observed on Kalshi page (in dollars, e.g. +0.27 or -0.10), or `null`.
 * - `resolution`: 'OPEN', 'YES', or 'NO' (verified from official Kalshi settled banners).
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
        label: 'U.S. national average falls below $4/gal ($3.978/gal) per AAA as Brent dips under $90',
        delta: -0.12,
        timeOffsetMin: 210,
        url: 'https://www.cnbc.com/2026/11/09/stock-market-today-live-updates.html',
        sourceName: 'CNBC'
      },
      {
        label: 'EIA historical retail gasoline benchmark & seasonal crack spread trend',
        delta: -0.10,
        timeOffsetMin: 95,
        url: 'https://www.eia.gov/todayinenergy/detail.php?id=66964',
        sourceName: 'U.S. EIA'
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
    observedPrice: 0.67,
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
        label: 'AAA national average drops below $4/gal to $3.978; Below $3.40 jumps +$0.10 (Below $3.60 +$0.27)',
        delta: 0.10,
        timeOffsetMin: 140,
        url: 'https://www.cnbc.com/2026/11/09/stock-market-today-live-updates.html',
        sourceName: 'CNBC'
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
    observedPrice: 0.07,
    observedSwing: null,
    volumeUsd: 51884,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA California Regular Average',
    modelFairValue: 0.11,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasminca/california-lowest-gas-price-yearly',
    sourceLabel: 'Kalshi — California Lowest Gas Price 2026',
    catalysts: [
      {
        label: 'EIA West Coast gasoline price spread & seasonal refinery transition data',
        delta: 0.04,
        timeOffsetMin: 180,
        url: 'https://www.eia.gov/todayinenergy/detail.php?id=66784',
        sourceName: 'U.S. EIA'
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
    observedPrice: 0.34,
    observedSwing: -0.04,
    volumeUsd: null,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA California Regular Average',
    modelFairValue: 0.25,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasmaxca/california-highest-gas-price-yearly/kxaaagasmaxca-26dec31',
    sourceLabel: 'Kalshi — California Highest Gas Price 2026',
    catalysts: [
      {
        label: 'Brent crude drops under $90/bbl easing West Coast refinery spike tail risk',
        delta: -0.11,
        timeOffsetMin: 165,
        url: 'https://www.cnbc.com/2026/11/09/stock-market-today-live-updates.html',
        sourceName: 'CNBC'
      }
    ]
  },
  {
    ticker: 'KXAAAGASCDNY-26NOV19',
    seriesTicker: 'KXAAAGASCDNY',
    topic: 'gas-prices',
    title: 'New York gas price (Nov 19, 2026) — Large decrease (<= $4.0814/gal)',
    contractLabel: 'NY Large Decrease',
    status: 'Open',
    resolution: null,
    observedPrice: 0.90,
    observedSwing: null,
    volumeUsd: null,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 19, 2026 (Payout Nov 26, 2026)',
    settlementSource: 'AAA New York Regular Average',
    modelFairValue: 0.92,
    sourceUrl: 'https://kalshi.com/markets/kxaaagascdny/new-york-gas-price/kxaaagascdny-26nov19',
    sourceLabel: 'Kalshi — New York Gas Price Nov 19',
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
        label: 'Emerson College National Poll puts Jon Ossoff #1 among Democrats at 17% (AOC 12%)',
        delta: 0.11,
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
    sourceLabel: 'Kalshi — 2026 U.S. Senate Control',
    catalysts: [
      {
        label: '2026 Midterm results drive +$0.23 (+23¢) jump in Democratic Senate control odds to 97%',
        delta: 0.23,
        timeOffsetMin: 240,
        url: 'https://kalshi.com/markets/controls/senate-winner/controls-2026',
        sourceName: 'Kalshi Market Feed'
      }
    ]
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
    observedSwing: 0.01,
    volumeUsd: 111643774,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2029',
    settlementSource: 'Official Electoral College / Presidential Inauguration',
    modelFairValue: 0.25,
    sourceUrl: 'https://kalshi.com/markets/kxpresperson/pres-person/kxpresperson-28',
    sourceLabel: 'Kalshi — 2028 Presidential Election Winner',
    catalysts: [
      {
        label: 'Emerson Poll: Rubio leads Vance 44%-24% in GOP; Ossoff tops Democrats at 17%',
        delta: 0.10,
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
    observedSwing: null,
    volumeUsd: 1038096,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2028',
    settlementSource: 'Official U.S. Senate Control',
    modelFairValue: 0.84,
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
    volumeUsd: 897054,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2029',
    settlementSource: 'Official Presidential Election Party Winner',
    modelFairValue: 0.74,
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
    observedPrice: 0.63,
    observedSwing: null,
    volumeUsd: 596106,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2028',
    settlementSource: 'Official 2028 Federal Election Results',
    modelFairValue: 0.56,
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
    sourceLabel: 'Kalshi — 2026 Oscar Best Actor (Settled YES)',
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
    sourceLabel: 'Kalshi — The Odyssey RT Score (Settled YES)',
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
    sourceLabel: 'Kalshi — 2026 Oscar Best Actress (Settled YES)',
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
    observedPrice: 0.91,
    observedSwing: null,
    volumeUsd: 4193638,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 2026 (Max Payout Dec 31, 2027)',
    settlementSource: 'The Game Awards Official Ceremony',
    modelFairValue: 0.94,
    sourceUrl: 'https://kalshi.com/markets/kxgameawards/game-awards/kxgameawards-2026',
    sourceLabel: 'Kalshi — The Game Awards 2026 GOTY',
    catalysts: [
      {
        label: 'GTA VI leads The Game Awards 2026 with 8 nominations & 99 Metacritic score',
        delta: 0.14,
        timeOffsetMin: 190,
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
    sourceLabel: 'Kalshi — 2026 Oscar Best Documentary (Settled YES)',
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
    sourceLabel: 'Kalshi — The Bride! RT Score (Settled YES)',
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
        label: 'ETH falls 6% to $1,650.79 amid broader market correction & Fed Waller 50bp hike remarks (+$0.19 jump)',
        delta: 0.19,
        timeOffsetMin: 110,
        url: 'https://www.cnbc.com/2026/11/19/stock-market-today-live-updates.html',
        sourceName: 'CNBC'
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
    observedSwing: -0.10,
    volumeUsd: 213632,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi Spot Reference',
    modelFairValue: 0.82,
    sourceUrl: 'https://kalshi.com/markets/kxsold26/sol-price-end-of-2026/kxsold26-27jan0100',
    sourceLabel: 'Kalshi — Solana Year-End Price 2026',
    catalysts: [
      {
        label: 'Broad crypto sell-off drags SOL contracts -$0.10 on $50+ (-$0.23 on $100+)',
        delta: -0.10,
        timeOffsetMin: 155,
        url: 'https://www.cnbc.com/amp/2026/11/20/bitcoin-price-gold-market-hedge.html',
        sourceName: 'CNBC'
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
    observedPrice: 0.19,
    observedSwing: 0.04,
    volumeUsd: null,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.27,
    sourceUrl: 'https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100',
    sourceLabel: 'Kalshi — Bitcoin EOY 2026 Range',
    catalysts: [
      {
        label: 'Bitcoin sinks below $60,000 ($59,554) as Dow/S&P enter correction; $65k–$69.9k bracket drops -$0.107',
        delta: -0.11,
        timeOffsetMin: 120,
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
    observedPrice: 0.58,
    observedSwing: 0.15,
    volumeUsd: null,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.67,
    sourceUrl: 'https://kalshi.com/markets/kxbtcminy/how-low-will-bitcoin-fall-this-year/kxbtcminy-27jan01',
    sourceLabel: 'Kalshi — How Low Will Bitcoin Get 2026',
    catalysts: [
      {
        label: 'BTC touches ~$55,055 intraday low during Wall Street sell-off; Below $55k jumps +$0.15',
        delta: 0.15,
        timeOffsetMin: 85,
        url: 'https://www.cnbc.com/2026/11/19/stock-market-today-live-updates.html',
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
    observedPrice: 0.18,
    observedSwing: 0.01,
    volumeUsd: null,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.28,
    sourceUrl: 'https://kalshi.com/markets/kxbtc50vs100/will-btc-fall-below-50k-before-hitting-100k/kxbtc50vs100-btc-26dec31',
    sourceLabel: 'Kalshi — BTC $50k Before $100k',
    catalysts: []
  },
  {
    ticker: 'KXBTCMAXMON-BTC-26MAR31',
    seriesTicker: 'KXBTCMAXMON',
    topic: 'crypto',
    title: 'How high will Bitcoin get in March 2026? — Above $77,500.00',
    contractLabel: 'Above $77,500',
    status: 'Resolved',
    resolution: 'NO',
    observedPrice: 0.00,
    observedSwing: null,
    volumeUsd: 2050528,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (Mar 31, 2026)',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.00,
    sourceUrl: 'https://kalshi.com/markets/kxbtcmaxmon/bitcoin-monthly-one-touch/kxbtcmaxmon-btc-26mar31',
    sourceLabel: 'Kalshi — BTC March 2026 High (Settled NO)',
    catalysts: []
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
    sourceLabel: 'Kalshi — 2026 The Masters (Settled YES)',
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
    sourceLabel: 'Kalshi — 2026 PGA Championship (Settled YES)',
    catalysts: []
  },
  {
    ticker: 'KXPGATOUR-THRC26-MTHO',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2026 PGA The RSM Classic Winner — Michael Thorbjornsen',
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
    sourceLabel: 'Kalshi — 2026 The RSM Classic Winner',
    catalysts: [
      {
        label: 'Michael Thorbjornsen opens 64 (-8) & surges to T1 at The RSM Classic (+$0.10 jump)',
        delta: 0.10,
        timeOffsetMin: 105,
        url: 'https://www.pgatour.com/tournaments/2026/the-rsm-classic/R2026493/past-results',
        sourceName: 'PGA Tour'
      }
    ]
  },
  {
    ticker: 'KXPGATOUR-MAST27',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2027 The Masters Champion — Scottie Scheffler',
    contractLabel: 'Scottie Scheffler',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.16,
    observedSwing: null,
    volumeUsd: 1894804,
    verifiedRestingLiquidity: null,
    closeWindow: 'Apr 2027 (Max Payout Apr 25, 2027)',
    settlementSource: 'Augusta National / PGA Tour',
    modelFairValue: 0.22,
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
    volumeUsd: null,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (2026 U.S. Open)',
    settlementSource: 'USGA / PGA Tour / ESPN',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-uso26',
    sourceLabel: 'Kalshi — 2026 U.S. Open (Settled YES)',
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
    volumeUsd: null,
    verifiedRestingLiquidity: null,
    closeWindow: 'Settled (Apr 2026)',
    settlementSource: 'Augusta National Official Field',
    modelFairValue: 0.00,
    sourceUrl: 'https://kalshi.com/markets/kxpgamasters/golfers-to-participate-in-the-masters/kxpgamasters-26',
    sourceLabel: 'Kalshi — 2026 Masters Field (Tiger Woods NO)',
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
    item: 'Unexposed dollar volumes, live resting orderbook contract counts, and unconfirmed post-Nov-19 NY gas settlement left blank',
    detail: 'Affected rows: KXAAAGASMAXCA-26DEC31 (volume), KXAAAGASCDNY-26NOV19 (volume & final YES/NO resolution), KXBTCY-27JAN0100 (volume), KXBTCMINY-27JAN01 (volume), KXBTC50VS100-BTC-26DEC31 (volume), KXBTCMAXMON-BTC-26MAR31 (volume), KXPGATOUR-USO26 (volume), KXPGAMASTERS-26 (volume), and static resting orderbook depth across all markets. Per verification rules, unconfirmable values are left blank and marked Unverified rather than inferred.',
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
    id: 'IRREG-14',
    severity: 'High',
    category: 'Dataset Re-verification',
    item: 'Session-2 live re-check corrected 7 stale/incorrect rows incl. CONTROLS-2026 settlement (see detail)',
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
    finding: 'Session arena-59730b38 re-checked all API endpoint claims against live docs.kalshi.com (demo_env, api_environments incl. external-feeds host, orderbook_responses, quick_start_websockets, rate_limits WS limits Basic/Adv/Expert 200, Premier 500, Paragon 750, Prime/Prestige 1000, candlesticks 1/60/1440, Create Order V2) and 8 live kalshi.com market pages; corrected 7 stale/incorrect rows (incl. CONTROLS-2026 Resolved YES), re-anchored model fair values preserving prior edge, added external-feeds endpoint row, and published IRREG-14.',
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
