import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

export default function AdminCourseMapPage() {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/category').then(r => r.json()),
      fetch('/api/course').then(r => r.json())
    ])
      .then(([catData, courseData]) => {
        if (catData.status) setCategories(catData.data || []);
        if (courseData.status) setCourses(courseData.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Course Map &amp; Reports</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Curriculum Course Map</h3>
        </div>
      </div>

      <div className="row g-4">
        {categories.map((cat) => {
          const catCourses = courses.filter(c => c.categoryID?._id === cat._id || c.categoryID === cat._id);

          return (
            <div key={cat._id} className="col-12 col-md-6 col-xl-6">
              <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <img 
                      src={cat.img?.startsWith('http') ? cat.img : `/${cat.img || 'upload/Aiapget 1.png'}`} 
                      alt={cat.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'contain' }}
                      onError={(e) => { e.target.src = '/assets/website-assets/img/cources-icon.svg'; }}
                    />
                    <div>
                      <h5 className="fw-bold text-dark mb-0">{cat.name}</h5>
                      <span className="text-muted small">{cat.detail}</span>
                    </div>
                  </div>
                  <span className="badge bg-primary-light text-primary fw-bold">
                    {catCourses.length} Courses
                  </span>
                </div>

                <div className="list-group list-group-flush">
                  {catCourses.length === 0 ? (
                    <div className="text-muted small py-3 text-center">
                      No courses linked to this category.
                    </div>
                  ) : (
                    catCourses.map((c) => (
                      <div key={c._id || c.id} className="list-group-item px-0 py-2 border-0 d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="text-dark d-block" style={{ fontSize: '0.92rem' }}>
                            {c.name}
                          </strong>
                          <span className="text-muted small">
                            ₹{(c.discount_price || 0).toLocaleString()} • {c.studentCount || 1200}+ scholars
                          </span>
                        </div>
                        <div className="btn-group btn-group-sm">
                          <Link to={`/admin/add-course/${c._id || c.id}`} className="btn btn-sm btn-light" title="Edit">
                            <i className="fa-solid fa-pen text-warning"></i>
                          </Link>
                          <Link to={`/student/course-modules/${c._id || c.id}`} target="_blank" className="btn btn-sm btn-light" title="View Syllabus">
                            <i className="fa-solid fa-sitemap text-primary"></i>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

