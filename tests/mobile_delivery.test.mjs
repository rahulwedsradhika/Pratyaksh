import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPortalStyleLoader,needsPortalStyles,portalStyles} from '../src/services/portalStyles.js';

test('public routes never fetch portal CSS; classroom navigation loads it once and returns to public styling',async()=>{
  const links=[];const marker={before(link){links.push(link);queueMicrotask(()=>link.onload());}};
  const doc={createElement(){return {};},querySelector(){return marker;}};
  const load=createPortalStyleLoader(doc);
  for(const pathname of ['/','/login','/onboarding','/pricing','/forgot-password']){assert.equal(needsPortalStyles(pathname),false);await load(pathname);}
  assert.equal(links.length,0);
  await load('/app');assert.equal(links.length,portalStyles.length);
  await load('/lesson/123');assert.equal(links.length,portalStyles.length);assert.ok(links.every(link=>link.media==='all'));
  await load('/login');assert.ok(links.every(link=>link.media==='not all'));
  await load('/admin/students');assert.ok(links.every(link=>link.media==='all'));assert.equal(links.length,portalStyles.length);
});

test('mobile headline and responsive illustrations are local, compressed assets with font licenses',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.ok(!html.includes('fonts.googleapis.com'));assert.ok(!html.includes('cdnjs.cloudflare.com'));
  assert.ok(!html.includes('/assets/css/style.css'));
  const font=fs.readFileSync('public/assets/fonts/hero-devanagari.woff2');assert.equal(font.subarray(0,4).toString(),'wOF2');assert.ok(font.length<32000);
  for(const name of ['inter','noto-serif-devanagari','noto-sans-devanagari'])assert.ok(fs.readFileSync('public/assets/fonts/'+name+'-LICENSE.txt','utf8').includes('SIL OPEN FONT LICENSE'));
  for(const name of ['scholar-student-320','doctor-laptop-320']){const image=fs.readFileSync('public/assets/home/'+name+'.webp');assert.equal(image.subarray(0,4).toString(),'RIFF');assert.equal(image.subarray(8,12).toString(),'WEBP');assert.ok(image.length<30000);}
});
