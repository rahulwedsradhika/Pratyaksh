import {studentFetch} from './studentFetch.js';
import {readApiResponse} from './apiResponse.js';

export async function validateRetryCoupon({planId,code}, request=studentFetch) {
  const response=await request('/api/coupons/validate', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({planId,code:code.trim().toUpperCase()})
  });
  const result=await readApiResponse(response);
  if(!response.ok || !result.status || !result.coupon)throw Error(result.error || result.message || 'This coupon could not be applied.');
  return result.coupon;
}

export async function createRetryCheckoutOrder({planId,couponCode}, request=studentFetch) {
  // Send identifiers only. The server recalculates prices, coupon limits and totals.
  const response=await request('/api/payment/razorpay/create-order', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({planId,couponCode:couponCode || undefined})
  });
  const result=await readApiResponse(response);
  if(!response.ok || !result.status)throw Error(result.message || result.error || 'Unable to retry payment.');
  return result;
}
