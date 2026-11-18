export const portalStyles = [
  '/assets/website-assets/css/style.css',
  '/assets/css/style.css',
  '/assets/css/skin_color.css',
  '/assets/icons/themify-icons/themify-icons.css',
  '/assets/icons/glyphicons/glyphicon.css',
  '/assets/icons/Ionicons/css/ionicons.css',
  '/assets/icons/iconsmind/style.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

const publicRoutes=new Set(['/','/pricing','/login','/register','/onboarding','/forgot-password','/reset-password','/payment-status','/admin/login','/admin/onboarding']);
export function needsPortalStyles(pathname) {
  return !publicRoutes.has(pathname.replace(/\/+$/,'')||'/');
}

export function createPortalStyleLoader(doc) {
  let links=[],pending;
  return pathname=>{
    const needed=needsPortalStyles(pathname);
    for(const link of links)link.media=needed?'all':'not all';
    if(!needed)return Promise.resolve();
    if(!pending)pending=Promise.all(portalStyles.map(href=>new Promise(resolve=>{
      const link=doc.createElement('link');link.rel='stylesheet';link.href=href;
      const timeout=setTimeout(resolve,6000);
      const finish=()=>{clearTimeout(timeout);resolve();};
      link.onload=finish;link.onerror=finish;
      links.push(link);
      const marker=doc.querySelector('meta[name="portal-style-slot"]');
      if(marker)marker.before(link);else doc.head.appendChild(link);
    })));
    return pending;
  };
}
