import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createCourseDetailHandler,subjectArtworkPath} from '../server/subjectCatalog.js';
import {subjectImageSource} from '../src/services/subjectArtwork.js';
import artwork from '../server/data/subjectArtwork.json' with {type:'json'};
import fs from 'node:fs';
import crypto from 'node:crypto';

test('public course-details fallback preserves each subjects own artwork and existing course fields', async t => {
  const subjects = [
    {id:'purva',course_id:'course1',name:'Charaka Samhita (Purvardha)',img:'upload/purva.png'},
    {id:'uttara',course_id:'course1',name:'Charaka Samhita (Uttarardha)',img:'/upload/uttara.png'},
    {id:'sushruta',course_id:'course1',name:'Sushruta Samhita',img:'upload/sushruta.png'},
    {id:'general',course_id:'course1',name:'General Studies',img:null}
  ];
  const course={id:'course1',name:'Course',price:100,discount_price:90,category_id:'cat1',student_count:12};
  const db={prepare(sql){return {async get(id){return id==='course1'?course:null;},async all(id){assert.equal(id,'course1');assert.match(sql,/is_active=1/);return subjects;}};}};
  const app=express();app.get(['/api/course/:id','/api/course/allData/:id'],createCourseDetailHandler(db));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin='http://127.0.0.1:'+server.address().port;
  for(const route of ['/api/course/course1','/api/course/allData/course1']){
    const response=await fetch(origin+route),body=await response.json();
    assert.equal(response.status,200);assert.equal(body.data.price,100);assert.equal(body.data.studentCount,12);
    assert.deepEqual(body.data.subjects.map(s=>s.img),['upload/purva.png','/upload/uttara.png','upload/sushruta.png','']);
    assert.deepEqual(body.data.subjects.map(s=>subjectImageSource(s.img)),['/upload/purva.png','/upload/uttara.png','/upload/sushruta.png','']);
  }
  const missing=await fetch(origin+'/api/course/missing');assert.equal(missing.status,404);
});

test('image paths remain same-origin without accidental protocol-relative URLs or unrelated banners',()=>{
  assert.equal(subjectImageSource(' /upload/Sushruta 1.jpg '),'/upload/Sushruta 1.jpg');
  assert.equal(subjectImageSource('upload/a.png'),'/upload/a.png');
  assert.equal(subjectImageSource('https://images.example.com/a.png'),'https://images.example.com/a.png');
  for(const value of [null,undefined,'','  ','//images.example.com/a.png','javascript:alert(1)'])assert.equal(subjectImageSource(value),'');
});

test('recovered subject banners use exact subject and course identity while retaining admin replacements',()=>{
  for(const [id,record]of Object.entries(artwork)){
    const subject={id,course_id:record.courseId,name:record.name,img:null};
    assert.equal(subjectArtworkPath(subject),record.assetPath);
    assert.equal(subjectArtworkPath({...subject,img:record.originalPath}),record.assetPath);
    assert.equal(subjectArtworkPath({...subject,img:'upload/admin-replacement.png'}),'upload/admin-replacement.png');
    assert.equal(subjectArtworkPath({...subject,course_id:'another-course'}),'');
    assert.equal(subjectArtworkPath({...subject,name:'Another subject'}),'');
  }
  assert.equal(subjectArtworkPath({id:'unknown',course_id:'course',name:'Unknown',img:null}),'');
});

test('every subject artwork mapping points to its bundled image with the verified content hash',()=>{
  assert.equal(Object.keys(artwork).length,83);
  for(const record of Object.values(artwork)){
    assert.match(record.assetPath,/^\/assets\/curriculum\/subject-[a-f\d]{24}\.(png|jpg|gif|webp|avif)$/);
    const data=fs.readFileSync('public'+record.assetPath);
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'),record.sha256);
    assert.ok(data.length>100);
  }
});
