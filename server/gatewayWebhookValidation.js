import crypto from 'node:crypto';
export function decodeGatewayWebhook(rawBody,signature,profiles,requestedMode) {
  if(!Buffer.isBuffer(rawBody)||typeof signature!=='string'||!/^[a-f0-9]{64}$/i.test(signature))throw Error('Invalid webhook signature.');
  if(requestedMode&&!['test','live'].includes(requestedMode))throw Error('Invalid webhook environment.');
  const modes=requestedMode?[requestedMode]:['test','live'];
  const actual=Buffer.from(signature,'hex');
  const mode=modes.find(mode=>{const secret=profiles[mode]?.webhookSecret;if(!secret)return false;const expected=crypto.createHmac('sha256',secret).update(rawBody).digest();return crypto.timingSafeEqual(expected,actual)});
  if(!mode)throw Error('Webhook signature does not match the configured environment.');
  const event=JSON.parse(rawBody.toString('utf8'));if(!event||typeof event.event!=='string'||!event.payload||typeof event.payload!=='object')throw Error('Invalid webhook payload.');
  return {mode,event};
}
