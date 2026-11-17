import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminFacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    designation: 'Ayurveda Professor & Samhita Expert',
    qualification: 'BAMS, MD (Ayu)',
    experience: '12+ Years',
    specialization: 'Charaka Samhita & Clinical Kayachikitsa'
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  const fetchFaculty = () => {
    fetch('/api/faculty')
      .then(r => r.json())
      .then(d => {
        if (d.status) setFaculty(d.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!newFaculty.name.trim()) {
      showToast('Faculty name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaculty)
      });
      const data = await res.json();
      if (data.status) {
        showToast('Faculty profile created successfully!', 'success');
        setNewFaculty({
          name: '',
          designation: 'Ayurveda Professor & Samhita Expert',
          qualification: 'BAMS, MD (Ayu)',
          experience: '12+ Years',
          specialization: 'Charaka Samhita & Clinical Kayachikitsa'
        });
        fetchFaculty();
      } else {
        showToast(data.message || 'Error saving faculty', 'error');
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
              <li className="breadcrumb-item active" aria-current="page">Faculty Management</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Faculty Roster &amp; Instructors</h3>
        </div>
      </div>

      <div className="row g-4">
        {/* Left: Add Faculty */}
        <div className="col-12 col-lg-5">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <h5 className="fw-bold text-dark mb-3">Add Faculty Member</h5>
            <form onSubmit={handleAddFaculty}>
              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Doctor / Faculty Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Dr. Harish Kumar Sharma" 
                  required
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Academic Designation</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newFaculty.designation}
                  onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-dark fw-bold small">Qualification</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newFaculty.qualification}
                    onChange={(e) => setNewFaculty({ ...newFaculty, qualification: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-dark fw-bold small">Teaching Experience</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newFaculty.experience}
                    onChange={(e) => setNewFaculty({ ...newFaculty, experience: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Samhita Specialization</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newFaculty.specialization}
                  onChange={(e) => setNewFaculty({ ...newFaculty, specialization: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary w-100 fw-bold"
              >
                {saving ? 'Saving...' : 'Save Faculty Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Existing Faculty */}
        <div className="col-12 col-lg-7">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <h5 className="fw-bold text-dark mb-3">Instructors Directory</h5>
            <div className="admin-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Credentials</th>
                    <th>Specialization</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map((f, idx) => (
                    <tr key={f.id || idx}>
                      <td>
                        <strong className="text-dark d-block">{f.name}</strong>
                        <span className="text-muted small">{f.designation}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {f.qualification || 'BAMS, MD'}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted small">{f.specialization || 'Ayurveda'}</span>
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

