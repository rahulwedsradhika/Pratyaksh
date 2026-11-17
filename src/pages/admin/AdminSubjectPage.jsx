import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminSubjectPage({ mode = 'view' }) {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState({ name: '', courseID: '', detail: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  const fetchSubjects = () => {
    fetch('/api/course')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setCourses(d.data);
          if (d.data.length > 0 && !selectedCourse) {
            setSelectedCourse(d.data[0]._id);
            loadCourseSubjects(d.data[0]._id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadCourseSubjects = (courseId) => {
    fetch(`/api/subject/course/${courseId}`)
      .then(r => r.json())
      .then(d => {
        if (d.status) setSubjects(d.data || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCourseChange = (cId) => {
    setSelectedCourse(cId);
    loadCourseSubjects(cId);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim() || !selectedCourse) {
      showToast('Subject name and course are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSubject, courseID: selectedCourse })
      });
      const data = await res.json();
      if (data.status) {
        showToast('Subject added successfully!', 'success');
        setNewSubject({ name: '', courseID: selectedCourse, detail: '' });
        loadCourseSubjects(selectedCourse);
      } else {
        showToast(data.message || 'Error adding subject', 'error');
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
              <li className="breadcrumb-item">Subject</li>
              <li className="breadcrumb-item active" aria-current="page">Subject Modules</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Subject &amp; Samhita Management</h3>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Form: Add Subject */}
        <div className="col-12 col-lg-5">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <h5 className="fw-bold text-dark mb-3">Add Subject to Course</h5>
            <form onSubmit={handleAddSubject}>
              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Select Course *</label>
                <select 
                  className="form-select" 
                  value={selectedCourse} 
                  onChange={(e) => handleCourseChange(e.target.value)}
                  required
                >
                  {courses.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Subject Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Charaka Samhita, Sushruta Samhita, Dravyaguna" 
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Sthana / Section Details</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="e.g. Sutra, Nidana, Vimana, Sharira, Chikitsa Sthana modules..." 
                  value={newSubject.detail}
                  onChange={(e) => setNewSubject({ ...newSubject, detail: e.target.value })}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary w-100 fw-bold"
              >
                {saving ? 'Adding...' : 'Add Subject to Course'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Table: Subjects in Selected Course */}
        <div className="col-12 col-lg-7">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0">Configured Subjects</h5>
              <span className="badge bg-light text-dark border">
                {subjects.length} Subjects
              </span>
            </div>

            <div className="admin-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Modules / Sthana</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">
                        No subjects configured for this course yet.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((s, idx) => (
                      <tr key={s._id || idx}>
                        <td><strong className="text-dark">{s.name}</strong></td>
                        <td><span className="text-muted small">{s.detail || 'Standard Curriculum'}</span></td>
                        <td>
                          <Link to="/admin/create-chapter" className="btn btn-sm btn-outline-primary">
                            Chapters
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

