import test from 'node:test';import assert from 'node:assert/strict';import {publicPdfRequest,protectPrivateDocuments} from '../server/publicAssetAccess.js';
test('PDFs cannot bypass classroom authorization through static aliases',()=>{
 for(const pathname of ['/upload/notes.pdf','/assets/upload/notes.PDF','/upload/notes%2Epdf'])assert.equal(publicPdfRequest(pathname),true);
 for(const pathname of ['/api/student/notes/id/file','/upload/banner.jpg','/assets/website-assets/logo.svg'])assert.equal(publicPdfRequest(pathname),false);
 let status;protectPrivateDocuments({path:'/upload/notes.pdf'},{status(code){status=code;return this;},json(){}},()=>assert.fail('Private PDF reached static serving'));assert.equal(status,403);
});
