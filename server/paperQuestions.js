export function snapshotQuestion(question,paperId) {
 const text=value=>typeof value==='string'?value:value?.hindi||value?.eng||'';
 const raw=question.correctOpt??question.correctOption,letter=/^[1-4]$/.test(String(raw))?['A','B','C','D'][Number(raw)-1]:String(raw||'').toUpperCase();
 const explanation=typeof question.solution?.data==='string'?question.solution.data:'';
 return {id:question._id||question.id||'',paper_id:paperId,subject_name:Array.isArray(question.subjectTag)?question.subjectTag[0]||'Ayurveda':question.subject||'Ayurveda',question_text:text(question.question),question_eng:typeof question.question==='object'?question.question.eng||'':'',option_a:text(question.opt1),option_b:text(question.opt2),option_c:text(question.opt3),option_d:text(question.opt4),correct_option:letter,correct_opt_num:/^[1-4]$/.test(String(raw))?Number(raw):null,explanation,reference_samhita:explanation};
}
export async function paperQuestions(db,paperId) {
 const rows=await db.prepare('SELECT q.*,a.question_snapshot FROM test_paper_questions a JOIN questions q ON q.id=a.question_id WHERE a.paper_id=? ORDER BY a.position').all(paperId);
 return rows.map(({question_snapshot,...question})=>question_snapshot?JSON.parse(question_snapshot):{...question,paper_id:paperId});
}
