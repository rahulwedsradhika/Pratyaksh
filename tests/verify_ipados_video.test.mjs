import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAppleTouchDevice, isStandaloneWebApp, isSignedVideoUrl,
  getCompatibleBunnyEmbedUrl, getTrustedStandaloneBunnyUrl
} from '../src/utils/appleVideoCompatibility.js';

const original = 'https://iframe.mediadelivery.net/embed/330113/58d65542-883a-4fdb-971f-51bc7eea7581?autoplay=false';
const direct = 'https://player.mediadelivery.net/play/330113/58d65542-883a-4fdb-971f-51bc7eea7581';

test('detect iPadOS Safari, desktop-mode iPadOS, and installed Home Screen app', () => {
  assert.equal(isAppleTouchDevice({userAgent:'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'}),true);
  assert.equal(isAppleTouchDevice({platform:'MacIntel',maxTouchPoints:5}),true);
  assert.equal(isAppleTouchDevice({platform:'MacIntel',maxTouchPoints:0}),false);
  assert.equal(isStandaloneWebApp({standalone:true}),true);
  assert.equal(isStandaloneWebApp({}, ()=>({matches:true})),true);
});

test('disable autoplay and use inline Bunny player controls on iPad', () => {
  const out = new URL(getCompatibleBunnyEmbedUrl(original,{appleTouch:true}));
  assert.equal(out.searchParams.get('autoplay'),'false');
  assert.equal(out.searchParams.get('playsinline'),'true');
  assert.equal(out.hostname,'player.mediadelivery.net');
  assert.equal(out.searchParams.get('nativeHls'),'off');
  assert.equal(out.searchParams.get('preload'),'false');
  assert.equal(out.searchParams.get('rememberSettings'),'false');
});

test('desktop also uses explicit tap in embedded player', () => {
  const out = new URL(getCompatibleBunnyEmbedUrl(original,{appleTouch:false}));
  assert.equal(out.searchParams.get('autoplay'),'false');
  assert.equal(out.searchParams.get('playsinline'),'true');
  assert.equal(out.searchParams.has('nativeHls'),false);
  assert.equal(out.searchParams.has('rememberSettings'),false);
});

test('preserves signed video URLs byte for byte',()=>{
  const signed=original+'&token=abc%2Bdef&expires=1920000000';
  assert.equal(isSignedVideoUrl(signed),true);
  assert.equal(getCompatibleBunnyEmbedUrl(signed,{appleTouch:true}),signed);
  assert.equal(getCompatibleBunnyEmbedUrl(signed,{appleTouch:false}),signed);
});

test('only allows valid trusted direct play links',()=>{
  assert.equal(getTrustedStandaloneBunnyUrl(direct),direct);
  assert.equal(getTrustedStandaloneBunnyUrl('https://example.com/test','58d65542-883a-4fdb-971f-51bc7eea7581'),direct);
  assert.equal(getTrustedStandaloneBunnyUrl('javascript:alert(1)'), '');
  assert.equal(getTrustedStandaloneBunnyUrl('https://player.mediadelivery.net.evil.example/play/330113/58d65542-883a-4fdb-971f-51bc7eea7581'),'');
  assert.equal(getTrustedStandaloneBunnyUrl('https://player.mediadelivery.net/play/111/58d65542-883a-4fdb-971f-51bc7eea7581'),'');
});


test('Apple embeds match the Safari-verified player URL without losing lecture parameters',()=>{
  const source='https://iframe.mediadelivery.net/embed/330113/a332cfc3-37f5-4e1b-a558-5d7c14ad167f?autoplay=false';
  assert.equal(getCompatibleBunnyEmbedUrl(source,{appleTouch:true}),'https://player.mediadelivery.net/embed/330113/a332cfc3-37f5-4e1b-a558-5d7c14ad167f?autoplay=false&playsinline=true&nativeHls=off&preload=false&rememberSettings=false');
  const existing=new URL(getCompatibleBunnyEmbedUrl(source+'&t=120&captions=en&nativeHls=safari',{appleTouch:true}));
  assert.equal(existing.searchParams.get('t'),'120');assert.equal(existing.searchParams.get('captions'),'en');assert.equal(existing.searchParams.get('nativeHls'),'off');
});
