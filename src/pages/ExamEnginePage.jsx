import '../styles/mobileExam.css';
import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import RichText from '../components/RichText';

export default function ExamEnginePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, toggleBookmark, bookmarks } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [paper, setPaper] = useState(null);
  const [examLoading, setExamLoading] = useState(true);
  const [examLoadError, setExamLoadError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: 'A' | 'B' | 'C' | 'D' }
  const [statusMap, setStatusMap] = useState({}); // { [qId]: 'answered' | 'marked' | 'unanswered' | 'not-visited' }
  const [timeLeft, setTimeLeft] = useState(90 * 60); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);

  // Fetch Paper and Questions
  useEffect(() => {
    let mounted = true;
    setExamLoading(true);
    setExamLoadError('');
    setPaper(null);
    setQuestions([]);
    fetch(`/api/test-paper/${id}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok || !data.status) throw new Error(data.message || 'The exam questions could not be loaded.');
        return data;
      })
      .then(d => {
        if (!mounted) return;
        if (d.status && d.data) {
          setPaper(d.data.paper);
          const qList = d.data.questions || [];
          setQuestions(qList);
          setTimeLeft((d.data.paper?.durationMinutes || 90) * 60);

          // Initialize statusMap
          const initialStatus = {};
          qList.forEach((q, i) => {
            initialStatus[q._id] = i === 0 ? 'unanswered' : 'not-visited';
          });
          setStatusMap(initialStatus);
        }
      })
      .catch(error => {
        if (mounted) setExamLoadError(error.message || 'Unable to retrieve this paper.');
      })
      .finally(() => {
        if (mounted) setExamLoading(false);
      });
    return () => { mounted = false; };
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (examLoading || examLoadError || !paper || questions.length === 0) return;
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, examLoading, examLoadError, paper, questions.length]);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (!examLoading) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentIndex, examLoading]);

  const handleSelectOption = (key) => {
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ._id]: key }));
    setStatusMap(prev => ({ ...prev, [currentQ._id]: prev[currentQ._id] === 'marked' ? 'marked' : 'answered' }));
  };

  const handleSaveAndNext = () => {
    if (!currentQ) return;
    const selected = answers[currentQ._id];
    setStatusMap(prev => ({
      ...prev,
      [currentQ._id]: selected ? 'answered' : 'unanswered'
    }));

    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      if (statusMap[nextQ._id] === 'not-visited') {
        setStatusMap(prev => ({ ...prev, [nextQ._id]: 'unanswered' }));
      }
      setCurrentIndex(currentIndex + 1);
    } else { setShowSubmitModal(true); }
  };

  const handleMarkForReview = () => {
    if (!currentQ) return;
    setStatusMap(prev => ({
      ...prev,
      [currentQ._id]: 'marked'
    }));

    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      if (statusMap[nextQ._id] === 'not-visited') {
        setStatusMap(prev => ({ ...prev, [nextQ._id]: 'unanswered' }));
      }
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    const updated = { ...answers };
    delete updated[currentQ._id];
    setAnswers(updated);
    setStatusMap(prev => ({ ...prev, [currentQ._id]: 'unanswered' }));
  };

  const handleJumpToQuestion = (index) => {
    const targetQ = questions[index];
    if (statusMap[targetQ._id] === 'not-visited') {
      setStatusMap(prev => ({ ...prev, [targetQ._id]: 'unanswered' }));
    }
    setCurrentIndex(index);
    setShowMobilePalette(false);
  };

  const handleFinalSubmit = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const res = await fetch('/api/test-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: paper?._id || id,
          paperTitle: paper?.title || 'Mock Examination',
          answers,
          timeSpentSeconds: timeSpent
        })
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Exam evaluation failed.');
      if (data.status) {
        showToast('Test evaluated successfully! Loading your score.', 'success');
        navigate('/quiz-result', { state: { result: data.data, paperTitle: paper?.title } });
      }
    } catch (e) {
      showToast(e.message || 'Error evaluating test', 'error');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTimer = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Status counts
  const answeredCount = questions.filter(q => Boolean(answers[q._id])).length;
  const markedCount = Object.values(statusMap).filter(s => s === 'marked').length;
  const notVisitedCount = Object.values(statusMap).filter(s => s === 'not-visited').length;
  const unansweredCount = questions.filter(q => !answers[q._id] && statusMap[q._id] !== 'not-visited').length;

  const isBookmarked = currentQ ? bookmarks.some(b => b.id === currentQ._id) : false;

  if (!paper || questions.length === 0) {
    return (
      <div 
        className="d-flex flex-column align-items-center justify-content-center min-vh-100"
        style={{ backgroundColor: 'var(--app-bg-canvas)', color: 'var(--app-text-primary)' }}
      >
        {examLoading && <div 
          className="spinner-border mb-3" 
          role="status" 
          style={{ width: '2.5rem', height: '2.5rem', color: 'var(--app-accent-warm)' }}
        ></div>}
        <h4 className="fw-semibold">{examLoading ? 'Preparing AIAPGET Examination Environment...' : examLoadError ? 'Unable to load exam questions' : 'No published questions for this exam'}</h4>
        <p className="text-secondary small">{examLoading ? 'Synchronizing question palette, markings, and timer.' : examLoadError || 'Please select a different test paper.'}</p>
        {!examLoading && <Link to="/tests" className="editorial-btn editorial-btn-primary mt-3">Back to Test Series</Link>}
      </div>
    );
  }

  return (
    <div 
      className="exam-simulator-page min-vh-100 d-flex flex-column"
      style={{ backgroundColor: 'var(--app-bg-canvas)', color: 'var(--app-text-primary)' }}
    >
      {/* 1. Distraction-Free Sticky Exam Header */}
      <header 
        className="exam-header sticky-top border-bottom px-3 px-md-4 py-2"
        style={{ 
          backgroundColor: 'var(--app-bg-surface)', 
          borderColor: 'var(--app-border-color)',
          zIndex: 1020,
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="exam-header-layout d-flex align-items-center justify-content-between gap-3">
          {/* Left: Exit + Title */}
          <div className="exam-header-title d-flex align-items-center gap-3 min-w-0">
            <button 
              onClick={() => setShowExitModal(true)}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              title="Exit exam"
              style={{ borderRadius: '8px', padding: '6px 12px' }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span className="d-none d-sm-inline">Exit</span>
            </button>
            <div className="min-w-0">
              <div className="d-flex align-items-center gap-2">
                <span 
                  className="badge px-2 py-0.5" 
                  style={{ 
                    backgroundColor: 'rgba(217, 119, 87, 0.15)', 
                    color: 'var(--app-accent-warm)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em'
                  }}
                >
                  AIAPGET SIMULATOR
                </span>
                <span className="text-secondary small d-none d-md-inline">
                  • {paper.totalQuestions || questions.length} Questions
                </span>
              </div>
              <h1 
                className="h6 mb-0 fw-bold text-truncate" 
                style={{ fontSize: '0.98rem', color: 'var(--app-text-primary)' }}
              >
                {paper.title}
              </h1>
            </div>
          </div>

          {/* Right: Timer Clock, Theme Toggle & Submit Button */}
          <div className="exam-header-controls d-flex align-items-center gap-2 gap-md-3">
            {/* Countdown Box */}
            <div 
              className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 border"
              style={{ 
                backgroundColor: 'var(--app-bg-subtle)',
                borderColor: timeLeft < 300 ? '#ef4444' : 'var(--app-border-color)'
              }}
            >
              <i 
                className={`fa-solid fa-clock ${timeLeft < 300 ? 'text-danger' : 'text-warning'}`}
                style={{ fontSize: '0.9rem' }}
              ></i>
              <span className="text-secondary small d-none d-sm-inline">Left:</span>
              <span 
                className="font-monospace fw-bold" 
                style={{ 
                  fontSize: '1.05rem',
                  color: timeLeft < 300 ? '#ef4444' : 'var(--app-accent-warm)' 
                }}
              >
                {formatTimer(timeLeft)}
              </span>
            </div>

            {/* Mobile Palette Toggle */}
            <button
              onClick={() => setShowMobilePalette(!showMobilePalette)}
              className="exam-question-toggle btn btn-sm btn-outline-secondary d-lg-none"
              title="Jump to a question"
              aria-expanded={showMobilePalette}
              aria-controls="exam-question-palette"
              style={{ borderRadius: '8px', padding: '6px 10px' }}
            >
              <i className="fa-solid fa-table-cells-large"></i><span>Questions</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="exam-theme-toggle btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{ width: '36px', height: '36px', borderRadius: '8px' }}
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-secondary'}`}></i>
            </button>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn btn-sm fw-semibold text-white d-flex align-items-center gap-2"
              style={{ 
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                borderRadius: '8px',
                padding: '7px 16px',
                fontSize: '0.88rem'
              }}
            >
              <i className="fa-solid fa-flag-checkered"></i>
              <span>Submit</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Exam Canvas: Two-Column Responsive Layout */}
      <div className="flex-grow-1 container-fluid px-3 px-md-4 py-3 py-md-4">
        <div className="row g-4">
          {/* Main Column: Active Question + Options */}
          <div className="col-12 col-lg-8 col-xl-9">
            <div 
              className="exam-question-card p-4 p-md-5 rounded-4 border shadow-sm h-100 d-flex flex-column"
              style={{ 
                backgroundColor: 'var(--app-bg-surface)', 
                borderColor: 'var(--app-border-color)' 
              }}
            >
              {/* Question Header: Counter, Subject, Marks, Bookmark */}
              <div 
                className="exam-question-meta d-flex flex-wrap align-items-center justify-content-between gap-2 pb-3 mb-4 border-bottom"
                style={{ borderColor: 'var(--app-border-color)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span 
                    className="badge px-3 py-1.5 fw-bold"
                    style={{ 
                      backgroundColor: 'var(--app-accent-warm)', 
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span 
                    className="badge border px-2.5 py-1"
                    style={{ 
                      backgroundColor: 'var(--app-bg-subtle)', 
                      borderColor: 'var(--app-border-color)',
                      color: 'var(--app-text-secondary)',
                      fontSize: '0.78rem'
                    }}
                  >
                    {currentQ.subject || 'Ayurveda Samhita'}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span 
                    className="badge border px-2.5 py-1 font-monospace"
                    style={{ 
                      backgroundColor: 'rgba(22, 163, 74, 0.1)', 
                      borderColor: 'rgba(22, 163, 74, 0.3)',
                      color: '#16a34a',
                      fontSize: '0.78rem'
                    }}
                  >
                    +{paper.perQMarks || 4} / -{paper.perQNegMarks || 1}
                  </span>

                  <button
                    onClick={() => toggleBookmark({ ...currentQ, paperId: paper?._id || id, paperTitle: paper?.title })}
                    className={`btn btn-sm ${isBookmarked ? 'btn-warning' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: '8px', padding: '4px 10px' }}
                    title={isBookmarked ? 'Bookmarked' : 'Bookmark this question'}
                  >
                    <i className={`fa-solid fa-bookmark ${isBookmarked ? 'text-dark' : ''}`}></i>
                  </button>
                </div>
              </div>

              {/* Question Statement */}
              <div className="question-content-box mb-4 flex-grow-1">
                <RichText
                  as="div"
                  className="fw-medium mb-4"
                  style={{ 
                    fontSize: '1.12rem', 
                    lineHeight: '1.65',
                    color: 'var(--app-text-primary)'
                  }}
                  content={currentQ.question}
                />

                <p className="exam-selection-hint" role="status">{answers[currentQ._id] ? 'Answer selected. You can change it anytime before submitting.' : 'Tap an option to select it. Move freely between questions.'}</p>
                {/* Multiple Choice Options List */}
                <div className="exam-options d-flex flex-column gap-2.5" role="radiogroup" aria-label="Answer options">
                  {currentQ.options.map(opt => {
                    const isSelected = answers[currentQ._id] === opt.key;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => handleSelectOption(opt.key)}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`Option ${opt.key}`}
                        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleSelectOption(opt.key); } }}
                        tabIndex={0}
                        className="exam-option p-3 rounded-3 border d-flex align-items-center gap-3 transition-all"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--app-bg-subtle)' : 'var(--app-bg-surface)',
                          borderColor: isSelected ? 'var(--app-accent-warm)' : 'var(--app-border-color)',
                          boxShadow: isSelected ? '0 0 0 2px rgba(217, 119, 87, 0.25)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: isSelected ? 'var(--app-accent-warm)' : 'var(--app-bg-canvas)',
                            color: isSelected ? '#ffffff' : 'var(--app-text-secondary)',
                            border: `1px solid ${isSelected ? 'var(--app-accent-warm)' : 'var(--app-border-color)'}`,
                            fontSize: '0.88rem'
                          }}
                        >
                          {opt.key}
                        </div>
                        <RichText
                          as="div"
                          className="fw-normal flex-grow-1"
                          style={{ 
                            fontSize: '0.98rem', 
                            color: isSelected ? 'var(--app-text-primary)' : 'var(--app-text-secondary)' 
                          }}
                          content={opt.text}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div 
                className="exam-answer-actions d-flex flex-wrap align-items-center justify-content-between gap-2 pt-4 mt-auto border-top"
                style={{ borderColor: 'var(--app-border-color)' }}
              >
                <div className="d-flex gap-2">
                  <button
                    onClick={handleClearResponse}
                    disabled={!answers[currentQ._id]}
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: '8px', padding: '7px 14px', fontSize: '0.85rem' }}
                  >
                    Clear answer
                  </button>
                  <button
                    onClick={handleMarkForReview}
                    className="btn btn-sm btn-outline-primary"
                    style={{ borderRadius: '8px', padding: '7px 14px', fontSize: '0.85rem' }}
                  >
                    <i className="fa-solid fa-flag me-1"></i> Review later
                  </button>
                </div>

                <div className="d-flex gap-2">
                  <button
                    onClick={() => handleJumpToQuestion(Math.max(currentIndex - 1, 0))}
                    disabled={currentIndex === 0}
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: '8px', padding: '7px 16px', fontSize: '0.85rem' }}
                  >
                    <i className="fa-solid fa-arrow-left me-1"></i> Previous
                  </button>
                  <button
                    onClick={handleSaveAndNext}
                    className="btn btn-sm text-white fw-semibold"
                    style={{ 
                      backgroundColor: 'var(--app-accent-warm)',
                      borderColor: 'var(--app-accent-warm)',
                      borderRadius: '8px', 
                      padding: '7px 20px', 
                      fontSize: '0.85rem' 
                    }}
                  >
                    {currentIndex === questions.length - 1 ? 'Finish' : 'Next'} <i className="fa-solid fa-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Question Palette Sidebar (Hidden on mobile unless toggled) */}
          <div id="exam-question-palette" className={`exam-palette col-12 col-lg-4 col-xl-3 ${showMobilePalette ? 'is-open d-block' : 'd-none d-lg-block'}`} >
            <div 
              className="p-4 rounded-4 border shadow-sm sticky-top"
              style={{ 
                backgroundColor: 'var(--app-bg-surface)', 
                borderColor: 'var(--app-border-color)',
                top: '75px'
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="h6 fw-bold mb-0" style={{ color: 'var(--app-text-primary)' }}>
                  All questions
                </h2>
                <span className="badge bg-secondary-subtle text-secondary small">
                  {questions.length} Total
                </span>
              </div>

              <button type="button" className="exam-palette-close btn btn-outline-secondary d-lg-none w-100 mb-3" onClick={() => setShowMobilePalette(false)}>Back to question</button>
              {/* Status Legend */}
              <div 
                className="row g-2 mb-3 pb-3 border-bottom"
                style={{ borderColor: 'var(--app-border-color)', fontSize: '0.78rem' }}
              >
                <div className="col-6 d-flex align-items-center gap-2">
                  <span 
                    className="rounded-circle d-inline-block" 
                    style={{ width: '12px', height: '12px', backgroundColor: '#16a34a' }}
                  ></span>
                  <span className="text-secondary">Answered: <strong>{answeredCount}</strong></span>
                </div>
                <div className="col-6 d-flex align-items-center gap-2">
                  <span 
                    className="rounded-circle d-inline-block" 
                    style={{ width: '12px', height: '12px', backgroundColor: '#8b5cf6' }}
                  ></span>
                  <span className="text-secondary">Marked: <strong>{markedCount}</strong></span>
                </div>
                <div className="col-6 d-flex align-items-center gap-2">
                  <span 
                    className="rounded-circle d-inline-block" 
                    style={{ width: '12px', height: '12px', backgroundColor: '#ef4444' }}
                  ></span>
                  <span className="text-secondary">Skipped: <strong>{unansweredCount}</strong></span>
                </div>
                <div className="col-6 d-flex align-items-center gap-2">
                  <span 
                    className="rounded-circle d-inline-block" 
                    style={{ width: '12px', height: '12px', backgroundColor: 'var(--app-border-color)' }}
                  ></span>
                  <span className="text-secondary">Not Seen: <strong>{notVisitedCount}</strong></span>
                </div>
              </div>

              {/* Grid of Palette Buttons */}
              <div 
                className="palette-grid p-2 rounded-3 border mb-3"
                style={{ 
                  backgroundColor: 'var(--app-bg-canvas)',
                  borderColor: 'var(--app-border-color)',
                  maxHeight: '360px',
                  overflowY: 'auto'
                }}
              >
                <div className="d-flex flex-wrap gap-1.5" style={{ gap: '6px' }}>
                  {questions.map((q, idx) => {
                    const st = statusMap[q._id] || 'not-visited';
                    const isCurrent = idx === currentIndex;

                    let bg = 'var(--app-bg-surface)';
                    let color = 'var(--app-text-secondary)';
                    let border = '1px solid var(--app-border-color)';

                    if (st === 'answered') {
                      bg = '#16a34a';
                      color = '#ffffff';
                      border = '1px solid #16a34a';
                    } else if (st === 'marked') {
                      bg = '#8b5cf6';
                      color = '#ffffff';
                      border = '1px solid #8b5cf6';
                    } else if (st === 'unanswered') {
                      bg = '#ef4444';
                      color = '#ffffff';
                      border = '1px solid #ef4444';
                    }

                    return (
                      <button
                        key={q._id}
                        onClick={() => handleJumpToQuestion(idx)}
                        className="btn btn-sm p-0 fw-semibold d-flex align-items-center justify-content-center"
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: bg,
                          color: color,
                          border: border,
                          fontSize: '0.8rem',
                          outline: isCurrent ? '2px solid var(--app-accent-warm)' : 'none',
                          outlineOffset: '2px'
                        }}
                        title={`Question ${idx + 1} (${st}${answers[q._id] ? ', answer selected' : ''})`}
                        aria-label={`Question ${idx + 1}, ${answers[q._id] ? 'answered' : st}${st === 'marked' ? ', marked for review' : ''}`}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Test CTA */}
              <button
                onClick={() => setShowSubmitModal(true)}
                className="btn btn-danger w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: '8px', fontSize: '0.9rem' }}
              >
                <i className="fa-solid fa-flag-checkered"></i> Submit Test Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMobilePalette && <button type="button" className="exam-palette-backdrop d-lg-none" aria-label="Close question list" onClick={() => setShowMobilePalette(false)} />}
      {/* 3. Submit Confirmation Modal */}
      {showSubmitModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content border-0 rounded-4 shadow-lg overflow-hidden"
              style={{ backgroundColor: 'var(--app-bg-surface)', color: 'var(--app-text-primary)' }}
            >
              <div className="modal-header border-bottom px-4 py-3" style={{ borderColor: 'var(--app-border-color)' }}>
                <h5 className="modal-title fw-bold">Submit Your Test Paper?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowSubmitModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary small mb-3">
                  Ready to finish? Every selected answer will be submitted, including answers marked for review. You can return to the test to check your selections.
                </p>

                <div 
                  className="p-3 rounded-3 border mb-3"
                  style={{ backgroundColor: 'var(--app-bg-canvas)', borderColor: 'var(--app-border-color)' }}
                >
                  <div className="row g-2 text-center">
                    <div className="col-3">
                      <strong className="d-block text-success fs-5">{answeredCount}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Answered</span>
                    </div>
                    <div className="col-3">
                      <strong className="d-block text-primary fs-5">{markedCount}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Review</span>
                    </div>
                    <div className="col-3">
                      <strong className="d-block text-danger fs-5">{unansweredCount}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Skipped</span>
                    </div>
                    <div className="col-3">
                      <strong className="d-block text-secondary fs-5">{notVisitedCount}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Not Seen</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top px-4 py-3" style={{ borderColor: 'var(--app-border-color)' }}>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={() => setShowSubmitModal(false)}
                  style={{ borderRadius: '8px', padding: '6px 14px' }}
                >
                  Continue Test
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm fw-bold px-4" 
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  style={{ borderRadius: '8px', padding: '6px 18px' }}
                >
                  {submitting ? 'Evaluating Score...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Exit Confirmation Modal */}
      {showExitModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content border-0 rounded-4 shadow-lg overflow-hidden"
              style={{ backgroundColor: 'var(--app-bg-surface)', color: 'var(--app-text-primary)' }}
            >
              <div className="modal-header border-bottom px-4 py-3" style={{ borderColor: 'var(--app-border-color)' }}>
                <h5 className="modal-title fw-bold">Leave Examination?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowExitModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary mb-0">
                  Are you sure you want to exit? Your progress in this session will not be submitted and no score report will be generated.
                </p>
              </div>
              <div className="modal-footer border-top px-4 py-3" style={{ borderColor: 'var(--app-border-color)' }}>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={() => setShowExitModal(false)}
                  style={{ borderRadius: '8px', padding: '6px 14px' }}
                >
                  Stay in Exam
                </button>
                <Link 
                  to="/tests" 
                  className="btn btn-danger btn-sm fw-bold px-3"
                  style={{ borderRadius: '8px', padding: '6px 14px' }}
                >
                  Exit Exam
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
