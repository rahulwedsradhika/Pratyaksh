import React from 'react';
import { Link } from 'react-router-dom';

export default function NewsDetailPage() {
  return (
    <div className="news-detail-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/latest-news" className="text-decoration-none">Latest News</Link></li>
            <li className="breadcrumb-item active" aria-current="page">How Your Regular Studies Can Help in AIAPGET</li>
          </ol>
        </nav>

        <div className="row g-4">
          <div className="col-lg-8">
            <article className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 mb-2">Strategy Guide</span>
              <h1 className="fw-bold text-dark mb-3">
                How Your Regular Studies Can Help in AIAPGET Preparation
              </h1>
              
              <div className="d-flex align-items-center gap-3 text-muted mb-4 pb-3 border-bottom" style={{ fontSize: '0.85rem' }}>
                <div><i className="fa-solid fa-user-pen me-1 text-warning"></i> Dr. Rahul Sir</div>
                <div><i className="fa-solid fa-calendar me-1 text-primary"></i> March 15, 2026</div>
                <div><i className="fa-solid fa-clock me-1 text-success"></i> 6 min read</div>
              </div>

              <img 
                src="/assets/website-assets/img/news/news1.jpg" 
                alt="AIAPGET Regular Study" 
                className="img-fluid rounded-4 mb-4 w-100 shadow-sm"
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/upload/Aiapget 1.png'; }}
              />

              <div className="article-content text-dark" style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
                <p>
                  A common question raised by undergraduate BAMS students across India is: <em>"Should I prioritize my university annual professional examinations, or should I start preparing for AIAPGET entrance right now?"</em>
                </p>

                <p>
                  The answer lies in understanding that <strong>AIAPGET is not a disconnected competitive exam</strong>—it is the direct crystallization of conceptual Samhita comprehension and clinical application learned throughout your undergraduate curriculum.
                </p>

                <h4 className="fw-bold mt-4 mb-3 text-dark">The 4-Step Integration Formula:</h4>

                <ol className="d-flex flex-column gap-3 mb-4">
                  <li>
                    <strong>Line-by-Line Samhita Recitation:</strong> Never rely exclusively on summary guides for university exams. When studying Charaka Samhita Sutra Sthana for your 1st and 2nd Prof, memorize the operative definitions (Rasa, Guna, Virya, Vipaka, Prabhava).
                  </li>
                  <li>
                    <strong>Chakrapani and Dalhana Commentary Annotations:</strong> Keep your commentary book alongside. The tricky 20% of AIAPGET questions come directly from Chakrapani Teeka and Dalhana Nibandha Sangraha.
                  </li>
                  <li>
                    <strong>Parallel MCQ Practice:</strong> Whenever you complete an Adhyaya for your college class (e.g., Dirghanjiviteeya or Rogabhishagjiteeya), solve 50 multiple choice questions immediately on the Pratyaksh Ayurveda practice engine.
                  </li>
                  <li>
                    <strong>Formula &amp; Mnemonics Journal:</strong> Maintain a pocket handbook of classical formulations, dosage, and Dravya ratios.
                  </li>
                </ol>

                <div className="p-4 rounded-3 my-4" style={{ backgroundColor: '#fff8f0', borderLeft: '4px solid #f57105' }}>
                  <h6 className="fw-bold text-dark mb-1">Key Takeaway for BAMS Scholars:</h6>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>
                    Every hour invested in conceptual, root-level understanding during your BAMS academic terms saves ten hours of stressful cramming during your internship year.
                  </p>
                </div>

                <p>
                  Pratyaksh Ayurveda offers tailored BAMS Prof 1st to 3rd professional coaching alongside comprehensive AIAPGET batches. Begin your journey early, master the 6 pillars, and turn your post-graduate aspirations into reality.
                </p>
              </div>

              <div className="d-flex justify-content-between align-items-center pt-4 border-top mt-5">
                <Link to="/latest-news" className="btn btn-outline-secondary">
                  <i className="fa-solid fa-arrow-left me-1"></i> Back to News
                </Link>
                <Link to="/courses" className="btn btn-ayur">
                  Explore AIAPGET Batches <i className="fa-solid fa-graduation-cap ms-1"></i>
                </Link>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
              <h5 className="fw-bold text-dark mb-3">Recent Strategy Articles</h5>
              <div className="d-flex flex-column gap-3">
                <div className="pb-2 border-bottom">
                  <small className="text-warning fw-bold">Samhita Mastery</small>
                  <h6 className="fw-bold text-dark mb-1">
                    <Link to="/news-details" className="text-dark text-decoration-none">
                      Top 100 High-Yield Shlokas from Charaka Sutra Sthana
                    </Link>
                  </h6>
                  <small className="text-muted">February 28, 2026</small>
                </div>
                <div className="pb-2 border-bottom">
                  <small className="text-warning fw-bold">Exam Technique</small>
                  <h6 className="fw-bold text-dark mb-1">
                    <Link to="/news-details" className="text-dark text-decoration-none">
                      How to Eliminate Negative Marking in NTA AIAPGET Exam
                    </Link>
                  </h6>
                  <small className="text-muted">January 14, 2026</small>
                </div>
                <div>
                  <small className="text-warning fw-bold">Pharmacology</small>
                  <h6 className="fw-bold text-dark mb-1">
                    <Link to="/news-details" className="text-dark text-decoration-none">
                      Comparative Analysis of Rasa Shastra Bhasma Parikshas
                    </Link>
                  </h6>
                  <small className="text-muted">December 19, 2025</small>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-4 text-center text-white" style={{ background: 'linear-gradient(135deg, #181d1f, #2b354f)' }}>
              <i className="fa-solid fa-pencil text-warning mb-2" style={{ fontSize: '2.5rem' }}></i>
              <h5 className="fw-bold mb-2">Practice Real Test Papers</h5>
              <p className="text-white-50 mb-3" style={{ fontSize: '0.85rem' }}>
                Test your knowledge with 31 Pragya Vitarka test papers configured with authentic timers and negative marking.
              </p>
              <Link to="/student-tests" className="btn btn-warning w-100 fw-bold">
                Start Mock Test
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

