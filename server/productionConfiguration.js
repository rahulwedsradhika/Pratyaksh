import 'dotenv/config';
import path from 'node:path';
export const production = [process.env.APP_ENV,process.env.NODE_ENV].some(v=>v?.toLowerCase()==='production');
export function validateProductionConfiguration(env=process.env) {
  if(![env.APP_ENV,env.NODE_ENV].some(v=>v?.toLowerCase()==='production'))return;
  if(env.DB_CONNECTION!=='mysql')throw Error('Production requires MySQL; SQLite fallback is disabled.');
  const origin=new URL(env.APP_URL||'');
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/')throw Error('APP_URL must be a public HTTPS origin.');
  if((env.AUTH_SESSION_SECRET||env.SESSION_SECRET||'').length<32)throw Error('A private session secret of at least 32 characters is required.');
  if((env.ENCRYPTION_KEY||env.RAZORPAY_ENCRYPTION_KEY||'').length<32)throw Error('The original private gateway encryption key must be configured.');
  if(!env.PERSISTENT_STORAGE_DIR||!path.isAbsolute(env.PERSISTENT_STORAGE_DIR))throw Error('An absolute PERSISTENT_STORAGE_DIR outside the deployment directory is required.');
  const relative=path.relative(process.cwd(),path.resolve(env.PERSISTENT_STORAGE_DIR));
  if(!relative.startsWith('..')&&!path.isAbsolute(relative))throw Error('Persistent uploads must be outside the deployment directory.');
  if(!env.OWNER_EMAIL||!/^\S+@\S+\.\S+$/.test(env.OWNER_EMAIL))throw Error('OWNER_EMAIL must identify the existing, verified superadmin.');
  if(/^(true|1)$/i.test(env.ALLOW_DEV_SEED||''))throw Error('Development seeds are forbidden in production.');
  for(const [key,value]of Object.entries(env))if(/BYPASS|NO_LOGIN|LOCAL_PRO/.test(key)&&/^(true|1)$/i.test(value))throw Error('Development authentication/access bypasses are forbidden in production.');
}
validateProductionConfiguration();
export function assertPaymentEnvironment(mode,env=process.env) {
  if((env.APP_ENV||env.NODE_ENV||'development').toLowerCase()==='production'&&mode!=='live')throw Error('Sandbox payments cannot grant production membership. Use a separate staging database for test purchases.');
}
