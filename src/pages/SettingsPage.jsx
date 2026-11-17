import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Sun, Moon, Monitor, BookOpen, Eye, Type, Waves, Check, ArrowUpRight, ShieldCheck } from 'lucide-react';
import StudentAppShell from '../components/shell/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import StudentLogout from '../components/StudentLogout';
import StudentAvatar from '../components/StudentAvatar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../styles/studentSettings.css';

function PreferenceSwitch({ icon: Icon, title, description, checked, onChange }) {
  return <label className="settings-preference"><span className="settings-preference-icon"><Icon size={18}/></span><span className="settings-preference-copy"><strong>{title}</strong><span>{description}</span></span><span className="settings-switch"><input type="checkbox" role="switch" aria-label={title} checked={checked} onChange={event=>onChange(event.target.checked)}/><span aria-hidden="true"/></span></label>;
}

export default function SettingsPage() {
  const { theme, resolvedTheme, setTheme, readingPreferences: preferences, setReadingPreference } = useTheme();
  const { user } = useAuth();
  return <StudentAppShell><PageContainer maxWidth="1040px"><div className="student-settings">
    <header className="settings-heading"><span className="editorial-badge editorial-badge-terracotta"><Settings size={14}/> MAKE IT YOURS</span><h1>Your space. Your way<span>.</span></h1><p>A comfortable classroom starts with the little things.</p></header>
    <div className="settings-layout"><div className="settings-main">
      <section className="editorial-card settings-section"><header><span className="settings-section-icon"><Sun size={19}/></span><div><h2>Find your light</h2><p>Choose the look that feels right for your study sessions.</p></div></header>
        <div className="settings-themes" role="group" aria-label="Appearance theme">
          {[{id:'light',label:'Light',description:'Warm & clear',icon:Sun},{id:'dark',label:'Dark',description:'Easy on the eyes',icon:Moon},{id:'system',label:'System',description:'Follows your device',icon:Monitor}].map(({id,label,description,icon:Icon})=><button type="button" className={`settings-theme settings-theme-${id}`} key={id} aria-pressed={theme===id} onClick={()=>setTheme(id)}><span className="settings-theme-preview" aria-hidden="true"><span/><span><i/><i/><i/></span></span><span className="settings-theme-label"><Icon size={15}/><strong>{label}</strong>{theme===id && <Check size={14}/>}</span><small>{description}</small></button>)}
        </div><p className="settings-footnote">Currently using {resolvedTheme} mode{theme==='system'?' · changes with your device':''}.</p>
      </section>
      <section className="editorial-card settings-section"><header><span className="settings-section-icon"><BookOpen size={19}/></span><div><h2>Read at your rhythm</h2><p>Adjust the details that make longer study sessions easier.</p></div></header>
        <PreferenceSwitch icon={Type} title="Classical Devanagari font" description="Use a traditional serif for Sanskrit and Hindi passages." checked={preferences.devanagari} onChange={value=>setReadingPreference('devanagari',value)}/>
        <PreferenceSwitch icon={Eye} title="Stronger text contrast" description="Make secondary text and captions easier to distinguish." checked={preferences.contrast} onChange={value=>setReadingPreference('contrast',value)}/>
        <div className="settings-text-size"><div><strong>Question & reading text size</strong><p>Applies to questions, options and answer explanations.</p></div><div className="settings-size-buttons" role="group" aria-label="Reading text size">{[{id:'standard',label:'Standard'},{id:'large',label:'Large'},{id:'larger',label:'Larger'}].map(({id,label})=><button type="button" aria-pressed={preferences.size===id} onClick={()=>setReadingPreference('size',id)} key={id}>{label}</button>)}</div></div>
        <PreferenceSwitch icon={Waves} title="Reduce animations" description="Keep transitions still for a calmer experience." checked={preferences.reduceMotion} onChange={value=>setReadingPreference('reduceMotion',value)}/>
      </section>
      <section className="editorial-card settings-section"><header><span className="settings-section-icon"><ShieldCheck size={19}/></span><div><h2>Your account, connected</h2><p>Keep your details and membership close at hand.</p></div></header><Link className="settings-account-link" to="/profile"><span>Profile & photo<small>Personal details and learning focus</small></span><ArrowUpRight size={18}/></Link><Link className="settings-account-link" to="/membership"><span>Membership<small>Access, expiry date and payment history</small></span><ArrowUpRight size={18}/></Link></section>
    </div><aside className="settings-aside">
      <section className="editorial-card settings-preview"><span className="settings-eyebrow">LIVE READING PREVIEW</span><span className="settings-preview-icon"><BookOpen size={24}/></span><h2>A little clarity goes a long way.</h2><div className="learning-reading-content devanagari-text settings-sample" lang="sa">विद्या ददाति विनयम्।</div><div className="learning-reading-content settings-sample-english">Your questions and commentary will use this reading size.</div><span className="settings-preview-caption">Adjust your reading preferences to see the difference.</span></section>
      <div className="settings-device-note"><ShieldCheck size={17}/><p>Your appearance and reading preferences are remembered on this browser. Tasks, saved questions and test history stay in your account.</p></div>
      <Link to="/profile" className="settings-profile-link"><StudentAvatar user={user} size={36}/><span>{user?.fullName || 'Your profile'}<small>Manage your student account</small></span><ArrowUpRight size={15}/></Link>
    </aside></div>
    <StudentLogout/>
  </div></PageContainer></StudentAppShell>;
}
