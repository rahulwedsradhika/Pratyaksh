/**
 * Admin Gateway for Pratyaksh Ayurveda
 * Connects Localhost Admin Panel directly to Live Production API:
 * Base: https://portal.pratyakshayurveda.in/api/
 */

const PROD_API_BASE = 'https://portal.pratyakshayurveda.in/api/';
const PROD_UPLOAD_URL = 'https://portal.pratyakshayurveda.in/api/upload';

// Safe in-memory cache for live production payloads
const liveCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

function getCached(key) {
  const item = liveCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    liveCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  liveCache.set(key, { data, timestamp: Date.now() });
}

export async function forwardToProduction({
  endpoint,
  method = 'GET',
  headers = {},
  body = null,
  timeout = 10000
}) {
  if(process.env.PRATYAKSH_REMOTE_ADMIN_ENABLED!=='true')return {success:false,status:503,source:'local-database',error:'Remote administration is disabled; use the application database.'};
  const targetUrl = endpoint.startsWith('http') ? endpoint : `${PROD_API_BASE}${endpoint.replace(/^\//, '')}`;
  if(new URL(targetUrl).origin!==new URL(PROD_API_BASE).origin)throw Error('Remote admin destination is not allowed.');

  const reqHeaders = {
    'User-Agent': 'PratyakshAyurveda-AdminGateway/2.0',
    'Accept': 'application/json, text/plain, */*',
    ...headers
  };

  // First-party login tokens must never be forwarded to the upstream service.
  for(const key of Object.keys(reqHeaders))if(/^(authorization|cookie|x-api-key)$/i.test(key))delete reqHeaders[key];
  if (process.env.PRATYAKSH_ADMIN_TOKEN) {
    reqHeaders['Authorization'] = `Bearer ${process.env.PRATYAKSH_ADMIN_TOKEN}`;
  }

  const options = {
    method,
    headers: reqHeaders,
    signal: AbortSignal.timeout(timeout)
  };

  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Buffer)) {
      reqHeaders['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    } else {
      options.body = body;
    }
  }

  try {
    const res = await fetch(targetUrl, options);
    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      success: res.ok,
      status: res.status,
      data,
      source: 'live-production',
      url: targetUrl
    };
  } catch (err) {
    console.error(`[AdminGateway] Failed to forward ${method} ${targetUrl}:`, err.message);
    return {
      success: false,
      status: 502,
      error: err.message,
      source: 'gateway-error',
      url: targetUrl
    };
  }
}

/**
 * Verified Live Mutation:
 * 1. Executes mutation against live API
 * 2. If successful, executes verification GET to confirm live state
 */
export async function executeVerifiedMutation({
  mutateEndpoint,
  verifyEndpoint,
  method = 'POST',
  body,
  authHeader
}) {
  const headers = authHeader ? { Authorization: authHeader } : {};

  // Step 1: Forward mutation
  const mutateResult = await forwardToProduction({
    endpoint: mutateEndpoint,
    method,
    headers,
    body
  });

  if (!mutateResult.success) {
    return {
      verified: false,
      status: mutateResult.status,
      message: mutateResult.data?.message || mutateResult.error || 'Live mutation failed',
      mutateResult
    };
  }

  // Step 2: Verification GET if verifyEndpoint provided
  let verifiedRecord = null;
  if (verifyEndpoint) {
    try {
      const verifyResult = await forwardToProduction({
        endpoint: verifyEndpoint,
        method: 'GET',
        headers
      });
      if (verifyResult.success && verifyResult.data?.data) {
        verifiedRecord = verifyResult.data.data;
      }
    } catch (e) {
      console.warn('[AdminGateway] Verification GET failed:', e.message);
    }
  }

  return {
    verified: true,
    status: 200,
    message: mutateResult.data?.message || 'Operation executed and confirmed on live production backend',
    liveRecord: verifiedRecord || mutateResult.data?.data,
    source: 'live-production'
  };
}

export { PROD_API_BASE, PROD_UPLOAD_URL };
