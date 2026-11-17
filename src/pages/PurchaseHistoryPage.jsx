import React from 'react';
import { Link } from 'react-router-dom';
import StudentAppShell from '../components/shell/StudentAppShell';

export default function PurchaseHistoryPage() {
  const purchases = [
    {
      id: 'PA-2026-INV-8492',
      courseTitle: 'AIAPGET Complete Samhita & Clinical Masterclass 2026',
      date: '15 Oct 2025',
      amount: '₹14,999',
      status: 'Active',
      type: 'Full Course Bundle',
      validity: 'Lifetime Access'
    },
    {
      id: 'PA-2026-INV-7104',
      courseTitle: 'Charaka Samhita Sutrasthana In-Depth Commentary Video Series',
      date: '02 Sep 2025',
      amount: '₹4,999',
      status: 'Active',
      type: 'Subject Module',
      validity: 'Lifetime Access'
    },
    {
      id: 'PA-2026-INV-5521',
      courseTitle: 'National Ayurveda Test Series — 50 Full Mocks with Ranking',
      date: '18 Jul 2025',
      amount: '₹2,499',
      status: 'Active',
      type: 'Test Series Pass',
      validity: 'Valid till AIAPGET 2026'
    }
  ];

  return (
    <StudentAppShell>
      <div className="container py-4">
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none" style={{ color: 'var(--app-accent-warm)' }}>Home</Link>
            </li>
            <li className="breadcrumb-item active text-secondary" aria-current="page">
              Purchase History &amp; Subscriptions
            </li>
          </ol>
        </nav>

        {/* Page Hero Banner */}
        <div 
          className="p-4 p-md-5 rounded-4 border shadow-sm mb-4"
          style={{ 
            backgroundColor: 'var(--app-bg-surface)', 
            borderColor: 'var(--app-border-color)' 
          }}
        >
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <span 
                className="badge px-3 py-1 mb-2 fw-semibold"
                style={{ 
                  backgroundColor: 'rgba(217, 119, 87, 0.12)', 
                  color: 'var(--app-accent-warm)',
                  fontSize: '0.8rem'
                }}
              >
                ACCOUNT &amp; BILLING
              </span>
              <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--app-text-primary)' }}>
                Purchase History &amp; Invoices
              </h1>
              <p className="text-secondary small mb-0">
                View your active learning subscriptions, payment receipts, and enrollment invoices.
              </p>
            </div>

            <div 
              className="p-3 rounded-3 border d-flex align-items-center gap-3"
              style={{ backgroundColor: 'var(--app-bg-canvas)', borderColor: 'var(--app-border-color)' }}
            >
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center text-success"
                style={{ width: '42px', height: '42px', backgroundColor: 'rgba(22, 163, 74, 0.15)' }}
              >
                <i className="fa-solid fa-circle-check fs-5"></i>
              </div>
              <div>
                <span className="text-secondary d-block" style={{ fontSize: '0.75rem' }}>Enrollment Status</span>
                <strong style={{ color: 'var(--app-text-primary)', fontSize: '0.92rem' }}>All Courses Unlocked</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div 
          className="p-4 p-md-5 rounded-4 border shadow-sm mb-4"
          style={{ 
            backgroundColor: 'var(--app-bg-surface)', 
            borderColor: 'var(--app-border-color)' 
          }}
        >
          <h2 className="h5 fw-bold mb-4" style={{ color: 'var(--app-text-primary)' }}>
            Enrolled Courses &amp; Subscriptions
          </h2>

          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ color: 'var(--app-text-primary)' }}>
              <thead>
                <tr 
                  className="small text-secondary"
                  style={{ borderBottom: '1px solid var(--app-border-color)' }}
                >
                  <th scope="col" className="pb-2">Invoice #</th>
                  <th scope="col" className="pb-2">Course / Package</th>
                  <th scope="col" className="pb-2">Enrolled On</th>
                  <th scope="col" className="pb-2">Access Validity</th>
                  <th scope="col" className="pb-2">Status</th>
                  <th scope="col" className="pb-2 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr 
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--app-border-color)' }}
                  >
                    <td className="py-3 font-monospace small text-secondary">{p.id}</td>
                    <td className="py-3">
                      <strong className="d-block" style={{ fontSize: '0.92rem' }}>
                        {p.courseTitle}
                      </strong>
                      <span className="text-secondary small">{p.type}</span>
                    </td>
                    <td className="py-3 text-secondary small">{p.date}</td>
                    <td className="py-3 small">{p.validity}</td>
                    <td className="py-3">
                      <span 
                        className="badge px-2.5 py-1 fw-semibold"
                        style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontSize: '0.75rem' }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-end">
                      <Link 
                        to="/courses"
                        className="btn btn-sm text-white fw-semibold"
                        style={{ 
                          backgroundColor: 'var(--app-accent-warm)',
                          borderColor: 'var(--app-accent-warm)',
                          borderRadius: '6px',
                          padding: '4px 12px',
                          fontSize: '0.8rem'
                        }}
                      >
                        Study Now
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Support & Billing Contact Card */}
        <div 
          className="p-4 rounded-4 border shadow-sm"
          style={{ 
            backgroundColor: 'var(--app-bg-surface)', 
            borderColor: 'var(--app-border-color)' 
          }}
        >
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-8">
              <h3 className="h6 fw-bold mb-1" style={{ color: 'var(--app-text-primary)' }}>
                Need Help with Billing or Invoices?
              </h3>
              <p className="text-secondary small mb-0">
                For GST tax invoices, institutional subscriptions, or transaction assistance, connect with our administration desk.
              </p>
            </div>
            <div className="col-12 col-md-4 d-flex flex-wrap gap-2 justify-content-md-end">
              <a 
                href="tel:+918795776006" 
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5"
                style={{ borderRadius: '8px', padding: '6px 14px' }}
              >
                <i className="fa-solid fa-phone"></i> +91 87957 76006
              </a>
              <a 
                href="https://wa.me/918795776006"
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm text-white fw-semibold d-flex align-items-center gap-1.5"
                style={{ backgroundColor: '#25D366', borderRadius: '8px', padding: '6px 14px' }}
              >
                <i className="fa-brands fa-whatsapp"></i> Chat Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </StudentAppShell>
  );
}
