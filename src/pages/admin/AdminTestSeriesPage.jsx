import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminTestSeriesPage() {
  const [testSeries, setTestSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSeries, setNewSeries] = useState({
    name: '',
    category: 'AIAPGET',
    detail: '',
    totalTests: 30,
    price: 3499,
    discountPrice: 2499
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  const fetchSeries = () => {
    fetch('/api/test-series')
      .then(r => r.json())
      .then(d => {
        if (d.status) setTestSeries(d.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleCreateSeries = async (e) => {
    e.preventDefault();
    if (!newSeries.name.trim()) {
      showToast('Series title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/test-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeries)
      });
      const data = await res.json();
      if (data.status) {
        showToast('Test series added successfully!', 'success');
        setNewSeries({
          name: '',
          category: 'AIAPGET',
          detail: '',
          totalTests: 30,
          price: 3499,
          discountPrice: 2499
        });
        fetchSeries();
      } else {
        showToast(data.message || 'Error creating series', 'error');
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
              <li className="breadcrumb-item">Tests</li>
              <li className="breadcrumb-item active" aria-current="page">Test Series Management</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Test Series &amp; Mock Exams</h3>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Form */}
        <div className="col-12 col-lg-5">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <h5 className="fw-bold text-dark mb-3">Create New Test Series</h5>
            <form onSubmit={handleCreateSeries}>
              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Series Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Pragya Vitarka 2027 Mock Drill Series" 
                  required
                  value={newSeries.name}
                  onChange={(e) => setNewSeries({ ...newSeries, name: e.target.value })}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-dark fw-bold small">Exam Category</label>
                  <select 
                    className="form-select"
                    value={newSeries.category}
                    onChange={(e) => setNewSeries({ ...newSeries, category: e.target.value })}
                  >
                    <option value="AIAPGET">AIAPGET</option>
                    <option value="State AMO">State AMO</option>
                    <option value="BAMS">BAMS Prof</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-dark fw-bold small">Total Mock Rounds</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newSeries.totalTests}
                    onChange={(e) => setNewSeries({ ...newSeries, totalTests: parseInt(e.target.value, 10) || 10 })}
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-dark fw-bold small">Price (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newSeries.price}
                    onChange={(e) => setNewSeries({ ...newSeries, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-dark fw-bold small">Offer Price (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newSeries.discountPrice}
                    onChange={(e) => setNewSeries({ ...newSeries, discountPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Description / Pattern Details</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Pattern (+4/-1), NTA simulation, Samhita topic weightage..." 
                  value={newSeries.detail}
                  onChange={(e) => setNewSeries({ ...newSeries, detail: e.target.value })}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary w-100 fw-bold"
              >
                {saving ? 'Creating...' : 'Create Test Series'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Table */}
        <div className="col-12 col-lg-7">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0">Active Test Series Batches</h5>
              <span className="badge bg-light text-dark border">
                {testSeries.length} Series
              </span>
            </div>

            <div className="admin-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Series Name</th>
                    <th>Category</th>
                    <th>Rounds</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {testSeries.map((s, idx) => (
                    <tr key={s._id || s.id || idx}>
                      <td>
                        <strong className="text-dark d-block">{s.name}</strong>
                        <span className="text-muted small">
                          {s.detail?.length > 50 ? `${s.detail.slice(0, 50)}...` : s.detail}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {s.category || 'AIAPGET'}
                        </span>
                      </td>
                      <td>{s.totalTests || 30} Tests</td>
                      <td>
                        <strong className="text-success">₹{(s.discountPrice || s.price || 1999).toLocaleString()}</strong>
                      </td>
                      <td>
                        <Link to="/student/student-tests" target="_blank" className="btn btn-sm btn-outline-warning text-dark fw-bold">
                          Run Simulator
                        </Link>
                      </td>
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

