import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminAddCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    categoryID: '',
    categoryName: 'AIAPGET',
    detail: '',
    price: 8499,
    discount_price: 6999,
    img: 'upload/Aiapget 1.png',
    rating: 4.9,
    studentCount: 1450,
    isActive: 1
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/category/active')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setCategories(d.data);
          if (!isEditMode && d.data.length > 0) {
            setFormData(prev => ({ ...prev, categoryID: d.data[0]._id, categoryName: d.data[0].name }));
          }
        }
      })
      .catch(console.error);

    if (isEditMode) {
      fetch(`/api/course/${id}`)
        .then(r => r.json())
        .then(d => {
          if (d.status && d.data) {
            const c = d.data;
            setFormData({
              name: c.name || '',
              categoryID: c.categoryID?._id || c.category_id || '',
              categoryName: c.categoryID?.name || c.category_name || 'AIAPGET',
              detail: c.detail || '',
              price: c.price || 8499,
              discount_price: c.discount_price || 6999,
              img: c.img || 'upload/Aiapget 1.png',
              rating: c.rating || 4.9,
              studentCount: c.studentCount || 1450,
              isActive: c.isActive !== undefined ? c.isActive : 1
            });
          }
        })
        .catch(console.error);
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Course title is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = isEditMode ? `/api/admin/courses/${id}` : '/api/admin/courses';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status) {
        showToast(isEditMode ? 'Course updated successfully!' : 'Course created successfully!', 'success');
        navigate('/admin/view-course');
      } else {
        showToast(data.message || 'Error saving course', 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header Breadcrumbs */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-1">
            <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
            <li className="breadcrumb-item"><Link to="/admin/view-course">Courses</Link></li>
            <li className="breadcrumb-item active" aria-current="page">
              {isEditMode ? 'Edit Course' : 'Add Course'}
            </li>
          </ol>
        </nav>
        <h3 className="fw-bold text-dark mb-0">
          {isEditMode ? `Edit Course: ${formData.name}` : 'Create New Academic Course'}
        </h3>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-8">
                  <label className="form-label text-dark fw-bold small">Course Name / Title *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    placeholder="e.g. Ayurdeeksha 4.0 - Advanced Samhita Revision"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-dark fw-bold small">Academic Category *</label>
                  <select 
                    className="form-select"
                    value={formData.categoryID}
                    onChange={(e) => {
                      const sel = categories.find(c => c._id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        categoryID: e.target.value,
                        categoryName: sel ? sel.name : formData.categoryName
                      });
                    }}
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Course Description &amp; Syllabus Overview</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  placeholder="Detail the target exam (AIAPGET, BAMS), classical Samhitas covered, live class schedule, and test series inclusions..."
                  value={formData.detail}
                  onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                ></textarea>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label text-dark fw-bold small">Original Price (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-dark fw-bold small">Discounted / Offer Price (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-dark fw-bold small">Thumbnail Image Path</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="upload/Aiapget 1.png"
                    value={formData.img}
                    onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label text-dark fw-bold small">Initial Rating (1.0 - 5.0)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-control" 
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5.0 })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-dark fw-bold small">Enrolled Scholars Count</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-dark fw-bold small">Status</label>
                  <select 
                    className="form-select"
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: parseInt(e.target.value, 10) })}
                  >
                    <option value={1}>Active (Visible to Students)</option>
                    <option value={0}>Draft / Inactive</option>
                  </select>
                </div>
              </div>

              <div className="d-flex gap-3 justify-content-end border-top pt-4">
                <Link to="/admin/view-course" className="btn btn-outline-secondary px-4">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn btn-primary px-5 fw-bold"
                >
                  {saving ? (
                    <span><i className="fa-solid fa-spinner fa-spin me-2"></i> Saving...</span>
                  ) : (
                    <span><i className="fa-solid fa-check me-2"></i> {isEditMode ? 'Update Course' : 'Create Course'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

