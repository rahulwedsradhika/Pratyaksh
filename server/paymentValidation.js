import crypto from 'node:crypto';

export function assertCheckoutSignature(order, input, secret) {
  if (!order.razorpay_order_id || (input.razorpayOrderId && input.razorpayOrderId !== order.razorpay_order_id) ||
    typeof input.razorpayPaymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(input.razorpayPaymentId)) throw new Error('Payment does not match the stored order.');
  if (!secret || typeof input.razorpaySignature !== 'string' || !/^[a-f0-9]{64}$/i.test(input.razorpaySignature)) throw new Error('Invalid payment signature.');
  const expected = crypto.createHmac('sha256', secret).update(`${order.razorpay_order_id}|${input.razorpayPaymentId}`).digest();
  const actual = Buffer.from(input.razorpaySignature, 'hex');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw new Error('Cryptographic signature verification failed.');
}

export function assertCapturedPayment(order, payment) {
  if (!payment || typeof payment.id !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(payment.id) || payment.order_id !== order.razorpay_order_id) throw new Error('Gateway payment does not belong to this order.');
  if (payment.status !== 'captured' || payment.captured !== true) throw new Error('Payment is not captured yet. Check your payment status before paying again.');
  if (payment.amount !== Math.round(Number(order.amount) * 100) || payment.currency !== order.currency) throw new Error('Gateway payment amount or currency does not match the order.');
}
