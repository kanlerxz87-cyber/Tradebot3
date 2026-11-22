/**
 * Official Kalshi Demo API Client (REST v2 + Web Crypto Ed25519 & RSA-PSS Signing)
 * Verified against:
 *  - https://docs.kalshi.com/getting_started/demo_env
 *  - https://docs.kalshi.com/getting_started/api_environments
 *  - https://docs.kalshi.com/getting_started/api_keys
 *  - https://docs.kalshi.com/getting_started/orderbook_responses
 *
 * Read-only by design: this client fetches public market data and, with a user-supplied demo key,
 * the account balance. Create Order V2 is documented on the verification page for reference but no
 * order-submitting request exists in the repository.
 */

export const KALSHI_DEMO_REST_PRIMARY = 'https://external-api.demo.kalshi.co/trade-api/v2';
export const KALSHI_DEMO_REST_LEGACY = 'https://demo-api.kalshi.co/trade-api/v2';
export const KALSHI_DEMO_WS_PRIMARY = 'wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2';
export const KALSHI_DEMO_WS_LEGACY = 'wss://demo-api.kalshi.co/trade-api/ws/v2';

function encodeDerLength(len) {
  if (len < 0x80) return new Uint8Array([len]);
  const bytes = [];
  let n = len;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function concatBytes(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/**
 * Wrap a PKCS#1 RSA private key DER (`-----BEGIN RSA PRIVATE KEY-----`) into PKCS#8 DER
 * so Web Crypto `importKey('pkcs8', ...)` accepts Kalshi-generated RSA keys directly.
 */
function wrapPkcs1RsaToPkcs8(pkcs1Bytes) {
  const version = new Uint8Array([0x02, 0x01, 0x00]); // INTEGER 0
  // rsaEncryption OID 1.2.840.113549.1.1.1 + NULL
  const algId = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00
  ]);
  const octetHeader = concatBytes(new Uint8Array([0x04]), encodeDerLength(pkcs1Bytes.length));
  const privateKeyOctet = concatBytes(octetHeader, pkcs1Bytes);
  const body = concatBytes(version, algId, privateKeyOctet);
  return concatBytes(new Uint8Array([0x30]), encodeDerLength(body.length), body);
}

