import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ChevronRight, ArrowRight } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';

export default function StudentTestSeriesPage() {
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/myTestSeries')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setSeriesList(d.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentAppShell>
      <PageContainer>
        {/* Header & Breadcrumb */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Test Series</span>
          </div>

          <div className="editorial-badge editorial-badge-terracotta mb-2">
            <GraduationCap size={13} />
            <span>NTA AIAPGET &amp; State PSC</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Test Series &amp; Mock Exams
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
            Timed NTA simulation papers, micro test rounds, and Samhita revision series with authentic classical commentary reviews.
          </p>
        </div>

        {/* Series Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--brand-terracotta)', width: '2rem', height: '2rem' }} role="status"></div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading authentic test series...</p>
          </div>
        ) : seriesList.length === 0 ? (
          <div className="editorial-card text-center p-5" style={{ maxWidth: '480px', margin: '2rem auto' }}>
            <GraduationCap size={36} color="var(--brand-terracotta)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No test series available yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Check back soon as new examination series are scheduled.
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {seriesList.map((ts) => {
              const imgSrc = ts.img?.startsWith('http') 
                ? ts.img 
                : (ts.img ? `/${ts.img}` : '/upload/1777645990779_29.png');

              return (
                <div key={ts._id} className="col-12 col-md-6 col-lg-4">
                  <div className="editorial-card h-100 d-flex flex-column justify-content-between">
                    {/* Series Banner */}
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
                      <img 
                        src={imgSrc} 
                        alt={ts.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/upload/1777645990779_29.png';
                        }}
                      />
                    </div>

                    {/* Series Details */}
                    <div className="p-3 p-md-4 d-flex flex-column justify-content-between flex-grow-1">
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                          {ts.name}
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
                          {ts.detail || ts.desc || 'Comprehensive Samhita and Subject-wise Test Series'}
                        </p>
                      </div>

                      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <Link 
                          to={`/tests/series/${ts._id}`}
                          className="editorial-btn editorial-btn-primary w-100"
                          style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
                        >
                          <span>View Test Papers</span>
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
