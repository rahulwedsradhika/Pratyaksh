export const latestPaymentOrderSql=`SELECT id,plan_id,amount,currency,status,created_at,updated_at FROM payment_orders
  WHERE student_id=? ORDER BY created_at DESC,id DESC LIMIT 1`;

export function createPaymentStatusHandler({db,authenticate,findActiveMembership,hasAdminAccess}) {
  return async(req,res)=>{
    const student=await authenticate(req);
    if(!student)return res.status(401).json({status:false,message:'Sign in to view your payment status.'});
    const membership=await findActiveMembership(student.email);
    const order=await db.prepare(latestPaymentOrderSql).get(student.id);
    res.set('Cache-Control','no-store');
    return res.json({status:true,hasActiveMembership:Boolean(membership)&&!student.is_suspended&&Boolean(student.email_verified),classroomAccess:await hasAdminAccess(student),suspended:Boolean(student.is_suspended),order:order||null,
      helplines:[{label:'Admissions & payment support',phone:'+918795776006',display:'+91 8795776006'}]});
  };
}
