/**
 * Official Kalshi Demo API Client (REST v2 + Web Crypto RSA-PSS Signing)
 * Verified against:
 *  - https://docs.kalshi.com/getting_started/demo_env
 *  - https://docs.kalshi.com/getting_started/api_environments
 *  - https://docs.kalshi.com/getting_started/orderbook_responses
 *
 * Order creation is intentionally not implemented. This client can read public market data and,
 * only with a user-supplied demo key, request the read-only portfolio balance endpoint.
 */

export const KALSHI_DEMO_REST_PRIMARY = 'https://external-api.demo.kalshi.co/trade-api/v2';
export const KALSHI_DEMO_REST_LEGACY = 'https://demo-api.kalshi.co/trade-api/v2';
export const KALSHI_DEMO_WS_PRIMARY = 'wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2';
export const KALSHI_DEMO_WS_LEGACY = 'wss://demo-api.kalshi.co/trade-api/ws/v2';

function pemToArrayBuffer(pem) {
  const cleaned = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Parse Kalshi official orderbook_fp response into structured bids, implied asks, spread & depth.
 * Official rule: YES bid at X == NO ask at (1.00 - X); NO bid at Y == YES ask at (1.00 - Y).
 */
export function parseOrderbookFp(payload) {
  const ob = payload && (payload.orderbook_fp || payload.orderbook);
  if (!ob) {
    return {
      yesBids: [],
      noBids: [],
      impliedYesAsks: [],
      bestYesBid: null,
      bestYesAsk: null,
      spread: null,
      totalYesContracts: 0,
      totalNoContracts: 0,
      totalDollarLiquidity: 0
    };
  }

  const rawYes = Array.isArray(ob.yes_dollars) ? ob.yes_dollars : [];
  const rawNo = Array.isArray(ob.no_dollars) ? ob.no_dollars : [];

  const yesBids = rawYes
    .map(([priceStr, countStr]) => {
      const price = Number(priceStr);
      const count = Number(countStr);
      return { price, count, dollars: +(price * count).toFixed(2) };
    })
    .filter((lvl) => Number.isFinite(lvl.price) && Number.isFinite(lvl.count) && lvl.count > 0)
    .sort((a, b) => b.price - a.price);

  const noBids = rawNo
    .map(([priceStr, countStr]) => {
      const price = Number(priceStr);
      const count = Number(countStr);
      return { price, count, dollars: +(price * count).toFixed(2) };
    })
    .filter((lvl) => Number.isFinite(lvl.price) && Number.isFinite(lvl.count) && lvl.count > 0)
    .sort((a, b) => b.price - a.price);

  const impliedYesAsks = noBids
    .map((lvl) => {
      const askPrice = +(1 - lvl.price).toFixed(4);
      return {
        price: askPrice,
        noBidPrice: lvl.price,
        count: lvl.count,
        dollars: +(askPrice * lvl.count).toFixed(2)
      };
    })
    .sort((a, b) => a.price - b.price);

  const bestYesBid = yesBids.length ? yesBids[0].price : null;
  const bestYesAsk = impliedYesAsks.length ? impliedYesAsks[0].price : null;
  const spread =
    bestYesBid !== null && bestYesAsk !== null ? +(bestYesAsk - bestYesBid).toFixed(4) : null;

  const totalYesContracts = yesBids.reduce((acc, l) => acc + l.count, 0);
  const totalNoContracts = noBids.reduce((acc, l) => acc + l.count, 0);
  const totalDollarLiquidity = +(
    yesBids.reduce((acc, l) => acc + l.dollars, 0) +
    impliedYesAsks.reduce((acc, l) => acc + l.dollars, 0)
  ).toFixed(2);

  return {
    yesBids,
    noBids,
    impliedYesAsks,
    bestYesBid,
    bestYesAsk,
    spread,
    totalYesContracts,
    totalNoContracts,
    totalDollarLiquidity
  };
}

export class KalshiDemoClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || KALSHI_DEMO_REST_PRIMARY;
    this.keyId = options.keyId || '';
    this.privateKeyPem = options.privateKeyPem || '';
    this.cryptoKey = null;
    this.lastStatus = {
      connected: false,
      mode: 'paper-simulation',
      endpoint: this.baseUrl,
      message: 'No Kalshi Demo REST request has completed. Paper trading is local simulation only.',
      lastChecked: null
    };
  }

  async configure({ baseUrl, keyId, privateKeyPem }) {
    if (baseUrl) this.baseUrl = baseUrl;
    this.keyId = (keyId || '').trim();
    this.privateKeyPem = (privateKeyPem || '').trim();
    this.cryptoKey = null;

    if (this.privateKeyPem) {
      const keyData = pemToArrayBuffer(this.privateKeyPem);
      this.cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        false,
        ['sign']
      );
    }
  }

  async buildSignedHeaders(method, pathWithPrefix) {
    if (!this.keyId || !this.cryptoKey) {
      throw new Error('Kalshi Demo API Key ID and PKCS#8 RSA private key are required for authenticated requests.');
    }
    const timestamp = String(Date.now());
    const cleanPath = pathWithPrefix.split('?')[0];
    const message = new TextEncoder().encode(timestamp + method.toUpperCase() + cleanPath);
    const sigBuffer = await crypto.subtle.sign(
      { name: 'RSA-PSS', saltLength: 32 },
      this.cryptoKey,
      message
    );
    return {
      'KALSHI-ACCESS-KEY': this.keyId,
      'KALSHI-ACCESS-TIMESTAMP': timestamp,
      'KALSHI-ACCESS-SIGNATURE': arrayBufferToBase64(sigBuffer)
    };
  }

  async request(method, relativePath, { auth = false, body = null } = {}) {
    const fullPath = '/trade-api/v2' + relativePath;
    const url = this.baseUrl.replace(/\/$/, '') + relativePath;
    const headers = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (auth) {
      Object.assign(headers, await this.buildSignedHeaders(method, fullPath));
    }
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  }

  async testPublicConnectivity() {
    const endpoints = [this.baseUrl, KALSHI_DEMO_REST_LEGACY].filter(
      (v, i, arr) => arr.indexOf(v) === i
    );
    for (const ep of endpoints) {
      try {
        const res = await fetch(`${ep.replace(/\/$/, '')}/markets?limit=5`, {
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          this.baseUrl = ep;
          this.lastStatus = {
            connected: true,
            mode: 'demo-public-rest',
            endpoint: ep,
            message: `Kalshi Demo public REST responded (${(data.markets || []).length} sample markets). This check does not prove every tracked event loaded, authenticate an account, stream WebSocket updates, or submit orders. REST responses may be cached.`,
            lastChecked: new Date().toISOString()
          };
          return { ok: true, status: this.lastStatus, data };
        }
        this.lastStatus = {
          connected: false,
          mode: 'paper-simulation',
          endpoint: ep,
          message: `Kalshi Demo public REST returned HTTP ${res.status}. Paper trading remains local simulation only.`,
          lastChecked: new Date().toISOString()
        };
      } catch (err) {
        this.lastStatus = {
          connected: false,
          mode: 'paper-simulation',
          endpoint: ep,
          message: `Kalshi Demo public REST could not be read from this browser (${err.message}). This may be CORS, network, or service availability; paper trading remains local simulation only.`,
          lastChecked: new Date().toISOString()
        };
      }
    }
    return { ok: false, status: this.lastStatus };
  }

  async getEvent(eventTicker) {
    if (!eventTicker) throw new Error('An event ticker is required for a public Demo snapshot.');
    return this.request('GET', `/events/${encodeURIComponent(eventTicker)}`);
  }

  getEventUrl(eventTicker) {
    return `${this.baseUrl.replace(/\/$/, '')}/events/${encodeURIComponent(eventTicker)}`;
  }

  async getMarketOrderbook(ticker, depth = 10) {
    if (!ticker) throw new Error('A Kalshi market ticker is required for an orderbook snapshot.');
    const data = await this.request('GET', `/markets/${encodeURIComponent(ticker)}/orderbook?depth=${depth}`);
    return parseOrderbookFp(data);
  }

  async getPortfolioBalance() {
    return this.request('GET', '/portfolio/balance', { auth: true });
  }

}
