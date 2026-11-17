/**
 * Embedded Bunny playback diagnostics.
 *
 * A cross-origin iframe's onLoad fires for error pages as well as real players.
 * Use Bunny's documented player.js events to distinguish initialization from
 * failures, and show a Safari-only recovery link when the player never responds.
 *
 * We intentionally do not inspect iframe DOM, change referrers or bypass any
 * provider access controls.
 */
const OTHER_BROWSERS = /(?:Chrome|Chromium|CriOS|FxiOS|Firefox|Edg|EdgiOS|OPR|OPiOS|DuckDuckGo|DuckDuckGoBrowser|SamsungBrowser|GSA|FBAV|Instagram)/i;

export function isSafariPlaybackClient(navigatorLike = {}) {
  const ua = String(navigatorLike.userAgent || '');
  const isAppleTouch = /iPad|iPhone|iPod/i.test(ua) ||
    (/Mac/i.test(String(navigatorLike.platform || '')) && Number(navigatorLike.maxTouchPoints || 0) > 1);
  // A Home Screen app is powered by Safari/WebKit even though the usual
  // Safari token may be absent. Exclude in-app and alternate browsers.
  if (OTHER_BROWSERS.test(ua)) return false;
  if (isAppleTouch && navigatorLike.standalone === true) return true;
  return /Safari\//i.test(ua) && /(?:Version\/|Mobile\/|Macintosh|iPad|iPhone)/i.test(ua);
}

export function readBunnyPlayerEvent(messageEvent, expectedWindow, expectedOrigin) {
  if (!messageEvent || !expectedWindow || messageEvent.source !== expectedWindow ||
      messageEvent.origin !== expectedOrigin) return null;
  let data = messageEvent.data;
  if (typeof data === 'string') {
    if (data.length > 20_000) return null;
    try { data = JSON.parse(data); } catch { return null; }
  }
  if (!data || typeof data !== 'object' || data.context !== 'player.js' ||
      typeof data.event !== 'string') return null;
  return {
    event: data.event,
    value: data.value
  };
}

export function shouldShowSafariRecovery({ isSafari, status, directUrl }) {
  return Boolean(isSafari && directUrl && (status === 'failed' || status === 'timeout'));
}

/** Show the official player link on every browser when the URL is trusted.
 * Callers must validate the provider destination before passing it here.
 */
export function canOpenVideoInBrowser(validatedDirectUrl) {
  return typeof validatedDirectUrl === 'string' && validatedDirectUrl.length > 0;
}
