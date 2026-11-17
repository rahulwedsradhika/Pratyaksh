import crypto from 'node:crypto';
const resources={
 courses:{table:'courses',fields:'category_id category_name name detail img price discount_price rating student_count is_active',required:'name',inactive:true},
 categories:{table:'categories',fields:'name tab detail img is_active',required:'name',inactive:true},
 subjects:{table:'subjects',fields:'course_id name detail icon img is_active',required:'name',inactive:true},
 chapters:{table:'chapters',fields:'module_id subject_id course_id name description faculty img order_num is_active',required:'name',inactive:true},
 questions:{table:'questions',fields:'paper_id subject_name question_text question_eng option_a option_b option_c option_d correct_option explanation reference_samhita code q_type',required:'question_text'},
 'test-series':{table:'test_series',fields:'course_id name description img paper_count is_active',required:'name',inactive:true},
 faculty:{table:'faculty',fields:'name qualification specialization designation detail img',required:'name'}
};
const aliases={categoryID:'category_id',categoryName:'category_name',courseID:'course_id',subjectID:'subject_id',moduleID:'module_id',paperId:'paper_id',discountPrice:'discount_price',studentCount:'student_count',isActive:'is_active',question:'question_text',questionEng:'question_eng',subject:'subject_name',optionA:'option_a',optionB:'option_b',optionC:'option_c',optionD:'option_d',correctOption:'correct_option',reference:'reference_samhita'};
export function curriculumInput(resource,body,creating){
 const spec=resources[resource];if(!spec||!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid content payload.');
 const allowed=new Set(spec.fields.split(' ')),data={};
 for(const [raw,value]of Object.entries(body)){
  const key=aliases[raw]||raw;if(!allowed.has(key))continue;
  if(key==='is_active'){if(![0,1,true,false].includes(value))throw Error('Invalid publication state.');data[key]=Number(value);}
  else if(['price','discount_price','rating','student_count','order_num','paper_count'].includes(key)){const n=Number(value);if(!Number.isFinite(n)||n<0||n>10000000)throw Error('Invalid numeric content field.');data[key]=n;}
  else {const v=value&&typeof value==='object'&&key.endsWith('_id')?value._id||value.id:value;if(v!==null&&typeof v!=='string')throw Error('Invalid text content field.');if(v?.length>(key.endsWith('_id')?191:200000))throw Error('Content field is too long.');data[key]=key.endsWith('_id')&&v===''?null:v;}
 }
 if(creating&&!String(data[spec.required]||'').trim())throw Error('A content title/question is required.');
 if(creating&&resource==='questions'&&['option_a','option_b','option_c','option_d','correct_option'].some(key=>!String(data[key]||'').trim()))throw Error('All four options and a correct answer are required.');
 if(data.correct_option!==undefined&&!/^[A-D]$/i.test(data.correct_option||''))throw Error('Choose the correct answer A–D.');
 if(data.correct_option)data.correct_option=data.correct_option.toUpperCase();
 if(creating&&resource==='courses'){data.rating??=0;data.student_count??=0;}
 if(!Object.keys(data).length)throw Error('No supported content fields were supplied.');return {spec,data};
}
export function installCurriculumAdmin(router,db,auth,owner){
 router.post('/import-questions',auth,owner,async(req,res)=>{
  try{
   if(!Array.isArray(req.body.questions)||!req.body.questions.length||req.body.questions.length>500)throw Error('Import 1–500 questions per batch.');
   const rows=req.body.questions.map(item=>({id:typeof(item.id||item._id)==='string'&&(item.id||item._id).length<=191?item.id||item._id:crypto.randomUUID(),data:curriculumInput('questions',item,true).data}));
   const write=async()=>{for(const {id,data}of rows){const fields=Object.keys(data);await db.prepare(`INSERT INTO questions (id,${fields.join(',')}) VALUES (?,${fields.map(()=>'?').join(',')})`).run(id,...fields.map(key=>data[key]));}};
   if(db.withTransaction)await db.withTransaction(write);else{await db.exec('BEGIN');try{await write();await db.exec('COMMIT');}catch(error){await db.exec('ROLLBACK');throw error;}}
   return res.json({status:true,imported:rows.length,message:rows.length+' questions imported into the application database.'});
  }catch(error){return res.status(400).json({status:false,message:error.code?'Import rejected; duplicate identifiers or invalid references. No batch records were committed.':error.message});}
 });
 for(const [resource,spec]of Object.entries(resources)){
  const save=async(req,res)=>{try{
   const creating=req.method==='POST',{data}=curriculumInput(resource,req.body,creating);
   const id=creating?crypto.randomUUID():req.params.id;
   if(!creating&&!await db.prepare(`SELECT id FROM ${spec.table} WHERE id=?`).get(id))return res.status(404).json({status:false,message:'Content not found.'});
   if(req.body.dryRun===true||req.query?.dryRun==='true')return res.json({status:true,dryRun:true,message:'Payload validated; no database write performed.'});
   const fields=Object.keys(data);
   if(creating)await db.prepare(`INSERT INTO ${spec.table} (id,${fields.join(',')}) VALUES (?,${fields.map(()=>'?').join(',')})`).run(id,...fields.map(k=>data[k]));
   else await db.prepare(`UPDATE ${spec.table} SET ${fields.map(k=>k+'=?').join(',')} WHERE id=?`).run(...fields.map(k=>data[k]),id);
   const record=await db.prepare(`SELECT * FROM ${spec.table} WHERE id=?`).get(id);return res.json({status:true,verified:true,source:'application-database',data:{...record,_id:record.id},message:'Content saved in the application database.'});
  }catch(error){return res.status(400).json({status:false,message:error.code?'Content could not be saved; check references and required fields.':error.message});}};
  router.post('/'+resource,auth,owner,save);router.put('/'+resource+'/:id',auth,owner,save);
  router.delete('/'+resource+'/:id',auth,owner,async(req,res)=>{try{
   const result=spec.inactive?await db.prepare(`UPDATE ${spec.table} SET is_active=0 WHERE id=?`).run(req.params.id):await db.prepare(`DELETE FROM ${spec.table} WHERE id=?`).run(req.params.id);
   return res.status(result.changes?200:404).json({status:Boolean(result.changes),message:spec.inactive?'Content unpublished; records retained.':'Content deleted.'});
  }catch{return res.status(409).json({status:false,message:'Content is still referenced and cannot be deleted.'});}});
 }
}
