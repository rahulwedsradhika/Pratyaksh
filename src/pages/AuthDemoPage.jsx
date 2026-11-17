import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Direct Access Without Credentials
 * Instantly redirects straight into the authenticated student dashboard.
 * Zero passwords, zero mobile numbers, zero OTPs, zero login forms.
 */
export default function AuthDemoPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="py-5 text-center min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading Student Dashboard...</span>
        </div>
        <h5 className="fw-bold text-dark">Entering Pratyaksh Ayurveda Student LMS...</h5>
        <p className="text-muted small">Direct Access Mode Active</p>
      </div>
    </div>
  );
}
