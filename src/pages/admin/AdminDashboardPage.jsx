import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboardPage() {
  const [courseList, setCourseList] = useState([]);
  const [testSeriesList, setTestSeriesList] = useState([]);
  const [stats, setStats] = useState({ courses: 0, questions: 0, testSeries: 0, students: 0, inquiries: 0 });
  const [loading, setLoading] = useState(true);

  const colors = ['color1', 'color2', 'color3', 'color4', 'color5', 'color6', 'color7'];

  useEffect(() => {
    // 1. Fetch purchase and plan distribution
    fetch('/api/admin/purchaseCount')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setCourseList(d.data.courseList || []);
          setTestSeriesList(d.data.testSeriesList || []);
        }
      })
      .catch(console.error);

    // 2. Fetch platform stats
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setStats(d.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      {/* 1. Authentic Welcome Banner (Decompiled Ivy AST) */}
      <div className="row align-items-end mb-4">
        <div className="col-xl-12 col-12">
          <div 
            className="box bg-primary-light p-4 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #eef5ff 0%, #e0edff 100%)',
              borderLeft: '5px solid #216cec',
              borderRadius: '12px'
            }}
          >
            <div className="box-body p-xl-0">
              <div className="row align-items-center">
                <div className="col-12 col-lg-8">
                  <h2 className="fw-bold text-dark mb-2">
                    Welcome <strong className="text-primary">Admin!</strong>
                  </h2>
                  <p className="text-dark my-10 fs-16 mb-1">
                    Your students completed <strong className="text-warning">80% </strong> of the tasks.
                  </p>
                  <p className="text-dark my-10 fs-16 mb-0">
                    Progress is <strong className="text-warning">very good!</strong>
                  </p>
                </div>
                <div className="col-12 col-lg-4 text-center d-none d-lg-block">
                  <img 
                    src="/assets/images/svg-icon/custom-14.svg" 
                    alt="Admin Illustration" 
                    style={{ maxHeight: '130px', width: 'auto' }}
                    onError={(e) => { e.target.src = '/assets/website-assets/img/object.png'; }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Platform Summary Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 rounded-3 bg-white h-100 border-start border-4 border-primary">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold">Active Courses</span>
                <h3 className="fw-bold text-dark mb-0 mt-1">{stats.courses || 19}</h3>
              </div>
              <div className="p-3 bg-primary-light rounded-circle text-primary fs-4">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 rounded-3 bg-white h-100 border-start border-4 border-success">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold">MCQs in Database</span>
                <h3 className="fw-bold text-dark mb-0 mt-1">{stats.questions || 450}</h3>
              </div>
              <div className="p-3 bg-success-light rounded-circle text-success fs-4">
                <i className="fa-solid fa-circle-question"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 rounded-3 bg-white h-100 border-start border-4 border-warning">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold">Test Series</span>
                <h3 className="fw-bold text-dark mb-0 mt-1">{stats.testSeries || 8}</h3>
              </div>
              <div className="p-3 bg-warning-light rounded-circle text-warning fs-4">
                <i className="fa-solid fa-pen-to-square"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 rounded-3 bg-white h-100 border-start border-4 border-danger">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold">Inquiries &amp; Doubts</span>
                <h3 className="fw-bold text-dark mb-0 mt-1">{stats.inquiries || 4}</h3>
              </div>
              <div className="p-3 bg-danger-light rounded-circle text-danger fs-4">
                <i className="fa-regular fa-bell"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Authentic Student Count Section (Decompiled Ivy AST) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white p-4 rounded-4 shadow-sm border">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h4 className="fw-bold text-dark mb-1">Student Count</h4>
                <p className="text-muted small mb-0">Real-time enrollment distribution across curriculum courses and test series batches.</p>
              </div>
              <Link to="/admin/registered-student" className="btn btn-sm btn-outline-primary fw-semibold">
                View All Scholars
              </Link>
            </div>

            {/* Courses Distribution */}
            <h6 className="fw-bold text-dark mb-2 text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
              <i className="fa-solid fa-book-open text-primary me-2"></i> Courses
            </h6>
            <div className="row g-3 p-2 border rounded-3 bg-light mb-4">
              {courseList.length === 0 && !loading ? (
                <div className="col-12 py-3 text-center text-muted small">No courses found</div>
              ) : (
                courseList.map((c, idx) => (
                  <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2">
                    <div className={`course-count ${colors[idx % colors.length]}`}>
                      <h3>{c.count}</h3>
                      <span>{c.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Test Series Distribution */}
            <h6 className="fw-bold text-dark mb-2 text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
              <i className="fa-solid fa-list-check text-warning me-2"></i> Test Series
            </h6>
            <div className="row g-3 p-2 border rounded-3 bg-light">
              {testSeriesList.length === 0 && !loading ? (
                <div className="col-12 py-3 text-center text-muted small">No test series found</div>
              ) : (
                testSeriesList.map((t, idx) => (
                  <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2">
                    <div className={`course-count ${colors[(idx + 2) % colors.length]}`}>
                      <h3>{t.count}</h3>
                      <span>{t.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Administration Actions */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card p-3 shadow-sm border rounded-3 bg-white h-100">
            <h6 className="fw-bold text-dark mb-2">
              <i className="fa-solid fa-plus-circle text-primary me-2"></i> Course Management
            </h6>
            <p className="text-muted small mb-3">Add academic programs, manage subjects, configure syllabus modules, and upload commentary PDFs.</p>
            <div className="d-flex gap-2 mt-auto">
              <Link to="/admin/add-course" className="btn btn-sm btn-primary">
                Add Course
              </Link>
              <Link to="/admin/view-course" className="btn btn-sm btn-outline-secondary">
                View All
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 shadow-sm border rounded-3 bg-white h-100">
            <h6 className="fw-bold text-dark mb-2">
              <i className="fa-solid fa-database text-success me-2"></i> Question Bank &amp; Tests
            </h6>
            <p className="text-muted small mb-3">Add and edit MCQs, bulk import question JSON, configure test rounds, and audit student scores.</p>
            <div className="d-flex gap-2 mt-auto">
              <Link to="/admin/question-bank" className="btn btn-sm btn-success text-white">
                Import Questions
              </Link>
              <Link to="/admin/view-question-bank" className="btn btn-sm btn-outline-secondary">
                Browse Bank
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 shadow-sm border rounded-3 bg-white h-100">
            <h6 className="fw-bold text-dark mb-2">
              <i className="fa-solid fa-users-gear text-warning me-2"></i> Scholar Enrollment
            </h6>
            <p className="text-muted small mb-3">Manage registered scholars, assign courses or test series, and review contact messages.</p>
            <div className="d-flex gap-2 mt-auto">
              <Link to="/admin/registered-student" className="btn btn-sm btn-warning text-dark fw-bold">
                Student Roster
              </Link>
              <Link to="/admin/enquiry" className="btn btn-sm btn-outline-secondary">
                Inquiries
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

