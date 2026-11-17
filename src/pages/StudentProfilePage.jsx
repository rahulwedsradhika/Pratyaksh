import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Camera, Save, ShieldCheck, CreditCard, CheckCircle2 } from 'lucide-react';
import StudentAppShell from '../components/shell/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import StudentAvatar from '../components/StudentAvatar';
import StudentLogout from '../components/StudentLogout';
import { useAuth } from '../context/AuthContext';
import { studentFetch } from '../services/studentFetch';
import { prepareProfilePhoto } from '../services/profilePhoto';
import '../styles/studentProfile.css';

const goals = ['AIAPGET & BAMS Complete','AIAPGET Competitive Sprint','BAMS University Professional','Ayurveda Medical Officer (AMO)'];
export default function StudentProfilePage() {
  const { user, membership, updateProfile, refreshStudentState } = useAuth();
  const [draft, setDraft] = useState({fullName:'',phone:'',examGoal:''});
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef(null);
  useEffect(() => { if (user) setDraft({fullName:user.fullName || user.full_name || '',phone:user.phone || '',examGoal:user.examGoal || user.exam_goal || ''}); }, [user]);
  async function save(event) {
    event.preventDefault(); setBusy(true);setError('');setMessage('');
    try {
      const result = await updateProfile(draft);
      if (!result.success) throw new Error(result.error || 'Profile could not be saved.');
      setMessage('Your profile has been updated.');
    } catch(error) { setError(error.message); } finally { setBusy(false); }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoBusy(true);setError('');setMessage('');
    try {
      const image = await prepareProfilePhoto(file);
      const response = await studentFetch('/api/student/avatar', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({image})});
      const body = await response.json();
      if (!response.ok || !body.status) throw new Error(body.message || 'Photo could not be saved.');
      await refreshStudentState();setMessage('Your profile photo has been updated.');
    } catch(error) {setError(error.message)} finally {setPhotoBusy(false)}
  }
  const expiry = membership?.expiryDate || membership?.expiry_date;
  return <StudentAppShell><PageContainer maxWidth="880px"><div className="student-profile-page">
    <header className="mb-4"><span className="editorial-badge editorial-badge-terracotta"><User size={14}/> YOUR ACCOUNT</span><h1>A profile that feels like you<span>.</span></h1><p>Your signup details, learning focus and membership, all in one place.</p></header>
    {error && <p role="alert" className="editorial-card p-3">{error}</p>}{message && <p role="status" className="editorial-card p-3"><CheckCircle2 size={16}/> {message}</p>}
    <section className="editorial-card profile-identity mb-4">
      <div className="profile-photo"><StudentAvatar user={user} size={88}/></div>
      <div className="profile-identity-copy"><h2>{user?.fullName || 'Your profile'}</h2><p>{user?.email}</p><span className="editorial-badge"><ShieldCheck size={13}/>{user?.emailVerified ? 'Verified email':'Email verification pending'}</span></div>
      <div><input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInput} onChange={upload} hidden aria-label="Upload profile picture"/><button type="button" className="editorial-btn editorial-btn-secondary" disabled={photoBusy || busy} onClick={()=>fileInput.current?.click()}><Camera size={16}/>{photoBusy ? 'Uploading…':'Change photo'}</button><p className="profile-photo-hint">JPG, PNG or WebP · Up to 5 MB</p></div>
    </section>
    <section className="editorial-card p-4 mb-4"><h2 className="h5 mb-1">Your student details</h2><p className="small mb-4">Keep the details you used during signup up to date.</p>
      <form onSubmit={save}><fieldset disabled={busy || photoBusy} className="profile-fields"><label>Full name<input className="form-control" required maxLength={120} value={draft.fullName} autoComplete="name" onChange={e=>setDraft({...draft,fullName:e.target.value})}/></label><label>Email address<input className="form-control" type="email" value={user?.email || ''} readOnly/><small>Your verified sign-in email.</small></label><label>Mobile / WhatsApp number<input className="form-control" type="tel" required maxLength={22} autoComplete="tel" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></label><label>Academic focus<select className="form-select" value={draft.examGoal} onChange={e=>setDraft({...draft,examGoal:e.target.value})}><option value="">Choose your learning focus</option>{draft.examGoal && !goals.includes(draft.examGoal) && <option value={draft.examGoal}>{draft.examGoal}</option>}{goals.map(goal=><option key={goal}>{goal}</option>)}</select></label><div className="profile-save"><button type="submit" className="editorial-btn editorial-btn-primary"><Save size={15}/>{busy?'Saving…':'Save profile'}</button></div></fieldset></form>
    </section>
    <section className="editorial-card profile-membership"><div><span className="editorial-badge mb-2"><CreditCard size={14}/> MEMBERSHIP</span><h2 className="h5">{user?.classroomAccess ? 'Administrator classroom access' : membership?.planName || membership?.plan_name || 'Complete your membership'}</h2><p className="small mb-0">{expiry ? `Membership ${membership?.status === 'expired' ? 'expired':'valid until'} ${new Date(expiry).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}` : 'View your plan, payment status and membership details.'}</p></div><Link to="/membership" className="editorial-btn editorial-btn-secondary">Manage membership</Link></section>
    <StudentLogout/>
  </div></PageContainer></StudentAppShell>;
}
