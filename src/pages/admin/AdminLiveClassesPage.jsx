import React, { useCallback, useEffect, useState } from 'react';
import { Radio, Plus, Pencil, Trash2, EyeOff, RefreshCw, X, Calendar, Megaphone, Video, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {notifyAnnouncementUpdate} from '../../services/announcementUpdates';
import '../../styles/adminLiveClasses.css';
const blank = () => ({title:'',message:'',kind:'class',zoomUrl:'',startsAt:'',state:'draft'});
const localDate = iso => iso ? new Date(iso).toLocaleString('sv-SE',{timeZone:'Asia/Kolkata'}).slice(0,16).replace(' ','T') : '';
const states = {draft:'Draft',published:'Published',ended:'Completed',cancelled:'Cancelled'};
const badge = state => state==='published'?'admin-badge-success':state==='draft'?'admin-badge-warning':state==='cancelled'?'admin-badge-danger':'admin-badge-neutral';
export default function AdminLiveClassesPage() {
  const { adminUser, request } = useAdminAuth();
  const allowed = adminUser?.role === 'super_admin';
  const [posts,setPosts]=useState([]),[draft,setDraft]=useState(blank),[editing,setEditing]=useState(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [editorOpen,setEditorOpen]=useState(false),[filter,setFilter]=useState('all');
  const load=useCallback(async()=>{const data=await request('/api/admin/live-classes');if(!Array.isArray(data.data))throw Error('The server did not return the announcement list.');setPosts(data.data);},[request]);
  useEffect(()=>{let active=true;if(!allowed)return;setLoading(true);request('/api/admin/live-classes').then(data=>{if(!Array.isArray(data.data))throw Error('The server did not return the announcement list.');if(active)setPosts(data.data);}).catch(error=>{if(active)setError(error.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false};},[allowed,request]);
  const change=(key,value)=>setDraft(previous=>({...previous,[key]:value}));
  function closeEditor(){setEditorOpen(false);setEditing(null);setDraft(blank());}
  function create(){setDraft(blank());setEditing(null);setEditorOpen(true);setError('');setNotice('');}
  function edit(post){setDraft({...post,startsAt:localDate(post.startsAt)});setEditing(post.id);setEditorOpen(true);setError('');setNotice('');window.scrollTo({top:0,behavior:'smooth'});}
  async function refresh(){setLoading(true);setError('');try{await load();}catch(error){setError(error.message);}finally{setLoading(false);}}
  async function save(event){
    event.preventDefault();setBusy(true);setError('');setNotice('');
    try{
      const startsAt=draft.startsAt?new Date(`${draft.startsAt}+05:30`).toISOString():'';
      const state=event.nativeEvent.submitter?.value==='published'?'published':draft.state;
      const result=await request(`/api/admin/live-classes${editing?`/${editing}`:''}`,{method:editing?'PUT':'POST',body:JSON.stringify({...draft,startsAt,state})});
      if(!result.data?.id)throw Error('The server did not confirm the saved announcement.');
      // Use the authoritative saved row immediately, even if a later refresh fails.
      setPosts(previous=>[result.data,...previous.filter(post=>post.id!==result.data.id)]);
      closeEditor();
      notifyAnnouncementUpdate();
      setNotice(result.data.state==='published'?'Published to students. Learn Live refreshes within 15 seconds.':result.data.state==='draft'?'Draft saved privately. Students cannot see it until you click Publish to students.':`${states[result.data.state]} saved successfully.`);
    }catch(error){setError(error.message);}finally{setBusy(false);}
  }
  async function remove(post){if(!window.confirm('Delete "'+post.title+'"? It will be removed from the admin list and student Learn Live page.'))return;setBusy(true);setError('');setNotice('');try{await request(`/api/admin/live-classes/${post.id}`,{method:'DELETE'});setPosts(previous=>previous.filter(item=>item.id!==post.id));if(editing===post.id)closeEditor();notifyAnnouncementUpdate();setNotice('Announcement deleted and removed from the student page.');}catch(error){setError(error.message);}finally{setBusy(false);}}
  async function publish(post){setBusy(true);setError('');setNotice('');try{const result=await request('/api/admin/live-classes/'+post.id,{method:'PUT',body:JSON.stringify({...post,state:'published'})});if(!result.data?.id||result.data.state!=='published')throw Error('The server did not confirm publication.');setPosts(previous=>previous.map(item=>item.id===post.id?result.data:item));notifyAnnouncementUpdate();setNotice('Published to students. Learn Live refreshes within 15 seconds.');}catch(error){setError(error.message);}finally{setBusy(false);}}
  async function unpublish(post){
    setBusy(true);setError('');setNotice('');
    try{
      const result=await request('/api/admin/live-classes/'+post.id,{method:'PUT',body:JSON.stringify({...post,state:'draft'})});
      if(!result.data?.id)throw Error('The server did not confirm the change.');
      setPosts(previous=>previous.map(item=>item.id===post.id?result.data:item));
      if(editing===post.id)setDraft(previous=>({...previous,state:'draft'}));
      notifyAnnouncementUpdate();
      setNotice('Unpublished. This post is now a private draft and is hidden from students.');
    }catch(error){setError(error.message);}finally{setBusy(false);}
  }
  const visible=posts.filter(post=>filter==='all'||(filter==='draft'?post.state==='draft':post.kind===filter));
  if(!allowed)return <div className="admin-card" role="alert" style={{padding:24}}>Only the superadmin can manage live classes and announcements.</div>;
  return <div className="admin-live-page">
    <header className="admin-page-header"><div><h1 className="admin-page-title">Live Classes &amp; Announcements</h1><p className="admin-page-subtitle">Manage Zoom sessions and updates shown on the student Learn Live page.</p></div><button type="button" className="admin-btn admin-btn-primary" onClick={create} disabled={busy}><Plus size={17}/>New announcement</button></header>
    {error&&<div className="admin-live-feedback is-error" role="alert"><AlertCircle size={18}/><span>{error}</span></div>}
    {notice&&<div className="admin-live-feedback is-success" role="status"><CheckCircle2 size={18}/><span>{notice}</span></div>}
    <div className="admin-live-summary">{[{title:'Published',value:posts.filter(p=>p.state==='published').length,icon:Radio},{title:'Zoom classes',value:posts.filter(p=>p.kind==='class').length,icon:Video},{title:'Drafts',value:posts.filter(p=>p.state==='draft').length,icon:Pencil}].map(({title,value,icon:Icon})=><div className="admin-card" key={title}><div><span>{title}</span><strong>{loading?'—':value}</strong></div><Icon size={22}/></div>)}</div>
    {editorOpen&&<section className="admin-card admin-live-editor" aria-label="Announcement editor"><div className="admin-live-section-heading"><div><h2>{editing?'Edit announcement':'New announcement'}</h2><p>Save privately as a draft, or publish when the details are ready.</p></div><button type="button" className="admin-icon-btn" aria-label="Close announcement editor" disabled={busy} onClick={closeEditor}><X size={18}/></button></div>
      <form onSubmit={save}><fieldset disabled={busy}>
        <label className="admin-form-label">Title<input className="admin-form-input" required maxLength={180} value={draft.title} onChange={e=>change('title',e.target.value)} placeholder="e.g. Charaka Sutra revision with Dr. Rahul Parihar"/></label>
        <div className="admin-live-form-grid"><label className="admin-form-label">Announcement type<select className="admin-form-select" value={draft.kind} onChange={e=>change('kind',e.target.value)}><option value="class">Zoom class</option><option value="update">Student announcement</option></select></label><label className="admin-form-label">Visibility<select className="admin-form-select" value={draft.state} onChange={e=>change('state',e.target.value)}>{Object.entries(states).map(([value,label])=><option key={value} value={value}>{label}{value==='draft'?' — superadmin only':value==='published'?' — visible to students':''}</option>)}</select></label></div>
        <div className="admin-live-form-grid"><label className="admin-form-label">{draft.kind==='class'?'Class date and time':'Announcement date and time'}<input className="admin-form-input" type="datetime-local" value={draft.startsAt} onChange={e=>change('startsAt',e.target.value)}/><small>Optional · India Standard Time (IST)</small></label><label className="admin-form-label">Zoom meeting link{draft.kind==='update'?' (optional)':''}<input className="admin-form-input" type="url" maxLength={2000} required={draft.kind==='class'&&draft.state==='published'} value={draft.zoomUrl} onChange={e=>change('zoomUrl',e.target.value)} placeholder="https://us02web.zoom.us/j/…"/><small>Use the full HTTPS Zoom link, including the passcode.</small></label></div>
        <label className="admin-form-label">{draft.kind==='class'?'Session details':'Announcement message'}<textarea className="admin-form-input" rows={4} maxLength={6000} value={draft.message} onChange={e=>change('message',e.target.value)} placeholder="Topics, faculty, preparation notes or schedule changes…"/></label>
        <div className="admin-live-editor-footer"><span>{draft.state==='draft'?'Drafts are private. Publish to students when the announcement is ready.':'Published posts appear on Learn Live. Completed and cancelled classes have no join link.'}</span><div><button className="admin-btn admin-btn-secondary" type="button" onClick={closeEditor}>Cancel</button><button className={`admin-btn ${draft.state==='draft'?'admin-btn-secondary':'admin-btn-primary'}`} type="submit">{busy?'Saving…':draft.state==='draft'?'Save private draft':draft.state==='published'?'Update published announcement':'Save changes'}</button>{draft.state==='draft'&&<button className="admin-btn admin-btn-primary" type="submit" value="published" disabled={busy}>{busy?'Publishing…':'Publish to students'}</button>}</div></div>
      </fieldset></form>
    </section>}
    <section className="admin-card admin-live-list"><div className="admin-live-toolbar"><div className="admin-live-filters" role="group" aria-label="Filter announcements">{[['all','All posts'],['class','Zoom classes'],['update','Announcements'],['draft','Drafts']].map(([key,label])=><button type="button" className={`admin-btn ${filter===key?'admin-btn-primary':'admin-btn-secondary'} admin-btn-sm`} aria-pressed={filter===key} key={key} onClick={()=>setFilter(key)}>{label}</button>)}</div><button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" disabled={busy||loading} onClick={refresh}><RefreshCw size={15}/>Refresh</button></div>
      {loading?<div role="status" className="admin-empty-state">Loading announcements…</div>:visible.length===0?<div className="admin-empty-state"><Megaphone size={32}/><h2 className="admin-empty-title">{posts.length?'No posts match this filter':'Your next class starts here'}</h2><p className="admin-empty-text">{posts.length?'Choose another filter to see your posts.':'Add a Zoom class or share an update with your students.'}</p>{!posts.length&&<button className="admin-btn admin-btn-primary" type="button" onClick={create}><Plus size={16}/>Create announcement</button>}</div>:<div className="admin-table-container"><table className="admin-table"><thead><tr><th>Announcement</th><th>Schedule · IST</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map(post=><tr key={post.id}><td><div className="admin-live-post-title">{post.kind==='class'?<Video size={17}/>:<Megaphone size={17}/>}<strong>{post.title}</strong></div><p className="admin-live-post-message">{post.message||'No additional details'}</p>{post.zoomUrl&&<a className="admin-live-link" href={post.zoomUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={13}/>View Zoom link</a>}</td><td>{post.startsAt?<span className="admin-live-schedule"><Calendar size={14}/>{new Date(post.startsAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'})}</span>:<span className="admin-live-muted">Not scheduled</span>}</td><td><span className={`admin-badge ${badge(post.state)}`}>{states[post.state]}</span></td><td><div className="admin-live-row-actions"><button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" disabled={busy} onClick={()=>edit(post)}><Pencil size={14}/>Edit</button>{post.state==='draft'&&<button type="button" className="admin-btn admin-btn-primary admin-btn-sm" disabled={busy} onClick={()=>publish(post)}><Radio size={14}/>Publish to students</button>}{post.state!=='draft'&&<button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" disabled={busy} onClick={()=>unpublish(post)}><EyeOff size={14}/>Unpublish</button>}<button type="button" className="admin-btn admin-btn-danger admin-btn-sm" disabled={busy} onClick={()=>remove(post)}><Trash2 size={14}/>Delete</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
