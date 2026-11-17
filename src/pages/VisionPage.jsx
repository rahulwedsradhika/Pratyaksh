import React from 'react';
import { Link } from 'react-router-dom';

export default function VisionPage() {
  return (
    <div className="vision-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Vision &amp; Philosophy</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Our Guiding Light</span>
          <h2 className="fw-bold text-dark">Vision &amp; Philosophy</h2>
          <p className="text-muted">Revitalizing Ayurvedic education through conceptual clarity, research rigour, and uncompromised academic integrity.</p>
        </div>

        <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm border mb-4">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <h3 className="fw-bold text-dark mb-3">Our Core Vision</h3>
              <p className="text-muted" style={{ lineHeight: '1.8' }}>
                To establish an intellectual ecosystem where every Ayurveda student develops the clinical and textual confidence to practice and lead globally. We envision an education model free of rote memorization, where students experience the logic (Yukti) behind every formulation and clinical sign.
              </p>

              <h4 className="fw-bold text-dark mt-4 mb-3">Our Mission Commitments:</h4>
              <ul className="d-flex flex-column gap-3 text-muted" style={{ lineHeight: '1.6' }}>
                <li>
                  <i className="fa-solid fa-circle-check text-warning me-2"></i>
                  <strong>Universal Access to Excellence:</strong> Providing high-quality coaching to scholars across all corners of India, overcoming geographical and economic limitations.
                </li>
                <li>
                  <i className="fa-solid fa-circle-check text-warning me-2"></i>
                  <strong>Preserving Classical Purity:</strong> Teaching Sanskrit shlokas in their authentic context while explaining their contemporary physiological counterparts.
                </li>
                <li>
                  <i className="fa-solid fa-circle-check text-warning me-2"></i>
                  <strong>Standardizing Assessment:</strong> Creating test series that train the mind to handle stress, eliminate options rationally, and score in the 99th percentile.
                </li>
              </ul>
            </div>

            <div className="col-lg-6 text-center">
              <div className="p-4 rounded-4" style={{ backgroundColor: '#fff9f2', border: '2px dashed #f57105' }}>
                <div className="pillar-devanagari text-warning mb-3">
                  विद्या वितर्क विज्ञानम्
                </div>
                <h5 className="fw-bold text-dark mb-2">The Eternal Trio</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.7' }}>
                  Knowledge, Critical Logic, and Specialized Science form the cornerstone of every lecture delivered at Pratyaksh Ayurveda.
                </p>
                <div className="mt-4">
                  <Link to="/courses" className="btn btn-ayur px-4 py-2">
                    Begin Your Preparation <i className="fa-solid fa-arrow-right ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

