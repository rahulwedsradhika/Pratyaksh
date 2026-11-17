/**
 * Public uploaded curriculum assets: live origin first, local disk fallback.
 * This is NOT a proxy for authenticated media, Bunny video streams, or arbitrary URLs.
 */
const UPLOAD_BASE = 'https://portal.pratyakshayurveda.in/upload/';
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']);
const MAX_ASSET_BYTES = 20 * 1024 * 1024;

export function createLiveUploadMiddleware({ fetchImpl = globalThis.fetch } = {}) {
  const mode = process.env.PRATYAKSH_CONTENT_MODE || (process.env.NODE_ENV === 'production' ? 'live-only' : 'live-first');
  return async function liveUpload(req, res, next) {
    if (req.method !== 'GET' || mode === 'local') return next();
    // Only publicly accessible content with simple path segments. Never proxy arbitrary hosts.
    const relative = req.path.replace(/^\/+/, '');
    if (!relative || relative.length > 250 || relative.split('/').some(x => x === '.' || x === '..') ||
        !/^[A-Za-z0-9_\-./%() ]+$/.test(relative)) {
      return res.status(400).json({ status: false, message: 'Invalid asset path' });
    }

    try {
      const filename = relative.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');
      const upstream = await fetchImpl(new URL(filename, UPLOAD_BASE), {
        method: 'GET',
        headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,application/pdf;q=0.9' },
        signal: AbortSignal.timeout(8000),
        redirect: 'error'
      });

      if (!upstream.ok) {
        if (upstream.status === 401 || upstream.status === 403) {
          return res.status(upstream.status).send('Media access requires authorization');
        }
        throw new Error('Origin asset returned ' + upstream.status);
      }

      const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const size = Number(upstream.headers.get('content-length') || 0);
      if (!TYPES.has(contentType) || (size && size > MAX_ASSET_BYTES)) {
        return res.status(415).send('Unsupported media type or size');
      }
      // Use a short browser cache; do not store protected content or write to ephemeral deployment disks.
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (buf.length > MAX_ASSET_BYTES) return res.status(413).send('Media is too large');
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Content-Source', 'production-live');
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(buf);
    } catch {
      if (mode === 'live-only') return res.status(503).send('Media temporarily unavailable');
      // Development fallback: preserve existing static assets when source is offline.
      res.setHeader('X-Content-Source', 'local-snapshot');
      res.setHeader('X-Content-Stale', 'true');
      return next();
    }
  };
}
