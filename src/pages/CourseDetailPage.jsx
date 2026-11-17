import { studentFetch as fetch } from '../services/studentFetch';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { useApp } from '../context/AppContext';

export default function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, enrollCourse, enrolledCourses, showToast } = useApp();
  const navigate = useNavigate();

  const isEnrolled = enrolledCourses.includes(id);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/course/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setCourse(d.data);
          if (d.data.subjects && d.data.subjects.length > 0) {
            setSubjects(d.data.subjects);
            setSelectedSubject(d.data.subjects[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/sub-subject/chapter/active/${selectedSubject._id}`)
        .then(r => r.json())
        .then(d => {
          if (d.status && d.data) {
            setChapters(d.data);
          } else {
            setChapters([]);
          }
        })
        .catch(console.error);
    }
  }, [selectedSubject]);

  if (loading) {
    return (
      <div className="container py-5 text-center min-vh-100">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading Course Details...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-5 text-center min-vh-100">
        <h3>Course Not Found</h3>
        <p className="text-muted">The requested course could not be located.</p>
        <Link to="/courses" className="btn btn-ayur">Back to Courses</Link>
      </div>
    );
  }

  const imgSrc = course.img?.startsWith('http') 
    ? course.img 
    : (course.img ? `/${course.img}` : '/assets/upload/Aiapget 1.png');

  return (
    <div className="course-detail-page bg-light py-5 min-vh-100">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/courses" className="text-decoration-none">Courses</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{course.name}</li>
          </ol>
        </nav>

        {/* Hero Banner for Course */}
        <div className="bg-white rounded-4 p-4 p-lg-5 shadow-sm border mb-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark fw-bold px-3 py-2 mb-2">
                {course.categoryID?.name || 'Ayurveda'}
              </span>
              <h1 className="fw-bold text-dark mb-3">{course.name}</h1>
              <p className="lead text-muted mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                {course.detail}
              </p>

              <div className="d-flex flex-wrap gap-4 text-muted mb-4 pb-3 border-bottom" style={{ fontSize: '0.9rem' }}>
                <div><i className="fa-solid fa-star text-warning me-1"></i> <span className="fw-bold text-dark">4.9 / 5.0</span> (120+ Ratings)</div>
                <div><i className="fa-solid fa-users text-primary me-1"></i> 1,420+ Enrolled Scholars</div>
                <div><i className="fa-solid fa-video text-danger me-1"></i> Full Video &amp; Notes Access</div>
                <div><i className="fa-solid fa-clock text-info me-1"></i> Self-Paced &amp; Offline Ready</div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap align-items-center gap-3">
                {isEnrolled ? (
                  <button 
                    onClick={() => navigate(`/subjects/${course._id}`)}
                    className="btn btn-success btn-lg px-4 fw-bold"
                  >
                    <i className="fa-solid fa-play me-2"></i> Resume Learning (LMS)
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        enrollCourse(course._id);
                        navigate(`/subjects/${course._id}`);
                      }}
                      className="btn btn-ayur btn-lg px-4 fw-bold"
                    >
                      <i className="fa-solid fa-bolt me-2"></i> Instant Enroll (Local Demo)
                    </button>
                    <button 
                      onClick={() => addToCart(course)}
                      className="btn btn-outline-dark btn-lg px-4 fw-bold"
                    >
                      <i className="fa-solid fa-bag-shopping me-2"></i> Add to Bag
                    </button>
                  </>
                )}
                <Link to="/student-tests" className="btn btn-outline-secondary btn-lg px-3">
                  <i className="fa-solid fa-pencil me-1"></i> Test Series
                </Link>
              </div>
            </div>

            <div className="col-lg-4 text-center">
              <div className="position-relative d-inline-block w-100">
                <img 
                  src={imgSrc} 
                  alt={course.name} 
                  className="img-fluid rounded-4 shadow border"
                  style={{ maxHeight: '280px', width: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/assets/upload/Aiapget 1.png'; }}
                />
                <div className="mt-3 p-3 bg-light rounded-3 border">
                  <div className="d-flex align-items-baseline justify-content-center gap-2">
                    <span className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>
                      ₹{course.discount_price ? course.discount_price.toLocaleString() : '8,499'}
                    </span>
                    {course.price && (
                      <span className="text-muted text-decoration-line-through">
                        ₹{course.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="badge bg-success text-white">Save 35% Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Video Lecture Section */}
        <div className="bg-white rounded-4 p-4 p-lg-5 shadow-sm border mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <span className="badge bg-danger text-white px-2 py-1 mb-1">
                <i className="fa-solid fa-circle-play me-1"></i> Free Demo Preview
              </span>
              <h4 className="fw-bold text-dark mb-0">Watch Sample Lecture: Samhita Decoding</h4>
            </div>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Duration: 42:30 • Full HD</span>
          </div>

          <VideoPlayer
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            title={`${course.name} - Demo Lecture`}
            lessonId={`demo_${course._id}`}
          />
        </div>

        {/* Syllabus / Subject Modules Accordion */}
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="bg-white rounded-4 p-4 p-lg-5 shadow-sm border">
              <h4 className="fw-bold text-dark mb-3">Curriculum &amp; Syllabus Modules</h4>
              <p className="text-muted mb-4">Browse through the subjects and chapters covered in this course:</p>

              {subjects.length > 0 ? (
                <div>
                  {/* Subject Pills */}
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {subjects.map(s => (
                      <button
                        key={s._id}
                        onClick={() => setSelectedSubject(s)}
                        className={`btn btn-sm px-3 py-2 fw-semibold rounded-pill ${selectedSubject?._id === s._id ? 'btn-ayur' : 'btn-light border'}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  {/* Chapters List */}
                  <div className="list-group">
                    {chapters.map((ch, idx) => (
                      <div key={ch._id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3">
                        <div className="d-flex align-items-center gap-3">
                          <span className="badge bg-light text-dark border rounded-circle p-2" style={{ width: '32px', height: '32px' }}>
                            {idx + 1}
                          </span>
                          <div>
                            <h6 className="fw-bold text-dark mb-0">{ch.name}</h6>
                            <small className="text-muted">3 Video Lectures • Detailed Commentary Notes</small>
                          </div>
                        </div>

                        <Link 
                          to={`/chapter-details/${ch._id}`} 
                          className="btn btn-sm btn-outline-warning text-dark fw-bold"
                        >
                          <i className="fa-solid fa-play me-1"></i> Start Lessons
                        </Link>
                      </div>
                    ))}
                    {chapters.length === 0 && (
                      <div className="p-4 text-center text-muted">
                        No chapters listed under this subject module yet.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted">
                  Full syllabus details are accessible under the Student LMS dashboard.
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Key Highlights & Guarantee */}
          <div className="col-lg-4">
            <div className="bg-white rounded-4 p-4 shadow-sm border mb-4">
              <h5 className="fw-bold text-dark mb-3">Course Inclusions</h5>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-4" style={{ fontSize: '0.9rem' }}>
                <li className="d-flex align-items-start gap-2">
                  <i className="fa-solid fa-check text-success mt-1"></i>
                  <span><strong>Full Samhita Dissection:</strong> Charaka, Sushruta, Ashtanga Hridaya, Sharangadhara line-by-line decoding.</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <i className="fa-solid fa-check text-success mt-1"></i>
                  <span><strong>31+ Mock Test Series:</strong> Pragya Vitarka NTA standard simulated tests.</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <i className="fa-solid fa-check text-success mt-1"></i>
                  <span><strong>High-Yield Mnemonics:</strong> Rapid revision sheets for numbers, formulations, and doses.</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <i className="fa-solid fa-check text-success mt-1"></i>
                  <span><strong>Unlimited Video Replays:</strong> Study anytime on mobile, tablet, or laptop.</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <i className="fa-solid fa-check text-success mt-1"></i>
                  <span><strong>Direct Faculty Access:</strong> Regular live doubt-clearing sessions.</span>
                </li>
              </ul>

              <div className="p-3 bg-light rounded-3 text-center border">
                <i className="fa-solid fa-shield-halved text-warning mb-2" style={{ fontSize: '1.8rem' }}></i>
                <h6 className="fw-bold text-dark mb-1">Localhost Development Mode</h6>
                <small className="text-muted d-block">
                  Enjoy unrestricted local exploration without passwords or payment barriers.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

