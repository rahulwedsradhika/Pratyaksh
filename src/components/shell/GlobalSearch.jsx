import { studentFetch as fetch } from '../../services/studentFetch';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, GraduationCap, Target, ArrowRight } from 'lucide-react';

export default function GlobalSearch({ isMobile = false, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Fetch searchable courses and test series on mount
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/course').then(r => r.json()).catch(() => ({ status: false })),
      fetch('/api/student/myTestSeries').then(r => r.json()).catch(() => ({ status: false }))
    ]).then(([coursesRes, testsRes]) => {
      if (!mounted) return;
      if (coursesRes.status && Array.isArray(coursesRes.data)) {
        setAllCourses(coursesRes.data);
      }
      if (testsRes.status && Array.isArray(testsRes.data)) {
        setAllTests(testsRes.data);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Filter items on query change
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const matchedCourses = allCourses
      .filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.detail && c.detail.toLowerCase().includes(q)))
      .slice(0, 3)
      .map(c => ({
        id: c._id,
        type: 'course',
        title: c.name,
        subtitle: c.categoryID?.name || 'Academic Course',
        path: `/subjects/${c._id}`
      }));

    const matchedTests = allTests
      .filter(t => (t.name && t.name.toLowerCase().includes(q)) || (t.detail && t.detail.toLowerCase().includes(q)))
      .slice(0, 3)
      .map(t => ({
        id: t._id,
        type: 'test',
        title: t.name,
        subtitle: 'Test Series',
        path: `/tests/series/${t._id}`
      }));

    // Show only genuine courses and test-series from the fetched catalog.
    // Never invent topic links pointing every query to the same sample paper.
    const combined = [...matchedCourses, ...matchedTests];
    setResults(combined);
    setIsOpen(combined.length > 0);
  }, [query, allCourses, allTests]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/courses?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      if (onClose) onClose();
    }
  };

  const handleSelectResult = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
    if (onClose) onClose();
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: isMobile ? '100%' : '320px', maxWidth: '100%' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="search"
            placeholder="Search courses, Samhitas, MCQs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            aria-expanded={isOpen && results.length > 0}
            aria-controls="global-search-results"
            className="editorial-search-input"
            aria-label="Search courses and tests"
          />
          <span 
            style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              color: 'var(--text-muted)', 
              display: 'flex', 
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            <Search size={15} />
          </span>
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setIsOpen(false); }}
              style={{
                position: 'absolute',
                right: '0.65rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Live Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          id="global-search-results"
          role="listbox"
          aria-label="Search suggestions"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-dropdown)',
            padding: '0.4rem',
            zIndex: 150,
            maxHeight: '340px',
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Matching Results ({results.length})
          </div>

          {results.map((res) => (
            <button
              type="button"
              role="option"
              aria-selected={false}
              key={`${res.type}-${res.id}`}
              onClick={() => handleSelectResult(res.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                color: 'var(--text-primary)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ color: 'var(--brand-terracotta)', display: 'flex', alignItems: 'center' }}>
                {res.type === 'course' && <BookOpen size={16} />}
                {res.type === 'test' && <GraduationCap size={16} />}
                {res.type === 'practice' && <Target size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {res.title}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {res.subtitle}
                </div>
              </div>
              <ArrowRight size={13} color="var(--text-muted)" />
            </button>
          ))}

          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '0.5rem 0.65rem',
              marginTop: '0.25rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--brand-terracotta)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              background: 'transparent',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <span>See all course results for "{query}"</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
