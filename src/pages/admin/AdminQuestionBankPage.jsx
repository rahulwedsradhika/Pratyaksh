import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

function renderSafeText(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (typeof val === 'object') {
    const t = val.hindi || val.eng || val.data || '';
    return typeof t === 'string' ? t.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : String(t);
  }
  return String(val);
}

export default function AdminQuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'add', 'import'

  // Single Question Form State
  const [newQ, setNewQ] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    subject: 'Charaka Samhita',
    explanation: '',
    reference: ''
  });

  // Bulk JSON State
  const [jsonInput, setJsonInput] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  const fetchQuestions = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit: pageSize,
      search,
      subject: subjectFilter
    });

    fetch(`/api/admin/questions?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.status) {
          setQuestions(d.data || []);
          setTotalCount(d.total || 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, search, subjectFilter]);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQ.question.trim() || !newQ.optionA.trim() || !newQ.optionB.trim()) {
      showToast('Question and Options are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ)
      });
      const data = await res.json();
      if (data.status) {
        showToast('Question added to Question Bank!', 'success');
        setNewQ({
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: 'A',
          subject: 'Charaka Samhita',
          explanation: '',
          reference: ''
        });
        setActiveTab('browse');
        fetchQuestions();
      } else {
        showToast(data.message || 'Error saving question', 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImportJSON = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) {
      showToast('Please paste a JSON array of question objects', 'error');
      return;
    }
    setSaving(true);
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        showToast('JSON root must be an array of questions', 'error');
        setSaving(false);
        return;
      }
      const res = await fetch('/api/admin/import-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsed })
      });
      const data = await res.json();
      if (data.status) {
        showToast(data.message || 'Questions imported successfully!', 'success');
        setJsonInput('');
        setActiveTab('browse');
        fetchQuestions();
      } else {
        showToast(data.message || 'Error importing questions', 'error');
      }
    } catch (err) {
      showToast(`Invalid JSON syntax: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qId) => {
    if (!window.confirm('Delete this question from question bank?')) return;
    try {
      const res = await fetch(`/api/admin/questions/${qId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status) {
        showToast('Question deleted', 'success');
        fetchQuestions();
      }
    } catch (e) {
      showToast('Error deleting question', 'error');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item">Question Bank</li>
              <li className="breadcrumb-item active" aria-current="page">MCQ Repository</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Ayurveda Question Bank</h3>
        </div>

        {/* View Mode Switcher */}
        <div className="btn-group">
          <button 
            onClick={() => setActiveTab('browse')}
            className={`btn btn-sm ${activeTab === 'browse' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            <i className="fa-solid fa-list me-1"></i> Browse ({totalCount})
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`btn btn-sm ${activeTab === 'add' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            <i className="fa-solid fa-plus me-1"></i> Add Question
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`btn btn-sm ${activeTab === 'import' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            <i className="fa-solid fa-file-import me-1"></i> Bulk Import
          </button>
        </div>
      </div>

      {/* TAB 1: BROWSE QUESTION BANK */}
      {activeTab === 'browse' && (
        <>
          {/* Filter Bar */}
          <div className="card p-3 shadow-sm border-0 rounded-3 bg-white mb-4">
            <div className="row g-3">
              <div className="col-md-6 col-lg-5">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="fa-solid fa-magnifying-glass text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-start-0" 
                    placeholder="Search question text, keyword, or commentary..." 
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
              <div className="col-md-4 col-lg-3">
                <select 
                  className="form-select"
                  value={subjectFilter}
                  onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Subjects</option>
                  <option value="Charaka Samhita">Charaka Samhita</option>
                  <option value="Sushruta Samhita">Sushruta Samhita</option>
                  <option value="Ashtanga Hridaya">Ashtanga Hridaya</option>
                  <option value="Dravyaguna">Dravyaguna</option>
                  <option value="Rasa Shastra">Rasa Shastra</option>
                  <option value="Kayachikitsa">Kayachikitsa</option>
                  <option value="Shalya Tantra">Shalya Tantra</option>
                </select>
              </div>
              <div className="col-md-2 col-lg-4 d-flex align-items-center justify-content-end">
                <span className="text-muted small fw-semibold">
                  Page {page} of {totalPages}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="admin-table shadow-sm mb-4">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>Question</th>
                    <th>Options</th>
                    <th style={{ width: '80px' }}>Correct</th>
                    <th>Subject</th>
                    <th>Reference</th>
                    <th className="text-end" style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="text-muted small mt-2">Loading question bank...</p>
                      </td>
                    </tr>
                  ) : questions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No questions found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    questions.map((q, idx) => (
                      <tr key={q.id || idx}>
                        <td className="text-muted small">{(page - 1) * pageSize + idx + 1}</td>
                        <td>
                          <strong className="text-dark d-block mb-1">{renderSafeText(q.questionText || q.question)}</strong>
                          {(q.explanation || q.solution) && (
                            <small className="text-muted d-block font-monospace" style={{ fontSize: '0.75rem' }}>
                              {renderSafeText(q.explanation || q.solution)}
                            </small>
                          )}
                        </td>
                        <td>
                          <div className="small text-muted" style={{ fontSize: '0.8rem' }}>
                            <div><strong>A:</strong> {renderSafeText(q.optionA || q.opt1 || q.option_a)}</div>
                            <div><strong>B:</strong> {renderSafeText(q.optionB || q.opt2 || q.option_b)}</div>
                            <div><strong>C:</strong> {renderSafeText(q.optionC || q.opt3 || q.option_c)}</div>
                            <div><strong>D:</strong> {renderSafeText(q.optionD || q.opt4 || q.option_d)}</div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-success text-white fw-bold">
                            {q.correctOption || q.correct_option}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {q.subject || 'Ayurveda'}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted small">{q.reference || '—'}</span>
                        </td>
                        <td className="text-end">
                          <button 
                            onClick={() => handleDelete(q.id)}
                            className="btn btn-sm btn-light text-danger"
                            title="Delete question"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border shadow-sm">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-sm btn-outline-secondary"
              >
                <i className="fa-solid fa-chevron-left me-1"></i> Previous
              </button>
              <span className="text-muted small">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} Questions
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-sm btn-outline-secondary"
              >
                Next <i className="fa-solid fa-chevron-right ms-1"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* TAB 2: ADD SINGLE QUESTION */}
      {activeTab === 'add' && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9">
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
              <h5 className="fw-bold text-dark mb-3">Add New MCQ to Question Bank</h5>
              <form onSubmit={handleAddQuestion}>
                <div className="mb-3">
                  <label className="form-label text-dark fw-bold small">Question Statement *</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Enter the question text (Sanskrit verses or English translation)..."
                    required
                    value={newQ.question}
                    onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
                  ></textarea>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-dark fw-bold small">Option A *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={newQ.optionA}
                      onChange={(e) => setNewQ({ ...newQ, optionA: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-dark fw-bold small">Option B *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={newQ.optionB}
                      onChange={(e) => setNewQ({ ...newQ, optionB: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-dark fw-bold small">Option C</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newQ.optionC}
                      onChange={(e) => setNewQ({ ...newQ, optionC: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-dark fw-bold small">Option D</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newQ.optionD}
                      onChange={(e) => setNewQ({ ...newQ, optionD: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label text-dark fw-bold small">Correct Option *</label>
                    <select 
                      className="form-select fw-bold"
                      value={newQ.correctOption}
                      onChange={(e) => setNewQ({ ...newQ, correctOption: e.target.value })}
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-dark fw-bold small">Subject *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newQ.subject}
                      onChange={(e) => setNewQ({ ...newQ, subject: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-dark fw-bold small">Samhita Verse Reference</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Charaka Sutra 26/40"
                      value={newQ.reference}
                      onChange={(e) => setNewQ({ ...newQ, reference: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-dark fw-bold small">Commentary / Rationale Explanation</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Provide commentary citations (Chakrapani, Dalhana, Arundatta)..."
                    value={newQ.explanation}
                    onChange={(e) => setNewQ({ ...newQ, explanation: e.target.value })}
                  ></textarea>
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('browse')}
                    className="btn btn-outline-secondary px-4"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn btn-primary px-5 fw-bold"
                  >
                    {saving ? 'Saving...' : 'Save Question to Bank'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BULK IMPORT JSON */}
      {activeTab === 'import' && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9">
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
              <h5 className="fw-bold text-dark mb-2">Bulk Import MCQs from JSON</h5>
              <p className="text-muted small mb-3">
                Paste an array of question objects matching the schema below. They will immediately merge into SQLite:
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

              <form onSubmit={handleImportJSON}>
                <div className="mb-3">
                  <textarea 
                    className="form-control font-monospace"
                    rows="9"
                    placeholder="Paste JSON array here..."
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  ></textarea>
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('browse')}
                    className="btn btn-outline-secondary px-4"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn btn-success text-white px-5 fw-bold"
                  >
                    {saving ? 'Importing...' : 'Import into Database'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

