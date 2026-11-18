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

test('iPhone and iPad open the correct lecture through an explicit no-referrer browser link',()=>{
  for(const navigator of [{userAgent:'iPhone',platform:'iPhone'},{userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:5}]){
    const html=render(navigator);
    const url='https://iframe.mediadelivery.net/embed/330113/6a9fae50-0ff8-46e1-a13e-53df04f8349e?autoplay=false&amp;playsinline=true';
    assert.ok(!html.includes('<iframe'));
    assert.ok(html.includes('Play lecture in browser'));
    assert.ok(html.includes(`href="${url}"`));
    assert.ok(html.match(/<a[^>]+rel="noopener noreferrer"[^>]+referrerPolicy="no-referrer"/));
    assert.ok(html.includes('View'));assert.ok(html.includes('Download'));
  }
});

test('signed Apple browser URLs preserve authorization byte for byte',()=>{
  const signed='https://iframe.mediadelivery.net/embed/330113/6a9fae50-0ff8-46e1-a13e-53df04f8349e?token=fixture%2Btoken&expires=1920000000';
  const html=render({userAgent:'iPad'},{secureEmbedUrl:signed});
  const escaped=signed.replaceAll('&','&amp;');
  assert.ok(!html.includes('<iframe'));assert.ok(html.includes(`href="${escaped}"`));
});

test('each lecture uses its own ID rather than the example lecture',()=>{
  const id='093dd15c-bf4e-4ce0-9e29-63369b2a31d4';
  const html=render({userAgent:'iPhone'},{bunnyId:id});
  assert.ok(html.includes(`/embed/330113/${id}?autoplay=false&amp;playsinline=true`));
  assert.ok(!html.includes('6a9fae50-0ff8-46e1-a13e-53df04f8349e'));
});

test('Android and desktop retain inline playback with no referrer',()=>{
  for(const navigator of [{userAgent:'Android',platform:'Linux'},{userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:0}]) {
    const html=render(navigator);
    assert.ok(html.match(/<iframe[^>]+referrerPolicy="no-referrer"/));
    assert.ok(html.includes('src="https://iframe.mediadelivery.net/embed/330113/6a9fae50-0ff8-46e1-a13e-53df04f8349e?autoplay=false&amp;playsinline=true"'));
    assert.ok(!html.includes('Play lecture in browser'));
    assert.ok(html.includes('View'));assert.ok(html.includes('Download'));
  }
});
