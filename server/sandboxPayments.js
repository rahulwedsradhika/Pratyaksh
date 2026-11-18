import {assertCapturedPayment} from './paymentValidation.js';

export function isProductionSandbox(mode,env=process.env) {
  return (env.APP_ENV||env.NODE_ENV||'development').toLowerCase()==='production' && mode==='test';
}

export function isSandboxOrder(order) {
  try{return order.provider==='razorpay' && /^order_/.test(order.razorpay_order_id||'') && JSON.parse(order.metadata||'{}').gatewayMode==='test';}catch{return false;}
}

// The caller verifies the checkout/webhook signature. Never activates membership.
export async function recordSandboxPayment(db,order,payment,signature=null) {
  if(!isSandboxOrder(order))throw Error('Only Test-mode orders can be recorded as sandbox payments.');
  assertCapturedPayment(order,payment);
  const save=async()=>{
    await db.prepare(`UPDATE payment_orders SET status='sandbox_verified',provider_payment_id=?,razorpay_payment_id=?,
      provider_signature=COALESCE(?,provider_signature),razorpay_signature=COALESCE(?,razorpay_signature),
      reconciliation_status='sandbox_verified',updated_at=? WHERE id=? AND student_id=?`).run(payment.id,payment.id,signature,signature,new Date().toISOString(),order.id,order.student_id);
    await db.prepare("UPDATE coupon_reservations SET state='released' WHERE order_id=? AND state='reserved'").run(order.id);
  };
  if(db.withTransaction)await db.withTransaction(save);else await save();
  return {status:true,sandbox:true,orderId:order.id,membership:null,message:'Test payment verified. No real money was charged and no live membership was activated. You can test checkout again.'};
}
