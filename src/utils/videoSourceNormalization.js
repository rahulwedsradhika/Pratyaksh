/**
 * Video Source Normalization and Origin Authorization Utility
 * Pratyaksh Ayurveda 2.0 Video Streaming Security
 * 
 * Target CDN: Bunny.net Stream (Library 330113)
 * Primary Hostname: iframe.mediadelivery.net
 */

export const ALLOWED_STREAM_HOSTNAMES = [
  'iframe.mediadelivery.net',
  'player.mediadelivery.net'
];

export const BUNNY_STREAM_LIBRARY_ID = '330113';

const getBaseOrigin = () => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
};

/**
 * Returns official standalone Bunny Direct Play URL:
 * https://player.mediadelivery.net/play/{libraryId}/{videoId}
 */
export function getDirectPlayUrl(bunnyId, libraryId = BUNNY_STREAM_LIBRARY_ID) {
  if (!bunnyId || typeof bunnyId !== 'string') return '';
  const cleanId = bunnyId.trim();
  if (!/^[0-9a-fA-F-]{16,}$/.test(cleanId)) return '';
  return `https://player.mediadelivery.net/play/${libraryId}/${cleanId}`;
}

/**
 * Returns authenticated backend proxy thumbnail URL for a Bunny video
 */
export function getThumbnailUrl(bunnyId) {
  if (!bunnyId || typeof bunnyId !== 'string') return '';
  const cleanId = bunnyId.trim();
  if (!/^[0-9a-fA-F-]{16,}$/.test(cleanId)) return '';
  return `/api/video/thumbnail/${cleanId}`;
}

/**
 * Safely extracts Bunny UUID from embed, play, or CDN URL
 */
export function extractBunnyIdFromUrl(url = '') {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/\/(?:embed|play)\/\d+\/([0-9a-fA-F-]+)/i) ||
                url.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
  return match ? match[1] : '';
}

/**
 * Normalizes video sources according to strict provider security and authorization hierarchy:
 * 1. Verified backend-supplied secureEmbedUrl (with signed tokens/query intact)
 * 2. Explicitly supplied provider embed src (with tokens/query intact)
 * 3. Documented Bunny Stream embed URL from authentic bunnyId
 * 4. Native HTML5 media fallback for direct media files (.mp4/.webm)
 * 
 * Always provides official Bunny Direct Play URL and thumbnail URL when bunnyId is identified.
 */
export function normalizeVideoSource({
  secureEmbedUrl = '',
  directPlayUrl = '',
  src = '',
  bunnyId = '',
  libraryId = BUNNY_STREAM_LIBRARY_ID
} = {}) {
  const baseOrigin = getBaseOrigin();
  const effectiveId = (bunnyId || extractBunnyIdFromUrl(secureEmbedUrl) || extractBunnyIdFromUrl(src) || extractBunnyIdFromUrl(directPlayUrl) || '').trim();
  const resolvedDirectPlay = directPlayUrl && directPlayUrl.trim() 
    ? directPlayUrl.trim() 
    : (effectiveId ? getDirectPlayUrl(effectiveId, libraryId) : '');
  const resolvedThumbnail = effectiveId ? getThumbnailUrl(effectiveId) : '';

  // Priority 1: Backend-supplied secureEmbedUrl
  if (secureEmbedUrl && typeof secureEmbedUrl === 'string' && secureEmbedUrl.trim()) {
    try {
      const parsed = new URL(secureEmbedUrl, baseOrigin);
      if (ALLOWED_STREAM_HOSTNAMES.includes(parsed.hostname.toLowerCase())) {
        return {
          type: 'embed',
          url: secureEmbedUrl.trim(),
          directPlayUrl: resolvedDirectPlay,
          thumbnailUrl: resolvedThumbnail,
          isAuthorizedProvider: true,
          bunnyId: effectiveId
        };
      }
    } catch {
      // Continue
    }
  }

  // Priority 2: Direct src if it points to an approved stream provider
  if (src && typeof src === 'string' && src.trim()) {
    try {
      const parsed = new URL(src, baseOrigin);
      if (ALLOWED_STREAM_HOSTNAMES.includes(parsed.hostname.toLowerCase())) {
        return {
          type: 'embed',
          url: src.trim(),
          directPlayUrl: resolvedDirectPlay,
          thumbnailUrl: resolvedThumbnail,
          isAuthorizedProvider: true,
          bunnyId: effectiveId
        };
      }
      // If src is a direct media file (e.g. mp4, webm, hls)
      const pathname = parsed.pathname.toLowerCase();
      if (pathname.endsWith('.mp4') || pathname.endsWith('.webm') || pathname.endsWith('.m3u8')) {
        return {
          type: 'native',
          url: src.trim(),
          directPlayUrl: '',
          thumbnailUrl: resolvedThumbnail,
          isAuthorizedProvider: false,
          bunnyId: ''
        };
      }
    } catch {
      // Continue
    }
  }

  // Priority 3: Derive from verified authentic bunnyId
  if (effectiveId && /^[0-9a-fA-F-]{16,}$/.test(effectiveId)) {
    return {
      type: 'embed',
      url: `https://iframe.mediadelivery.net/embed/${libraryId}/${effectiveId}?autoplay=false`,
      directPlayUrl: resolvedDirectPlay,
      thumbnailUrl: resolvedThumbnail,
      isAuthorizedProvider: true,
      bunnyId: effectiveId
    };
  }

  // Fallback for non-empty generic src
  if (src && typeof src === 'string' && src.trim()) {
    return {
      type: 'native',
      url: src.trim(),
      directPlayUrl: '',
      thumbnailUrl: '',
      isAuthorizedProvider: false,
      bunnyId: ''
    };
  }

  return {
    type: 'empty',
    url: '',
    directPlayUrl: '',
    thumbnailUrl: '',
    isAuthorizedProvider: false,
    bunnyId: ''
  };
}

