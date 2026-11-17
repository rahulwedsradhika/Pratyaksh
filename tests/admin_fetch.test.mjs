import test from 'node:test';import assert from 'node:assert/strict';import {adminFetch} from '../src/services/adminFetch.js';
test('legacy admin requests carry their session only to same-origin first-party APIs',async()=>{
 const originalWindow=globalThis.window,originalStorage=globalThis.localStorage,calls=[];
 globalThis.window={location:{href:'https://study.example.invalid/admin',origin:'https://study.example.invalid'},fetch:async(input,options)=>{calls.push(options);return {ok:true};}};
 globalThis.localStorage={getItem:()=> 'isolated-fixture-token'};
 try{await adminFetch('/api/admin/courses');assert.equal(calls[0].headers.get('Authorization'),'Bearer isolated-fixture-token');await adminFetch('https://other.example.invalid/api/admin');assert.equal(calls[1].headers.has('Authorization'),false);}finally{globalThis.window=originalWindow;globalThis.localStorage=originalStorage;}
});
