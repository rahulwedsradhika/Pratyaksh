export function adminFetch(input,options={}) {
  const url=new URL(typeof input==='string'?input:input.url,window.location.href);
  const headers=new Headers(options.headers||(typeof input==='object'?input.headers:undefined));
  if(url.origin===window.location.origin&&url.pathname.startsWith('/api/')){
    const token=localStorage.getItem('ayur_admin_token');if(token&&!headers.has('Authorization'))headers.set('Authorization','Bearer '+token);
  }
  return window.fetch(input,{...options,headers});
}
