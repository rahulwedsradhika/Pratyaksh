import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Video, Bell, CalendarDays, ArrowUpRight, RefreshCw } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import { studentFetch } from '../services/studentFetch';
import {subscribeAnnouncementUpdates} from '../services/announcementUpdates';
import '../styles/liveClasses.css';
export default function LearnLivePage() {
  const [posts,setPosts]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[filter,setFilter]=useState('all'),[version,setVersion]=useState(0);
  useEffect(()=>{
    let active=true,sequence=0;
    async function load(){const request=++sequence;try{const response=await studentFetch('/api/student/live-classes',{cache:'no-store'});const body=await response.json();if(!response.ok||!body.status||!Array.isArray(body.data))throw new Error(body.message||'Unable to load class announcements.');if(active&&request===sequence){setPosts(body.data);setError('')}}catch(error){if(active&&request===sequence)setError(error.message)}finally{if(active&&request===sequence)setLoading(false)}}
    load();const unsubscribe=subscribeAnnouncementUpdates(load);return()=>{active=false;sequence++;unsubscribe()};
  },[version]);
  const visible=posts.filter(post=>filter==='all'||post.kind===filter);
  return <StudentAppShell><PageContainer maxWidth="1000px"><div className="student-live">
    <header className="live-heading"><div><span className="editorial-badge editorial-badge-terracotta"><Radio size={14}/> YOUR LIVE CLASSROOM</span><h1>Learn together. Stay connected<span>.</span></h1><p>Class schedules, Zoom invitations and updates from your institute.</p></div><button className="editorial-btn editorial-btn-secondary" type="button" onClick={()=>setVersion(n=>n+1)} aria-label="Refresh class announcements"><RefreshCw size={15}/>Refresh</button></header>
    <div className="live-filters" role="group" aria-label="Announcement type">{[['all','All announcements'],['class','Zoom classes'],['update','Updates']].map(([key,label])=><button type="button" key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</div>
    {error && <p role="alert" className="live-feedback">{error}</p>}
    {loading?<p role="status" className="p-4">Loading class announcements…</p>:!visible.length&&!error?<section className="editorial-card live-empty"><Video size={38}/><h2>No {filter==='class'?'classes':filter==='update'?'updates':'announcements'} published yet</h2><p>When your institute posts a class or update, it will appear here.</p><Link className="editorial-btn editorial-btn-secondary" to="/courses">Explore recorded lectures <ArrowUpRight size={15}/></Link></section>:<div className="live-post-list">{visible.map(post=><article className={`editorial-card live-student-post state-${post.state}`} key={post.id}>
      <div className="live-post-top"><span className="live-post-icon">{post.kind==='class'?<Video size={22}/>:<Bell size={22}/>}</span><span className="live-state">{post.state==='published'?(post.kind==='class'?'Zoom class':'Institute update'):post.state==='ended'?'Completed':'Cancelled'}</span></div>
      <h2>{post.title}</h2>{post.startsAt && <p className="live-post-date"><CalendarDays size={15}/>{new Date(post.startsAt).toLocaleString('en-IN',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Kolkata'})} IST</p>}
      {post.message && <p className="live-post-message">{post.message}</p>}
      <footer><small>Updated {new Date(post.updatedAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'})} IST</small>{post.zoomUrl && post.state==='published' && <a className="editorial-btn editorial-btn-primary" href={post.zoomUrl} target="_blank" rel="noopener noreferrer">Open Zoom class <ArrowUpRight size={15}/></a>}</footer>
    </article>)}</div>}
  </div></PageContainer></StudentAppShell>;
}
