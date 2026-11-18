import NoteActions from './NoteActions';
import React, { useEffect, useRef, useState } from 'react';
import {
  normalizeVideoSource,
  BUNNY_STREAM_LIBRARY_ID
} from '../utils/videoSourceNormalization';
import {
  isAppleTouchDevice,
  getAppleLectureLaunchUrl,
  getCompatibleBunnyEmbedUrl,
  getTrustedStandaloneBunnyUrl
} from '../utils/appleVideoCompatibility';
import { readBunnyPlayerEvent, canOpenVideoInBrowser } from '../utils/embeddedVideoHealth';

/**
 * Android and desktop use the embedded player. iPhone and iPad open the trusted
 * standalone provider player on an explicit tap, keeping notes in the classroom.
 */
export default function VideoPlayer({
  src = '',
  secureEmbedUrl = '',
  directPlayUrl = '',
  bunnyId = '',
  title = 'Ayurveda Lecture',
  lessonId = 'demo_lesson',
  notesUrl = '',
  noteId = '',
  noteTitle = 'Lecture notes',
  durationStr = '',
  faculty = '',
  onPlayback,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false
}) {
  const [reloadCount, setReloadCount] = useState(0);
  const iframeRef = useRef(null);
  const playbackRef = useRef(onPlayback);
  playbackRef.current = onPlayback;
  const lastActivityRef = useRef(0);
  const [playerStatus, setPlayerStatus] = useState('loading');
  const appleTouch = typeof navigator !== 'undefined' && isAppleTouchDevice(navigator);
  const normalized = normalizeVideoSource({
    secureEmbedUrl,
    directPlayUrl,
    src,
    bunnyId,
    libraryId: BUNNY_STREAM_LIBRARY_ID
  });
  const embeddedUrl = normalized.type === 'embed'
    ? getCompatibleBunnyEmbedUrl(normalized.url, { appleTouch })
    : '';
  const directPlayerUrl = getTrustedStandaloneBunnyUrl(normalized.directPlayUrl || directPlayUrl,
    normalized.bunnyId || bunnyId || '', BUNNY_STREAM_LIBRARY_ID);
  // The external-player action is always available when the current lecture
  // has a validated Bunny URL, independent of browser or player load status.
  const externalPlaybackUrl=appleTouch?getAppleLectureLaunchUrl({secureEmbedUrl,src,directPlayUrl,bunnyId:normalized.bunnyId||bunnyId,libraryId:BUNNY_STREAM_LIBRARY_ID}):'';
  const canOpenBrowser = canOpenVideoInBrowser(directPlayerUrl);

  useEffect(() => {
    setReloadCount(0);
    lastActivityRef.current = 0;
  }, [lessonId, embeddedUrl]);

  // Cross-origin iframe.onload does not indicate successful playback. Bunny's
  // player.js messaging provides ready/play/error events. A missing response
  // after the watchdog is an *unconfirmed load*, not a proven HTTP 403.
  useEffect(() => {
    setPlayerStatus('loading');
    if (normalized.type !== 'embed' || !embeddedUrl || !iframeRef.current ||
        typeof window === 'undefined') return undefined;

    const frame = iframeRef.current;
    let expectedOrigin;
    try { expectedOrigin = new URL(embeddedUrl).origin; }
    catch { setPlayerStatus('failed'); return undefined; }

    let active = true;
    function subscribe() {
      for (const eventName of ['play', 'timeupdate', 'error']) {
        frame.contentWindow?.postMessage(JSON.stringify({
          context: 'player.js', version: '0.0.11', method: 'addEventListener',
          value: eventName, listener: `lecture-${eventName}`
        }), expectedOrigin);
      }
    }
    subscribe();
    const watchdog = window.setTimeout(() => {
      if (active) setPlayerStatus(prev => prev === 'loading' ? 'timeout' : prev);
    }, 18000);

    function handleMessage(event) {
      const message = readBunnyPlayerEvent(event, frame.contentWindow, expectedOrigin);
      if (!message || !active) return;
      if (message.event === 'ready') subscribe();
      if (message.event === 'play' || message.event === 'timeupdate') {
        const now = Date.now();
        if (message.event === 'play' || now - lastActivityRef.current > 15000) {
          lastActivityRef.current = now;
          playbackRef.current?.(message.value?.seconds);
        }
      }
      if (['ready', 'getPaused', 'play', 'timeupdate', 'progress'].includes(message.event)) {
        window.clearTimeout(watchdog);
        setPlayerStatus('ready');
      } else if (message.event === 'error' && message.value?.code !== 2) {
        window.clearTimeout(watchdog);
        setPlayerStatus('failed');
      }
    }
    window.addEventListener('message', handleMessage);
    return () => {
      active = false;
      window.clearTimeout(watchdog);
      window.removeEventListener('message', handleMessage);
    };
  }, [lessonId, embeddedUrl, reloadCount, normalized.type]);

  function registerPlayerEvents(event) {
    // Request only documented diagnostics; never attempt remote playback or
    // alter Bunny authorization. Ignore failures on legacy unsupported players.
    const frame = event.currentTarget;
    let targetOrigin;
    try { targetOrigin = new URL(embeddedUrl).origin; }
    catch { return; }
    const frameWindow = frame.contentWindow;
    if (!frameWindow) return;
    for (const eventName of ['play', 'timeupdate', 'error']) {
      frameWindow.postMessage(JSON.stringify({
        context: 'player.js', version: '0.0.11', method: 'addEventListener', value: eventName,
        listener: `lecture-${eventName}`
      }), targetOrigin);
    }
    frameWindow.postMessage(JSON.stringify({
      context: 'player.js', version: '0.0.11', method: 'getPaused'
    }), targetOrigin);
  }

  function reloadPlayer() {
    setPlayerStatus('loading');
    setReloadCount(count => count + 1);
  }

  return (
    <div className="d-flex flex-column gap-3 w-100" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="position-relative rounded-3 overflow-hidden w-100 video-player-container"
        style={{ width: '100%', maxWidth: '100%', aspectRatio: '16/9', minHeight: externalPlaybackUrl?210:0, backgroundColor: '#0c0d10' }}>
        {externalPlaybackUrl ? (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 text-center" style={{color:'#f5f3ef',gap:12}}>
            <a href={externalPlaybackUrl} target="_blank" rel="noopener noreferrer" className="editorial-btn editorial-btn-primary" aria-label={'Play lecture in browser: '+title} onClick={()=>playbackRef.current?.()}>Play lecture in browser</a>
            <p style={{color:'#d0cac2',fontSize:14,margin:0,maxWidth:420}}>On iPhone and iPad, lectures open in the video provider’s player. Return here for your notes.</p>
          </div>
        ) : normalized.type === 'embed' && embeddedUrl ? (
          <iframe
            ref={iframeRef}
            key={lessonId + '-' + embeddedUrl + '-' + reloadCount}
            src={embeddedUrl}
            className="w-100 h-100 border-0 position-absolute top-0 start-0 active-lecture-iframe"
            style={{ width: '100%', height: '100%', display: 'block' }}
            title={title}
            loading="eager"
            onLoad={registerPlayerEvents}
            onError={() => setPlayerStatus('failed')}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; accelerometer; gyroscope"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        ) : normalized.type === 'native' && normalized.url ? (
          <video
            key={lessonId + '-' + normalized.url + '-' + reloadCount}
            src={normalized.url}
            controls
            playsInline
            onPlay={event => playbackRef.current?.(event.currentTarget.currentTime)}
            onTimeUpdate={event => {
              if (Date.now() - lastActivityRef.current > 15000) {
                lastActivityRef.current = Date.now();
                playbackRef.current?.(event.currentTarget.currentTime);
              }
            }}
            preload="metadata"
            className="w-100 h-100"
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
            onEnded={() => { if (onNext) onNext(); }}
          >
            Your browser does not support this lecture format.
          </video>
        ) : (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center"
            role="status" style={{ backgroundColor: '#17191b', color: '#f5f3ef' }}>
            <i className="fa-solid fa-video-slash fa-2x mb-2" aria-hidden="true" />
            <h3 className="h6 mb-2" style={{ color: '#f5f3ef' }}>No video available for this lecture</h3>
            <p className="small mb-0" style={{ color: '#d0cac2' }}>Please select another lecture or contact support.</p>
          </div>
        )}
      </div>

      {!externalPlaybackUrl && (normalized.type === 'embed' || normalized.type === 'native') && (
        <div className={`lecture-video-support ${playerStatus === 'failed' || playerStatus === 'timeout' ? 'lecture-video-support--warning' : ''}`}
          role={playerStatus === 'failed' || playerStatus === 'timeout' ? 'status' : undefined}>
          <div className="lecture-video-support__copy">
            <span>
              {playerStatus === 'failed' ? 'The embedded video reported a playback problem.' :
               playerStatus === 'timeout' ? 'The video has not confirmed that it loaded. You can retry it.' :
               'Tap Play inside the video player to watch your lecture here.'}
            </span>
          </div>
          <div className="lecture-video-support__actions">
            <button type="button"
              className="editorial-btn editorial-btn-secondary"
              aria-label={'Reload embedded video: ' + title}
              onClick={reloadPlayer}>
              <i className="fa-solid fa-rotate-right" aria-hidden="true" />
              Reload video
            </button>
            {canOpenBrowser && (
              <a className="editorial-btn editorial-btn-primary"
                href={directPlayerUrl} target="_blank" rel="noopener noreferrer"
                aria-label={'Open lecture in browser: ' + title}>
                <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                Open Video in Browser
              </a>
            )}
          </div>
        </div>
      )}

      {/* Clean Lecture Metadata Card: Only Title, Faculty, Duration & Actions */}
      <div 
        className="editorial-card p-3 p-md-4 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Metadata Badges: Faculty and Duration */}
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            {faculty && (
              <span className="editorial-badge" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-user-doctor me-1" style={{ color: 'var(--brand-terracotta, #D97706)' }}></i>
                {faculty}
              </span>
            )}
            {durationStr && (
              <span className="editorial-badge" style={{ fontSize: '0.82rem' }}>
                <i className="fa-regular fa-clock me-1"></i>
                {durationStr}
              </span>
            )}
          </div>

          {/* Lecture Title */}
          <h2 className="fw-bold mb-0" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
            {title}
          </h2>
        </div>

        {/* Action Controls: PDF Notes and Navigation */}
        <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap">
          {noteId && <NoteActions noteId={noteId} title={noteTitle} />}

          {hasPrev && (
            <button 
              onClick={onPrev} 
              className="editorial-btn editorial-btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.55rem 0.9rem' }}
              title="Previous Lesson"
            >
              <i className="fa-solid fa-chevron-left"></i> Previous
            </button>
          )}

          {hasNext && (
            <button 
              onClick={onNext} 
              className="editorial-btn editorial-btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
              title="Next Lesson"
            >
              Next Lesson <i className="fa-solid fa-chevron-right ms-1"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
