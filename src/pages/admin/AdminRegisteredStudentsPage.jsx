import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminRegisteredStudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState({ open: false, student: null, selectedCourse: '' });
  const { showToast } = useApp();

  const fetchStudents = () => {
    fetch('/api/admin/students')
      .then(r => r.json())
      .then(d => {
        if (d.status) setStudents(d.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch('/api/course')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setCourses(d.data);
          if (d.data.length > 0) {
            setAssignModal(prev => ({ ...prev, selectedCourse: d.data[0]._id }));
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAssignCourse = async () => {
    if (!assignModal.student || !assignModal.selectedCourse) return;
    try {
      const res = await fetch(`/api/admin/students/${assignModal.student.id}/assign-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: assignModal.selectedCourse })
      });
      const data = await res.json();
      if (data.status) {
        showToast(`Course assigned to ${assignModal.student.fullName}!`, 'success');
        setAssignModal({ open: false, student: null, selectedCourse: courses[0]?._id || '' });
        fetchStudents();
      } else {
        showToast(data.message || 'Error assigning course', 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q || 
      s.fullName?.toLowerCase().includes(q) || 
      s.email?.toLowerCase().includes(q) || 
      s.mobile?.includes(q);
  });

  return (
    <AdminLayout>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Registered Students</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Registered Student Scholars</h3>
        </div>
      </div>

      {/* Search Bar */}
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
                placeholder="Search by student name, email, or mobile..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6 col-lg-8 d-flex align-items-center justify-content-end">
            <span className="text-muted small fw-semibold">
              Showing {filtered.length} of {students.length} registered scholars
            </span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="admin-table shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Scholar Name</th>
                <th>Email Address</th>
                <th>Mobile Number</th>
                <th>Enrolled Courses</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted small mt-2">Loading student records...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No registered scholars found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-primary-light text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', minWidth: '36px' }}>
                          {s.fullName?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <strong className="text-dark d-block">{s.fullName}</strong>
                          <span className="text-muted small">Registered Scholar</span>
                        </div>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td>{s.mobile || '—'}</td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {s.enrolledCourses?.length || 1} Courses
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success text-white">Active</span>
                    </td>
                    <td className="text-end">
                      <button 
                        onClick={() => setAssignModal({ open: true, student: s, selectedCourse: courses[0]?._id || '' })}
                        className="btn btn-sm btn-outline-primary"
                        title="Assign Course / Test Series"
                      >
                        <i className="fa-solid fa-plus me-1"></i> Assign Course
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Assign Course Modal */}
      {assignModal.open && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  Assign Course to {assignModal.student?.fullName}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setAssignModal({ open: false, student: null, selectedCourse: '' })}
                ></button>
              </div>
              <div className="modal-body py-4">
                <p className="text-muted small mb-3">
                  Select an academic course to unlock in this scholar's student dashboard immediately without payment:
                </p>
                <div className="mb-3">
                  <label className="form-label text-dark fw-bold small">Choose Course</label>
                  <select 
                    className="form-select"
                    value={assignModal.selectedCourse}
                    onChange={(e) => setAssignModal({ ...assignModal, selectedCourse: e.target.value })}
                  >
                    {courses.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={() => setAssignModal({ open: false, student: null, selectedCourse: '' })}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleAssignCourse}
                  className="btn btn-primary fw-bold px-4"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

