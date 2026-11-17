import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="privacy-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Privacy Policy</li>
          </ol>
        </nav>

        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
          <span className="badge bg-warning text-dark px-3 py-1 mb-2">Legal &amp; Transparency</span>
          <h1 className="fw-bold text-dark mb-4">Privacy Policy</h1>
          <p className="text-muted border-bottom pb-3">Last updated: March 2026 • Pratyaksh Ayurveda Education Platform</p>

          <div className="policy-content text-dark" style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
            <h4 className="fw-bold mt-4 text-dark">1. Data Collected by Us</h4>
            <p className="text-muted">
              We collect information that you directly provide when registering on our platform, purchasing course subscriptions, attempting test papers, or requesting academic counseling. This may include your full name, email address, mobile number, educational institution (BAMS college), state, and test performance metrics.
            </p>

            <h4 className="fw-bold mt-4 text-dark">2. Data Uses</h4>
            <p className="text-muted">
              The data collected is utilized to:
            </p>
            <ul className="text-muted">
              <li>Deliver course modules, live Zoom lectures, and recorded video content.</li>
              <li>Calculate your test scores, percentiles, and subject-wise accuracy on mock test papers.</li>
              <li>Provide personalized mentorship and track study completion progress.</li>
              <li>Send critical examination notifications, batch updates, and schedule reminders.</li>
            </ul>

            <h4 className="fw-bold mt-4 text-dark">3. Payment &amp; Billing Information</h4>
            <p className="text-muted">
              On production, payments are processed via verified, PCI-DSS compliant third-party payment gateways. Pratyaksh Ayurveda never stores your full credit/debit card numbers, CVV, or banking credentials. On this local development replica, all payment actions run in simulated LOCAL_DEMO_MODE without real credit transactions.
            </p>

            <h4 className="fw-bold mt-4 text-dark">4. Security of Information</h4>
            <p className="text-muted">
              We implement industry-standard encryption, SSL/TLS protocols, and secure storage to safeguard your personal details and academic test records against unauthorized access or disclosure.
            </p>

            <h4 className="fw-bold mt-4 text-dark">5. Your Rights</h4>
            <p className="text-muted">
              You maintain the right to review, update, or request deletion of your learner profile at any time by contacting our support team or accessing your student profile settings.
            </p>

            <h4 className="fw-bold mt-4 text-dark">6. Information Sharing</h4>
            <p className="text-muted">
              We do not sell, rent, or trade your personal information to third-party marketing companies. Data is shared exclusively with technical service providers (e.g. video delivery CDNs, SMS gateways) strictly required to operate platform features.
            </p>

            <h4 className="fw-bold mt-4 text-dark">7. Contact Us</h4>
            <p className="text-muted">
              For any questions regarding this Privacy Policy or your data, please write to: <a href="mailto:infopratyakshayurveda@gmail.com" className="text-warning fw-semibold">infopratyakshayurveda@gmail.com</a> or visit our Varanasi office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

