import { studentFetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Award, RotateCcw, ChevronRight, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import StudentAppShell from '../components/shell/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import RichText from '../components/RichText';

export default function TestResultPage() {
  const location = useLocation();
  const [saved, setSaved] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const attempt = new URLSearchParams(location.search).get('attempt');
  const [loading, setLoading] = useState(Boolean(attempt));
  useEffect(() => {
    let active = true;
    setSaved(null);
    setFetchError('');
    setLoading(Boolean(attempt));
    if (attempt) studentFetch(`/api/student/activity/tests/${encodeURIComponent(attempt)}`)
      .then(async response => {
        const body = await response.json();
        if (!response.ok || !body.status) throw new Error('Unable to load this test result.');
        if (active) setSaved(body.data);
      }).catch(error => { if (active) setFetchError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const result = saved?.result || location.state?.result;
  const paperTitle = saved?.paperTitle || location.state?.paperTitle || 'Test Result';
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'unattempted'

  if (loading || fetchError) return <StudentAppShell><PageContainer><p role="status">{fetchError || 'Loading test result…'}</p></PageContainer></StudentAppShell>;

  if (!result) {
    return (
      <StudentAppShell>
        <PageContainer maxWidth="640px">
          <div className="editorial-card text-center p-5 my-5">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--brand-terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <Award size={26} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              No Recent Test Result Found
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
              Attempt an AIAPGET mock test or subject assessment from the test series to view your score breakdown, accuracy, and classical answersheet.
            </p>
            <Link
              to="/tests"
              className="editorial-btn editorial-btn-primary"
              style={{ padding: '0.55rem 1.25rem' }}
            >
              <span>Browse Test Series</span>
            </Link>
          </div>
        </PageContainer>
      </StudentAppShell>
    );
  }

  const { 
    score, 
    totalMarks, 
    accuracy, 
    correctCount, 
    incorrectCount, 
    unattemptedCount, 
    timeSpentSeconds, 
    detailedReview = [] 
  } = result;

  const filteredReview = detailedReview.filter(q => {
    if (filter === 'correct') return q.status === 'correct';
    if (filter === 'incorrect') return q.status === 'incorrect';
    if (filter === 'unattempted') return q.status === 'unattempted';
    return true;
  });

  return (
    <StudentAppShell>
      <PageContainer maxWidth="960px">
        {/* 1. Natural Page Header & Breadcrumb */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <Link to="/tests" style={{ color: 'var(--text-muted)' }}>Test Series</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Evaluation Report</span>
          </div>

          <div className="editorial-badge editorial-badge-terracotta mb-2">
            <Award size={13} />
            <span>Score Card &amp; Analysis</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {paperTitle}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            Evaluated under standard AIAPGET marking criteria (+4 for correct, -1 for negative marking).
          </p>
        </div>

        {/* 2. Score Summary Metrics Card */}
        <div className="editorial-card p-4 p-md-5 mb-4">
          <div className="row g-3 g-md-4 text-center justify-content-center mb-4">
            <div className="col-6 col-md-3">
              <div 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '10px', 
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Final Score
                </span>
                <div 
                  className="font-monospace fw-bold" 
                  style={{ fontSize: '1.85rem', color: score >= 0 ? '#2D7A4D' : '#C24136', lineHeight: 1.15 }}
                >
                  {score} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {totalMarks}</span>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '10px', 
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Accuracy
                </span>
                <div 
                  className="font-monospace fw-bold" 
                  style={{ fontSize: '1.85rem', color: 'var(--brand-terracotta)', lineHeight: 1.15 }}
                >
                  {accuracy}%
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '10px', 
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Correct / Incorrect
                </span>
                <div className="font-monospace fw-bold" style={{ fontSize: '1.85rem', lineHeight: 1.15 }}>
                  <span style={{ color: '#2D7A4D' }}>{correctCount}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 0.25rem' }}>/</span>
                  <span style={{ color: '#C24136' }}>{incorrectCount}</span>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '10px', 
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Time Taken
                </span>
                <div 
                  className="font-monospace fw-bold" 
                  style={{ fontSize: '1.85rem', color: 'var(--text-primary)', lineHeight: 1.15 }}
                >
                  {Math.floor((timeSpentSeconds || 0) / 60)}m {(timeSpentSeconds || 0) % 60}s
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/tests"
              className="editorial-btn editorial-btn-primary"
              style={{ padding: '0.5rem 1.25rem' }}
            >
              <RotateCcw size={15} />
              <span>Take Another Test</span>
            </Link>
            <Link
              to="/performance"
              className="editorial-btn editorial-btn-secondary"
              style={{ padding: '0.5rem 1.25rem' }}
            >
              <span>View Analytics</span>
            </Link>
          </div>
        </div>

        {/* 3. Detailed Answersheet Section */}
        {detailedReview.length > 0 && (
          <div className="editorial-card p-4 p-md-5">
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '1.5rem', 
                paddingBottom: '0.75rem', 
                borderBottom: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  Detailed Answersheet &amp; Commentary
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Showing {filteredReview.length} of {detailedReview.length} questions
                </span>
              </div>

              {/* Filter Tabs */}
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '0.25rem', 
                  padding: '3px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {[
                  { id: 'all', label: `All (${detailedReview.length})` },
                  { id: 'correct', label: `Correct (${correctCount})` },
                  { id: 'incorrect', label: `Incorrect (${incorrectCount})` },
                  { id: 'unattempted', label: `Skipped (${unattemptedCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    type="button"
                    style={{
                      background: filter === tab.id ? 'var(--bg-surface)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: filter === tab.id ? 650 : 500,
                      color: filter === tab.id ? 'var(--brand-terracotta)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      boxShadow: filter === tab.id ? 'var(--shadow-xs)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Review List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredReview.map((q, idx) => {
                const isCorrect = q.status === 'correct';
                const isUnattempted = q.status === 'unattempted';

                return (
                  <div
                    key={q.questionId || idx}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="editorial-badge" style={{ fontSize: '0.72rem' }}>
                        Question {idx + 1}
                      </span>

                      {isCorrect ? (
                        <span className="editorial-badge editorial-badge-success" style={{ fontSize: '0.72rem' }}>
                          <CheckCircle2 size={12} /> Correct
                        </span>
                      ) : isUnattempted ? (
                        <span className="editorial-badge" style={{ fontSize: '0.72rem' }}>
                          Unattempted (0)
                        </span>
                      ) : (
                        <span 
                          className="editorial-badge" 
                          style={{ backgroundColor: 'var(--status-incorrect-bg)', color: 'var(--status-incorrect)', fontSize: '0.72rem' }}
                        >
                          <XCircle size={12} /> Incorrect
                        </span>
                      )}
                    </div>

                    <RichText
                      as="div"
                      className="devanagari-text mb-3"
                      style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}
                      content={q.questionText}
                    />

                    <div className="row g-2 mb-3" aria-label="Question options">
                      {q.options?.map(option => <div className="col-12 col-md-6" key={option.key}>
                        <div style={{ padding: '.85rem', borderRadius: 10, height: '100%', border: `1px solid ${option.key === q.correctOption ? 'var(--status-correct, #398260)' : option.key === q.selectedOption ? 'var(--status-incorrect, #b9432c)' : 'var(--border-subtle)'}`, background: 'var(--bg-surface)' }}>
                          <div className="d-flex justify-content-between gap-2 mb-1"><strong>{option.key}.</strong><span className="small">{option.key === q.correctOption ? 'Correct answer' : ''}{option.key === q.selectedOption ? ' · Your selection' : ''}</span></div>
                          <RichText content={option.text} />
                        </div>
                      </div>)}
                      {!q.options?.length && <p className="small text-muted">Options are unavailable in this saved attempt.</p>}
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-12 col-sm-6">
                        <div 
                          style={{ 
                            padding: '0.65rem 0.85rem', 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Your Selection: </span>
                          <strong style={{ color: isCorrect ? '#2D7A4D' : isUnattempted ? 'var(--text-muted)' : '#C24136' }}>
                            {q.selectedOption || 'Skipped'}
                          </strong>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div 
                          style={{ 
                            padding: '0.65rem 0.85rem', 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Correct Answer: </span>
                          <strong style={{ color: '#2D7A4D' }}>
                            {q.correctOption}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {(q.explanation || q.reference) && (
                      <div
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.85rem',
                          lineHeight: 1.6
                        }}
                      >
                        <strong style={{ color: 'var(--brand-terracotta)', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                          Classical Commentary Analysis:
                        </strong>
                        {q.explanation && (
                          <RichText as="div" style={{ color: 'var(--text-secondary)' }} content={q.explanation} />
                        )}
                        {q.reference && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span className="editorial-badge" style={{ fontSize: '0.72rem' }}>
                              <RichText content={q.reference} />
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PageContainer>
    </StudentAppShell>
  );
}
