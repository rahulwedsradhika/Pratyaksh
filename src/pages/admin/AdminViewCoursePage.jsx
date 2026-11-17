import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminViewCoursePage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const { showToast } = useApp();

  const fetchCourses = () => {
    fetch('/api/course')
      .then(r => r.json())
      .then(d => {
        if (d.status) setCourses(d.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch('/api/category/active')
      .then(r => r.json())
      .then(d => {
        if (d.status) setCategories(d.data || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status) {
        showToast('Course removed successfully', 'success');
        fetchCourses();
      } else {
        showToast(data.message || 'Error deleting course', 'error');
      }
    } catch (e) {
      showToast('Server error while deleting course', 'error');
    }
  };

  const filtered = courses.filter(c => {
    const matchesCat = !filterCat || c.categoryID?._id === filterCat || c.categoryID === filterCat;
    const q = searchQuery.toLowerCase();
    const matchesQ = !q || c.name.toLowerCase().includes(q) || c.detail?.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <AdminLayout>
      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item">Courses</li>
              <li className="breadcrumb-item active" aria-current="page">View Courses</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Course Management</h3>
        </div>
        <Link to="/admin/add-course" className="btn btn-primary fw-bold">
          <i className="fa-solid fa-plus me-2"></i> Add New Course
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-3 shadow-sm border-0 rounded-3 bg-white mb-4">
        <div className="row g-3">
          <div className="col-md-6 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="fa-solid fa-magnifying-glass text-muted"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search courses..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4 col-lg-3">
            <select 
              className="form-select"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2 col-lg-2 d-flex align-items-center">
            <span className="text-muted small fw-semibold">
              Showing {filtered.length} of {courses.length} courses
            </span>
          </div>
        </div>
      </div>

      {/* Courses Data Table */}
      <div className="admin-table shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Thumbnail</th>
                <th>Course Name</th>
                <th>Category</th>
                <th>Price (₹)</th>
                <th>Discount Price (₹)</th>
                <th>Scholars</th>
                <th className="text-end" style={{ width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted small mt-2">Loading courses...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="fa-solid fa-folder-open fs-2 mb-2 d-block"></i>
                    No courses match the specified filters.
                  </td>
                </tr>
              ) : (
                filtered.map((course) => (
                  <tr key={course._id || course.id}>
                    <td>
                      <img 
                        src={course.img?.startsWith('http') ? course.img : `/${course.img || 'upload/Aiapget 1.png'}`} 
                        alt={course.name} 
                        style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => { e.target.src = '/assets/upload/Aiapget 1.png'; }}
                      />
                    </td>
                    <td>
                      <strong className="text-dark d-block">{course.name}</strong>
                      <span className="text-muted small">
                        {course.detail?.length > 70 ? `${course.detail.slice(0, 70)}...` : course.detail}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {course.categoryID?.name || course.category_name || 'Ayurveda'}
                      </span>
                    </td>
                    <td>₹{(course.price || 0).toLocaleString()}</td>
                    <td>
                      <strong className="text-success">₹{(course.discount_price || 0).toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className="badge bg-primary-light text-primary">
                        {course.studentCount || 1200}+
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link 
                          to={`/courses/${course._id || course.id}`} 
                          target="_blank" 
                          className="btn btn-light" 
                          title="View on site"
                        >
                          <i className="fa-solid fa-eye text-primary"></i>
                        </Link>
                        <Link 
                          to={`/admin/add-course/${course._id || course.id}`} 
                          className="btn btn-light" 
                          title="Edit course"
                        >
                          <i className="fa-solid fa-pen text-warning"></i>
                        </Link>
                        <button 
                          onClick={() => handleDeleteCourse(course._id || course.id, course.name)} 
                          className="btn btn-light text-danger" 
                          title="Delete course"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

