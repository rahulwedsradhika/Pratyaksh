import 'dotenv/config';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {getMysqlPool,closeMysqlPool} from '../../server/db_mysql.js';import {snapshotQuestion} from '../../server/paperQuestions.js';
const sourceIndex=process.argv.indexOf('--source');if(sourceIndex<0)throw Error('Use --source <private authorized paper snapshot directory>.');
if([process.env.APP_ENV,process.env.NODE_ENV].includes('production')&&!process.argv.includes('--allow-production-import'))throw Error('Production content import requires explicit approval.');
const directory=path.resolve(process.argv[sourceIndex+1]),pool=getMysqlPool(),connection=await pool.getConnection();
const fields=['question_text','question_eng','option_a','option_b','option_c','option_d','correct_option','explanation','reference_samhita'];
const canonical=row=>JSON.stringify(fields.map(k=>row[k]??''));
const report={papers:0,associations:0,insertedAssociations:0,newQuestions:0,variantSnapshots:0,emptySnapshots:0};
try{
 const [[lock]]=await connection.query("SELECT GET_LOCK('ayurvedasidhi_paper_import',10) AS acquired");if(!lock.acquired)throw Error('Another paper import is running.');
 for(const filename of fs.readdirSync(directory).filter(n=>/^paper_[a-f\d]{24}\.json$/i.test(n)).sort()){
  const source=JSON.parse(fs.readFileSync(path.join(directory,filename),'utf8')),paper=source?.data;
  const paperId=filename.slice(6,-5),questions=paper?.questionList;
  if(!Array.isArray(questions)||!questions.length){report.emptySnapshots++;continue;}
  if(paper._id&&paper._id!==paperId)throw Error('Snapshot paper identity mismatch.');
  const [[target]]=await connection.execute('SELECT id FROM test_papers WHERE id=?',[paperId]);if(!target)throw Error('Snapshot references a paper missing from the imported catalogue.');
  await connection.beginTransaction();
  try{
   for(let index=0;index<questions.length;index++){
    const row=snapshotQuestion(questions[index],paperId);if(!/^[\w-]{1,191}$/.test(row.id)||!row.question_text&&!row.question_eng||!/^[A-D]$/.test(row.correct_option))throw Error('Snapshot contains an invalid or ungraded question; import stopped.');
    let [[existing]]=await connection.execute('SELECT * FROM questions WHERE id=?',[row.id]);
    if(!existing){const columns=Object.keys(row);await connection.execute(`INSERT INTO questions (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,columns.map(k=>row[k]));existing=row;report.newQuestions++;}
    const variant=canonical(existing)!==canonical(row)?JSON.stringify(row):null;if(variant)report.variantSnapshots++;
    const [[link]]=await connection.execute('SELECT position,question_snapshot FROM test_paper_questions WHERE paper_id=? AND question_id=?',[paperId,row.id]);
    if(link){if(Number(link.position)!==index+1||link.question_snapshot!==variant)throw Error('An existing paper association differs; refusing to overwrite it.');}
    else {await connection.execute('INSERT INTO test_paper_questions(paper_id,question_id,position,question_snapshot) VALUES (?,?,?,?)',[paperId,row.id,index+1,variant]);report.insertedAssociations++;}
    report.associations++;
   }
   await connection.commit();report.papers++;
  }catch(error){await connection.rollback();throw error;}
 }
 const [[unlinked]]=await connection.query('SELECT COUNT(*) AS n FROM test_papers p WHERE NOT EXISTS(SELECT 1 FROM test_paper_questions a WHERE a.paper_id=p.id)');report.papersWithoutAssociations=Number(unlinked.n);
 fs.mkdirSync('database/import-output',{recursive:true});fs.writeFileSync('database/import-output/paper-associations.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){console.error('Paper import failed:',error.code||error.message);process.exitCode=1;}finally{await connection.query("SELECT RELEASE_LOCK('ayurvedasidhi_paper_import')").catch(()=>{});connection.release();await closeMysqlPool();}
