import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, GraduationCap, ArrowUpRight, History, Trophy } from 'lucide-react';
import { studentFetch } from '../services/studentFetch';
import '../styles/studentActivity.css';

const lectureLink = item => `/lesson/${encodeURIComponent(item.chapter_id)}?lecture=${encodeURIComponent(item.lecture_id)}`;
const dateLabel = value => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function StudentActivity() {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    function refresh() {
    studentFetch('/api/student/activity', { cache: 'no-store' }).then(async response => {
      const body = await response.json();
      if (!response.ok || !body.status) throw new Error('Activity unavailable');
      if (active) { setActivity(body.data); setError(false); }
    }).catch(() => { if (active) setError(true); });
    }
    refresh();
    window.addEventListener('student-activity-saved', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener('student-activity-saved', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  if (error) return <div role="status" className="editorial-card p-4 mb-4">Your learning history could not be loaded. Refresh to try again.</div>;
  if (!activity) return <p role="status" className="mb-4">Loading your learning history…</p>;
  const latestLecture = activity.lectures[0];
  const latestTest = activity.tests[0];
  return (
    <section aria-label="Your learning activity" className="student-activity mb-5">
      <header className="activity-heading"><div><span className="activity-eyebrow">PICK UP YOUR MOMENTUM</span><h2>Your learning, in motion<span>.</span></h2></div><span className="activity-caption"><History size={14} /> Your personal learning trail</span></header>
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="activity-spotlight activity-continue">
            <span className="editorial-badge editorial-badge-terracotta mb-3"><Play size={14} /> Continue watching</span>
            <h2 className="h5">{latestLecture?.title || 'Your next lecture starts here'}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{latestLecture ? `${latestLecture.chapter_title} · Last watched ${dateLabel(latestLecture.last_watched_at)}` : 'Play a lecture and it will appear here when you return.'}</p>
            <Link className="editorial-btn editorial-btn-primary" to={latestLecture ? lectureLink(latestLecture) : '/courses'}>{latestLecture ? 'Continue lecture' : 'Browse lectures'}</Link>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="activity-spotlight activity-latest-test">
            <span className="editorial-badge mb-3"><Trophy size={14} /> Latest result</span>
            <h2 className="h5">{latestTest?.title || 'No tests completed yet'}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{latestTest ? `${latestTest.score} / ${latestTest.totalMarks} marks · ${latestTest.accuracy}% accuracy` : 'Your completed tests and results will appear here.'}</p>
            <Link className="editorial-btn editorial-btn-secondary" to={latestTest ? `/exam/result?attempt=${encodeURIComponent(latestTest.id)}` : '/tests'}>{latestTest ? 'View result' : 'Open test series'}</Link>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="activity-history activity-watch-history">
            <header className="activity-history-header"><div className="activity-history-title"><span className="activity-icon"><Play size={18} /></span><h2>Watch history</h2></div><span className="activity-count">{activity.lectures.length} lectures</span></header>
            {!activity.lectures.length && <div className="activity-empty"><span className="activity-empty-icon"><Play size={28} strokeWidth={1.5} /></span><h3>Make room for a little learning</h3><p>Play a lecture and your personal learning trail will begin here.</p><Link to="/courses">Find your next lecture <ArrowUpRight size={14} /></Link></div>}
            <div className="activity-scroll" tabIndex={0} role="region" aria-label="Learning history entries">
              {activity.lectures.map((item, index) => <Link className="activity-row" to={lectureLink(item)} key={`${item.chapter_id}-${item.lecture_id}`} style={{ '--delay': `${Math.min(index, 6) * 40}ms` }}>
                <span className="activity-row-icon"><Play size={16} /></span><div className="activity-row-copy"><strong>{item.title}</strong><span>{item.chapter_title}</span><time dateTime={item.last_watched_at}>{dateLabel(item.last_watched_at)}</time></div><ArrowUpRight size={17} className="activity-arrow" />
              </Link>)}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="activity-history activity-test-history">
            <header className="activity-history-header"><div className="activity-history-title"><span className="activity-icon"><Trophy size={18} /></span><h2>Test history</h2></div><span className="activity-count">{activity.tests.length} completed</span></header>
            {!activity.tests.length && <div className="activity-empty"><span className="activity-empty-icon"><Trophy size={28} strokeWidth={1.5} /></span><h3>Your first result is ahead</h3><p>Complete a test to see your scores, accuracy and answer reviews here.</p><Link to="/tests">Explore test series <ArrowUpRight size={14} /></Link></div>}
            <div className="activity-scroll" tabIndex={0} role="region" aria-label="Learning history entries">
              {activity.tests.map((item, index) => <Link className="activity-row" to={`/exam/result?attempt=${encodeURIComponent(item.id)}`} key={item.id} style={{ '--delay': `${Math.min(index, 6) * 40}ms` }}>
                <span className="activity-row-icon"><GraduationCap size={18} /></span><div className="activity-row-copy"><strong>{item.title}</strong><time dateTime={item.completedAt}>{dateLabel(item.completedAt)}</time></div><span className="activity-score">{item.score}<small> / {item.totalMarks}</small></span><ArrowUpRight size={17} className="activity-arrow" />
              </Link>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
