import {useEffect,useState} from 'react';

// Google's iframe uses a pixel width; remeasure its actual slot on phone rotation.
export function useGoogleButtonWidth(slotId,ready) {
  const [width,setWidth]=useState(0);
  useEffect(()=>{
    if(!ready)return;
    const slot=document.getElementById(slotId);
    if(!slot)return;
    const measure=()=>setWidth(Math.floor(Math.min(376,slot.getBoundingClientRect().width)));
    measure();
    const observer=new ResizeObserver(measure);observer.observe(slot);
    return ()=>observer.disconnect();
  },[slotId,ready]);
  return width;
}
