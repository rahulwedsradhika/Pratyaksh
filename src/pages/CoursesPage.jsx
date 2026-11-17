import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { BookOpen, Search, X, ChevronRight, Filter } from 'lucide-react';
import StudentCourseCard from '../components/StudentCourseCard';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: categoryParamId } = useParams();

  const selectedCategory = categoryParamId || searchParams.get('category') || '';
  const searchFilter = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(searchFilter);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/category/active').then(r => r.json()).catch(() => ({ status: false })),
      fetch('/api/course').then(r => r.json()).catch(() => ({ status: false }))
    ]).then(([catRes, courseRes]) => {
      if (!mounted) return;
      if (catRes.status && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
      if (courseRes.status && Array.isArray(courseRes.data)) {
        setCourses(courseRes.data);
      }
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setLocalSearch(searchFilter);
  }, [searchFilter]);

  const handleCategorySelect = (catId) => {
    const params = new URLSearchParams(searchParams);
    if (catId) params.set('category', catId);
    else params.delete('category');
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (localSearch.trim()) params.set('search', localSearch.trim());
    else params.delete('search');
    setSearchParams(params);
  };

  const filteredCourses = courses.filter(c => {
    const matchesCategory = !selectedCategory || c.categoryID?._id === selectedCategory || c.categoryID === selectedCategory;
    const query = searchFilter.toLowerCase();
    const matchesSearch = !query || 
      (c.name && c.name.toLowerCase().includes(query)) || 
      (c.detail && c.detail.toLowerCase().includes(query)) ||
      (c.categoryID?.name && c.categoryID.name.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <StudentAppShell>
      <PageContainer>
        {/* Header & Breadcrumb */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>My Courses</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="editorial-badge editorial-badge-terracotta mb-2">
                <BookOpen size={13} />
                <span>Curriculum Directory</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Academic Programs &amp; Courses
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
                Complete curricula covering Samhita commentaries, clinical case dissections, and NTA-pattern test series.
              </p>
            </div>

            {/* Filter Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ width: '280px', maxWidth: '100%' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="search"
                  placeholder="Filter courses..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="editorial-search-input"
                />
                <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Search size={15} />
                </span>
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      const params = new URLSearchParams(searchParams);
                      params.delete('search');
                      setSearchParams(params);
                    }}
                    style={{ position: 'absolute', right: '0.65rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`editorial-btn ${!selectedCategory ? 'editorial-btn-primary' : 'editorial-btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}
          >
            All Courses ({courses.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => handleCategorySelect(cat._id)}
              className={`editorial-btn ${selectedCategory === cat._id ? 'editorial-btn-primary' : 'editorial-btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--brand-terracotta)', width: '2rem', height: '2rem' }} role="status"></div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading authentic courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="editorial-card text-center p-5" style={{ maxWidth: '480px', margin: '2rem auto' }}>
            <BookOpen size={36} color="var(--brand-terracotta)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No matching courses found
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {searchFilter ? `No results found for "${searchFilter}". Try adjusting your keywords.` : 'No courses available in this category.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setSearchParams({});
              }}
              className="editorial-btn editorial-btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {filteredCourses.map((course) => (
              <div key={course._id} className="col-12 col-md-6 col-lg-4">
                <StudentCourseCard course={course} />
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </StudentAppShell>
  );
}