/**
 * Assesses whether the current client origin is authorized by Bunny Stream Library 330113
 * Allowed domains in Bunny Dashboard:
 * - localhost (and *.localhost)
 * - pratyakshayurveda.in (and *.pratyakshayurveda.in)
 * 
 * Disallowed origins:
 * - 127.0.0.1 (raw loopback IP)
 * - 10.x.x.x, 192.168.x.x, 172.16-31.x.x (LAN IP addresses)
 * - *.trycloudflare.com / *.trycloudflare.net (Preview tunnels unless added to dashboard)
 */
export function assessOriginAuthorization(hostname) {
  const currentHost = hostname !== undefined 
    ? hostname 
    : (typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost');
  const host = (currentHost || '').toLowerCase().trim();

  const isLocalhost = host === 'localhost' || host.endsWith('.localhost');
  const isProduction = host === 'pratyakshayurveda.in' || host.endsWith('.pratyakshayurveda.in');
  const isAuthorized = isLocalhost || isProduction;

  const isLoopbackIp = host === '127.0.0.1' || host === '::1';
  const isLanIp = /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
                  /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
                  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host);
  const isPreview = host.includes('trycloudflare.com') || host.includes('trycloudflare.net');

  let message = '';
  let suggestedAction = null;
  let recommendedOrigin = '';

  const port = (typeof window !== 'undefined' && window.location && window.location.port) 
    ? `:${window.location.port}` 
    : '';
  const protocol = (typeof window !== 'undefined' && window.location && window.location.protocol) 
    ? window.location.protocol 
    : 'http:';
  const path = (typeof window !== 'undefined' && window.location) 
    ? `${window.location.pathname || ''}${window.location.search || ''}${window.location.hash || ''}` 
    : '';

  if (isAuthorized) {
    message = 'Authorized origin. Bunny Stream CDN playback permitted.';
    suggestedAction = null;
  } else if (isLoopbackIp) {
    message = 'Bunny Stream CDN restricts video playback on raw IP addresses (127.0.0.1). Switch to localhost to view this lecture.';
    suggestedAction = 'switch_to_localhost';
    recommendedOrigin = `${protocol}//localhost${port}${path}`;
  } else if (isLanIp) {
    message = 'Video streaming is restricted on local network IP addresses by CDN access controls. Please view on localhost or configure domain allowlisting.';
    suggestedAction = 'lan_ip_warning';
    recommendedOrigin = `${protocol}//localhost${port}${path}`;
  } else if (isPreview) {
    message = 'Preview deployment domain is not yet authorized in Bunny Stream Library 330113 Allowed Domains. Access via localhost or the authorized portal.';
    suggestedAction = 'preview_domain_warning';
    recommendedOrigin = 'https://portal.pratyakshayurveda.in';
  } else {
    message = 'Video playback is restricted on this domain by CDN security policy.';
    suggestedAction = 'unauthorized_origin';
  }

  return {
    isAuthorized,
    isLocalhost,
    isProduction,
    isLoopbackIp,
    isLanIp,
    isPreview,
    hostname: host,
    message,
    suggestedAction,
    recommendedOrigin
  };
}

/**
 * Determines default player mode:
 * The embedded player must send its origin for Bunny domain authorization.
 * Domain allowlisting remains controlled by the video library; a referrer
 * policy cannot authorize a preview or LAN hostname on its own.
 */
export function determineDefaultPlayerMode(hostname) {
  return 'embedded';
}
