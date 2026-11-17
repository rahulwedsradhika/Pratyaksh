import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutUsPage() {
  return (
    <div className="about-us-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">About Us</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm border mb-5">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-warning text-dark px-3 py-2 mb-2">Our Story</span>
              <h1 className="fw-bold text-dark mb-3">Do You Know Who We Are?</h1>
              <p className="lead text-muted mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>
                Pratyaksh Ayurveda was founded in Varanasi (Kashi)—the ancient seat of Ayurvedic scholarship—with a single resolute mission: to bridge the timeless wisdom of traditional Samhitas with modern medical education.
              </p>
              <p className="text-muted" style={{ lineHeight: '1.8' }}>
                We believe that Ayurveda is not a collection of outdated formulas to be mechanically memorized. It is a vibrant, living science whose depth can only be unlocked through <strong>Pratyaksh</strong> (direct perception, critical reasoning, and demonstrable clinical truth).
              </p>
              <div className="d-flex gap-3 mt-4">
                <Link to="/courses" className="btn btn-ayur px-4">
                  Explore Programs
                </Link>
                <Link to="/faculty" className="btn btn-outline-secondary px-4">
                  Meet Our Mentors
                </Link>
              </div>
            </div>

            <div className="col-lg-6 text-center">
              <img 
                src="/assets/website-assets/img/become-01.png" 
                alt="About Pratyaksh Ayurveda" 
                className="img-fluid rounded-4 shadow"
                style={{ maxHeight: '380px', objectFit: 'contain' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/upload/Aiapget 1.png'; }}
              />
            </div>
          </div>
        </div>

        {/* 3 Pillars of Pratyaksh Pedagogy */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="ayur-card p-4 h-100 text-center">
              <div className="btn btn-warning rounded-circle p-3 text-dark mb-3" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                <i className="fa-solid fa-scroll"></i>
              </div>
              <h5 className="fw-bold text-dark mb-2">Authentic Samhita Lineage</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                Rooted directly in Charaka, Sushruta, and Vagbhata with Chakrapani, Dalhana, and Arundatta classical commentaries.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="ayur-card p-4 h-100 text-center">
              <div className="btn btn-warning rounded-circle p-3 text-dark mb-3" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <h5 className="fw-bold text-dark mb-2">High-Yield Exam Acumen</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                Proprietary Pragya Vitarka test papers meticulously calibrated to NTA question framing standards and negative marking control.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="ayur-card p-4 h-100 text-center">
              <div className="btn btn-warning rounded-circle p-3 text-dark mb-3" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                <i className="fa-solid fa-hand-holding-heart"></i>
              </div>
              <h5 className="fw-bold text-dark mb-2">Personal Mentorship</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                Continuous guidance by MD(Ay) scholars from Banaras Hindu University (BHU) offering personalized preparation roadmaps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

