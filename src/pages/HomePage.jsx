import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [testimonials, setTestimonials] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [showTopNotice, setShowTopNotice] = useState(true);
  const { showToast } = useApp();

  useEffect(() => {
    // 1. Fetch categories
    fetch('/api/category/active')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) {
          setCategories(d.data);
          if (d.data.length > 0) setSelectedCatId(d.data[0]._id);
        }
      })
      .catch(console.error);

    // 2. Fetch courses
    fetch('/api/course')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) setCourses(d.data);
      })
      .catch(console.error);

    // 3. Fetch testimonials
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) setTestimonials(d.data);
      })
      .catch(console.error);

    // 4. Fetch blogs
    fetch('/api/blogs')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) setBlogs(d.data);
      })
      .catch(console.error);
  }, []);

  const filteredCourses = selectedCatId
    ? courses.filter(c => c.categoryID?._id === selectedCatId)
    : courses;

  return (
    <div className="home-page">
      {/* 0. Top Announcement Banner (Authentic Production) */}
      {showTopNotice && (
        <div className="bg-dark text-white py-2 px-3 position-relative" style={{ fontSize: '0.9rem' }}>
          <div className="container d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark fw-bold">Notice</span>
              <span>
                Contact Pratyaksh Ayurveda now for any query or Free demo - <a href="tel:+918795776006" className="text-warning text-decoration-none fw-bold">+91-8795776006</a>
              </span>
            </div>
            <button 
              type="button" 
              className="btn btn-sm text-white-50 p-0 fs-5 border-0 bg-transparent"
              onClick={() => setShowTopNotice(false)}
              aria-label="Close notice"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION (Authentic Production) */}
      <section className="home-slide d-flex align-items-center py-5 position-relative" style={{ minHeight: '560px', background: 'linear-gradient(135deg, #fffaf4 0%, #ffffff 50%, #fff5eb 100%)' }}>
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <div className="home-slide-text">
                <h5 className="text-warning fw-bold text-uppercase mb-2" style={{ letterSpacing: '1px', fontSize: '0.95rem' }}>
                  The Future of Ayurveda is
                </h5>
                <h1 className="sanskrit-text text-dark fw-bolder mb-3" style={{ fontSize: 'calc(1.8rem + 1.3vw)', lineHeight: '1.25' }}>
                  तिष्ठत्युपरि युक्तिज्ञो द्रव्यज्ञानवतां सदा ||
                </h1>
                <div className="trust-user mb-4">
                  <p className="lead text-muted" style={{ fontSize: '1.15rem', lineHeight: '1.6' }}>
                    Understanding concepts is always better than simply memorizing the quotations &amp; facts
                  </p>
                </div>
                <div className="d-flex flex-wrap gap-3">
                  <Link to="/course-category" className="btn btn-warning fw-bold px-4 py-3 text-dark shadow-sm rounded-pill" style={{ fontSize: '1rem' }}>
                    Get Free Demo <i className="fa-solid fa-arrow-right ms-2"></i>
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline-dark fw-bold px-4 py-3 rounded-pill" style={{ fontSize: '1rem' }}>
                    Get Free Access <i className="fa-solid fa-graduation-cap ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-5 text-center">
              <div className="position-relative d-inline-block">
                <img 
                  src="/assets/website-assets/img/object.png" 
                  alt="Pratyaksh Ayurveda Learning" 
                  className="img-fluid"
                  style={{ maxHeight: '420px', objectFit: 'contain' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/assets/upload/Aiapget 1.png'; }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS COUNTERS (Authentic Production 4 Boxes) */}
      <section className="py-4 bg-white border-top border-bottom shadow-sm">
        <div className="container">
          <div className="row g-4 text-center">
            {/* Box 1 */}
            <div className="col-6 col-lg-3">
              <div className="d-flex align-items-center justify-content-center gap-3 p-3 rounded-3 bg-light border h-100">
                <img src="/assets/website-assets/img/cources-icon.svg" alt="" width="48" height="48" />
                <div className="text-start">
                  <h4 className="fw-bolder mb-0 text-dark">159,673+</h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Students Visited</p>
                </div>
              </div>
            </div>

            {/* Box 2 */}
            <div className="col-6 col-lg-3">
              <div className="d-flex align-items-center justify-content-center gap-3 p-3 rounded-3 bg-light border h-100">
                <img src="/assets/website-assets/img/pencil-icon.svg" alt="" width="48" height="48" />
                <div className="text-start">
                  <h4 className="fw-bolder mb-0 text-dark">35,486+</h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Hours of Lessons Watched</p>
                </div>
              </div>
            </div>

            {/* Box 3 */}
            <div className="col-6 col-lg-3">
              <div className="d-flex align-items-center justify-content-center gap-3 p-3 rounded-3 bg-light border h-100">
                <img src="/assets/website-assets/img/icon/icon-4.svg" alt="" width="48" height="48" />
                <div className="text-start">
                  <h4 className="fw-bolder mb-0 text-dark">8,189,465+</h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Questions Practiced</p>
                </div>
              </div>
            </div>

            {/* Box 4 */}
            <div className="col-6 col-lg-3">
              <div className="d-flex align-items-center justify-content-center gap-3 p-3 rounded-3 bg-light border h-100">
                <img src="/assets/website-assets/img/gratuate-icon.svg" alt="" width="48" height="48" />
                <div className="text-start">
                  <h4 className="fw-bolder mb-0 text-dark">102,447+</h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Tests Solved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY JOIN PRATYAKSH AYURVEDA (Authentic Production) */}
      <section className="py-5" style={{ backgroundColor: '#fff' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bolder text-dark mb-2" style={{ fontSize: '2.2rem' }}>Why Join Pratyaksh Ayurveda ?</h2>
            <p className="text-muted" style={{ fontSize: '1.05rem' }}>Learn logically from scholars dedicated to conceptual Ayurvedic mastery.</p>
          </div>

          <div className="row align-items-center g-5">
            {/* 4 Feature Items */}
            <div className="col-lg-8">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="p-4 rounded-4 border bg-light h-100 shadow-sm d-flex gap-3 align-items-start">
                    <img src="/assets/website-assets/img/icon/icon-3.svg" alt="" width="42" height="42" className="mt-1" />
                    <div>
                      <h5 className="fw-bold text-dark mb-2">Conceptual Learning</h5>
                      <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Conceptual clarity through visualisation
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-4 rounded-4 border bg-light h-100 shadow-sm d-flex gap-3 align-items-start">
                    <img src="/assets/website-assets/img/icon/icon-3.svg" alt="" width="42" height="42" className="mt-1" />
                    <div>
                      <h5 className="fw-bold text-dark mb-2">Crack AIAPGET Question framing pattern</h5>
                      <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Once understanding AIAPGET question framing pattern will definitely bring you in top merit.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-4 rounded-4 border bg-light h-100 shadow-sm d-flex gap-3 align-items-start">
                    <img src="/assets/website-assets/img/icon/icon-3.svg" alt="" width="42" height="42" className="mt-1" />
                    <div>
                      <h5 className="fw-bold text-dark mb-2">Practical aspects of Samhitas</h5>
                      <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Each verse has a practical sense,which a good doctor must understand.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-4 rounded-4 border bg-light h-100 shadow-sm d-flex gap-3 align-items-start">
                    <img src="/assets/website-assets/img/icon/icon-3.svg" alt="" width="42" height="42" className="mt-1" />
                    <div>
                      <h5 className="fw-bold text-dark mb-2">Integrated Approach</h5>
                      <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Exploring Ayurveda in modern language &amp; modern science in Ayurvedic language.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Join Image */}
            <div className="col-lg-4 text-center">
              <img 
                src="/assets/website-assets/img/join.png" 
                alt="Join Pratyaksh Ayurveda" 
                className="img-fluid rounded-4 shadow-sm"
                style={{ maxHeight: '380px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE 6 SAMHITA PILLARS: HOW IT WORKS (Authentic Production) */}
      <section className="py-5" style={{ backgroundColor: '#fcf8f3' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-warning text-dark px-3 py-2 mb-2 fw-bold text-uppercase">The 6 Pillars of Excellence</span>
            <h2 className="fw-bolder text-dark">विद्या • वितर्क • विज्ञान • स्मृति • तत्परता • क्रिया</h2>
            <p className="text-muted">The classical pedagogical principles laid down by Acharya Charaka for total mastery.</p>
          </div>

          <div className="row g-4">
            {[
              { dev: 'विद्या', title: 'Vidya', desc: 'Lessons from subject experts', icon: '/assets/website-assets/img/icon/iconupdated1.png' },
              { dev: 'वितर्क', title: 'Vitarka', desc: 'Curiosity is welcomed for open doubt sessions', icon: '/assets/website-assets/img/icon/iconupdated.png' },
              { dev: 'विज्ञान', title: 'Vijnana', desc: 'Discussion based on Shastra with scientific explanation', icon: '/assets/website-assets/img/icon/iconupdated3.png' },
              { dev: 'स्मृति', title: 'Smriti', desc: 'Visualisation,association,tips & methods to memorise', icon: '/assets/website-assets/img/icon/iconupdated5.png' },
              { dev: 'तत्परता', title: 'Tatparata', desc: 'Regular revision and planned tests', icon: '/assets/website-assets/img/icon/iconupdated6.png' },
              { dev: 'क्रिया', title: 'Kriya', desc: 'Practical application of knowledge', icon: '/assets/website-assets/img/icon/iconupdated7.png' }
            ].map((p, idx) => (
              <div key={idx} className="col-lg-2 col-md-4 col-sm-6 text-center">
                <div 
                  className="p-4 rounded-4 border bg-white shadow-sm h-100 d-flex flex-column align-items-center justify-content-between position-relative overflow-hidden"
                  style={{
                    backgroundImage: 'url(/assets/website-assets/img/profile-bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'top center'
                  }}
                >
                  <div className="bg-white rounded-circle p-2 shadow-sm mb-3 border" style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={p.icon} alt={p.dev} width="36" height="36" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                  <h4 className="fw-bolder text-dark mb-1" style={{ fontSize: '1.4rem' }}>{p.dev}</h4>
                  <h6 className="fw-bold text-warning mb-2" style={{ fontSize: '0.9rem' }}>{p.title}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. COURSE CATEGORIES (Authentic Production Tracks) */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
            <div>
              <span className="badge bg-warning text-dark px-3 py-1 mb-2 fw-bold text-uppercase">Academic Curriculum</span>
              <h2 className="fw-bolder text-dark mb-1" style={{ fontSize: '2.2rem' }}>Course Categories</h2>
              <p className="text-muted mb-0">Choose the suitable course for yourself:</p>
            </div>
            <Link to="/courses" className="btn btn-outline-dark fw-bold rounded-pill px-4 mt-3 mt-md-0">
              Explore All 19 Courses <i className="fa-solid fa-arrow-right ms-2"></i>
            </Link>
          </div>

          {/* 4 Authentic Category Cards */}
          <div className="row g-4 mb-5">
            <div className="col-lg-3 col-sm-6">
              <Link to="/courses" className="text-decoration-none">
                <div className="ayur-card p-4 text-center h-100 hover-lift">
                  <img src="/assets/upload/Aiapget 1.png" alt="AIAPGET" className="img-fluid rounded-3 mb-3" style={{ height: '140px', width: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/assets/website-assets/img/object.png'; }} />
                  <h4 className="fw-bold text-dark mb-1">AIAPGET</h4>
                  <span className="badge bg-warning text-dark fw-bold px-3 py-1">Get Accelerated</span>
                </div>
              </Link>
            </div>

            <div className="col-lg-3 col-sm-6">
              <Link to="/courses" className="text-decoration-none">
                <div className="ayur-card p-4 text-center h-100 hover-lift">
                  <img src="/assets/upload/1761215591667_student5.jpg" alt="BAMS" className="img-fluid rounded-3 mb-3" style={{ height: '140px', width: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/assets/website-assets/img/object.png'; }} />
                  <h4 className="fw-bold text-dark mb-1">BAMS I-III</h4>
                  <span className="badge bg-warning text-dark fw-bold px-3 py-1">Start Growing</span>
                </div>
              </Link>
            </div>

            <div className="col-lg-3 col-sm-6">
              <Link to="/courses" className="text-decoration-none">
                <div className="ayur-card p-4 text-center h-100 hover-lift">
                  <img src="/assets/upload/graduate 114px.png" alt="Graduates" className="img-fluid rounded-3 mb-3" style={{ height: '140px', width: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/assets/website-assets/img/object.png'; }} />
                  <h4 className="fw-bold text-dark mb-1">Graduates</h4>
                  <span className="badge bg-warning text-dark fw-bold px-3 py-1">Go Ahead</span>
                </div>
              </Link>
            </div>

            <div className="col-lg-3 col-sm-6">
              <Link to="/courses" className="text-decoration-none">
                <div className="ayur-card p-4 text-center h-100 hover-lift">
                  <img src="/assets/upload/vaidya.png" alt="Practicing Vaidya" className="img-fluid rounded-3 mb-3" style={{ height: '140px', width: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/assets/website-assets/img/object.png'; }} />
                  <h4 className="fw-bold text-dark mb-1">Practicing Vaidya</h4>
                  <span className="badge bg-warning text-dark fw-bold px-3 py-1">Upgrade Here</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Dynamic Courses Tabs */}
          <div className="d-flex flex-wrap gap-2 mb-4 pb-2 border-bottom">
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedCatId(cat._id)}
                className={`btn btn-sm px-3 py-2 fw-bold rounded-pill ${selectedCatId === cat._id ? 'btn-ayur' : 'btn-light text-dark'}`}
              >
                {cat.name} {cat.tab && <span className="opacity-75 ms-1" style={{ fontSize: '0.75rem' }}>({cat.tab})</span>}
              </button>
            ))}
          </div>

          <div className="row g-4">
            {filteredCourses.slice(0, 6).map(c => (
              <div key={c._id} className="col-lg-4 col-md-6">
                <CourseCard course={c} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. STUDENTS & EXPERTS BOTH LOVE US (Authentic Rankers & Testimonials) */}
      <section className="py-5" style={{ backgroundColor: '#fcfcfd' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-warning text-dark px-3 py-2 mb-2 fw-bold text-uppercase">Check out these real reviews</span>
            <h2 className="fw-bolder text-dark mb-2" style={{ fontSize: '2.2rem' }}>Students &amp; Experts both love us.</h2>
            <p className="text-muted">Proving conceptual excellence across premier National Ayurvedic Institutes year after year.</p>
          </div>

          <div className="row g-4">
            {[
              { name: 'Dr. Smita Pandey', exam: 'AIAPGET 2022', rank: 'AIR 4 (NIA Jaipur)', quote: 'The line-by-line Samhita dissection by Rahul Sir made Charaka Sutra & Chikitsa crystal clear.', img: '/assets/website-assets/img/faculty/std1.jpg' },
              { name: 'Dr. Suraj Kumar Sahu', exam: 'AIAPGET 2022', rank: 'AIR 7 (IMS BHU)', quote: 'Vitarka critical analysis tests taught me how to eliminate tricky options and avoid negative marks.', img: '/assets/website-assets/img/faculty/std3.jpg' },
              { name: 'Dr. Vivek Tiwari', exam: 'AIAPGET 2021', rank: 'AIR 11 (AIIA New Delhi)', quote: 'High-yield mnemonics and Shastra reasoning made even difficult Dravya classification memorable.', img: '/assets/website-assets/img/faculty/std4.jpg' },
              { name: 'Dr. Shatabdee Pati', exam: 'AIAPGET 2021', rank: 'AIR 14 (IPGT&RA Jamnagar)', quote: 'Pratyaksh Ayurveda is the only institute where Shastra logic and modern diagnosis are blended seamlessly.', img: '/assets/website-assets/img/faculty/std5.jpg' },
              { name: 'Dr. Pooja Dadhich', exam: 'AIAPGET 2022', rank: 'Topper (Govt. Medical Officer)', quote: 'The test series matches the exact NTA AIAPGET pressure and question framing standard.', img: '/assets/website-assets/img/faculty/std6.jpg' },
              { name: 'Dr. Krishna Bihari Rajput', exam: 'AIAPGET 2020', rank: 'Top Merit (National Scholar)', quote: 'Consistent chapter-wise tests and instant commentary citations gave me the confidence to excel.', img: '/assets/website-assets/img/faculty/std7.jpg' }
            ].map((topper, idx) => (
              <div key={idx} className="col-lg-4 col-md-6">
                <div className="ayur-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <img 
                        src={topper.img} 
                        alt={topper.name} 
                        className="rounded-circle border border-warning"
                        width="58"
                        height="58"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/assets/website-assets/img/icon/icons8-male-user-96.png'; }}
                      />
                      <div>
                        <h5 className="fw-bold text-dark mb-0">{topper.name}</h5>
                        <small className="badge bg-warning text-dark fw-bold me-1">{topper.exam}</small>
                        <small className="text-muted fw-semibold">{topper.rank}</small>
                      </div>
                    </div>
                    <div className="text-warning mb-2">
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star ms-1"></i>
                      <i className="fa-solid fa-star ms-1"></i>
                      <i className="fa-solid fa-star ms-1"></i>
                      <i className="fa-solid fa-star ms-1"></i>
                    </div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                      "{topper.quote}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. JOIN PRATYAKSH AYURVEDA FOR FREE (Authentic Production Action Boxes) */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bolder text-dark mb-2" style={{ fontSize: '2.2rem' }}>Join Pratyaksh Ayurveda for free</h2>
            <p className="text-muted">Start learning with open demo lectures or access the complete curriculum on localhost.</p>
          </div>

          <div className="row g-4 mb-5">
            {/* Box 1: Guest Scholar */}
            <div className="col-lg-6">
              <div className="p-4 p-md-5 rounded-4 border bg-light h-100 d-flex flex-column flex-md-row align-items-center justify-content-between gap-4 shadow-sm">
                <div>
                  <h4 className="fw-bolder text-dark mb-2">As a guest scholar</h4>
                  <p className="text-muted mb-4" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                    Go to the courses &amp; watch out open demo videos anytime.
                  </p>
                  <Link to="/course-category" className="btn btn-warning fw-bold px-4 py-2 text-dark rounded-pill">
                    Get Free Demo
                  </Link>
                </div>
                <img src="/assets/website-assets/img/become-01.png" alt="" className="img-fluid" style={{ maxHeight: '180px' }} />
              </div>
            </div>

            {/* Box 2: Full Course */}
            <div className="col-lg-6">
              <div className="p-4 p-md-5 rounded-4 border bg-light h-100 d-flex flex-column flex-md-row align-items-center justify-content-between gap-4 shadow-sm">
                <div>
                  <h4 className="fw-bolder text-dark mb-2">Access the full course</h4>
                  <p className="text-muted mb-4" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                    Access all 19 authentic courses, 4,129 video lectures, and 21,013 questions on localhost without restrictions.
                  </p>
                  <Link to="/dashboard" className="btn btn-dark fw-bold px-4 py-2 text-white rounded-pill">
                    Get Free Access
                  </Link>
                </div>
                <img src="/assets/website-assets/img/user-guest (1).png" alt="" className="img-fluid" style={{ maxHeight: '180px' }} />
              </div>
            </div>
          </div>

          {/* 3 Platform Counts */}
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="p-4 rounded-4 bg-light border h-100">
                <img src="/assets/website-assets/img/icon/icons8-male-user-96.png" alt="" width="56" height="56" className="mb-2" />
                <h3 className="fw-bolder text-dark mb-1">4265+</h3>
                <p className="text-muted mb-0 fw-semibold">Happy Users</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 rounded-4 bg-light border h-100">
                <img src="/assets/website-assets/img/icon/icons8-storytelling-96.png" alt="" width="56" height="56" className="mb-2" />
                <h3 className="fw-bolder text-dark mb-1">19+</h3>
                <p className="text-muted mb-0 fw-semibold">Courses Available</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 rounded-4 bg-light border h-100">
                <img src="/assets/website-assets/img/icon/icons8-people-100.png" alt="" width="56" height="56" className="mb-2" />
                <h3 className="fw-bolder text-dark mb-1">11</h3>
                <p className="text-muted mb-0 fw-semibold">Active Faculties</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. APTOPADESHA - THE BLOG (Authentic Production) */}
      <section className="py-5" style={{ backgroundColor: '#fcfcfd' }}>
        <div className="container py-4">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
            <div>
              <span className="badge bg-warning text-dark px-3 py-1 mb-2 fw-bold text-uppercase">Scholarly Insights</span>
              <h2 className="fw-bolder text-dark mb-1" style={{ fontSize: '2.2rem' }}>Aptopadesha - The Blog</h2>
              <p className="text-muted mb-0">Guidance, strategy, and Samhita insights from top mentors:</p>
            </div>
            <Link to="/latest-news" className="btn btn-outline-dark fw-bold rounded-pill px-4 mt-3 mt-md-0">
              Read All Articles <i className="fa-solid fa-arrow-right ms-2"></i>
            </Link>
          </div>

          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="ayur-card p-0 overflow-hidden h-100">
                <img src="/assets/website-assets/img/news/news1.jpg" alt="News" className="w-100" style={{ height: '200px', objectFit: 'cover' }} onError={(e) => { e.target.src = '/assets/upload/Aiapget 1.png'; }} />
                <div className="p-4">
                  <span className="badge bg-light text-muted border mb-2">Strategy</span>
                  <h5 className="fw-bold text-dark mb-2">
                    <Link to="/news-details" className="text-dark text-decoration-none">
                      How Your Regular Studies Can Help in AIAPGET Preparation
                    </Link>
                  </h5>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    Learn how correlating BAMS curriculum subjects with competitive MCQ framing gives you a decisive head start.
                  </p>
                  <Link to="/news-details" className="btn btn-sm btn-ayur fw-bold">
                    Read Article <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="ayur-card p-0 overflow-hidden h-100">
                <img src="/assets/upload/Ayurvigya.jpg" alt="Ayurvigya" className="w-100" style={{ height: '200px', objectFit: 'cover' }} onError={(e) => { e.target.src = '/assets/upload/Aiapget 1.png'; }} />
                <div className="p-4">
                  <span className="badge bg-light text-muted border mb-2">Clinical Correlation</span>
                  <h5 className="fw-bold text-dark mb-2">
                    <Link to="/news-details" className="text-dark text-decoration-none">
                      Understanding Charaka Chikitsa Sthana Operative Protocols
                    </Link>
                  </h5>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    Deconstructing Jwara, Raktapitta, and Gulma clinical formulations with modern pathology correlates.
                  </p>
                  <Link to="/news-details" className="btn btn-sm btn-ayur fw-bold">
                    Read Article <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="ayur-card p-0 overflow-hidden h-100">
                <img src="/assets/upload/1702530470864_PV 24 course.jpg" alt="PV 24" className="w-100" style={{ height: '200px', objectFit: 'cover' }} onError={(e) => { e.target.src = '/assets/upload/Aiapget 1.png'; }} />
                <div className="p-4">
                  <span className="badge bg-light text-muted border mb-2">Exam Excellence</span>
                  <h5 className="fw-bold text-dark mb-2">
                    <Link to="/news-details" className="text-dark text-decoration-none">
                      How to Master Negative Marking in AIAPGET &amp; PSC
                    </Link>
                  </h5>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    Tactical question elimination techniques designed to preserve rank and maximize percentile scoring.
                  </p>
                  <Link to="/news-details" className="btn btn-sm btn-ayur fw-bold">
                    Read Article <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
