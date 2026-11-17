import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/enquiries')
      .then(r => r.json())
      .then(d => {
        if (d.status) setEnquiries(d.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item">Notification</li>
              <li className="breadcrumb-item active" aria-current="page">Enquiry Messages</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Student Inquiries &amp; Messages</h3>
        </div>
      </div>

      <div className="admin-table shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Scholar Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Subject / Inquiry</th>
                <th>Message Content</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No inquiry messages received yet.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq, idx) => (
                  <tr key={enq.id || idx}>
                    <td className="text-muted small">
                      {enq.created_at ? new Date(enq.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td><strong className="text-dark">{enq.name}</strong></td>
                    <td>{enq.email}</td>
                    <td>{enq.phone || enq.mobile || '—'}</td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {enq.subject || 'Course Guidance'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <span className="small text-muted">{enq.message}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

