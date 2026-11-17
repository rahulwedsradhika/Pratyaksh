import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentAvatar from '../StudentAvatar';
export default function StudentProfileMenu() {
  const { user } = useAuth();
  const name = user?.fullName || user?.full_name || user?.name || 'Student';
  return <Link to="/profile" aria-label="Open your profile" title="My profile" style={{display:'flex',alignItems:'center',gap:'.5rem',padding:'.3rem .65rem .3rem .3rem',borderRadius:24,background:'var(--bg-subtle)',border:'1px solid var(--border-subtle)',color:'var(--text-primary)',textDecoration:'none',flexShrink:0}}><StudentAvatar user={user} size={30}/><span className="d-none d-sm-inline" style={{fontSize:'.82rem',fontWeight:600}}>{name.split(' ')[0]}</span></Link>;
}