function pemToBytes(pem) {
  const isPkcs1Rsa = /-----BEGIN RSA PRIVATE KEY-----/.test(pem);
  const cleaned = pem
    .replace(/-----BEGIN [A-Z0-9 ]+-----/g, '')
    .replace(/-----END [A-Z0-9 ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes: isPkcs1Rsa ? wrapPkcs1RsaToPkcs8(bytes) : bytes, isPkcs1Rsa };
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
 * Official Create Order (V2) single-book mapping:
 * `bid` = buy YES at YES price; `ask` = sell YES at YES price (== buy NO at 1 - price).
 */
export function mapYesNoOrderToV2({ action = 'BUY', side = 'YES', price }) {
  const act = String(action).toUpperCase();
  const s = String(side).toUpperCase();
  const p = Math.max(0.01, Math.min(0.99, Number(price)));

  if (s === 'YES') {
    return {
      side: act === 'BUY' ? 'bid' : 'ask',
      price: +p.toFixed(4)
    };
  }
  // NO leg mapped to YES single-book reciprocal price
  const yesEquivPrice = +(1 - p).toFixed(4);
  return {
    side: act === 'BUY' ? 'ask' : 'bid',
    price: Math.max(0.01, Math.min(0.99, yesEquivPrice))
  };
}

/**
 * Parse Kalshi official orderbook_fp response into structured bids, implied asks, spread & depth.
 * Official rule: YES bid at X == NO ask at (1.00 - X); NO bid at Y == YES ask at (1.00 - Y).
 */
export function parseOrderbookFp(payload) {
  const ob = payload && (payload.orderbook_fp || payload.orderbook);
  if (!ob) {
    return {
      simulated: false,
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
    simulated: false,
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
    this.keyAlgorithm = null; // 'Ed25519' or 'RSA-PSS'
    this.authenticated = false;
    this.lastStatus = {
      connected: false,
      authenticated: false,
      mode: 'paper-simulation',
      endpoint: this.baseUrl,
      message: 'Paper Demo Mode active (connect Kalshi Demo API credentials or test public REST).',
      lastChecked: null
    };
  }

  /**
   * Configure endpoint and optionally import either an Ed25519 (Kalshi default) or RSA-PSS private key.
   */
  async configure({ baseUrl, keyId, privateKeyPem }) {
    if (baseUrl) this.baseUrl = baseUrl;
    this.keyId = (keyId || '').trim();
    this.privateKeyPem = (privateKeyPem || '').trim();
    this.cryptoKey = null;
    this.keyAlgorithm = null;
    this.authenticated = false;

    if (this.privateKeyPem) {
      const { bytes, isPkcs1Rsa } = pemToBytes(this.privateKeyPem);
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

      if (!isPkcs1Rsa) {
        // Try Ed25519 first (Kalshi default PKCS#8 key type), then fall back to RSA-PSS PKCS#8
        try {
          this.cryptoKey = await crypto.subtle.importKey('pkcs8', buf, { name: 'Ed25519' }, false, ['sign']);
          this.keyAlgorithm = 'Ed25519';
          return { algorithm: this.keyAlgorithm };
        } catch (_) {
          // Fall through to RSA-PSS
        }
      }

      this.cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        buf,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        false,
        ['sign']
      );
      this.keyAlgorithm = 'RSA-PSS';
      return { algorithm: this.keyAlgorithm };
    }
    return { algorithm: null };
  }

  async buildSignedHeaders(method, pathWithPrefix) {
    if (!this.keyId || !this.cryptoKey) {
      throw new Error('Kalshi Demo API Key ID and private key PEM (Ed25519 or RSA) are required for authenticated requests.');
    }
    const timestamp = String(Date.now());
    const cleanPath = pathWithPrefix.split('?')[0];
    const message = new TextEncoder().encode(timestamp + method.toUpperCase() + cleanPath);

    const signAlgo =
      this.keyAlgorithm === 'Ed25519'
        ? { name: 'Ed25519' }
        : { name: 'RSA-PSS', saltLength: 32 };

    const sigBuffer = await crypto.subtle.sign(signAlgo, this.cryptoKey, message);
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
            authenticated: this.authenticated,
            mode: 'live-public-rest',
            endpoint: ep,
            message: `Live Kalshi Demo REST reachable (${(data.markets || []).length} sample markets fetched from ${ep}).`,
            lastChecked: new Date().toISOString()
          };
          return { ok: true, status: this.lastStatus, data };
        }
      } catch (err) {
        this.lastStatus = {
          connected: false,
          authenticated: false,
          mode: 'paper-simulation',
          endpoint: ep,
          message: `Browser fetch blocked or unreachable (${err.message}). Running Verified Catalog + Paper Demo Mode (see IRREG-02).`,
          lastChecked: new Date().toISOString()
        };
      }
    }
    return { ok: false, status: this.lastStatus };
  }

  async getMarket(ticker) {
    return this.request('GET', `/markets/${encodeURIComponent(ticker)}`);
  }

  async getMarketOrderbook(ticker, depth = 10) {
    const data = await this.request('GET', `/markets/${encodeURIComponent(ticker)}/orderbook?depth=${depth}`);
    return {
      ...parseOrderbookFp(data),
      simulated: false,
      liveSource: `Live Demo REST Book (${ticker})`,
      fetchedAtMs: Date.now()
    };
  }

  async getPortfolioBalance() {
    const bal = await this.request('GET', '/portfolio/balance', { auth: true });
    this.authenticated = true;
    this.lastStatus = {
      connected: true,
      authenticated: true,
      mode: 'live-authenticated-demo',
      endpoint: this.baseUrl,
      message: `Authenticated to Kalshi Demo API (${this.keyAlgorithm}) at ${this.baseUrl}.`,
      lastChecked: new Date().toISOString()
    };
    return bal;
  }

}
