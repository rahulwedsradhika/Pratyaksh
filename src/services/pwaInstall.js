export function installPlatform(navigatorLike={}) {
 const ua=navigatorLike.userAgent||'';
 if(/iPad|iPhone|iPod/i.test(ua)||(/Mac/i.test(navigatorLike.platform||'')&&Number(navigatorLike.maxTouchPoints)>1))return 'ios';
 if(/Android/i.test(ua))return 'android';
 if(/Safari/i.test(ua)&&!/Chrome|Chromium|Edg/i.test(ua))return 'safari';
 return 'desktop';
}
export function createInstallController(browser) {
 let prompt=null;const media=browser?.matchMedia?.('(display-mode: standalone)');
 let snapshot={canPrompt:false,installed:Boolean(media?.matches||browser?.navigator?.standalone)};
 const listeners=new Set();
 function update(){const next={canPrompt:Boolean(prompt),installed:snapshot.installed||Boolean(media?.matches||browser?.navigator?.standalone)};if(next.canPrompt!==snapshot.canPrompt||next.installed!==snapshot.installed){snapshot=next;listeners.forEach(fn=>fn());}}
 function before(event){event.preventDefault();prompt=event;update();}
 function installed(){prompt=null;snapshot={canPrompt:false,installed:true};listeners.forEach(fn=>fn());}
 browser?.addEventListener('beforeinstallprompt',before);browser?.addEventListener('appinstalled',installed);media?.addEventListener?.('change',update);
 return {getSnapshot:()=>snapshot,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},async request(){if(!prompt)return 'unavailable';const event=prompt;prompt=null;update();try{await event.prompt();const choice=await event.userChoice;return choice?.outcome==='accepted'?'accepted':'dismissed';}catch{return 'unavailable';}},dispose(){browser?.removeEventListener('beforeinstallprompt',before);browser?.removeEventListener('appinstalled',installed);media?.removeEventListener?.('change',update);listeners.clear();}};
}
export const appInstall=createInstallController(typeof window==='undefined'?undefined:window);
if(import.meta.hot)import.meta.hot.dispose(()=>appInstall.dispose());
export function registerAppWorker(){if(typeof window==='undefined'||!window.isSecureContext||!('serviceWorker' in navigator))return;const register=()=>navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>console.warn('App offline support is unavailable in this browser.'));if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});}
