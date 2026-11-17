import {adminFetch as fetch} from '../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function AdminCmsPage() {
  const { showToast } = useApp();
  const [stats, setStats] = useState({ courses: 0, questions: 0, testSeries: 0, faculty: 0, inquiries: 0 });
  const [activeTab, setActiveTab] = useState('overview');

  // Course Form
  const [newCourse, setNewCourse] = useState({ name: '', categoryName: 'AIAPGET', detail: '', price: 8499, discountPrice: 6999 });

  // Question Import
  const [jsonInput, setJsonInput] = useState('');

  const fetchStats = () => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { if (d.status) setStats(d.data); });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.name) {
      showToast('Course name is required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });
      const data = await res.json();
      if (data.status) {
        showToast('Course added to local database successfully!', 'success');
        setNewCourse({ name: '', categoryName: 'AIAPGET', detail: '', price: 8499, discountPrice: 6999 });
        fetchStats();
      }
    } catch (e) {
      showToast('Error creating course', 'error');
    }
  };

  const handleImportQuestions = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) {
      showToast('Please paste a JSON array of questions', 'error');
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        showToast('JSON must be an array of question objects', 'error');
        return;
      }
      const res = await fetch('/api/admin/import-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsed })
      });
      const data = await res.json();
      if (data.status) {
        showToast(data.message, 'success');
        setJsonInput('');
        fetchStats();
      }
    } catch (err) {
      showToast(`Invalid JSON: ${err.message}`, 'error');
    }
  };

  return (
    <div className="admin-cms-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Local Content Management (CMS)</li>
          </ol>
        </nav>

        <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm border mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge bg-danger text-white px-3 py-1 mb-2">Localhost Admin Console</span>
              <h2 className="fw-bold text-dark mb-1">Pratyaksh Ayurveda Local CMS</h2>
              <p className="text-muted mb-0">Directly manage local courses, question banks, and JSON/CSV imports without passwords or cloud restrictions.</p>
            </div>
            <Link to="/" className="btn btn-outline-secondary">
              <i className="fa-solid fa-arrow-left me-1"></i> Back to Site
            </Link>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="row g-4 mb-4">
          <div className="col-md-2 col-6">
            <div className="stat-counter-box p-3 h-100">
              <div className="stat-counter-number" style={{ fontSize: '1.6rem' }}>{stats.courses}</div>
              <small className="text-muted fw-bold">Active Courses</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stat-counter-box p-3 h-100">
              <div className="stat-counter-number" style={{ fontSize: '1.6rem' }}>{stats.questions}</div>
              <small className="text-muted fw-bold">MCQs in Database</small>
            </div>
          </div>
          <div className="col-md-2 col-6">
            <div className="stat-counter-box p-3 h-100">
              <div className="stat-counter-number" style={{ fontSize: '1.6rem' }}>{stats.testSeries}</div>
              <small className="text-muted fw-bold">Test Series</small>
            </div>
          </div>
          <div className="col-md-2 col-6">
            <div className="stat-counter-box p-3 h-100">
              <div className="stat-counter-number" style={{ fontSize: '1.6rem' }}>{stats.faculty}</div>
              <small className="text-muted fw-bold">Faculty</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stat-counter-box p-3 h-100">
              <div className="stat-counter-number" style={{ fontSize: '1.6rem' }}>{stats.inquiries}</div>
              <small className="text-muted fw-bold">Contact Inquiries</small>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="d-flex gap-2 mb-4 border-bottom pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`btn btn-sm px-3 py-2 fw-bold rounded-pill ${activeTab === 'overview' ? 'btn-ayur' : 'btn-light border'}`}
          >
            Add New Course
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`btn btn-sm px-3 py-2 fw-bold rounded-pill ${activeTab === 'import' ? 'btn-ayur' : 'btn-light border'}`}
          >
            Import Questions (JSON / CSV)
          </button>
        </div>

        {/* Tab 1: Add Course */}
        {activeTab === 'overview' && (
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            <h4 className="fw-bold text-dark mb-3">Create / Add New Course</h4>
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
              Add a new course to the local SQLite database. It will immediately appear across course catalog and student LMS.
            </p>

            <form onSubmit={handleCreateCourse}>
              <div className="row g-3 mb-3">
                <div className="col-md-8">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Course Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ayurdeeksha 4.0 - Advanced Samhita Revision"
                    required
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Category</label>
                  <select
                    className="form-select"
                    value={newCourse.categoryName}
                    onChange={(e) => setNewCourse({ ...newCourse, categoryName: e.target.value })}
                  >
                    <option value="AIAPGET">AIAPGET</option>
                    <option value="BAMS I-III">BAMS I-III</option>
                    <option value="Graduates">Graduates</option>
                    <option value="Practicing Vaidya">Practicing Vaidya</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Description / Syllabus Overview</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Detail the modules, live schedules, and test series included..."
                  value={newCourse.detail}
                  onChange={(e) => setNewCourse({ ...newCourse, detail: e.target.value })}
                ></textarea>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Original Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Discounted Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newCourse.discountPrice}
                    onChange={(e) => setNewCourse({ ...newCourse, discountPrice: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-ayur px-4 py-2 fw-bold">
                <i className="fa-solid fa-plus me-1"></i> Save Course to SQLite
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Question Importer */}
        {activeTab === 'import' && (
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            <h4 className="fw-bold text-dark mb-2">Import MCQs from JSON</h4>
            <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
              Paste an array of questions in the format below to immediately populate the local question bank:
            </p>

            <div className="p-3 bg-light rounded-3 font-monospace mb-3" style={{ fontSize: '0.8rem' }}>
{`[
  {
    "question": "Which Mahabhuta predominance produces Tikta Rasa?",
    "optionA": "Vayu + Akasha",
    "optionB": "Vayu + Agni",
    "optionC": "Jala + Prithvi",
    "optionD": "Agni + Prithvi",
    "correctOption": "A",
    "subject": "Dravyaguna",
    "explanation": "Tikta Rasa is predominantly formed of Vayu and Akasha.",
    "reference": "Charaka Sutra 26/40"
  }
]`}
            </div>

            <form onSubmit={handleImportQuestions}>
              <div className="mb-3">
                <textarea
                  className="form-control font-monospace"
                  rows="8"
                  placeholder="Paste JSON array here..."
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-ayur px-4 py-2 fw-bold">
                <i className="fa-solid fa-file-import me-1"></i> Import into Database
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

