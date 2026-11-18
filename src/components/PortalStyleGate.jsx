import React,{useLayoutEffect,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {createPortalStyleLoader,needsPortalStyles} from '../services/portalStyles';

const loadStyles=createPortalStyleLoader(document);
export default function PortalStyleGate({children}) {
  const {pathname}=useLocation();
  const [readyPath,setReadyPath]=useState('');
  useLayoutEffect(()=>{
    let active=true;
    loadStyles(pathname).then(()=>{if(active)setReadyPath(pathname);});
    return()=>{active=false;};
  },[pathname]);
  if(needsPortalStyles(pathname)&&readyPath!==pathname)return <div role="status" style={{padding:'3rem',textAlign:'center'}}>Opening your classroom…</div>;
  return children;
}
