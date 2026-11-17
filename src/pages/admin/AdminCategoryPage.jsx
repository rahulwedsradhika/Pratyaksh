import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState({ name: '', tab: '', detail: '', img: 'upload/Aiapget 1.png' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  const fetchCats = () => {
    fetch('/api/category')
      .then(r => r.json())
      .then(d => {
        if (d.status) setCategories(d.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
      const data = await res.json();
      if (data.status) {
        showToast('Category added successfully!', 'success');
        setNewCat({ name: '', tab: '', detail: '', img: 'upload/Aiapget 1.png' });
        fetchCats();
      } else {
        showToast(data.message || 'Error creating category', 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item">Courses</li>
              <li className="breadcrumb-item active" aria-current="page">Add Category</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Academic Categories</h3>
        </div>
      </div>

      <div className="row g-4">
        {/* Left: Add Category Form */}
        <div className="col-12 col-lg-5">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <h5 className="fw-bold text-dark mb-3">Add Academic Category</h5>
            <form onSubmit={handleAddCategory}>
              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Category Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. AIAPGET, BAMS I-III, AMO Target" 
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Action Tab Label</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Get Accelerated, Start Growing, Go Ahead" 
                  value={newCat.tab}
                  onChange={(e) => setNewCat({ ...newCat, tab: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Category Detail / Tagline</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  placeholder="e.g. Prepare For The Specialization" 
                  value={newCat.detail}
                  onChange={(e) => setNewCat({ ...newCat, detail: e.target.value })}
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Circular Badge Image</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="upload/Aiapget 1.png" 
                  value={newCat.img}
                  onChange={(e) => setNewCat({ ...newCat, img: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary w-100 fw-bold"
              >
                {saving ? 'Saving...' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Existing Categories List */}
        <div className="col-12 col-lg-7">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <h5 className="fw-bold text-dark mb-3">Existing Program Categories</h5>
            <div className="admin-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Badge</th>
                    <th>Name</th>
                    <th>Action Tab</th>
                    <th>Tagline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <img 
                          src={c.img?.startsWith('http') ? c.img : `/${c.img || 'upload/Aiapget 1.png'}`} 
                          alt={c.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'contain' }}
                          onError={(e) => { e.target.src = '/assets/website-assets/img/cources-icon.svg'; }}
                        />
                      </td>
                      <td><strong className="text-dark">{c.name}</strong></td>
                      <td><span className="badge bg-light text-dark border">{c.tab || 'Explore'}</span></td>
                      <td><span className="text-muted small">{c.detail}</span></td>
                      <td><span className="badge bg-success text-white">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

