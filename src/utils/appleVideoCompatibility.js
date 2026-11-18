/**
 * Cross-browser Bunny Stream playback configuration.
 * iPadOS, including Safari Add to Home Screen, can block autoplay inside
 * newly mounted, cross-origin frames. Use an explicit tap in the Bunny player.
 * Do not modify signed URLs.
 */
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const AUTH_KEYS = new Set(['token', 'expires', 'signature', 'token_path', 'securitytoken']);

export function isAppleTouchDevice(navigatorLike = {}) {
  const ua = navigatorLike.userAgent || '';
  const platform = navigatorLike.platform || '';
  return /iPad|iPhone|iPod/i.test(ua + ' ' + platform) ||
    (/Mac/i.test(platform + ' ' + ua) && Number(navigatorLike.maxTouchPoints || 0) > 1);
}

export function isStandaloneWebApp(navigatorLike = {}, matchMediaFn) {
  if (navigatorLike.standalone === true) return true;
  try {
    return typeof matchMediaFn === 'function' &&
      !!matchMediaFn('(display-mode: standalone)')?.matches;
  } catch {
    return false;
  }
}

export function isSignedVideoUrl(url) {
  try {
    const parsed = new URL(url);
    return [...parsed.searchParams.keys()].some(key => AUTH_KEYS.has(key.toLowerCase()));
  } catch {
    return false;
  }
}

// Validate provider destinations before using them for embeds or browser links.
function parseBunnyUrl(candidate, libraryId) {
  if (typeof candidate !== 'string' || !candidate) return null;
  try {
    const url = new URL(candidate);
    const match = url.pathname.match(/^\/(embed|play)\/(\d+)\/([0-9a-fA-F-]+)\/?$/);
    if (url.protocol !== 'https:' || url.username || url.password ||
        !['iframe.mediadelivery.net', 'player.mediadelivery.net'].includes(url.hostname) ||
        !match || !UUID.test(match[3]) || (libraryId && match[2] !== String(libraryId))) return null;
    return {url, libraryId: match[2], videoId: match[3]};
  } catch { return null; }
}

function legacyEmbedUrl(libraryId, videoId) {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&playsinline=true`;
}

export function getCompatibleBunnyEmbedUrl(candidate) {
  const parsed = parseBunnyUrl(candidate);
  if (!parsed || parsed.url.pathname.startsWith('/play/')) return candidate || '';
  // Never rewrite a signed URL: its host, path and parameters may be authenticated.
  if (isSignedVideoUrl(candidate)) return candidate;
  parsed.url.hostname = 'iframe.mediadelivery.net';
  parsed.url.searchParams.set('autoplay', 'false');
  parsed.url.searchParams.set('playsinline', 'true');
  return parsed.url.href;
}

export function getTrustedStandaloneBunnyUrl(candidate, bunnyId = '', libraryId = '330113') {
  const parsed = parseBunnyUrl(candidate, libraryId);
  if (parsed) {
    if (isSignedVideoUrl(candidate)) return candidate;
    return legacyEmbedUrl(parsed.libraryId, parsed.videoId);
  }
  return UUID.test(bunnyId) && /^\d+$/.test(String(libraryId)) ? legacyEmbedUrl(libraryId, bunnyId) : '';
}

// Shared by embedded and external playback; each lecture retains its own ID.
export function getAppleLectureLaunchUrl({secureEmbedUrl='',src='',directPlayUrl='',bunnyId='',libraryId='330113'}={}) {
  for (const candidate of [secureEmbedUrl, src, directPlayUrl]) {
    if (parseBunnyUrl(candidate, libraryId)) return getTrustedStandaloneBunnyUrl(candidate, '', libraryId);
  }
  return getTrustedStandaloneBunnyUrl('', bunnyId, libraryId);
}
