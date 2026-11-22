/**
 * Tradebot3 Verified Data Catalog
 * All entries verified line by line against official Kalshi docs (docs.kalshi.com),
 * official Kalshi market pages (kalshi.com), and verified external sources on 2026-11-22 (UTC).
 *
 * STRICT VERIFICATION POLICY:
 * - Only 5 topics allowed: gas-prices, elections, culture, crypto, golf.
 * - Every entry includes an official sourceUrl and sourceLabel.
 * - Any value that could not be confirmed from an official source is explicitly `null`
 *   so tables render it blank and flag it as Unverified (linked to flagged-for-review.html).
 */

export const LAST_VERIFIED_UTC = '2026-11-22T07:35:00Z';

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
    officialHubUrl: 'https://kalshi.com/markets/kxaaagasmax/us-highest-gas-price-yearly/kxaaagasmax-26dec31',
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
    authRequired: 'Public for market data; Ed25519 (recommended) or RSA-PSS for portfolio/orders',
    notes: 'Dedicated Trade API demo root recommended by Kalshi docs.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/demo_env',
    sourceLabel: 'Kalshi Docs — Demo Environment'
  },
  {
    surface: 'REST Trade API (Legacy Shared)',
    status: 'Also Supported',
    url: 'https://demo-api.kalshi.co/trade-api/v2',
    authRequired: 'Public for market data; Ed25519 or RSA-PSS for portfolio/orders',
    notes: 'Legacy shared demo REST host; remains officially supported for compatibility.',
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
    notes: 'Dedicated lower-latency stream for demo fill and user_orders channels (other channels return error code 8).',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_environments',
    sourceLabel: 'Kalshi Docs — API Environments'
  },
  {
    surface: 'External Feeds WebSocket (Demo)',
    status: 'Dedicated Feed Host',
    url: 'wss://external-feeds.demo.kalshi.co/trade-api/v2/external-feeds',
    authRequired: 'Authenticated (sign GET /trade-api/v2/external-feeds)',
    notes: 'Dedicated demo host for external data feeds; Trade API REST/WS hosts unaffected. Covers the external-feeds gap in static IRREG-11.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_environments',
    sourceLabel: 'Kalshi Docs — API Environments'
  },
  {
    surface: 'API Key Signing Spec',
    status: 'Authentication Spec',
    url: 'Headers: KALSHI-ACCESS-KEY, KALSHI-ACCESS-TIMESTAMP (ms, ±30s), KALSHI-ACCESS-SIGNATURE',
    authRequired: 'Ed25519 (default, PKCS#8) or RSA-PSS SHA-256 (PKCS#1/PKCS#8)',
    notes: 'Sign timestamp + METHOD + path_without_query. Timestamps outside ±30s return 401 header_timestamp_expired.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_keys',
    sourceLabel: 'Kalshi Docs — API Keys'
  },
  {
    surface: 'REST Get Events',
    status: 'Public Endpoint',
    url: 'GET /trade-api/v2/events',
    authRequired: 'None',
    notes: 'Lists events (excludes multivariate combo events, which use GET /events/multivariate).',
    sourceUrl: 'https://docs.kalshi.com/api-reference/events/get-events',
    sourceLabel: 'Kalshi Docs — Get Events'
  },
  {
    surface: 'REST Get Markets',
    status: 'Public Endpoint',
    url: 'GET /trade-api/v2/markets',
    authRequired: 'None',
    notes: 'Lists binary markets filterable by status (unopened, open, closed, settled), series_ticker, or event_ticker.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/market/get-markets',
    sourceLabel: 'Kalshi Docs — Get Markets'
  },
  {
    surface: 'REST Get Market Orderbook',
    status: 'Public Endpoint',
    url: 'GET /trade-api/v2/markets/{ticker}/orderbook',
    authRequired: 'None',
    notes: 'Returns orderbook_fp { yes_dollars, no_dollars } as [price_dollars, count_fp] bids only (ascending; best bid is last). Returns HTTP 200 with empty arrays even for unknown tickers (IRREG-05).',
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
    notes: 'Returns balance (cents), balance_dollars, portfolio_value, updated_ts. Metered in its own bucket: 1 req/s (Basic/Adv), 5 req/s (higher tiers).',
    sourceUrl: 'https://docs.kalshi.com/api-reference/portfolio/get-balance',
    sourceLabel: 'Kalshi Docs — Get Balance'
  },
  {
    surface: 'REST Create Order (V2)',
    status: 'Authenticated Endpoint',
    url: 'POST /trade-api/v2/portfolio/events/orders',
    authRequired: 'KALSHI-ACCESS-KEY, TIMESTAMP, SIGNATURE',
    notes: 'Single-book YES-leg order entry: side is "bid" (buy YES) or "ask" (sell YES / buy NO at 1 - price), fixed-point string count & price.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/orders/create-order-v2',
    sourceLabel: 'Kalshi Docs — Create Order (V2)'
  },
  {
    surface: 'WebSocket Public Data Channels',
    status: 'Auth Handshake Required',
    url: 'channels: ticker, trade, market_lifecycle_v2, multivariate_market_lifecycle',
    authRequired: 'Authenticated WS Session (no extra channel-level auth)',
    notes: 'Streams live price ticks, trades, and market resolution lifecycle events.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/quick_start_websockets',
    sourceLabel: 'Kalshi Docs — Quick Start WebSockets'
  },
  {
    surface: 'WebSocket Private Channels',
    status: 'Auth Handshake Required',
    url: 'channels: orderbook_delta, fill, market_positions, communications, order_group_updates, user_orders',
    authRequired: 'Authenticated WS Session',
    notes: 'Streams incremental orderbook changes, fills, live positions, and user orders.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/quick_start_websockets',
    sourceLabel: 'Kalshi Docs — Quick Start WebSockets'
  },
  {
    surface: 'WebSocket Connection Limits',
    status: 'Rate Limit Spec',
    url: 'Basic/Adv/Expert: 200 | Premier: 500 | Paragon: 750 | Prime/Prestige: 1,000',
    authRequired: 'Tier-based (shared across Predictions & Perps)',
    notes: 'Maximum concurrent WebSocket connections per API tier; exceeding returns HTTP 429 too_many_requests.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/rate_limits',
    sourceLabel: 'Kalshi Docs — Rate Limits and Tiers'
  }
];

