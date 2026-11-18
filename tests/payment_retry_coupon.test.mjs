import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {membershipQuote,reserveCoupon} from '../server/membershipPricing.js';
import {validateRetryCoupon,createRetryCheckoutOrder} from '../src/services/paymentRetryCheckout.js';

function fixture(t) {
  const db=new DatabaseSync(':memory:');t.after(()=>db.close());
  db.exec(`CREATE TABLE membership_plans(id TEXT PRIMARY KEY,price REAL,duration_months INTEGER,is_active INTEGER,is_public INTEGER);
    CREATE TABLE coupons(id TEXT PRIMARY KEY,code TEXT,discount_type TEXT,discount_value REAL,min_order_amount REAL,max_discount_amount REAL,valid_from TEXT,valid_until TEXT,usage_limit INTEGER,times_used INTEGER,is_active INTEGER,deleted_at TEXT);
    CREATE TABLE coupon_reservations(order_id TEXT PRIMARY KEY,coupon_id TEXT,state TEXT DEFAULT 'reserved',created_at TEXT);
    INSERT INTO membership_plans VALUES ('plan',1000,6,1,1),('other-plan',2000,12,1,1);
    INSERT INTO coupons VALUES ('coupon','SAVE10','percentage',10,0,NULL,'2020-01-01','2099-01-01',10,0,1,NULL);`);
  const requests=[];
  const request=async(url,options)=>{
    const body=JSON.parse(options.body);requests.push({url,body});
    try {
      if(url==='/api/coupons/validate') {
        const quote=await membershipQuote(db,body.planId,body.code);
        if(!quote.coupon)throw Error('Coupon required.');
        return Response.json({status:true,coupon:{code:quote.coupon.code,discountAmount:quote.discountAmount,finalAmount:quote.finalAmount}});
      }
      const quote=await reserveCoupon(db,body.planId,body.couponCode,'order-'+requests.length);
      return Response.json({status:true,orderId:'new-order',amountPaise:quote.amountPaise});
    }catch(error){return Response.json({status:false,error:error.message,message:error.message},{status:400});}
  };
  return {db,request,requests};
}

test('retry validates a coupon and submits its code while the server calculates the new total',async t=>{
  const {request,requests}=fixture(t);
  const coupon=await validateRetryCoupon({planId:'plan',code:' save10 '},request);
  assert.equal(coupon.finalAmount,900);assert.equal(coupon.discountAmount,100);
  const order=await createRetryCheckoutOrder({planId:'plan',couponCode:coupon.code,amount:1,discountAmount:999},request);
  assert.equal(order.amountPaise,90000);
  assert.deepEqual(requests[1].body,{planId:'plan',couponCode:'SAVE10'});
  const changedPlan=await createRetryCheckoutOrder({planId:'other-plan',couponCode:'SAVE10'},request);
  assert.equal(changedPlan.amountPaise,180000);
  const noCoupon=await createRetryCheckoutOrder({planId:'plan'},request);
  assert.equal(noCoupon.amountPaise,100000);
});

test('invalid or newly disabled coupons fail instead of silently charging the full price',async t=>{
  const {db,request}=fixture(t);
  await assert.rejects(()=>validateRetryCoupon({planId:'plan',code:'INVALID'},request),/invalid/i);
  await validateRetryCoupon({planId:'plan',code:'SAVE10'},request);
  db.exec('UPDATE coupons SET is_active=0');
  await assert.rejects(()=>createRetryCheckoutOrder({planId:'plan',couponCode:'SAVE10'},request),/invalid/i);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM coupon_reservations').get().n,0);
});
