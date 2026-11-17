import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="terms-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Terms &amp; Conditions</li>
          </ol>
        </nav>

        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
          <span className="badge bg-warning text-dark px-3 py-1 mb-2">Platform Agreement</span>
          <h1 className="fw-bold text-dark mb-4">Terms &amp; Conditions</h1>
          <p className="text-muted border-bottom pb-3">Effective Date: March 2026 • Pratyaksh Ayurveda</p>

          <div className="terms-content text-dark" style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
            <h4 className="fw-bold mt-4 text-dark">1. Acceptance of Terms</h4>
            <p className="text-muted">
              By accessing or enrolling in courses, test series, and study materials provided by Pratyaksh Ayurveda, you agree to abide by these Terms and Conditions and our Privacy Policy.
            </p>

            <h4 className="fw-bold mt-4 text-dark">2. Intellectual Property &amp; Content Access</h4>
            <p className="text-muted">
              All lectures, video stream recordings, commentary annotations, question banks, explanations, and proprietary study notes are the exclusive intellectual property of Pratyaksh Ayurveda. Users are granted a personal, non-transferable, non-exclusive license to view materials for educational preparation. Unauthorized copying, recording, distribution, or commercial sharing is strictly prohibited.
            </p>

            <h4 className="fw-bold mt-4 text-dark">3. Pricing, Payments &amp; Refunds</h4>
            <p className="text-muted">
              Course fees and subscription rates are clearly specified on the course details page. Because access to digital videos, test series, and notes is granted immediately upon enrollment, fees paid are non-refundable once content access has been initiated.
            </p>

            <h4 className="fw-bold mt-4 text-dark">4. Website / App Content Access</h4>
            <p className="text-muted">
              Subscribers receive access to purchased courses for the duration specified in the enrollment plan (typically 12 months or until the targeted examination date). We strive for 99.9% platform availability, with occasional scheduled maintenance announced in advance.
            </p>

            <h4 className="fw-bold mt-4 text-dark">5. Organization's Rights</h4>
            <p className="text-muted">
              Pratyaksh Ayurveda reserves the right to modify course schedules, update question sets with newer syllabus guidelines, and substitute faculty in unforeseen circumstances without diminishing instructional quality.
            </p>

            <h4 className="fw-bold mt-4 text-dark">6. Disclaimers</h4>
            <p className="text-muted">
              While our mentors and Pragya Vitarka test series aim to prepare you for the highest performance in AIAPGET and university exams, examination outcomes depend on individual diligence, self-study, and examination conditions. Pratyaksh Ayurveda does not guarantee specific government appointments or ranks.
            </p>

            <h4 className="fw-bold mt-4 text-dark">7. Ask Questions / Dispute Resolution</h4>
            <p className="text-muted">
              All disputes are subject to the exclusive jurisdiction of the competent courts in Varanasi (Kashi), Uttar Pradesh, India. If you have any inquiries regarding these terms, please contact: <a href="mailto:infopratyakshayurveda@gmail.com" className="text-warning fw-semibold">infopratyakshayurveda@gmail.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

