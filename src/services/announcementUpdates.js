export const ANNOUNCEMENT_REFRESH_MS=15000;
export const ANNOUNCEMENT_STORAGE_KEY='ayur_announcements_updated_at';
export function notifyAnnouncementUpdate(target=window){
  try{target.localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY,String(Date.now())+'-'+Math.random().toString(36).slice(2));}catch{}
  target.dispatchEvent(new Event('announcements-updated'));
}
export function subscribeAnnouncementUpdates(refresh,target=window,documentTarget=document){
  const load=()=>{if(documentTarget.visibilityState!=='hidden')refresh();};
  const storage=event=>{if(event.key===ANNOUNCEMENT_STORAGE_KEY)load();};
  const timer=target.setInterval(load,ANNOUNCEMENT_REFRESH_MS);
  target.addEventListener('focus',load);target.addEventListener('announcements-updated',load);target.addEventListener('storage',storage);documentTarget.addEventListener('visibilitychange',load);
  return()=>{target.clearInterval(timer);target.removeEventListener('focus',load);target.removeEventListener('announcements-updated',load);target.removeEventListener('storage',storage);documentTarget.removeEventListener('visibilitychange',load);};
}
