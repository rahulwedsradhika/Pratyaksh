import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, ChevronRight, ArrowLeft, Play, Clock, Target } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';

export default function StudentTestPapersPage() {
  const { id: seriesId } = useParams();
  const [papers, setPapers] = useState([]);
  const [seriesInfo, setSeriesInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/student/myPaper/${seriesId}`).then(r => r.json()).catch(() => ({ status: false })),
      fetch('/api/student/myTestSeries').then(r => r.json()).catch(() => ({ status: false }))
    ])
      .then(([paperRes, seriesRes]) => {
        if (paperRes.status && paperRes.data) {
          setPapers(paperRes.data);
        }
        if (seriesRes.status && seriesRes.data) {
          const matched = seriesRes.data.find(s => s._id === seriesId || s.id === seriesId);
          if (matched) setSeriesInfo(matched);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [seriesId]);

  return (
    <StudentAppShell>
      <PageContainer>
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <Link to="/tests" style={{ color: 'var(--text-muted)' }}>Test Series</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{seriesInfo?.name || 'Papers'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="editorial-badge editorial-badge-terracotta mb-2">
                <GraduationCap size={13} />
                <span>NTA AIAPGET Format</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {seriesInfo?.name || 'Available Test Papers'}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
                {seriesInfo?.detail || seriesInfo?.desc || 'Complete NTA pattern test papers with timed simulation and verse explanations.'}
              </p>
            </div>

            <Link to="/tests" className="editorial-btn editorial-btn-secondary" style={{ fontSize: '0.82rem' }}>
              <ArrowLeft size={14} />
              <span>Back to Series</span>
            </Link>
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--brand-terracotta)', width: '2rem', height: '2rem' }} role="status"></div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading test papers...</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="editorial-card text-center p-5" style={{ maxWidth: '480px', margin: '2rem auto' }}>
            <GraduationCap size={36} color="var(--brand-terracotta)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No papers scheduled in this series
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Check back soon as papers are added per the exam timetable.
            </p>
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {papers.map((paper, idx) => {
              const imgSrc = paper.img?.startsWith('http')
                ? paper.img
                : (paper.img ? `/${paper.img}` : '/upload/1779602563776_Picture2.jpg');
              const paperId = paper._id || idx;

              return (
                <div key={paperId} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className="editorial-card h-100 d-flex flex-column justify-content-between">
                    {/* Test Banner Artwork */}
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
                      <img 
                        src={imgSrc} 
                        alt={paper.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/upload/1779602563776_Picture2.jpg';
                        }}
                      />
                    </div>

                    {/* Paper Info */}
                    <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                      <div>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: 1.35 }}>
                          {paper.title}
                        </h3>
                        <p 
                          style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--text-secondary)', 
                            marginBottom: '1rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4
                          }}
                        >
                          {paper.syllabus || paper.desc || 'Charaka Samhita and high-yield AIAPGET questions.'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <Link 
                          to={`/exam/${paperId}`}
                          className="editorial-btn editorial-btn-primary flex-grow-1"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                        >
                          <Clock size={13} />
                          <span>Exam</span>
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
