import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ArrowUpRight, Trophy, Target, GraduationCap, TrendingUp } from 'lucide-react';
import { studentFetch } from '../services/studentFetch';
import StudentAppShell from '../components/shell/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import '../styles/performance.css';

function Trend({ attempts, accuracy = false }) {
  const data = [...attempts].reverse().slice(-20);
  const values = data.map(item => accuracy ? Number(item.accuracy) || 0 : Number(item.score) || 0);
  const low = accuracy ? 0 : Math.min(0, ...values);
  const high = accuracy ? 100 : Math.max(1, ...values);
  const x = index => data.length === 1 ? 300 : 48 + index * 510 / (data.length - 1);
  const y = value => 204 - (value - low) / (high - low) * 174;
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const color = accuracy ? '#487568' : 'var(--brand-terracotta)';
  return <article className="performance-chart editorial-card p-4">
    <div className="d-flex justify-content-between align-items-center"><h2>{accuracy ? 'Accuracy over time' : 'Score over time'}</h2><span className="performance-chart-unit">{accuracy ? '%' : 'marks'}</span></div>
    <p>Most recent {data.length} completed {data.length === 1 ? 'test' : 'tests'} · oldest to newest</p>
    <svg viewBox="0 0 600 250" role="img" aria-label={`${accuracy ? 'Accuracy' : 'Score'} line graph for your most recent ${data.length} tests`}>
      {[0, 1, 2, 3, 4].map(i => { const value = low + (high - low) * i / 4; return <g key={i}><line x1="48" x2="558" y1={y(value)} y2={y(value)} stroke="var(--border-subtle)" strokeDasharray="4 5" /><text x="38" y={y(value) + 4} textAnchor="end" fill="var(--text-muted)" fontSize="11">{Math.round(value)}</text></g>; })}
      {low < 0 && <line x1="48" x2="558" y1={y(0)} y2={y(0)} stroke="var(--text-muted)" />}
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((item, index) => <g key={item.id}><circle cx={x(index)} cy={y(values[index])} r="5" fill="var(--bg-surface)" stroke={color} strokeWidth="2.5"><title>{item.paperTitle}: {values[index]}{accuracy ? '%' : ' marks'} · {new Date(item.date).toLocaleDateString('en-IN')}</title></circle>{(index === 0 || index === data.length - 1) && <text x={x(index)} y="233" textAnchor="middle" fill="var(--text-muted)" fontSize="11">{new Date(item.date).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</text>}</g>)}
    </svg>
    {data.length === 1 && <p className="mb-0">Complete another test to see your trend develop.</p>}
  </article>;
}

export default function PerformancePage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    studentFetch('/api/student/performance', { cache: 'no-store' }).then(async response => {
      const body = await response.json();
      if (!response.ok || !body.status) throw new Error('Unable to load your performance. Refresh to try again.');
      if (active) setAttempts(body.data.attempts);
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const average = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + (Number(item.accuracy) || 0), 0) / attempts.length) : 0;
  const top = attempts.length ? Math.max(...attempts.map(item => Number(item.score) || 0)) : 0;
  const total = attempts.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
  const metrics = [ {label:'Tests completed', value:attempts.length, icon:GraduationCap}, {label:'Average accuracy', value:`${average}%`, icon:Target}, {label:'Highest score', value:top, icon:Trophy}, {label:'Total marks earned', value:total, icon:TrendingUp} ];
  return <StudentAppShell><PageContainer><div className="student-performance">
    <header className="performance-header"><span className="editorial-badge editorial-badge-terracotta"><BarChart3 size={14} /> YOUR PROGRESS</span><h1>Every attempt tells a story<span>.</span></h1><p>Follow your progress, spot your trends, and revisit every answer.</p></header>
    {loading ? <p role="status">Loading your test history…</p> : error ? <p role="alert">{error}</p> : !attempts.length ? <div className="editorial-card p-5 text-center"><BarChart3 size={40} className="mb-3" /><h2 className="h4">Your progress starts with your first test</h2><p>Completed tests will appear here with your scores and full answer reviews.</p><Link className="editorial-btn editorial-btn-primary" to="/tests">Explore test series <ArrowUpRight size={16} /></Link></div> : <>
      <div className="performance-metrics">{metrics.map(({label,value,icon:Icon}) => <article className="editorial-card performance-metric" key={label}><Icon size={19} /><span>{label}</span><strong>{value}</strong></article>)}</div>
      <div className="performance-charts"><Trend attempts={attempts} /><Trend attempts={attempts} accuracy /></div>
      <section className="editorial-card p-4"><div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4"><div><h2 className="h5 mb-1">Your test journey</h2><p className="small mb-0" style={{color:'var(--text-secondary)'}}>Your completed attempts, newest first.</p></div><Link to="/tests" className="editorial-btn editorial-btn-secondary">Take another test <ArrowUpRight size={14} /></Link></div>
        <div className="table-responsive"><table className="performance-table"><thead><tr><th scope="col">Test paper</th><th scope="col">Completed</th><th scope="col">Score</th><th scope="col">Accuracy</th><th scope="col">Answer key</th></tr></thead><tbody>{attempts.map(item => <tr key={item.id}><th scope="row">{item.paperTitle}</th><td>{new Date(item.date).toLocaleString('en-IN', {dateStyle:'medium',timeStyle:'short'})}</td><td><strong>{item.score}</strong> / {item.totalMarks ?? '—'}</td><td><span className="performance-accuracy">{item.accuracy}%</span></td><td><Link to={`/exam/result?attempt=${encodeURIComponent(item.id)}`} className="editorial-btn editorial-btn-secondary" aria-label={`Review ${item.paperTitle}`}>Review <ArrowUpRight size={14} /></Link></td></tr>)}</tbody></table></div>
        <p className="small mt-3 mb-0" style={{color:'var(--text-muted)'}}>Scores use each paper’s marking scheme. Different papers may have different maximum marks.</p>
      </section>
    </>}
  </div></PageContainer></StudentAppShell>;
}