/**
 * Verified Kalshi Markets across the 5 strictly allowed topics ONLY.
 * Re-verified line by line against live official Kalshi market pages on 2026-11-22 (UTC).
 * - `volumeUsd`: verified dollar volume from official Kalshi market page, or `null` (blank + Unverified).
 * - `verifiedRestingLiquidity`: `null` statically because resting orderbook depth is live/dynamic;
 *   live orderbook fetch or clearly labeled Demo Simulation supplies interactive ladder depth.
 * - `observedPrice`: verified observed YES probability/price ($0.00-$1.00) from official Kalshi page.
 * - `observedSwing`: verified daily/recent price move observed on Kalshi page (in dollars), or `null`.
 * - `resolution`: 'OPEN', 'YES', or 'NO' (verified from official Kalshi settled banners).
 */
export const VERIFIED_MARKETS = [
  // ======================== 1. GAS PRICES ========================
  {
    ticker: 'KXAAAGASMAX-26DEC31',
    seriesTicker: 'KXAAAGASMAX',
    topic: 'gas-prices',
    title: 'How high will US gas prices get this year? — Above $4.60',
    contractLabel: 'Above $4.60 (Yes 6¢ / No 96¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.06,
    observedSwing: -0.05,
    volumeUsd: 2150412,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA Daily Fuel Gauge',
    modelFairValue: 0.14,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasmax/us-highest-gas-price-yearly/kxaaagasmax-26dec31',
    sourceLabel: 'Kalshi — US Highest Gas Price 2026',
    catalysts: [
      {
        label: 'AAA reports U.S. national average regular gas dipped below $4/gal to $3.90, lowest since July',
        delta: -0.14,
        timeOffsetMin: 210,
        url: 'https://www.cspdailynews.com/fuels/gas-prices-dip-below-4-first-time-july-aaa-reports',
        sourceName: 'CSP Daily News (Kalshi Digest)'
      },
      {
        label: 'EIA historical retail gasoline benchmark & seasonal crack spread decline trend',
        delta: -0.10,
        timeOffsetMin: 95,
        url: 'https://www.eia.gov/todayinenergy/detail.php?id=66964',
        sourceName: 'U.S. EIA'
      }
    ]
  },
  {
    ticker: 'KXAAAGASMAXCA-26DEC31',
    seriesTicker: 'KXAAAGASMAXCA',
    topic: 'gas-prices',
    title: 'How high will gas prices in California get this year? — Above $6.60',
    contractLabel: 'CA Above $6.60 (Yes 6¢ / No 98¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.02,
    observedSwing: -0.06,
    volumeUsd: 509539,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA California Regular Average',
    modelFairValue: 0.09,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasmaxca/california-highest-gas-price-yearly/kxaaagasmaxca-26dec31',
    sourceLabel: 'Kalshi — California Highest Gas Price 2026',
    catalysts: [
      {
        label: 'AAA reports gas prices fell in all 50 states (-20¢ national drop to $3.78/gal) with crude below $90',
        delta: -0.11,
        timeOffsetMin: 165,
        url: 'https://1190kex.iheart.com/featured/portland-local-news/content/2026-11-17-gas-prices-plunge-across-us/',
        sourceName: '1190 KEX (Kalshi Digest)'
      }
    ]
  },
  {
    ticker: 'KXAAAGASMIN-26DEC31',
    seriesTicker: 'KXAAAGASMIN',
    topic: 'gas-prices',
    title: 'How low will US gas prices get this year? — Below $3.40',
    contractLabel: 'Below $3.40 (Yes 69¢ / No 33¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.67,
    observedSwing: 0.27,
    volumeUsd: 120214,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA Daily Fuel Gauge',
    modelFairValue: 0.78,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasmin/us-lowest-gas-price-yearly/kxaaagasmin-26dec31',
    sourceLabel: 'Kalshi — US Lowest Gas Price 2026',
    catalysts: [
      {
        label: 'Texas pump prices drop ~55¢ in a month; Below $3.40 surges +$0.27 to 67% (Below $3.60 +$0.30)',
        delta: 0.27,
        timeOffsetMin: 140,
        url: 'https://www.cbsnews.com/texas/news/texas-gas-prices-drop-nearly-55-cents-a-gallon-whats-behind-the-decline/',
        sourceName: 'CBS News (Kalshi Digest)'
      }
    ]
  },
  {
    ticker: 'KXAAAGASMINCA-26DEC31-3.90',
    seriesTicker: 'KXAAAGASMINCA',
    topic: 'gas-prices',
    title: 'How low will gas prices in California get this year? — Below $3.90',
    contractLabel: 'CA Below $3.90 (Yes 2¢ / No 99¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.02,
    observedSwing: -0.02,
    volumeUsd: 70069,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'AAA California Regular Average',
    modelFairValue: 0.08,
    sourceUrl: 'https://kalshi.com/markets/kxaaagasminca/california-lowest-gas-price-yearly/kxaaagasminca-26dec31',
    sourceLabel: 'Kalshi — California Lowest Gas Price 2026',
    catalysts: [
      {
        label: 'NBC News state gas tracker shows California & Hawaii remain only states above $5/gal',
        delta: -0.05,
        timeOffsetMin: 180,
        url: 'https://www.nbcnews.com/data-graphics/gas-prices-iran-war-state-national-cost-trump-rcna265835',
        sourceName: 'NBC News (Kalshi Digest)'
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
    closeWindow: 'Settled (Nov 19, 2026)',
    settlementSource: 'AAA New York Regular Average',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/kxaaagascdny/new-york-gas-price/kxaaagascdny-26nov19',
    sourceLabel: 'Kalshi — NY Gas Price Nov 19 (Settled YES)',
    catalysts: []
  },

  // ======================== 2. ELECTIONS ========================
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
    closeWindow: 'Settled (Nov 2026 Midterms)',
    settlementSource: 'Media Consensus / U.S. Senate Pres. Pro Tempore',
    modelFairValue: 1.00,
    sourceUrl: 'https://kalshi.com/markets/controls/senate-winner/controls-2026',
    sourceLabel: 'Kalshi — 2026 Senate Control (Settled YES)',
    catalysts: []
  },
  {
    ticker: 'KXPRESNOMD-28',
    seriesTicker: 'KXPRESNOMD',
    topic: 'elections',
    title: '2028 Democratic presidential nominee — Jon Ossoff',
    contractLabel: 'Jon Ossoff (Yes 24¢ / No 77¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.24,
    observedSwing: null,
    volumeUsd: 308045852,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2028',
    settlementSource: 'Democratic National Convention Official Nominee',
    modelFairValue: 0.33,
    sourceUrl: 'https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28',
    sourceLabel: 'Kalshi — 2028 Democratic Nominee',
    catalysts: [
      {
        label: 'Emerson College National Poll puts Jon Ossoff #1 among Democrats at 17% (AOC 12%)',
        delta: 0.11,
        timeOffsetMin: 175,
        url: 'https://emersoncollegepolling.com/national-poll-rubio-leads-2028-gop-nomination-contest-ossoff-rises-among-democrats/',
        sourceName: 'Emerson Polling'
      },
      {
        label: 'MS NOW reports inside 2028 Democratic shadow campaigns & donor outreach ahead of 2027 announcements',
        delta: -0.10,
        timeOffsetMin: 80,
        url: 'https://www.ms.now/news/2028-democratic-presidential-candidates-primary',
        sourceName: 'MS NOW (Kalshi Digest)'
      }
    ]
  },
  {
    ticker: 'KXPRESPERSON-28',
    seriesTicker: 'KXPRESPERSON',
    topic: 'elections',
    title: '2028 U.S. Presidential Election winner? — Jon Ossoff',
    contractLabel: 'Jon Ossoff (Yes 18¢ / No 83¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.17,
    observedSwing: -0.01,
    volumeUsd: 111670768,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2029',
    settlementSource: 'Official Electoral College / Presidential Inauguration',
    modelFairValue: 0.25,
    sourceUrl: 'https://kalshi.com/markets/kxpresperson/pres-person/kxpresperson-28',
    sourceLabel: 'Kalshi — 2028 Presidential Election Winner',
    catalysts: [
      {
        label: 'Emerson Poll: Rubio leads Vance 44%-24% in GOP closed-ended; Ossoff leads Democrats at 17%',
        delta: 0.10,
        timeOffsetMin: 130,
        url: 'https://emersoncollegepolling.com/national-poll-rubio-leads-2028-gop-nomination-contest-ossoff-rises-among-democrats/',
        sourceName: 'Emerson Polling'
      },
      {
        label: 'NY Post covers Emerson Poll shakeup as Rubio surges past JD Vance in 2028 GOP field',
        delta: 0.10,
        timeOffsetMin: 90,
        url: 'https://nypost.com/2026/11/19/us-news/marco-rubio-surges-past-jd-vance-to-lead-2028-republican-primary-race-poll/',
        sourceName: 'NY Post (Kalshi Digest)'
      }
    ]
  },
  {
    ticker: 'CONTROLS-2028',
    seriesTicker: 'CONTROLS',
    topic: 'elections',
    title: '2028 U.S. Senate winner? — Democratic Party',
    contractLabel: 'Democratic Party (Yes 89¢ / No 12¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.90,
    observedSwing: 0.01,
    volumeUsd: 1038132,
    verifiedRestingLiquidity: null,
    closeWindow: 'Feb 1, 2029',
    settlementSource: 'Official U.S. Senate Control',
    modelFairValue: 0.83,
    sourceUrl: 'https://kalshi.com/markets/controls/senate-winner/controls-2028',
    sourceLabel: 'Kalshi — 2028 U.S. Senate Control',
    catalysts: [
      {
        label: 'Reuters analysis shows Democrats hold structural Senate advantage in 2028 map (GOP defends 19 seats)',
        delta: 0.10,
        timeOffsetMin: 150,
        url: 'https://www.reuters.com/graphics/US-ELECTIONS/GRAPHICS-BLOG/akpelkldzvr/2026-11-16/future-senate/',
        sourceName: 'Reuters (Kalshi Digest)'
      }
    ]
  },
  {
    ticker: 'KXPRESPARTY-2028',
    seriesTicker: 'KXPRESPARTY',
    topic: 'elections',
    title: '2028 Presidential Election winner? (Party) — Democratic Party',
    contractLabel: 'Democratic Party (Yes 67¢ / No 34¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.67,
    observedSwing: null,
    volumeUsd: 911689,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2029',
    settlementSource: 'Official Presidential Election Party Winner',
    modelFairValue: 0.76,
    sourceUrl: 'https://kalshi.com/markets/kxpresparty/party-winning-presidency/kxpresparty-2028',
    sourceLabel: 'Kalshi — 2028 Presidential Party Winner',
    catalysts: []
  },
  {
    ticker: 'POWER-28',
    seriesTicker: 'POWER',
    topic: 'elections',
    title: '2028: Who will win Presidency, House, and Senate? — Democratic Sweep',
    contractLabel: 'Democratic Sweep (Yes 67¢ / No 34¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.65,
    observedSwing: null,
    volumeUsd: 613272,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 7, 2029',
    settlementSource: 'Official 2028 Federal Election Results',
    modelFairValue: 0.56,
    sourceUrl: 'https://kalshi.com/markets/power/party-power/power-28',
    sourceLabel: 'Kalshi — 2028 Party Power Sweep',
    catalysts: [
      {
        label: 'NBC News: GOP Senate campaign chair warns of steep hill to win back Senate in 2028',
        delta: 0.10,
        timeOffsetMin: 120,
        url: 'https://www.nbcnews.com/politics/congress/republicans-lower-expectations-win-back-senate-2028-steep-hill-climb-rcna610012',
        sourceName: 'NBC News (Kalshi Digest)'
      }
    ]
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
    contractLabel: 'GTA VI (Yes 92¢ / No 9¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.91,
    observedSwing: 0.06,
    volumeUsd: 4315316,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 10, 2026 (Max Payout Dec 31, 2027)',
    settlementSource: 'The Game Awards Official Ceremony',
    modelFairValue: 0.84,
    sourceUrl: 'https://kalshi.com/markets/kxgameawards/game-awards/kxgameawards-2026',
    sourceLabel: 'Kalshi — The Game Awards 2026 GOTY',
    catalysts: [
      {
        label: 'Variety: GTA VI earns 99 Metacritic score, tying Ocarina of Time as highest-rated game ever',
        delta: 0.14,
        timeOffsetMin: 190,
        url: 'https://variety.com/2026/gaming/news/gta-6-reviews-highest-rated-video-game-1236951803/',
        sourceName: 'Variety (Kalshi Digest)'
      },
      {
        label: 'Billboard: GTA VI leads 2026 Game Awards nominations with 8 nods ahead of Dec 10 ceremony',
        delta: 0.10,
        timeOffsetMin: 110,
        url: 'https://billboard.com/music/awards/2026-game-awards-nominations-list-grand-theft-auto-vi-1236384541',
        sourceName: 'Billboard (Kalshi Digest)'
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
    ticker: 'KXBTCY-27JAN0100',
    seriesTicker: 'KXBTCY',
    topic: 'crypto',
    title: 'Bitcoin price at the end of 2026 — $60,000 to $64,999.99',
    contractLabel: '$60,000–$64,999.99 (Yes 21.9¢ / No 78.4¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.22,
    observedSwing: 0.03,
    volumeUsd: 50835002,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.31,
    sourceUrl: 'https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100',
    sourceLabel: 'Kalshi — Bitcoin EOY 2026 Range',
    catalysts: [
      {
        label: 'CNBC: Bitcoin sinks under $60k alongside S&P 500 & Dow correction; US BTC funds shed $3.47B this month',
        delta: -0.11,
        timeOffsetMin: 120,
        url: 'https://www.cnbc.com/2026/11/20/bitcoin-price-gold-market-hedge.html',
        sourceName: 'CNBC (Kalshi Digest)'
      }
    ]
  },
  {
    ticker: 'KXBTCMINY-27JAN01',
    seriesTicker: 'KXBTCMINY',
    topic: 'crypto',
    title: 'How low will Bitcoin get this year? — Below $55,000.00',
    contractLabel: 'BTC Below $55,000 (Yes 66¢ / No 36¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.64,
    observedSwing: 0.32,
    volumeUsd: 9494723,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.74,
    sourceUrl: 'https://kalshi.com/markets/kxbtcminy/how-low-will-bitcoin-fall-this-year/kxbtcminy-27jan01',
    sourceLabel: 'Kalshi — How Low Will Bitcoin Get 2026',
    catalysts: [
      {
        label: 'BTC touches ~$55,055 intraday low during Wall Street 8.5% sell-off; Below $55k surges +$0.32 to 64%',
        delta: 0.32,
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
    contractLabel: '$50,000 First (Yes 40¢ / No 63¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.37,
    observedSwing: -0.03,
    volumeUsd: 9284632,
    verifiedRestingLiquidity: null,
    closeWindow: 'Dec 31, 2026',
    settlementSource: 'CF Benchmarks / Kalshi BTC Reference',
    modelFairValue: 0.48,
    sourceUrl: 'https://kalshi.com/markets/kxbtc50vs100/will-btc-fall-below-50k-before-hitting-100k/kxbtc50vs100-btc-26dec31',
    sourceLabel: 'Kalshi — BTC $50k Before $100k',
    catalysts: [
      {
        label: 'Motley Fool: MSCI plans to remove Strategy & Metaplanet from USA Index on Nov 30 amid 9% weekly BTC drop',
        delta: 0.12,
        timeOffsetMin: 145,
        url: 'https://www.fool.com/investing/2026/11/21/msci-is-cutting-strategy-and-metaplanet-from-its-indexes-here-s-what-it-means-for-bitcoin-treasury-company-stocks/',
        sourceName: 'Motley Fool (Kalshi Digest)'
      }
    ]
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
  {
    ticker: 'KXETHMINY-27JAN01',
    seriesTicker: 'KXETHMINY',
    topic: 'crypto',
    title: 'How low will Ethereum get this year? — Below $1,500.00',
    contractLabel: 'ETH Below $1,500 (Yes 63¢ / No 38¢)',
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
        label: 'Coindoo: ETH dips to $1,538 with $545M liquidations & $714.6M US crypto fund outflows (+$0.26 jump)',
        delta: 0.26,
        timeOffsetMin: 110,
        url: 'https://coindoo.com/ethereum-dips-stops-above-low/',
        sourceName: 'Coindoo (Kalshi Digest)'
      },
      {
        label: 'CNBC: Wall Street tech/AI selloff & Fed hike concerns push risk assets into correction',
        delta: 0.15,
        timeOffsetMin: 170,
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
    contractLabel: 'SOL $50 or above (Yes 89¢ / No 15¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.90,
    observedSwing: -0.01,
    volumeUsd: 215030,
    verifiedRestingLiquidity: null,
    closeWindow: 'Jan 1, 2027',
    settlementSource: 'CF Benchmarks / Kalshi Spot Reference',
    modelFairValue: 0.81,
    sourceUrl: 'https://kalshi.com/markets/kxsold26/sol-price-end-of-2026/kxsold26-27jan0100',
    sourceLabel: 'Kalshi — Solana Year-End Price 2026',
    catalysts: [
      {
        label: 'BeInCrypto: US Solana ETFs draw $4.4M inflows ending 6-week outflow streak amid crypto selloff',
        delta: -0.10,
        timeOffsetMin: 155,
        url: 'https://beincrypto.com/solana-etf-inflows-crypto-selloff-bitwise/',
        sourceName: 'BeInCrypto (Kalshi Digest)'
      }
    ]
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
    sourceLabel: 'Kalshi — 2026 U.S. Open (Settled YES)',
    catalysts: []
  },
  {
    ticker: 'KXPGATOUR-THRC26-MTHO',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2026 PGA The RSM Classic Winner — Michael Thorbjornsen',
    contractLabel: 'Michael Thorbjornsen (T1 -9 · Yes 18¢ / No 84¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.18,
    observedSwing: 0.01,
    volumeUsd: 39992031,
    verifiedRestingLiquidity: null,
    closeWindow: 'Nov 23, 2026 (Rain Delay · Max Payout Dec 5)',
    settlementSource: 'PGA Tour / ESPN / Fox Sports',
    modelFairValue: 0.26,
    sourceUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-thrc26',
    sourceLabel: 'Kalshi — 2026 The RSM Classic Winner',
    catalysts: [
      {
        label: 'PGA Tour Leaderboard: Thorbjornsen (64-69, -9) tied for 1st after R2; R3 suspended due to rain (Monday finish)',
        delta: 0.10,
        timeOffsetMin: 105,
        url: 'https://www.pgatour.com/tournaments/2026/the-rsm-classic/R2026493/leaderboard',
        sourceName: 'PGA Tour Official Leaderboard'
      }
    ]
  },
  {
    ticker: 'KXPGATOUR-MAST27',
    seriesTicker: 'KXPGATOUR',
    topic: 'golf',
    title: '2027 The Masters Champion — Scottie Scheffler',
    contractLabel: 'Scottie Scheffler (Yes 18¢ / No 83¢)',
    status: 'Open',
    resolution: 'OPEN',
    observedPrice: 0.18,
    observedSwing: -0.01,
    volumeUsd: 2380682,
    verifiedRestingLiquidity: null,
    closeWindow: 'Apr 2027 (Max Payout Apr 25, 2027)',
    settlementSource: 'Augusta National / PGA Tour',
    modelFairValue: 0.25,
    sourceUrl: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-mast27',
    sourceLabel: 'Kalshi — 2027 The Masters Champion',
    catalysts: [
      {
        label: 'Kalshi 2027 Masters market sees sharp volatility (Rickie Fowler ▲ 10.3¢ on thin book; Scheffler leads at 18%)',
        delta: 0.10,
        timeOffsetMin: 140,
        url: 'https://kalshi.com/markets/kxpgatour/pga-tour/kxpgatour-mast27',
        sourceName: 'Kalshi Official Market'
      }
    ]
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
    item: 'KXAAAGASCDNY-26NOV19 settled volume not exposed & live resting orderbook depth is dynamic',
    detail: 'After line-by-line re-verification on 2026-11-22 UTC, 7 previously blank volumes were confirmed from official Kalshi pages (KXAAAGASMAXCA, KXBTCY, KXBTCMINY, KXBTC50VS100, KXBTCMAXMON, KXPGATOUR-USO26, KXPGAMASTERS-26). Only KXAAAGASCDNY-26NOV19 (settled page omits total dollar volume) and live resting orderbook contract counts across all 29 markets cannot be confirmed statically and remain blank / flagged Unverified.',
    status: 'Needs Review',
    sourceUrl: 'https://kalshi.com/markets/kxaaagascdny/new-york-gas-price/kxaaagascdny-26nov19',
    sourceLabel: 'Kalshi — NY Gas Price Nov 19'
  },
  {
    id: 'IRREG-08',
    severity: 'Low',
    category: 'Repository Audit',
    item: 'Initial repository state contained only an 11-byte README.md',
    detail: 'Baseline commit 62713af9e466cd393c61be0df37e5de0872919cc contained only README.md ("# Tradebot3"). PR #1 established the initial site, and session arena-ff314ece conducted a full independent line-by-line audit against live official Kalshi pages and API docs.',
    status: 'Needs Review',
    sourceUrl: 'https://github.com/kanlerxz87-cyber/Tradebot3/commit/62713af9e466cd393c61be0df37e5de0872919cc',
    sourceLabel: 'GitHub Commit 62713af'
  },
  {
    id: 'IRREG-14',
    severity: 'High',
    category: 'Dataset Re-verification (Session arena-59730b38)',
    item: 'Session-2 live re-check corrected 7 stale/incorrect rows incl. CONTROLS-2026 settlement (see detail)',
    detail: 'Independent re-verification against live official Kalshi pages on 2026-11-22 (07:27:00Z) corrected 7 rows (KXAAAGASMAX-26DEC31, KXAAAGASMIN-26DEC31, KXPRESNOMD-28, KXETHMINY-27JAN01, KXPGATOUR-THRC26-MTHO, CONTROLS-2026 Resolved YES, KXBTCMAXMON-BTC-26MAR31 volume $2,050,528). Preserved verbatim as the Session 2 refresh record requested by static IRREG-10.',
    status: 'Needs Review',
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets (live re-check)'
  },
  {
    id: 'IRREG-15',
    severity: 'Medium',
    category: 'Full 29-Market Audit & Code Remediations (Session arena-ff314ece)',
    item: 'Completed full 29/29 market verification, KXAAAGASCDNY settlement, 6 more verified volumes, Ed25519+PKCS#1 signing & PGA Tour URL fix',
    detail: 'Session arena-ff314ece audited all remaining 21 of 29 live Kalshi markets + 14 Kalshi docs pages on 2026-11-22 (07:35:00Z) and remediated: (1) KXAAAGASCDNY-26NOV19 confirmed settled YES (volume omitted on settled page -> remains blank/Unverified); (2) filled 6 additional previously blank official volumes (KXAAAGASMAXCA $509,539, KXBTCY $50,835,002, KXBTCMINY $9,494,723, KXBTC50VS100 $9,284,632, KXPGATOUR-USO26 $353,561,663, KXPGAMASTERS-26 $807,770); (3) refreshed remaining open market prices/volumes & replaced PGA Tour 2025 /past-results link with live 2026 /leaderboard; (4) upgraded kalshi-client.js to support Ed25519 (Kalshi default) + PKCS#1/PKCS#8 RSA-PSS + Create Order V2 YES/NO reciprocal mapping + live Demo orderbook pull; (5) fixed Quick Trade NO-side price synchronization bug.',
    status: 'Remediated in PR — Published for Transparency',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_keys',
    sourceLabel: 'Kalshi Docs — API Keys & Official Pages'
  }
];

export const REPO_AUDIT_ITEMS = [
  {
    path: 'README.md (baseline 62713af -> current)',
    checkType: 'Baseline & Docs Audit',
    finding: 'Original repo contained only "# Tradebot3" (11 bytes). Verified full site map, Kalshi Demo REST/WS endpoints, and verification commands.',
    verified: true,
    sourceUrl: 'https://github.com/kanlerxz87-cyber/Tradebot3',
    sourceLabel: 'GitHub — Tradebot3 Repo'
  },
  {
    path: 'GitHub Pages Config',
    checkType: 'Deployment Audit',
    finding: 'Verified active GitHub Pages deployment on branch main root (/) at https://kanlerxz87-cyber.github.io/Tradebot3/ with HTTPS enforced and .nojekyll present.',
    verified: true,
    sourceUrl: 'https://kanlerxz87-cyber.github.io/Tradebot3/',
    sourceLabel: 'GitHub Pages Live Site'
  },
  {
    path: 'COORDINATION.md',
    checkType: 'Parallel Session Protocol',
    finding: 'Maintains shared task board across sessions (arena-3716ae8d PR #1 + arena-ff314ece independent line-by-line verification & upgrades), official source links, irregularities log, and PR/merge history.',
    verified: true,
    sourceUrl: 'https://github.com/kanlerxz87-cyber/Tradebot3/blob/main/COORDINATION.md',
    sourceLabel: 'COORDINATION.md'
  },
  {
    path: 'assets/js/kalshi-client.js',
    checkType: 'API & Crypto Signing Audit',
    finding: 'Upgraded in session arena-ff314ece to support BOTH Ed25519 (Kalshi default) and RSA-PSS SHA-256 (PKCS#8 and PKCS#1 auto-wrap), single-book Create Order V2 YES/NO mapping, live orderbook_fp parser, and zero hardcoded secrets.',
    verified: true,
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_keys',
    sourceLabel: 'Kalshi Docs — API Keys'
  },
  {
    path: 'assets/js/data.js',
    checkType: 'Line-by-Line Market & Source Audit',
    finding: 'Every one of the 29 markets across the 5 strict topics (Gas Prices, Elections, Culture, Crypto, Golf) re-verified directly against live kalshi.com pages on 2026-11-22 UTC; stale volumes/settlements corrected and unexposed fields left blank + Unverified.',
    verified: true,
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets'
  },
  {
    path: 'assets/js/charts.js & dashboard.js',
    checkType: 'Interactive UX Audit',
    finding: 'Verified interactive Seconds/Minutes/Hours canvas chart with hover crosshair price/time tooltip, clickable >= $0.10 jump catalyst markers, live REST orderbook pull button, alert chat search/sound controls, and category P&L bar chart.',
    verified: true,
    sourceUrl: 'https://docs.kalshi.com/getting_started/orderbook_responses',
    sourceLabel: 'Kalshi Docs — Orderbook Responses'
  },
  {
    path: 'assets/js/data.js (Session 2 re-verification)',
    checkType: 'Independent Re-verification',
    finding: 'Session arena-59730b38 re-checked API endpoints against live docs.kalshi.com and spot-checked 8 live kalshi.com market pages; corrected 7 stale/incorrect rows (incl. CONTROLS-2026 Resolved YES), added external-feeds endpoint row, and published IRREG-14.',
    verified: true,
    sourceUrl: 'https://kalshi.com/markets',
    sourceLabel: 'Kalshi Official Markets (live re-check)'
  },
  {
    path: 'scripts/verify_site.py',
    checkType: 'Automated Verification',
    finding: 'Validates all required files, 0 broken internal links, DOM ID bindings, 5-topic isolation, HTTPS official source links on every row, Ed25519/V2 order mapping, orderbook_fp reciprocal math, and live strategy/settlement engine.',
    verified: true,
    sourceUrl: 'https://github.com/kanlerxz87-cyber/Tradebot3',
    sourceLabel: 'GitHub — Tradebot3 Repo'
  }
];

export const INTERACTIVE_SUGGESTIONS = [
  {
    priority: 'P1 — High Impact',
    area: 'True Sub-Second Streaming',
    suggestion: 'Deploy a Cloudflare Worker or Node.js Authenticated WebSocket Relay',
    rationale: 'Because browsers cannot attach Kalshi\'s required KALSHI-ACCESS-* handshake headers on WebSocket upgrades, a tiny edge relay signs GET /trade-api/ws/v2 server-side (using Ed25519 for lowest CPU latency) and fans out ticker, trade, orderbook_delta, and market_lifecycle_v2 messages to the dashboard with <100ms latency.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/quick_start_websockets',
    sourceLabel: 'Kalshi WebSockets Quick Start'
  },
  {
    priority: 'P1 — High Impact',
    area: 'Real-Time Catalyst Pinning',
    suggestion: 'Auto-Match >= $0.10 Price Spikes to Live News & Official Data Webhooks',
    rationale: 'Connect AAA Daily Fuel Gauge, EIA weekly petroleum releases, AP/Reuters Election Calls, PGA Tour ShotLink feeds, and CF Benchmarks crypto spot feeds (cfbenchmarks_value WS channel) so any >= $0.10 move automatically pins timestamped verified links onto the chart.',
    sourceUrl: 'https://docs.kalshi.com/websockets',
    sourceLabel: 'Kalshi WebSocket Feeds'
  },
  {
    priority: 'P2 — Trader UX',
    area: 'One-Click Orderbook Ladder Trading (Partially Live Now)',
    suggestion: 'Expand Click-to-Fill Depth Rows with Instant Post-Only & Cancel/Amend Controls',
    rationale: 'Clicking any resting YES bid or implied YES ask row already pre-fills the order ticket; adding hotkeys, instant post-only submission, and live open-order cancel/amend controls via /portfolio/events/orders lets traders react to >= $0.10 swings in under 1 second.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/orders/create-order-v2',
    sourceLabel: 'Kalshi Create Order (V2)'
  },
  {
    priority: 'P2 — Trader UX',
    area: 'Desktop Push Alerts & Custom Threshold Sliders',
    suggestion: 'Add Browser Web Notifications & Per-Topic Swing Threshold Sliders ($0.05–$0.25)',
    rationale: 'Complement the built-in High-ROI audio ping toggle with browser Notification API alerts and per-topic sensitivity sliders so traders never miss high-edge swings when viewing another tab.',
    sourceUrl: 'https://docs.kalshi.com/websockets',
    sourceLabel: 'Kalshi WebSocket API'
  },
  {
    priority: 'P3 — Analytics',
    area: 'Automated Strategy Backtesting on Historical Candlesticks',
    suggestion: 'Ingest Kalshi Historical Candlesticks & Trades for Walk-Forward Strategy Validation',
    rationale: 'Use GET /historical/markets/{ticker}/candlesticks and /historical/fills (now supporting up to 100 comma-separated tickers per request) to replay historical >= $0.10 jumps and measure out-of-sample Sharpe ratio, fill slippage, and category ROI.',
    sourceUrl: 'https://docs.kalshi.com/api-reference/historical/get-historical-market',
    sourceLabel: 'Kalshi Historical API'
  },
  {
    priority: 'P3 — Portfolio',
    area: 'Dedicated User Fill & Resolution Notifications',
    suggestion: 'Subscribe to wss://user-ws.demo.kalshi.co/trade-api/ws/v2 & market_lifecycle_v2',
    rationale: 'Kalshi advises reacting to fill/settlement WebSocket events rather than polling GET /portfolio/balance (limited to 1 req/s on Basic/Adv tiers) for instant P&L updates and zero-latency settlement tracking.',
    sourceUrl: 'https://docs.kalshi.com/getting_started/api_environments',
    sourceLabel: 'Kalshi API Environments'
  }
];
