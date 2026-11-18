import {isAppleTouchDevice,getAppleLectureLaunchUrl} from '../utils/appleVideoCompatibility';
import NoteActions from '../components/NoteActions';
import { notesForLecture } from '../services/lectureNotes';
import '../styles/classroom.css';
import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { 
  Play, 
  FileText, 
  Target, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import { saveLectureHistory } from '../services/lectureHistory';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';

export default function LessonViewPage() {
  const { subId, id } = useParams();
  const chapterId = id || subId;
  const location = useLocation();
  const requestedLecture = new URLSearchParams(location.search).get('lecture');

  const [chapter, setChapter] = useState(null);
  const [activeTab, setActiveTab] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [historyError, setHistoryError] = useState('');


  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError('');
    setActiveLessonIndex(null);
    setLessons([]);
    setNotes([]);

    fetch(`/api/student/chapter-details/${chapterId}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok || !data.status) throw new Error(data.code === 'CONTENT_SOURCE_AUTH_REQUIRED'
          ? 'The production lecture and notes provider has denied access. Please contact support to reconnect the content service.'
          : data.message || 'Unable to load this chapter. Please try again.');
        return data;
      })
      .then(d => {
        if (!mounted) return;
        if (d.status && d.data) {
          setChapter(d.data);
          const selected = (d.data.videos || []).findIndex(video => (video._id || video.id) === requestedLecture);
          setActiveLessonIndex(selected >= 0 ? selected : null);
          if (d.data.videos && d.data.videos.length > 0) {
            setLessons(d.data.videos.map((v, i) => {
              const bId = v.bunnyID || v.bunny_id || '';
              return {
                ...v,
                _id: v._id || v.id || `v_${i}`,
                title: v.title,
                duration: v.duration || '',
                bunnyID: bId,
                bunny_id: bId,
                directPlayUrl: v.directPlayUrl || (bId ? `https://player.mediadelivery.net/play/330113/${bId}` : ''),
                thumbnailUrl: v.thumbnailUrl || (bId ? `/api/video/thumbnail/${bId}` : ''),
                secureEmbedUrl: v.secureEmbedUrl || '',
                videoUrl: v.secureEmbedUrl || (bId ? `https://iframe.mediadelivery.net/embed/330113/${bId}?autoplay=false` : '')
              };
            }));
          }
          if (d.data.notes) {
            setNotes(d.data.notes);
          }

        }
      })
      .catch(error => { if (mounted) setLoadError(error.message); })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [chapterId, requestedLecture]);

  const appleTouch = typeof navigator !== 'undefined' && isAppleTouchDevice(navigator);
  const activeLesson = activeLessonIndex === null ? null : lessons[activeLessonIndex];
  const activeNotes = notesForLecture(activeLesson, notes, lessons);
  const activeLectureId = activeLesson?._id;
  useEffect(() => {
    if (loading || !activeLectureId || appleTouch) return;
    let active = true;
    setHistoryError('');
    saveLectureHistory({ chapterId, lectureId: activeLectureId })
      .catch(error => { if (active) setHistoryError(error.message); });
    return () => { active = false; };
  }, [loading, chapterId, activeLectureId, appleTouch]);


  return (
    <StudentAppShell>
      <PageContainer>
        <div className="simple-classroom">
        {historyError && <p role="status" className="editorial-card p-3">{historyError}</p>}
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <Link to="/courses" style={{ color: 'var(--text-muted)' }}>Courses</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {chapter?.name || 'Classroom'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--brand-terracotta)', width: '2rem', height: '2rem' }} role="status"></div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading classroom &amp; video lectures...</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="editorial-card p-4" style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: 20 }}>Classroom content could not load</h2>
            <p>{loadError}</p>
            <a href="tel:+918795776006">Call support: +91 8795776006</a>
          </div>
        ) : (
          <div>
            {/* Chapter Header Card */}
            <div 
              className="classroom-chapter-summary editorial-card p-3 p-md-4 mb-4 d-flex flex-column flex-sm-row align-items-center gap-3 gap-md-4"
              style={{ backgroundColor: 'var(--bg-accent-tint)' }}
            >
              {/* Thumbnail */}
              <div 
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '10px', 
                  overflow: 'hidden', 
                  flexShrink: 0,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img 
                  src={chapter?.img ? (chapter.img.startsWith('http') ? chapter.img : `/${chapter.img}`) : '/upload/1778774858960_1719243095255_Cha. Su. 1.jpg'} 
                  alt={chapter?.name || 'Chapter'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/upload/1778774858960_1719243095255_Cha. Su. 1.jpg';
                  }}
                />
              </div>

              {/* Metadata */}
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="editorial-badge" style={{ fontSize: '0.72rem' }}>
                    Faculty: {chapter?.faculty || 'Dr. Rahul Parihar'}
                  </span>
                </div>
                <h1 className="classroom-chapter-title" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {chapter?.name || 'Charaka Sutra 1'}
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  <span className="devanagari-text" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{chapter?.desc || chapter?.description || 'दीर्घञ्जीवितीय अध्याय'}</span>
                </p>
              </div>
            </div>

            {/* 3 Unified Navigation Tabs */}
            <div className="classroom-tab-list" role="tablist" aria-label="Chapter learning sections" style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', gap: '1.5rem' }}>
              <button 
                type="button"
                onClick={() => setActiveTab('lessons')}
                role="tab" aria-selected={activeTab === 'lessons'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 0.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 650,
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'lessons' ? 'var(--brand-terracotta)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'lessons' ? '2px solid var(--brand-terracotta)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <Play size={16} />
                <span>Lectures {lessons.length > 0 && `(${lessons.length})`}</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('notes')}
                role="tab" aria-selected={activeTab === 'notes'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 0.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 650,
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'notes' ? 'var(--brand-terracotta)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'notes' ? '2px solid var(--brand-terracotta)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <FileText size={16} />
                <span>Notes {notes.length > 0 && `(${notes.length})`}</span>
              </button>


            </div>

            {/* Lecture picker and current video */}
            {activeTab === 'lessons' && (
              <div className="row g-4 classroom-player-layout">
                {/* Main Video Stage */}
                <div className="col-12">
                  <div className="editorial-card classroom-player-card p-3 p-md-4">
                    {activeLesson && <button type="button" className="classroom-back" onClick={() => setActiveLessonIndex(null)}><ArrowLeft size={17}/>All lectures <span>{activeLessonIndex + 1} of {lessons.length}</span></button>}
                    {activeLesson ? (
                      <VideoPlayer
                        src={activeLesson.videoUrl || ""}
                        secureEmbedUrl={activeLesson.secureEmbedUrl || ""}
                        directPlayUrl={activeLesson.directPlayUrl || ""}
                        bunnyId={activeLesson.bunnyID || activeLesson.bunny_id}
                        title={activeLesson.title}
                        faculty={chapter?.faculty || ""}
                        lessonId={activeLesson._id}
                        onPlayback={positionSeconds => {
                          saveLectureHistory({ chapterId, lectureId: activeLesson._id, positionSeconds })
                            .then(() => setHistoryError(''))
                            .catch(error => setHistoryError(error.message));
                        }}
                        durationStr={activeLesson.duration}
                        hasNext={activeLessonIndex < lessons.length - 1}
                        hasPrev={activeLessonIndex > 0}
                        onNext={() => setActiveLessonIndex(prev => Math.min(prev + 1, lessons.length - 1))}
                        onPrev={() => setActiveLessonIndex(prev => Math.max(prev - 1, 0))}
                      />
                    ) : lessons.length > 0 ? (
                      <div className="classroom-lecture-list">
                        <div className="classroom-list-heading"><h2>Available lectures</h2><p>Choose a lecture to start learning.</p></div>
                        {lessons.map((lesson, index) => {
                          const launchUrl=appleTouch?getAppleLectureLaunchUrl({secureEmbedUrl:lesson.secureEmbedUrl,src:lesson.videoUrl,directPlayUrl:lesson.directPlayUrl,bunnyId:lesson.bunnyID||lesson.bunny_id}):'';
                          const LectureAction=launchUrl?'a':'button';
                          return <LectureAction {...(launchUrl?{href:launchUrl,target:'_blank',rel:'noopener noreferrer'}:{type:'button'})} className="classroom-lecture-row" key={lesson._id} onClick={() => {
                            setActiveLessonIndex(index);
                            if(launchUrl)saveLectureHistory({chapterId,lectureId:lesson._id}).catch(error=>setHistoryError(error.message));
                          }}>
                          <span className="classroom-lecture-number">{index + 1}</span>
                          <span className="classroom-lecture-label"><strong>{lesson.title || `Lecture ${index + 1}`}</strong>{lesson.duration && <small><Clock size={13}/>{lesson.duration}</small>}</span>
                          <span className="classroom-lecture-play"><Play size={18}/><span>Watch</span></span>
                        </LectureAction>;})}
                      </div>
                    ) : (
                      <div className="text-center py-5 text-muted">
                        <BookOpen size={36} color="var(--brand-terracotta)" style={{ margin: '0 auto 1rem auto' }} />
                        <h5>No lectures uploaded for this chapter yet.</h5>
                      </div>
                    )}
                    {activeLesson && activeNotes.length > 0 && <section className="classroom-player-notes" aria-label="Lecture notes">
                      <h2>Lecture notes</h2>
                      <p>View a PDF or download it for later.</p>
                      {activeNotes.map(note => <div className="classroom-player-note" key={note._id || note.id}>
                        <span><FileText size={18}/><strong>{note.title || 'Chapter notes'}</strong></span>
                        <NoteActions noteId={note._id || note.id} title={note.title}/>
                      </div>)}
                    </section>}


                  </div>
                </div>


              </div>
            )}

            {/* TAB 2: NOTES & HANDOUTS */}
            {activeTab === 'notes' && (
              <div>
                {notes.length === 0 ? (
                  <div className="editorial-card text-center p-5">
                    <FileText size={36} color="var(--brand-terracotta)" style={{ margin: '0 auto 1rem auto' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      No digital notes available yet
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Commentary handouts for this chapter will be uploaded soon.
                    </p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {notes.map((note) => (
                      <div key={note._id} className="col-12 col-md-6 col-lg-4">
                        <div className="editorial-card p-4 h-100 d-flex flex-column justify-content-between">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                              <div style={{ color: 'var(--brand-terracotta)' }}><FileText size={22} /></div>
                              <h3 style={{ fontSize: '0.98rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
                                {note.title}
                              </h3>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                              {note.description || 'Authentic verse-by-verse classical commentary analysis.'}
                            </p>
                          </div>

                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <NoteActions noteId={note._id || note.id} title={note.title} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


          </div>
        )}
        </div>
      </PageContainer>
    </StudentAppShell>
  );
}
