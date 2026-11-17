import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminChapterBankPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChapter, setNewChapter] = useState({
    title: '',
    duration: '45 Min',
    bunnyID: 'a332cfc3-37f5-4e1b-a558-5d7c14ad167f',
    notesUrl: '/upload/1778514035013_Charaka Sutra Demo.pdf',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  useEffect(() => {
    fetch('/api/course')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setCourses(d.data);
          if (d.data.length > 0) {
            setSelectedCourse(d.data[0]._id);
            fetchChaptersForCourse(d.data[0]._id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchChaptersForCourse = (courseId) => {
    fetch(`/api/sub-subject/chapter/active/${courseId}`)
      .then(r => r.json())
      .then(d => {
        if (d.status) setChapters(d.data || []);
      })
      .catch(console.error);
  };

  const handleCourseChange = (cId) => {
    setSelectedCourse(cId);
    fetchChaptersForCourse(cId);
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    if (!newChapter.title.trim() || !selectedCourse) {
      showToast('Chapter title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newChapter, courseID: selectedCourse })
      });
      const data = await res.json();
      if (data.status) {
        showToast('Chapter & lesson created successfully!', 'success');
        setNewChapter({
          title: '',
          duration: '45 Min',
          bunnyID: 'a332cfc3-37f5-4e1b-a558-5d7c14ad167f',
          notesUrl: '/upload/1778514035013_Charaka Sutra Demo.pdf',
          description: ''
        });
        fetchChaptersForCourse(selectedCourse);
      } else {
        showToast(data.message || 'Error creating chapter', 'error');
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
              <li className="breadcrumb-item">Chapter Bank</li>
              <li className="breadcrumb-item active" aria-current="page">Manage Chapters</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Chapter &amp; Lesson Bank</h3>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Form: Add Chapter */}
        <div className="col-12 col-lg-5">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <h5 className="fw-bold text-dark mb-3">Create New Chapter / Adhyaya</h5>
            <form onSubmit={handleCreateChapter}>
              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Course / Module *</label>
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
                <label className="form-label text-dark fw-bold small">Chapter Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Dirghanjivitiya Adhyaya (Charaka Sutra 1)" 
                  required
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-dark fw-bold small">Estimated Duration</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="45 Min" 
                    value={newChapter.duration}
                    onChange={(e) => setNewChapter({ ...newChapter, duration: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-dark fw-bold small">Bunny.net Stream Video ID</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Bunny CDN Video UUID" 
                    value={newChapter.bunnyID}
                    onChange={(e) => setNewChapter({ ...newChapter, bunnyID: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Lecture Notes PDF Path</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="/upload/1778514035013_Charaka Sutra Demo.pdf" 
                  value={newChapter.notesUrl}
                  onChange={(e) => setNewChapter({ ...newChapter, notesUrl: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-dark fw-bold small">Chapter Notes / Commentary Summary</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Key verses, operative principles, and commentaries..."
                  value={newChapter.description}
                  onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary w-100 fw-bold"
              >
                {saving ? 'Creating Chapter...' : 'Save Chapter & Lesson'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Table: Chapters in Course */}
        <div className="col-12 col-lg-7">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0">Configured Chapters</h5>
              <span className="badge bg-light text-dark border">
                {chapters.length} Chapters
              </span>
            </div>

            <div className="admin-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Chapter Title</th>
                    <th>Media / Video</th>
                    <th>Notes PDF</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        No chapters configured for this module yet.
                      </td>
                    </tr>
                  ) : (
                    chapters.map((ch, idx) => (
                      <tr key={ch._id || idx}>
                        <td>
                          <strong className="text-dark d-block">{ch.title || ch.name}</strong>
                          <span className="text-muted small">{ch.duration || '45 Min'}</span>
                        </td>
                        <td>
                          <span className="badge bg-success text-white">
                            <i className="fa-solid fa-play me-1"></i> Bunny CDN
                          </span>
                        </td>
                        <td>
                          <a 
                            href={ch.notesUrl || '/upload/1778514035013_Charaka Sutra Demo.pdf'} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-sm btn-outline-danger"
                          >
                            <i className="fa-solid fa-file-pdf me-1"></i> PDF
                          </a>
                        </td>
                        <td>
                          <Link 
                            to={`/student/lesson/${ch._id}`} 
                            target="_blank"
                            className="btn btn-sm btn-outline-primary"
                          >
                            Preview
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

