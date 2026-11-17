let checkoutScript;
export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript) checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => { if (window.Razorpay) resolve(); else { checkoutScript = null; reject(new Error('Payment checkout could not load. Please try again.')); } };
    script.onerror = () => { script.remove(); checkoutScript = null; reject(new Error('Payment checkout could not load. Check your connection and retry.')); };
    document.head.appendChild(script);
  });
  return checkoutScript;
}
