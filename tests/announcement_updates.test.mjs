import test from 'node:test';import assert from 'node:assert/strict';
import {notifyAnnouncementUpdate,subscribeAnnouncementUpdates,ANNOUNCEMENT_STORAGE_KEY} from '../src/services/announcementUpdates.js';
test('published changes refresh open student tabs, focus and polling; cleanup removes subscriptions',()=>{
 const target=new EventTarget(),doc=new EventTarget();doc.visibilityState='visible';let timer,cleared=false,saved,refreshes=0;
 target.localStorage={setItem:(key,value)=>saved={key,value}};target.setInterval=(callback,delay)=>{assert.equal(delay,15000);timer=callback;return 1;};target.clearInterval=()=>cleared=true;
 const unsubscribe=subscribeAnnouncementUpdates(()=>refreshes++,target,doc);
 notifyAnnouncementUpdate(target);assert.equal(refreshes,1);assert.equal(saved.key,ANNOUNCEMENT_STORAGE_KEY);
 const event=new Event('storage');Object.defineProperty(event,'key',{value:ANNOUNCEMENT_STORAGE_KEY});target.dispatchEvent(event);assert.equal(refreshes,2);
 timer();assert.equal(refreshes,3);doc.visibilityState='hidden';timer();assert.equal(refreshes,3);
 doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));assert.equal(refreshes,4);
 unsubscribe();target.dispatchEvent(new Event('announcements-updated'));assert.equal(refreshes,4);assert.equal(cleared,true);
});
