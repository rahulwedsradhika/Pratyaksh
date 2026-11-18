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

export function getCompatibleBunnyEmbedUrl(url, { appleTouch = false } = {}) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' ||
        !['iframe.mediadelivery.net', 'player.mediadelivery.net'].includes(parsed.hostname.toLowerCase()) ||
        !/^\/embed\/\d+\/[0-9a-fA-F-]{16,}$/.test(parsed.pathname)) {
      return url;
    }
    // Signed embed URLs must remain intact. Appending parameters can invalidate
    // the provider signature or authorization rules.
    if (isSignedVideoUrl(url)) return url;

    // Mount the actual provider player from the beginning. Playback starts
    // only when the learner taps the Play control INSIDE the iframe, which is
    // compatible with iPadOS gesture requirements and other browsers.
    parsed.searchParams.set('autoplay', 'false');
    parsed.searchParams.set('playsinline', 'true');
    if (appleTouch) {
      // Match the provider URL verified in Safari. Forcing native HLS in a
      // nested WebKit iframe can select a different path than the working player.
      parsed.hostname = 'player.mediadelivery.net';
      parsed.searchParams.set('nativeHls', 'off');
      parsed.searchParams.set('preload', 'false');
      // WebKit partitions/restricts third-party storage. Playback must not
      // depend on preferences saved inside the cross-origin player frame.
      parsed.searchParams.set('rememberSettings', 'false');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getTrustedStandaloneBunnyUrl(candidate, bunnyId = '', libraryId = '330113') {
  const sources = [candidate];
  if (UUID.test(bunnyId)) {
    sources.push('https://player.mediadelivery.net/play/' + libraryId + '/' + bunnyId);
  }
  for (const source of sources) {
    if (typeof source !== 'string' || !source.trim()) continue;
    try {
      const url = new URL(source.trim());
      if (url.protocol !== 'https:' || url.username || url.password || url.hostname !== 'player.mediadelivery.net') continue;
      const match = url.pathname.match(/^\/play\/(\d+)\/([0-9a-fA-F-]{16,})\/?$/);
      if (!match || match[1] !== String(libraryId) || !UUID.test(match[2])) continue;
      return url.href;
    } catch {
      // Ignore invalid or untrusted destination.
    }
  }
  return '';
}


// Open the same official top-level player verified by the student in Safari.
// Signed provider URLs retain every byte; never manufacture or strip tokens.
export function getAppleLectureLaunchUrl({secureEmbedUrl='',src='',directPlayUrl='',bunnyId='',libraryId='330113'}={}) {
  let identifiedId=UUID.test(bunnyId)?bunnyId:'';
  for(const candidate of [secureEmbedUrl,src,directPlayUrl]) {
    if(typeof candidate!=='string'||!candidate)continue;
    try {
      const url=new URL(candidate);
      const match=url.pathname.match(/^\/(embed|play)\/(\d+)\/([0-9a-fA-F-]+)\/?$/);
      if(url.protocol!=='https:'||url.username||url.password||!['iframe.mediadelivery.net','player.mediadelivery.net'].includes(url.hostname)||!match||match[2]!==String(libraryId)||!UUID.test(match[3]))continue;
      if(isSignedVideoUrl(candidate))return candidate;
      if(!identifiedId)identifiedId=match[3];
    } catch {}
  }
  if(!identifiedId)return '';
  const direct=getTrustedStandaloneBunnyUrl(directPlayUrl,identifiedId,libraryId);
  if(!direct)return '';
  const url=new URL(direct);
  url.searchParams.set('autoplay','true');
  url.searchParams.set('playsinline','true');
  url.searchParams.set('nativeHls','off');
  url.searchParams.set('rememberSettings','false');
  return url.href;
}
