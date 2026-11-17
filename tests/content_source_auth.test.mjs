import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudentLiveMiddleware } from '../server/liveStudentContent.js';
import { createLivePaperHandlers } from '../server/liveTestPaper.js';

function response() {
  return { statusCode: 200, body: null, setHeader() {}, status(code) {this.statusCode = code;return this;}, json(body) {this.body = body;return this;} };
}

test('HTTP 200 access denial is never replaced by local notes or questions', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ status: false, message: 'Access denied. This content is only available in enrolled courses.' }), { status: 200 });
  const res = response();
  await createStudentLiveMiddleware({ fetchImpl })({ method: 'GET', path: '/api/notes/chapter/test' }, res, () => assert.fail('must not use local fallback'));
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, 'CONTENT_SOURCE_AUTH_REQUIRED');
  const paper = response();
  await createLivePaperHandlers({ fetchImpl }).getPaper({}, paper, { paperId: 'test', mode: 'practice' });
  assert.equal(paper.statusCode, 403);
  assert.equal(paper.body.code, 'CONTENT_SOURCE_AUTH_REQUIRED');
});

test('only the explicitly configured server credential is sent upstream', async () => {
  for (const sourceToken of [null, 'server-service-token']) {
    const fetchImpl = async (_url, options) => {
      assert.equal(options.headers.Authorization, sourceToken ? 'Bearer server-service-token' : undefined);
      assert.equal(options.headers.Cookie, undefined);
      assert.equal(options.redirect, 'error');
      return new Response(JSON.stringify({ status: true, data: [] }), { status: 200 });
    };
    const res = response();
    await createStudentLiveMiddleware({ fetchImpl, sourceToken })({ method: 'GET', path: '/api/video/chapter/test', headers: { authorization: 'Bearer local-admin-token', cookie: 'local-session' } }, res, () => assert.fail('unexpected fallback'));
    assert.equal(res.statusCode, 200);
  }
});
