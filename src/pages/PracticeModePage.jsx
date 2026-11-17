import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Target, ChevronRight, ArrowLeft, ArrowRight, Bookmark, Check, X as CloseIcon, ListFilter } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import RichText from '../components/RichText';
import { useApp } from '../context/AppContext';

export default function PracticeModePage() {
  const { id } = useParams();
  const testId = id || '6440dfbc632c6415afe69bc0';

  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const { bookmarks, setBookmarks, showToast } = useApp() || {};

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError('');
    setQuestions([]);
    setPaper(null);

    fetch(`/api/student/quiz-practice/${testId}`)
      .then(async r => {
        const d = await r.json();
        if (!r.ok || !d.status) throw new Error(d.message || 'Unable to load this practice paper.');
        return d;
      })
      .then(d => {
        if (!mounted) return;
        if (d.status && d.data) {
          setPaper(d.data.paper);
          if (d.data.questions && Array.isArray(d.data.questions)) {
            setQuestions(d.data.questions);
          }
        }
      })
      .catch(error => {
        if (mounted) setLoadError(error.message || 'Unable to retrieve practice questions.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [testId]);

  const currentQ = questions[currentIndex];
  const selectedOption = selectedAnswers[currentIndex] || null;
  const isAnswered = selectedOption !== null;

  const handleSelectOption = (key) => {
    if (isAnswered) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: key
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const isCurrentBookmarked = bookmarks?.some(b => b.id === (currentQ?._id || currentIndex));

  const toggleBookmark = () => {
    if (!currentQ) return;
    const qId = currentQ._id || currentIndex;
    if (isCurrentBookmarked) {
      setBookmarks?.(prev => prev.filter(b => b.id !== qId));
      showToast?.('Removed from saved questions', 'info');
    } else {
      const newBookmark = {
        id: qId,
        question: currentQ.question,
        reference: currentQ.explanation,
        testId: testId,
        savedAt: new Date().toISOString()
      };
      setBookmarks?.(prev => [...(prev || []), newBookmark]);
      showToast?.('Question saved for revision!', 'success');
    }
  };

  return (
    <StudentAppShell>
      <PageContainer maxWidth="880px">
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <Link to="/tests" style={{ color: 'var(--text-muted)' }}>Tests</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {paper?.title || 'Practice Mode'}
            </span>
          </div>
        </div>

        {/* Status Bar */}
        <div 
          className="editorial-card p-3 p-md-4 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div>
            <div className="editorial-badge editorial-badge-terracotta mb-1">
              <Target size={13} />
              <span>Self-Paced Practice</span>
            </div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
              {paper?.title || 'Classical Samhita Practice'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="editorial-badge" style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}>
              Question {questions.length ? currentIndex + 1 : 0} of {questions.length}
            </span>

            <button
              type="button"
              onClick={toggleBookmark}
              className="editorial-btn editorial-btn-secondary"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '8px',
                color: isCurrentBookmarked ? 'var(--brand-terracotta)' : 'var(--text-muted)'
              }}
              title={isCurrentBookmarked ? "Remove bookmark" : "Save question for revision"}
              aria-label="Bookmark question"
            >
              <Bookmark size={16} fill={isCurrentBookmarked ? "currentColor" : "none"} />
            </button>

            <button
              type="button"
              onClick={() => setPaletteOpen(prev => !prev)}
              className="editorial-btn editorial-btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              title="Question Palette"
            >
              <ListFilter size={14} />
              <span className="d-none d-sm-inline">Palette</span>
            </button>
          </div>
        </div>

        {/* Question Palette Drawer Overlay */}
        {paletteOpen && (
          <div className="editorial-card p-4 mb-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Question Navigation Palette ({questions.length} Questions)
              </div>
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {questions.map((_, i) => {
                const ans = selectedAnswers[i];
                const isCur = i === currentIndex;
                let bg = 'var(--bg-subtle)';
                let color = 'var(--text-primary)';
                if (ans !== undefined) {
                  bg = 'var(--status-correct-bg)';
                  color = 'var(--status-correct)';
                }
                if (isCur) {
                  bg = 'var(--button-primary-bg)';
                  color = 'var(--button-primary-ink)';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setCurrentIndex(i); setPaletteOpen(false); }}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: bg,
                      color: color,
                      fontSize: '0.8rem',
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Question Card */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--brand-terracotta)', width: '2rem', height: '2rem' }} role="status"></div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading question...</p>
          </div>
        ) : !currentQ ? (
          <div className="editorial-card text-center p-5">
            <h5>{loadError ? 'Unable to load this practice paper' : 'No published questions in this practice set.'}</h5>
            {loadError && <p style={{ color: 'var(--text-secondary)' }}>{loadError}</p>}
            <Link to="/tests" className="editorial-btn editorial-btn-primary mt-3">Return to Test Series</Link>
          </div>
        ) : (
          <div className="editorial-card p-4 p-md-5 mb-4">
            {/* Question Number Heading */}
            <div style={{ fontSize: '0.85rem', fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              Question No. {currentIndex + 1}
            </div>

            {/* Bilingual Question Text (Hindi / Sanskrit / English) */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div className="devanagari-text" style={{ fontSize: '1.15rem', fontWeight: 650, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '0.5rem' }}>
                <RichText content={currentQ.question} />
              </div>
              {currentQ.questionEng && currentQ.questionEng !== currentQ.question && (
                <div style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  <RichText content={currentQ.questionEng} />
                </div>
              )}
            </div>

            {/* 4 Interactive Option Rows */}
            <div className="options-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {currentQ.options.map((opt) => {
                const isSelected = selectedOption === opt.key;
                const isCorrect = currentQ.correctOption && currentQ.correctOption.toUpperCase() === opt.key.toUpperCase();

                let cardBg = 'var(--bg-subtle)';
                let borderColor = 'var(--border-subtle)';
                let textColor = 'var(--text-primary)';
                let icon = null;

                if (isAnswered) {
                  if (isCorrect) {
                    cardBg = 'var(--status-correct-bg)';
                    borderColor = 'var(--status-correct-border)';
                    textColor = 'var(--status-correct)';
                    icon = <Check size={16} color="var(--status-correct)" style={{ marginLeft: '0.5rem' }} />;
                  } else if (isSelected && !isCorrect) {
                    cardBg = 'var(--status-incorrect-bg)';
                    borderColor = 'var(--status-incorrect-border)';
                    textColor = 'var(--status-incorrect)';
                    icon = <CloseIcon size={16} color="var(--status-incorrect)" style={{ marginLeft: '0.5rem' }} />;
                  }
                }

                return (
                  <div 
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: cardBg,
                      border: `1.5px solid ${borderColor}`,
                      cursor: isAnswered ? 'default' : 'pointer',
                      color: textColor,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Option Radio Letter (A) / (B) / (C) / (D) */}
                    <span 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: `1.5px solid ${borderColor}`,
                        backgroundColor: isAnswered && (isCorrect || isSelected) ? borderColor : 'var(--bg-surface)',
                        color: textColor,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {opt.key}
                    </span>

                    {/* Option Text */}
                    <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: (isAnswered && (isCorrect || isSelected)) ? 650 : 500, display: 'flex', alignItems: 'center' }}>
                      <RichText content={opt.text} />
                      {icon}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Classical Commentary Citation Reference */}
            {isAnswered && currentQ.explanation && (
              <div 
                style={{ 
                  backgroundColor: 'var(--bg-accent-tint)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '10px', 
                  padding: '0.85rem 1rem', 
                  marginBottom: '1.5rem',
                  fontSize: '0.88rem' 
                }}
              >
                <span style={{ fontWeight: 650, color: 'var(--brand-terracotta)' }}>Classical Reference: </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentQ.explanation}</span>
              </div>
            )}

            {/* Previous & Next Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="editorial-btn editorial-btn-secondary"
                style={{ 
                  opacity: currentIndex === 0 ? 0.45 : 1,
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <ArrowLeft size={15} />
                <span>Previous</span>
              </button>

              <button 
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= questions.length - 1}
                className="editorial-btn editorial-btn-primary"
                style={{ 
                  opacity: currentIndex >= questions.length - 1 ? 0.45 : 1,
                  cursor: currentIndex >= questions.length - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <span>Next</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </PageContainer>
    </StudentAppShell>
  );
}
