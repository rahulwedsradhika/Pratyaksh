import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

// Render the actual component with isolated navigator fixtures; no browser,
// credentials, external requests, or authenticated routes are involved.
const compiled=await build({entryPoints:['src/components/VideoPlayer.jsx'],bundle:true,platform:'node',format:'cjs',write:false,external:['react','react-dom','lucide-react']});
const require=createRequire(import.meta.url);
function render(navigator,props={}) {
  const module={exports:{}};
  new Function('require','module','exports','navigator',compiled.outputFiles[0].text)(require,module,module.exports,navigator);
  return renderToStaticMarkup(React.createElement(module.exports.default,{bunnyId:'6a9fae50-0ff8-46e1-a13e-53df04f8349e',title:'Fixture lecture',noteId:'fixture-note',...props}));
}

test('iPhone and desktop-mode iPad render an explicit external play link and keep lecture notes',()=>{
  for(const navigator of [{userAgent:'iPhone',platform:'iPhone'},{userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:5}]){
    const html=render(navigator);
    assert.ok(!html.includes('<iframe'));assert.ok(html.includes('Play lecture in browser'));assert.ok(html.includes('target="_blank"'));assert.ok(html.includes('noopener noreferrer'));
    assert.ok(html.includes('/play/330113/6a9fae50-0ff8-46e1-a13e-53df04f8349e?autoplay=true'));assert.ok(html.includes('View'));assert.ok(html.includes('Download'));
  }
});

test('Android retains embedded playback and Apple signed links are preserved in the external action',()=>{
  assert.ok(render({userAgent:'Android',platform:'Linux',maxTouchPoints:5}).includes('<iframe'));
  const signed='https://iframe.mediadelivery.net/embed/330113/6a9fae50-0ff8-46e1-a13e-53df04f8349e?token=fixture%2Btoken&expires=1920000000';
  const html=render({userAgent:'iPad'},{secureEmbedUrl:signed});
  assert.ok(html.includes(signed.replaceAll('&','&amp;')));assert.ok(!html.includes('<iframe'));
});
