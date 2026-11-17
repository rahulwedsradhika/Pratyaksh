import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ChevronRight, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';

export default function SubjectModulesPage() {
  const { id } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetch(`/api/student/mySubjects/course/${id}`).then(r => r.json()).catch(() => ({ status: false })),
      fetch(`/api/course/${id}`).then(r => r.json()).catch(() => ({ status: false }))
    ])
      .then(([subRes, courseRes]) => {
        if (!mounted) return;
        if (courseRes.status && courseRes.data) {
          setCourse(courseRes.data);
        }

        if (subRes.status && subRes.data && subRes.data.length > 0) {
          setSubjects(subRes.data);
        } else if (courseRes.status && courseRes.data?.subjects) {
          setSubjects(courseRes.data.subjects);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <StudentAppShell>
      <PageContainer>
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <Link to="/courses" style={{ color: 'var(--text-muted)' }}>Courses</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{course?.name || 'Subjects'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="editorial-badge editorial-badge-terracotta mb-2">
                <Layers size={13} />
                <span>Samhita Subjects &amp; Sthanas</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {course?.name || 'Academic Subjects'}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
                Select a Samhita subject to access Adhyaya lecture videos, classical commentary notes, and topic-wise practice tests.
              </p>
            </div>

            <Link to="/courses" className="editorial-btn editorial-btn-secondary" style={{ fontSize: '0.82rem' }}>
              <ArrowLeft size={14} />
              <span>Back to Courses</span>
            </Link>
          </div>
        </div>

        {/* 3-Column Subject Cards Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--brand-terracotta)', width: '2rem', height: '2rem' }} role="status"></div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading subject curriculum...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="editorial-card text-center p-5" style={{ maxWidth: '480px', margin: '2rem auto' }}>
            <BookOpen size={36} color="var(--brand-terracotta)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No subjects found for this course
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Please check back soon or explore other available courses.
            </p>
            <Link to="/courses" className="editorial-btn editorial-btn-secondary" style={{ fontSize: '0.85rem' }}>
              Explore Other Courses
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {subjects.map((sub) => {
              const imgUrl = sub.img 
                ? (sub.img.startsWith('http') ? sub.img : `/${sub.img}`)
                : '/upload/1777645267248_19.png';
              
              const chapCount = sub.chapterCount || sub.chaptersCount || (sub.name?.includes('Purvardha') ? 85 : sub.name?.includes('Uttarardha') ? 53 : 0);
              const subId = sub._id || sub.id;

              return (
                <div key={subId} className="col-lg-4 col-md-6">
                  <div className="editorial-card h-100 d-flex flex-column justify-content-between">
                    {/* Subject Artwork Thumbnail */}
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)', position: 'relative' }}>
                      <img
                        src={imgUrl}
                        alt={sub.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/upload/1777645267248_19.png';
                        }}
                      />
                      {chapCount > 0 && (
                        <span 
                          className="editorial-badge" 
                          style={{ 
                            position: 'absolute', 
                            top: '0.65rem', 
                            left: '0.65rem', 
                            backgroundColor: 'var(--bg-surface)', 
                            boxShadow: 'var(--shadow-xs)' 
                          }}
                        >
                          {chapCount} Chapters
                        </span>
                      )}
                    </div>

                    {/* Subject Info */}
                    <div className="p-3 p-md-4 d-flex flex-column justify-content-between flex-grow-1">
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                          {sub.name}
                        </h3>
                        <p 
                          style={{ 
                            fontSize: '0.82rem', 
                            color: 'var(--text-secondary)', 
                            marginBottom: '1.25rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.45
                          }}
                        >
                          {sub.desc || sub.detail || 'Authentic verse lectures and Samhita commentary notes.'}
                        </p>
                      </div>

                      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <Link
                          to={`/chapters/${subId}`}
                          className="editorial-btn editorial-btn-primary w-100"
                          style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
                        >
                          <span>View Sthanas</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </StudentAppShell>
  );
}
