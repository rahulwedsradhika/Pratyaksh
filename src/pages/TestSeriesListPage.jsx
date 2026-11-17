import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import StudentLayout from '../components/StudentLayout';

export default function TestSeriesListPage() {
  const location = useLocation();
  const isStudentPortal = location.pathname.startsWith('/student');

  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test-series')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setSeriesList(d.data);
          if (d.data.length > 0) setSelectedSeries(d.data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const content = (
    <div className={`test-series-list-page ${isStudentPortal ? 'p-0' : 'py-5 bg-light min-vh-100'}`}>
      <div className={isStudentPortal ? 'container-fluid' : 'container'}>
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item">
              <Link to={isStudentPortal ? "/student" : "/dashboard"} className="text-decoration-none">
                Dashboard
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">Test Series Catalog</li>
          </ol>
        </nav>

        <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm border mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge bg-warning text-dark px-3 py-1 mb-2">Pragya Vitarka Series</span>
              <h2 className="fw-bold text-dark mb-1">AIAPGET &amp; State AMO Test Series</h2>
              <p className="text-muted mb-0">31 Comprehensive test rounds with NTA pattern, negative marking (+4 / -1 or +3 / -1), and timer simulation.</p>
            </div>
            <Link to="/practice-mode" className="btn btn-warning text-dark fw-bold">
              <i className="fa-solid fa-bolt me-1"></i> Switch to Practice Mode
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : (
          <div className="row g-4">
            {/* Left Column: Test Series Selector */}
            <div className="col-lg-4">
              <div className="bg-white rounded-4 p-3 shadow-sm border mb-4">
                <h5 className="fw-bold text-dark mb-3 px-2">All Test Series ({seriesList.length})</h5>
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {seriesList.map((ts, idx) => {
                    const isSelected = selectedSeries?._id === ts._id;
                    return (
                      <div
                        key={ts._id}
                        onClick={() => setSelectedSeries(ts)}
                        className={`p-3 rounded-3 border cursor-pointer transition-all ${
                          isSelected ? 'border-warning bg-warning bg-opacity-10 shadow-sm' : 'border-light bg-light hover-bg-white'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <strong className={`small ${isSelected ? 'text-dark' : 'text-secondary'}`}>
                            {idx + 1}. {ts.name}
                          </strong>
                          <span className="badge bg-success ms-2">Unlocked</span>
                        </div>
                        <small className="text-muted d-block">{ts.totalPaper || 10} Papers • Bilingual</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Papers Inside Selected Series */}
            <div className="col-lg-8">
              {selectedSeries ? (
                <div className="bg-white rounded-4 p-4 shadow-sm border">
                  <div className="border-bottom pb-3 mb-4">
                    <span className="badge bg-warning text-dark px-3 py-1 mb-2">Selected Series</span>
                    <h3 className="fw-bold text-dark mb-1">{selectedSeries.name}</h3>
                    <p className="text-muted mb-0">{selectedSeries.detail || 'Full-syllabus mock tests strictly adhering to official NCISM & NTA marking standards.'}</p>
                  </div>

                  <h5 className="fw-bold text-dark mb-3">Available Test Papers</h5>
                  <div className="d-flex flex-column gap-3">
                    {(selectedSeries.papers && selectedSeries.papers.length > 0 ? selectedSeries.papers : [
                      { _id: `${selectedSeries._id}_p1`, name: `${selectedSeries.name} - Full Mock Paper 1`, totalQuestions: 120, timeLimit: 120 },
                      { _id: `${selectedSeries._id}_p2`, name: `${selectedSeries.name} - Full Mock Paper 2`, totalQuestions: 120, timeLimit: 120 },
                      { _id: `${selectedSeries._id}_p3`, name: `${selectedSeries.name} - Subject Drill Paper 3`, totalQuestions: 120, timeLimit: 120 }
                    ]).map((paper, pIdx) => (
                      <div key={paper._id || pIdx} className="p-3 bg-light rounded-3 border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                        <div>
                          <h6 className="fw-bold text-dark mb-1">{paper.name}</h6>
                          <div className="d-flex gap-3 text-muted small">
                            <span><i className="fa-solid fa-list-ol me-1"></i> {paper.totalQuestions || 120} Questions</span>
                            <span><i className="fa-regular fa-clock me-1"></i> {paper.timeLimit || 120} Minutes</span>
                            <span><i className="fa-solid fa-award me-1"></i> 480 Marks</span>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <Link 
                            to={`/exam-mode/${paper._id || 'mock_test_1'}`} 
                            className="btn btn-warning fw-bold text-dark px-4 shadow-sm"
                          >
                            <i className="fa-solid fa-pen-to-square me-1"></i> Attempt Test
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
                  <p className="text-muted">Select a test series to view papers.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isStudentPortal) {
    return <StudentLayout>{content}</StudentLayout>;
  }

  return content;
}
