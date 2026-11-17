import StudentActivity from '../components/StudentActivity';
import InstallAppButton from '../components/InstallAppButton';
import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  GraduationCap, 
  ChevronRight, 
  BookOpen, 
  FileText
} from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [testSeries, setTestSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/course').then(r => r.json()).catch(() => ({ status: false })),
      fetch('/api/student/myTestSeries').then(r => r.json()).catch(() => ({ status: false }))
    ])
      .then(([cRes, tRes]) => {
        if (cRes?.status && Array.isArray(cRes.data)) {
          setCourses(cRes.data);
        }
        if (tRes?.status && Array.isArray(tRes.data)) {
          setTestSeries(tRes.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const studentName = (user?.fullName || user?.full_name || user?.name || '').trim();

  return (
    <StudentAppShell>
      <PageContainer>
        {/* 1. Minimal Welcome Area (Claude Warmth & Clean Clarity) */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="editorial-badge editorial-badge-terracotta">
              Pratyaksh Ayurveda Learning
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {studentName ? `Welcome back, ${studentName}` : 'Welcome back'}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0 }}>
            Discover your next lecture, explore courses, and prepare with real test papers.
          </p>
        </div>

        <InstallAppButton compact />
        <StudentActivity />

        {/* 3. My Academic Courses (Compact, Proportional Cards) */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Explore Academic Courses
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Browse the available curricula, Samhita modules and study resources.
              </p>
            </div>
            <Link 
              to="/courses" 
              className="editorial-btn editorial-btn-outline" 
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              <span>View All Courses</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" style={{ color: 'var(--brand-terracotta)', width: '2rem', height: '2rem' }} role="status"></div>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading academic programs...</p>
            </div>
          ) : (
            <div className="row g-3 g-md-4">
              {courses.slice(0, 3).map((c) => {
                const imgSrc = c.img?.startsWith('http') ? c.img : `/${c.img || 'upload/1777645147681_28.png'}`;
                return (
                  <div key={c._id} className="col-12 col-md-6 col-lg-4">
                    <div className="editorial-card h-100 d-flex flex-column justify-content-between">
                      {/* Course Image Thumbnail (16:9) */}
                      <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
                        <img
                          src={imgSrc}
                          alt={c.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = '/upload/1777645147681_28.png'; }}
                        />
                      </div>

                      {/* Course Body */}
                      <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <span className="editorial-badge" style={{ fontSize: '0.7rem' }}>
                              {c.categoryID?.name || 'AIAPGET'}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.02rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                            {c.name}
                          </h3>
                          <p 
                            style={{ 
                              fontSize: '0.82rem', 
                              color: 'var(--text-secondary)', 
                              marginBottom: '1rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.45
                            }}
                          >
                            {c.detail || 'Authentic curriculum with high-yield recorded lectures and structured tests.'}
                          </p>
                        </div>

                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                          <Link
                            to={`/subjects/${c._id}`}
                            className="editorial-btn editorial-btn-secondary w-100"
                            style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                          >
                            <span>Explore Subjects</span>
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Available Test Series */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Test Series &amp; Mock Exams
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                NTA AIAPGET format papers with timed simulations and Samhita commentary reviews.
              </p>
            </div>
            <Link 
              to="/tests" 
              className="editorial-btn editorial-btn-outline" 
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              <span>View All Series</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="row g-3 g-md-4">
            {testSeries.slice(0, 3).map((ts) => {
              const tsImg = ts.img?.startsWith('http') ? ts.img : `/${ts.img || 'upload/1777645990779_29.png'}`;
              return (
                <div key={ts._id} className="col-12 col-md-6 col-lg-4">
                  <div className="editorial-card h-100 d-flex flex-column justify-content-between">
                    {/* Test Banner Thumbnail */}
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
                      <img
                        src={tsImg}
                        alt={ts.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/upload/1777645990779_29.png'; }}
                      />
                    </div>

                    {/* Series Details */}
                    <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                          {ts.name}
                        </h3>
                        <p 
                          style={{ 
                            fontSize: '0.82rem', 
                            color: 'var(--text-secondary)', 
                            marginBottom: '1rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.45
                          }}
                        >
                          {ts.detail || ts.desc || 'Comprehensive Samhita and Subject-wise Test Series'}
                        </p>
                      </div>

                      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <Link
                          to={`/tests/series/${ts._id}`}
                          className="editorial-btn editorial-btn-secondary w-100"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                        >
                          <span>Open Test Papers</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </StudentAppShell>
  );
}
