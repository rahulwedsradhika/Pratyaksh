import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Search, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import '../styles/sthanaSelection.css';

export default function ChapterLessonsPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSthanaId = searchParams.get('sthana');
  const sectionId = section => String(section._id || section.id);
  const [sections, setSections] = useState([]);
  const selectedSthana = sections.find(section => sectionId(section) === selectedSthanaId);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedChapters] = useState(() => {
    try {
      const saved = localStorage.getItem('ayur_completed_chapters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setSections([]);
    setSearchQuery('');

    fetch(`/api/student/myChapters/subject/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!mounted) return;
        if (d.status && d.data && Array.isArray(d.data)) {
          setSections(d.data);
        } else {
          fetch(`/api/sub-subject/chapter/active/${id}`)
            .then(r2 => r2.json())
            .then(d2 => {
              if (d2.status && d2.data) {
                setSections([
                  {
                    id: 'default',
                    name: 'Subject Chapters',
                    chapters: d2.data
                  }
                ]);
              }
            })
            .catch(console.error);
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

  const visibleSections = selectedSthana ? [selectedSthana] : [];
  const filteredSections = visibleSections.map(section => ({
    ...section,
    chapters: (section.chapters || []).filter(chapter => !searchQuery.trim() ||
      `${chapter.name || ''} ${chapter.detail || ''}`.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(section => !searchQuery.trim() || section.chapters.length > 0);
  const matchingSthanas = sections.filter(section => !searchQuery.trim() ||
    (section.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  function selectSthana(section) {
    setSearchQuery('');
    setSearchParams({ sthana: sectionId(section) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showSthanas() {
    setSearchQuery('');
    setSearchParams({});
  }

  return (
    <StudentAppShell>
      <PageContainer>
        {/* Header & Breadcrumb */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <Link to="/courses" style={{ color: 'var(--text-muted)' }}>Courses</Link>
            <ChevronRight size={13} />
            <button type="button" onClick={showSthanas} style={{ background: 'none', border: 0, padding: 0, color: 'var(--brand-terracotta)' }}>Sthanas</button>
            {selectedSthana && <><ChevronRight size={13} /><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedSthana.name}</span></>}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="editorial-badge editorial-badge-terracotta mb-2">
                <BookOpen size={13} />
                <span>{selectedSthana ? 'Samhita Adhyayas' : 'Samhita Curriculum'}</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {selectedSthana ? selectedSthana.name : 'Choose a Sthana'}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
                {selectedSthana ? 'Select an Adhyaya to open its video lectures and notes.' : 'Choose a Sthana or section to explore its chapters, lectures and commentary notes.'}
              </p>
            </div>

            {/* Chapter Search Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="sthana-search">
                <input
                  type="search"
                  placeholder={selectedSthana ? 'Filter Adhyayas...' : 'Search Sthanas...'}
                  aria-label={selectedSthana ? 'Search chapters in this Sthana' : 'Search Sthanas'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="editorial-search-input"
                />
                <span className="sthana-search-icon" aria-hidden="true">
                  <Search size={14} />
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="sthana-search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedSthana && <button type="button" className="editorial-btn editorial-btn-secondary mb-4" onClick={showSthanas}><ArrowLeft size={15} /> All Sthanas</button>}

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--brand-terracotta)', width: '2rem', height: '2rem' }} role="status"></div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading Sthana sections and Adhyayas...</p>
          </div>
        ) : !selectedSthana ? (
          <div className="row g-4">
            {selectedSthanaId && <p role="status">This Sthana is no longer available. Choose another section below.</p>}
            {matchingSthanas.map((section, index) => (
              <div className="col-12 col-md-6 col-xl-4" key={sectionId(section)}>
                <button type="button" className="editorial-card p-4 w-100 h-100 text-start sthana-choice" onClick={() => selectSthana(section)}>
                  <div className="d-flex align-items-center justify-content-between mb-4"><span className="editorial-badge editorial-badge-terracotta"><BookOpen size={15} /> Section {String(index + 1).padStart(2, '0')}</span><ChevronRight size={19} /></div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{section.name}</h2>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{section.chapters?.length || 0} Adhyayas</p>
                  <span style={{ color: 'var(--brand-terracotta)', fontSize: '.85rem', fontWeight: 600 }}>View chapters <ChevronRight size={14} /></span>
                </button>
              </div>
            ))}
            {!matchingSthanas.length && <div className="col-12"><div className="editorial-card p-5 text-center"><BookOpen size={32} className="mb-3" /><h2 className="h5">{searchQuery ? 'No Sthanas match your search' : 'No Sthanas available for this subject'}</h2>{searchQuery && <button type="button" className="editorial-btn editorial-btn-secondary" onClick={() => setSearchQuery('')}>Clear search</button>}</div></div>}
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="editorial-card text-center p-5" style={{ maxWidth: '480px', margin: '2rem auto' }}>
            <BookOpen size={36} color="var(--brand-terracotta)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {searchQuery ? `No chapters matching "${searchQuery}"` : 'No chapters available for this subject'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {searchQuery ? 'Try clearing your search term.' : 'Please select another subject or check your course syllabus.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="editorial-btn editorial-btn-secondary"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredSections.map((section) => (
              <div key={section._id || section.id} style={{ marginBottom: '2.5rem' }}>
                {/* Sthana Heading */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {section.name}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {section.chapters?.length || 0} Adhyayas
                  </span>
                </div>

                {/* Sthana Academic Container (Theme-Responsive Accent Tint) */}
                <div 
                  style={{ 
                    backgroundColor: 'var(--bg-accent-tint)', 
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '1.25rem'
                  }}
                >
                  <div className="row g-3">
                    {section.chapters?.map((chap) => {
                      const chapId = chap._id || chap.id;
                      const isCompleted = completedChapters.includes(chapId);
                      const imgUrl = chap.img 
                        ? (chap.img.startsWith('http') ? chap.img : `/${chap.img}`)
                        : '/upload/1778774858960_1719243095255_Cha. Su. 1.jpg';

                      return (
                        <div key={chapId} className="col-6 col-md-4 col-lg-3 col-xl-2">
                          <Link
                            to={`/student/chapter-details/${id}/${chapId}`}
                            className="editorial-card d-flex flex-column h-100 text-decoration-none"
                            style={{ 
                              padding: '0.85rem', 
                              backgroundColor: 'var(--bg-surface)',
                              position: 'relative' 
                            }}
                          >
                            {/* Chapter Artwork */}
                            <div 
                              style={{ 
                                width: '100%', 
                                aspectRatio: '1/1', 
                                overflow: 'hidden', 
                                borderRadius: '8px', 
                                backgroundColor: 'var(--bg-subtle)',
                                marginBottom: '0.65rem',
                                position: 'relative'
                              }}
                            >
                              <img
                                src={imgUrl}
                                alt={chap.name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/upload/1778774858960_1719243095255_Cha. Su. 1.jpg';
                                }}
                              />
                              {isCompleted && (
                                <span 
                                  style={{ 
                                    position: 'absolute', 
                                    top: '4px', 
                                    right: '4px', 
                                    color: 'var(--status-correct)',
                                    background: 'var(--bg-surface)',
                                    borderRadius: '50%',
                                    display: 'flex'
                                  }}
                                >
                                  <CheckCircle2 size={16} fill="var(--status-correct)" color="#fff" />
                                </span>
                              )}
                            </div>

                            {/* Chapter Label */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 650, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                {chap.name}
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </StudentAppShell>
  );
}
