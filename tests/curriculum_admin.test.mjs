import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {curriculumInput,installCurriculumAdmin} from '../server/curriculumAdmin.js';import {requirePricingAdmin} from '../server/membershipPricing.js';
test('curriculum input maps existing forms without accepting protected fields or invalid values',()=>{
 const {data}=curriculumInput('courses',{name:'LOCAL FIXTURE',categoryID:'category',discountPrice:50,isActive:true,password_hash:'bad',role:'super_admin'},true);
 assert.equal(data.category_id,'category');assert.equal(data.discount_price,50);assert.equal(data.is_active,1);assert.equal(data.password_hash,undefined);assert.equal(data.role,undefined);
 assert.throws(()=>curriculumInput('courses',{name:'x',price:-1},true));assert.throws(()=>curriculumInput('questions',{question:'x',correctOption:'Z'},true));
});
test('local curriculum writes require a verified superadmin and unpublishing preserves the record',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE courses(id TEXT PRIMARY KEY,name TEXT,rating REAL,student_count INTEGER,is_active INTEGER DEFAULT 1);CREATE TABLE questions(id TEXT PRIMARY KEY,question_text TEXT,option_a TEXT,option_b TEXT,option_c TEXT,option_d TEXT,correct_option TEXT)');
 const routes=new Map(),router={};for(const method of ['post','put','delete'])router[method]=(url,...handlers)=>routes.set(method+' '+url,handlers);
 installCurriculumAdmin(router,db,(req,res,next)=>req.admin?next():res.status(401).json({status:false}),requirePricingAdmin);
 const call=(key,req)=>new Promise((resolve,reject)=>{const res={code:200,status(n){this.code=n;return this;},json(data){this.body=data;resolve(this);return this;}};let i=0;const next=()=>{Promise.resolve(routes.get(key)[i++]?.(req,res,next)).catch(reject);};next();});
 try{
  assert.equal((await call('post /courses',{method:'POST',body:{name:'LOCAL FIXTURE'},query:{}})).code,401);
  assert.equal((await call('post /courses',{method:'POST',body:{name:'LOCAL FIXTURE'},query:{},admin:{role:'support_staff'}})).code,403);
  const admin={role:'super_admin'},created=await call('post /courses',{method:'POST',body:{name:'LOCAL FIXTURE'},query:{},admin});assert.equal(created.body.status,true);
  assert.equal((await call('delete /courses/:id',{params:{id:created.body.data.id},admin})).body.status,true);
  assert.equal(db.prepare('SELECT is_active FROM courses').get().is_active,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM courses').get().n,1);
  const question={id:'duplicate',question:'LOCAL FIXTURE',optionA:'A',optionB:'B',optionC:'C',optionD:'D',correctOption:'A'};
  const bulk=await call('post /import-questions',{body:{questions:[question,question]},admin});assert.equal(bulk.code,400);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM questions').get().n,0);
 }finally{db.close();}
});
