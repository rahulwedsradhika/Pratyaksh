import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CourseCategoryPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/category/active')
      .then(r => r.json())
      .then(d => { if (d.status) setCategories(d.data || []); });
  }, []);

  return (
    <div className="course-category-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Course Categories</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Academic Pathways</span>
          <h2 className="fw-bold text-dark">Course Categories</h2>
          <p className="text-muted">
            Choose your learning path. Whether you are an undergraduate BAMS scholar, preparing for AIAPGET post-graduate entrance, or a practicing Vaidya upgrading clinical mastery:
          </p>
        </div>

        <div className="row g-4">
          {categories.map((cat, idx) => {
            const icons = ['fa-graduation-cap', 'fa-book-medical', 'fa-user-doctor', 'fa-mortar-pestle'];
            const icon = icons[idx % icons.length];
            const imgSrc = cat.img ? (cat.img.startsWith('http') ? cat.img : `/${cat.img}`) : '/assets/upload/Aiapget 1.png';

            return (
              <div key={cat._id} className="col-lg-6">
                <div className="ayur-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="btn btn-warning rounded-circle p-3 text-dark d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', fontSize: '1.4rem' }}>
                          <i className={`fa-solid ${icon}`}></i>
                        </div>
                        <div>
                          <span className="badge bg-light text-warning border fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                            {cat.tab || 'Academic Track'}
                          </span>
                          <h3 className="fw-bold text-dark mb-0">{cat.name}</h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted mb-4" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                      {cat.detail || 'Comprehensive curriculum tailored for syllabus excellence, conceptual depth, and examination success.'}
                    </p>

                    <div className="p-3 bg-light rounded-3 mb-4 border">
                      <ul className="list-unstyled mb-0 d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
                        <li><i className="fa-solid fa-check text-success me-2"></i> Structured chapter modules with video lectures</li>
                        <li><i className="fa-solid fa-check text-success me-2"></i> Topic-wise question practice with explanations</li>
                        <li><i className="fa-solid fa-check text-success me-2"></i> Downloadable PDF notes &amp; mnemonics sheets</li>
                      </ul>
                    </div>
                  </div>

                  <div className="d-flex gap-3">
                    <Link to={`/courses/${cat._id}`} className="btn btn-ayur flex-grow-1 fw-bold">
                      View Courses in {cat.name} <i className="fa-solid fa-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

