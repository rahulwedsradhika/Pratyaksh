import { studentFetch } from '../services/studentFetch';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Search, Trash2, ArrowRight } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import { useApp } from '../context/AppContext';
import '../styles/savedQuestions.css';

// Saved content is shown as text; provider markup never becomes executable HTML.
function plain(value) {
  if (!value) return '';
  const document = new DOMParser().parseFromString(String(value), 'text/html');
  document.querySelectorAll('script,style').forEach(node => node.remove());
  return document.body.textContent || '';
}

export default function BookmarksPage() {
  const { bookmarks, bookmarksLoading, bookmarksError, toggleBookmark } = useApp();
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState({});
  const [answers, setAnswers] = useState({});
  const [answerStatus, setAnswerStatus] = useState({});
  async function revealAnswer(id) {
    if (revealed[id]) { setRevealed(previous => ({ ...previous, [id]: false })); return; }
    setRevealed(previous => ({ ...previous, [id]: true }));
    setAnswerStatus(previous => ({ ...previous, [id]: 'loading' }));
    try {
      const response = await studentFetch(`/api/student/bookmarks/${encodeURIComponent(id)}/answer`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok || !body.status) throw new Error('Answer could not be loaded. Hide and show it again to retry.');
      setAnswers(previous => ({ ...previous, [id]: body.data }));
      setAnswerStatus(previous => ({ ...previous, [id]: 'ready' }));
    } catch (error) { setAnswerStatus(previous => ({ ...previous, [id]: error.message })); }
  }
  const [removing, setRemoving] = useState(null);
  const filtered = bookmarks.filter(item => `${plain(item.question)} ${plain(item.questionEng)} ${plain(item.paperTitle)}`.toLowerCase().includes(search.trim().toLowerCase()));
  async function remove(question) {
    setRemoving(question.id);
    try { await toggleBookmark(question); } finally { setRemoving(null); }
  }
  return <StudentAppShell><PageContainer>
    <div className="mb-4">
      <span className="editorial-badge editorial-badge-terracotta mb-2"><Bookmark size={13} /> Study Revision</span>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Saved Questions</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Questions you bookmark during tests, collected for your revision.</p>
    </div>
    {bookmarksLoading ? <p role="status">Loading your saved questions…</p> : bookmarksError ? <div role="alert" className="editorial-card p-4">{bookmarksError}</div> : bookmarks.length === 0 ?
      <div className="editorial-card p-5 text-center" style={{ maxWidth: 540, margin: '3rem auto' }}>
        <Bookmark size={32} className="mb-3" style={{ color: 'var(--brand-terracotta)' }} />
        <h2 className="h4">No saved questions yet</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Tap the bookmark button on a question during a test. It will appear here for revision.</p>
        <Link to="/tests" className="editorial-btn editorial-btn-primary">Browse test series <ArrowRight size={15} /></Link>
      </div> : <>
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <span className="editorial-badge">{bookmarks.length} saved questions</span>
        <label className="saved-questions-search"><Search size={17} aria-hidden="true" /><input className="editorial-search-input" type="search" aria-label="Search saved questions" placeholder="Search saved questions…" value={search} onChange={event => setSearch(event.target.value)} /></label>
      </div>
      {!filtered.length && <p role="status">No saved questions match your search.</p>}
      <div className="d-flex flex-column gap-4">
        {filtered.map(saved => ({ ...saved, ...(answers[saved.id] || {}) })).map((item, index) => <article key={item.id} className="editorial-card p-4">
          <header className="d-flex align-items-start justify-content-between gap-3 mb-3">
            <div><span className="editorial-badge mb-2">Question {index + 1}</span>{item.paperTitle && <p className="small mb-1" style={{ color: 'var(--text-secondary)' }}>{plain(item.paperTitle)}</p>}{item.savedAt && <time className="small" style={{ color: 'var(--text-muted)' }} dateTime={item.savedAt}>Saved {new Date(item.savedAt).toLocaleDateString('en-IN')}</time>}</div>
            <button type="button" className="editorial-btn editorial-btn-secondary" disabled={removing === item.id} aria-label={`Remove saved question ${index + 1}`} onClick={() => remove(item)}><Trash2 size={15} />{removing === item.id ? 'Removing…' : 'Remove'}</button>
          </header>
          <h2 style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{plain(item.question)}</h2>
          {item.questionEng && item.questionEng !== item.question && <p>{plain(item.questionEng)}</p>}
          <div className="row g-2 mt-2">{item.options?.map(option => <div className="col-12 col-md-6" key={option.key}><div style={{ border: revealed[item.id] && option.key === item.correctOption ? '2px solid var(--status-correct, #398260)' : '1px solid var(--border-subtle)', borderRadius: 10, padding: '.8rem', lineHeight: 1.7 }}><strong>{option.key}.</strong> {plain(option.text)}</div></div>)}</div>
          <button type="button" className="editorial-btn editorial-btn-secondary mt-3" aria-expanded={Boolean(revealed[item.id])} aria-controls={`answer-${item.id}`} onClick={() => revealAnswer(item.id)}>
            {revealed[item.id] ? 'Hide answer & reference' : 'Show answer & reference'}
          </button>
          {revealed[item.id] && <section id={`answer-${item.id}`} className="mt-3 p-3" aria-label="Answer and reference" style={{ background: 'var(--bg-subtle)', borderRadius: 12, lineHeight: 1.8 }}>
            {answerStatus[item.id] !== 'ready' ? <p role="status" className="mb-0">{answerStatus[item.id] === 'loading' ? 'Loading answer and reference…' : answerStatus[item.id]}</p> : <>
            <h3 className="h6">Correct answer</h3>
            <p>{item.correctOption ? <><strong>{item.correctOption}.</strong> {plain(item.options?.find(option => option.key === item.correctOption)?.text)}</> : 'The answer key is not available in the local question data.'}</p>
            {plain(item.explanation) && <><h3 className="h6">Explanation</h3><p style={{ whiteSpace: 'pre-wrap' }}>{plain(item.explanation)}</p></>}
            <h3 className="h6">Reference</h3>
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{plain(item.samhitaReference) || 'No reference was provided with this question.'}</p>
            </>}
          </section>}
        </article>)}
      </div>
    </>}
  </PageContainer></StudentAppShell>;
}
