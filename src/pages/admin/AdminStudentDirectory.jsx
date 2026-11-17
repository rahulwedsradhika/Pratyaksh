import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreVertical, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  Mail, 
  Phone, 
  Calendar, 
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Award,
  RefreshCw,
  X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminStudentDirectory() {
  const { adminUser, hasPermission } = useAdminAuth();
  
  // Data state
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState('all');

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [extensionDays, setExtensionDays] = useState(30);
  const [extensionReason, setExtensionReason] = useState('Academic courtesy extension');

  // Manual Add Form State
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    enrollmentType: 'paid',
    planId: 'samhita-scholars',
    adminNotes: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formResult, setFormResult] = useState(null);
  const [formError, setFormError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  const token = localStorage.getItem('ayur_admin_token');

  // Fetch student directory
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search.trim(),
        status: statusFilter,
        enrollmentType: enrollmentFilter
      });

      const res = await fetch(`/api/admin/students?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status && json.data) {
        setStudents(json.data.students || []);
        setTotalCount(json.data.pagination?.total || 0);
        setTotalPages(json.data.pagination?.pages || 1);
      } else {
        setError(json.message || 'Failed to fetch student records');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, limit, statusFilter, enrollmentFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch full student profile
  const openStudentDetail = async (studentId) => {
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.status && json.data?.student) {
        setSelectedStudent(json.data);
        setStudentDetailOpen(true);
      } else {
        setError(json.error || json.message || 'Failed to fetch student details');
      }
    } catch (err) {
      setError('Error fetching student details: ' + err.message);
    }
  };

  // Toggle selection
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(students.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // CSV Export
  const handleExportCSV = () => {
    const rows = (selectedIds.size > 0 
      ? students.filter(s => selectedIds.has(s.id))
      : students
    );

    if (rows.length === 0) {
      alert('No students to export');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Verified', 'Plan', 'Membership Status', 'Expiry Date', 'Enrolled At'];
    const csvContent = [
      headers.join(','),
      ...rows.map(s => [
        s.id,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.phone || '').replace(/"/g, '""')}"`,
        s.is_verified ? 'Yes' : 'No',
        `"${s.membership_plan || 'None'}"`,
        s.membership_status || 'None',
        s.membership_expiry || 'N/A',
        s.created_at || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pratyaksh_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Manual Enrollment Submit
  const handleManualAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormResult(null);

    try {
      const res = await fetch('/api/admin/students/manual-enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.status && json.data) {
        setFormResult(json.data);
        fetchStudents();
      } else {
        setFormError(json.message || 'Failed to manually enroll student');
      }
    } catch (err) {
      setFormError(err.message || 'Network error processing enrollment');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Membership Extension
  const handleExtendMembership = async () => {
    if (!selectedStudent) return;
    try {
      const res = await fetch('/api/admin/memberships/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent.student.id,
          action: 'extend',
          days: parseInt(extensionDays, 10) || 30,
          reason: extensionReason
        })
      });
      const json = await res.json();
      if (json.status) {
        alert('Membership successfully extended!');
        setExtensionModalOpen(false);
        openStudentDetail(selectedStudent.student.id);
        fetchStudents();
      } else {
        alert(json.message || 'Failed to extend membership');
      }
    } catch (err) {
      alert('Error extending membership: ' + err.message);
    }
  };

  // Copy invitation link
  const copyInviteLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Student Directory</h1>
          <p className="admin-page-subtitle">
            Manage authenticated BAMS scholars, manual invitations, credentials, and academic standing.
          </p>
        </div>
        <div className="admin-header-actions">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={handleExportCSV}
            title="Export filtered scholars to CSV"
          >
            <Download size={15} />
            <span>Export CSV ({selectedIds.size > 0 ? selectedIds.size : totalCount})</span>
          </button>
          
          {hasPermission('students:write') && (
            <button 
              type="button" 
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setFormResult(null);
                setFormError(null);
                setFormData({
                  email: '',
                  name: '',
                  phone: '',
                  enrollmentType: 'paid',
                  planId: 'samhita-scholars',
                  adminNotes: ''
                });
                setManualAddOpen(true);
              }}
            >
              <Plus size={15} />
              <span>Manually Add Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input 
              type="text" 
              className="admin-form-input" 
              style={{ paddingLeft: '2.25rem' }} 
              placeholder="Search by name, email, phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Membership Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-secondary)', whiteSpace: 'nowrap' }}>
              Membership:
            </label>
            <select 
              className="admin-form-select" 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Memberships</option>
              <option value="expired">Expired Memberships</option>
              <option value="suspended">Suspended Accounts</option>
              <option value="none">No Active Plan</option>
            </select>
          </div>

          {/* Enrollment Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-secondary)', whiteSpace: 'nowrap' }}>
              Enrolment:
            </label>
            <select 
              className="admin-form-select" 
              value={enrollmentFilter}
              onChange={(e) => { setEnrollmentFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Enrolment Types</option>
              <option value="regular">Self-Registered (Online)</option>
              <option value="paid">Manual Direct Paid</option>
              <option value="scholarship">Institute Scholarship</option>
              <option value="complimentary">Complimentary / Faculty</option>
              <option value="offline_pending">Offline Pending</option>
            </select>
          </div>

          {/* Records per page & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="admin-btn admin-btn-sm admin-btn-secondary" 
              onClick={fetchStudents} 
              title="Refresh Directory"
            >
              <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
              Showing {students.length} of {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="admin-spin" style={{ width: 32, height: 32, border: '3px solid var(--admin-border)', borderTopColor: 'var(--admin-primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-secondary)' }}>Loading verified scholar profiles...</div>
          </div>
        ) : error ? (
          <div className="admin-empty-state">
            <AlertCircle size={36} style={{ color: 'var(--admin-danger)' }} />
            <div className="admin-empty-title">Failed to load student records</div>
            <div className="admin-empty-text">{error}</div>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={fetchStudents}>Retry</button>
          </div>
        ) : students.length === 0 ? (
          <div className="admin-empty-state">
            <Users size={36} className="admin-empty-icon" />
            <div className="admin-empty-title">No matching scholars found</div>
            <div className="admin-empty-text">Try adjusting your search query or membership status filters.</div>
          </div>
        ) : (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input 
                        type="checkbox" 
                        checked={students.length > 0 && selectedIds.size === students.length}
                        onChange={toggleSelectAll} 
                      />
                    </th>
                    <th>Scholar Name &amp; Contact</th>
                    <th>Verified Status</th>
                    <th>Active Membership Plan</th>
                    <th>Expiry Date</th>
                    <th>Enrolment Category</th>
                    <th>Account Standing</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const isSelected = selectedIds.has(s.id);
                    const isPlanActive = s.membership_status === 'active';
                    return (
                      <tr key={s.id} style={{ backgroundColor: isSelected ? 'var(--admin-blue-bg)' : undefined }}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelectOne(s.id)}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div className="admin-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                              {(s.name || s.email || 'S')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                {s.name || 'Ayurveda Scholar'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                {s.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {s.is_verified ? (
                            <span className="admin-badge admin-badge-success" title="Email verification confirmed">
                              <CheckCircle2 size={12} /> Verified
                            </span>
                          ) : (
                            <span className="admin-badge admin-badge-warning" title="Pending email verification">
                              <Clock size={12} /> Unverified
                            </span>
                          )}
                        </td>
                        <td>
                          {s.membership_plan ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--admin-text-primary)' }}>
                                {s.membership_plan_title || s.membership_plan}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                                {s.membership_tier ? `Tier: ${s.membership_tier}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                              No Plan Active
                            </span>
                          )}
                        </td>
                        <td>
                          {s.membership_expiry ? (
                            <span style={{ fontSize: '0.8rem', color: isPlanActive ? 'var(--admin-text-primary)' : 'var(--admin-danger)', fontWeight: isPlanActive ? 500 : 600 }}>
                              {new Date(s.membership_expiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-secondary" style={{ textTransform: 'capitalize' }}>
                            {s.enrollment_type || 'Self-Registered'}
                          </span>
                        </td>
                        <td>
                          {s.status === 'suspended' ? (
                            <span className="admin-badge admin-badge-danger">Suspended</span>
                          ) : (
                            <span className="admin-badge admin-badge-success">Good Standing</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            type="button" 
                            className="admin-btn admin-btn-sm admin-btn-secondary"
                            onClick={() => openStudentDetail(s.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderTop: '1px solid var(--admin-border)', fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--admin-text-muted)' }}>
                Page {page} of {totalPages} ({totalCount} total scholars)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="admin-btn admin-btn-sm admin-btn-secondary" 
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button 
                  type="button" 
                  className="admin-btn admin-btn-sm admin-btn-secondary" 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==========================================================
          MODAL: MANUALLY ADD STUDENT (PHASE 2 WORKFLOW)
          ========================================================== */}
      {manualAddOpen && (
        <div className="admin-modal-backdrop" onClick={() => setManualAddOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} style={{ color: 'var(--admin-primary)' }} />
                <h3 className="admin-modal-title">Manually Add / Invite Scholar</h3>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setManualAddOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {!formResult ? (
              <form onSubmit={handleManualAddSubmit}>
                <div className="admin-modal-body">
                  <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    Manually enroll an individual scholar. New email addresses receive a secure cryptographic invitation link. Existing accounts will have their membership safely assigned without altering auth credentials.
                  </p>

                  {formError && (
                    <div className="admin-card" style={{ borderColor: 'var(--admin-danger-border)', backgroundColor: 'var(--admin-danger-bg)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--admin-danger-text)' }}>
                      <strong>Enrolment Error:</strong> {formError}
                    </div>
                  )}

                  <div className="admin-form-group">
                    <label className="admin-form-label">Scholar Email Address *</label>
                    <input 
                      type="email" 
                      className="admin-form-input" 
                      placeholder="e.g. vidya.sharma@bams.edu.in" 
                      required 
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Full Name</label>
                      <input 
                        type="text" 
                        className="admin-form-input" 
                        placeholder="Dr. / Scholar Name" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Phone Number</label>
                      <input 
                        type="text" 
                        className="admin-form-input" 
                        placeholder="+91 98765 43210" 
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Enrolment Category *</label>
                      <select 
                        className="admin-form-select"
                        value={formData.enrollmentType}
                        onChange={e => setFormData({ ...formData, enrollmentType: e.target.value })}
                      >
                        <option value="paid">Direct Paid (Offline/Desk)</option>
                        <option value="scholarship">Merit Scholarship (100% Grant)</option>
                        <option value="complimentary">Complimentary / Faculty Review</option>
                        <option value="offline_pending">Offline Pending (Cash/NEFT)</option>
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Assigned Membership *</label>
                      <select 
                        className="admin-form-select"
                        value={formData.planId}
                        onChange={e => setFormData({ ...formData, planId: e.target.value })}
                      >
                        <option value="samhita-scholars">Samhita Scholars (12 Months)</option>
                        <option value="aiapget-fastrack">AIAPGET Fastrack (6 Months)</option>
                        <option value="bams-foundation">BAMS Foundation (3 Months)</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Administrative Audit Note</label>
                    <textarea 
                      className="admin-form-input" 
                      rows={2} 
                      placeholder="e.g. Approved by Dean office for national symposium topper."
                      value={formData.adminNotes}
                      onChange={e => setFormData({ ...formData, adminNotes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setManualAddOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={formSubmitting}>
                    {formSubmitting ? 'Enrolling...' : 'Confirm & Generate Access'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="admin-modal-body">
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--admin-success-bg)', color: 'var(--admin-success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <CheckCircle2 size={28} />
                    </div>
                    <h4 style={{ fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: '0.5rem' }}>
                      Scholar Enrolled Successfully!
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '1.25rem' }}>
                      Student ID: <code>{formResult.studentId}</code> • Enrolment: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{formResult.enrollmentType}</span>
                    </p>
                  </div>

                  {formResult.invitationLink && (
                    <div className="admin-card" style={{ backgroundColor: 'var(--admin-bg-base)', padding: '1rem', marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                        Cryptographic Invitation URL
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          readOnly 
                          className="admin-form-input" 
                          style={{ fontSize: '0.8rem', fontFamily: 'monospace' }} 
                          value={formResult.invitationLink} 
                        />
                        <button 
                          type="button" 
                          className="admin-btn admin-btn-secondary"
                          onClick={() => copyInviteLink(formResult.invitationLink)}
                        >
                          {copiedLink ? <Check size={16} style={{ color: 'var(--admin-success)' }} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.5rem' }}>
                        Share this link directly with the student to let them activate their profile and set their secure password.
                      </p>
                    </div>
                  )}

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--admin-blue-bg)', border: '1px solid var(--admin-blue-border)', borderRadius: 'var(--admin-radius-sm)', fontSize: '0.8rem', color: 'var(--admin-blue-text)' }}>
                    <Shield size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                    An immutable audit log has been written recording your admin user ID and authorization justification.
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-primary" onClick={() => setManualAddOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: STUDENT FULL PROFILE INSPECTOR & HISTORY
          ========================================================== */}
      {studentDetailOpen && selectedStudent && (
        <div className="admin-modal-backdrop" onClick={() => setStudentDetailOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="admin-avatar" style={{ width: 40, height: 40, fontSize: '1.1rem' }}>
                  {(selectedStudent.student.name || selectedStudent.student.email || 'S')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="admin-modal-title">{selectedStudent.student.name || 'Scholar Profile'}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    ID: <code>{selectedStudent.student.id}</code>
                  </div>
                </div>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setStudentDetailOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Account Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {selectedStudent.student.is_verified ? (
                  <span className="admin-badge admin-badge-success">
                    <CheckCircle2 size={12} /> Email Verified
                  </span>
                ) : (
                  <span className="admin-badge admin-badge-warning">
                    <Clock size={12} /> Pending Verification
                  </span>
                )}
                <span className="admin-badge admin-badge-primary">
                  {selectedStudent.student.enrollment_type || 'Self-Registered'}
                </span>
                <span className={`admin-badge ${selectedStudent.student.status === 'suspended' ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                  {selectedStudent.student.status === 'suspended' ? 'Suspended' : 'Active Account'}
                </span>
              </div>

              {/* Contact Information */}
              <div className="admin-card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Contact &amp; Identification
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.75rem' }}>Email:</span>
                    <strong style={{ color: 'var(--admin-text-primary)' }}>{selectedStudent.student.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.75rem' }}>Phone:</span>
                    <strong style={{ color: 'var(--admin-text-primary)' }}>{selectedStudent.student.phone || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.75rem' }}>Enrolled On:</span>
                    <span>{new Date(selectedStudent.student.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.75rem' }}>Last Login:</span>
                    <span>{selectedStudent.student.last_login_at ? new Date(selectedStudent.student.last_login_at).toLocaleString('en-IN') : 'Never'}</span>
                  </div>
                </div>
              </div>

              {/* Active Membership Record */}
              <div className="admin-card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem', borderColor: selectedStudent.activeMembership ? 'var(--admin-primary)' : 'var(--admin-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>
                    Authoritative Membership Standing
                  </div>
                  {hasPermission('plans:write') && selectedStudent.activeMembership && (
                    <button 
                      type="button" 
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => setExtensionModalOpen(true)}
                    >
                      Extend / Renew
                    </button>
                  )}
                </div>

                {selectedStudent.activeMembership ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--admin-primary)', fontWeight: 700 }}>
                        {selectedStudent.activeMembership.plan_name || selectedStudent.activeMembership.plan_id}
                      </h4>
                      <span className="admin-badge admin-badge-success">Active</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>Activated: <strong>{new Date(selectedStudent.activeMembership.starts_at).toLocaleDateString('en-IN')}</strong></div>
                      <div>Valid Until: <strong>{new Date(selectedStudent.activeMembership.expires_at).toLocaleDateString('en-IN')}</strong></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                    No active membership found. Scholar has access to free preview lectures only.
                  </div>
                )}
              </div>

              {/* Payment & Order History */}
              <div className="admin-card">
                <div className="admin-card-header" style={{ padding: '0.9rem 1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>
                    Order &amp; UPI Transaction Ledger ({selectedStudent.orders?.length || 0})
                  </div>
                </div>

                {(!selectedStudent.orders || selectedStudent.orders.length === 0) ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                    No financial orders found for this scholar.
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>UTR Reference</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.orders.map((o) => (
                          <tr key={o.id}>
                            <td><code>{o.order_id || o.id}</code></td>
                            <td style={{ fontWeight: 600 }}>₹{(o.amount || 0).toLocaleString()}</td>
                            <td style={{ textTransform: 'uppercase' }}>{o.payment_method || 'UPI'}</td>
                            <td>
                              <span className={`admin-badge ${o.status === 'paid' ? 'admin-badge-success' : o.status === 'pending' ? 'admin-badge-warning' : 'admin-badge-danger'}`}>
                                {o.status}
                              </span>
                            </td>
                            <td><code>{o.utr_number || '—'}</code></td>
                            <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setStudentDetailOpen(false)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: EXTEND MEMBERSHIP MODAL
          ========================================================== */}
      {extensionModalOpen && selectedStudent && (
        <div className="admin-modal-backdrop" onClick={() => setExtensionModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Extend Scholar Membership</h3>
              <button type="button" className="admin-icon-btn" onClick={() => setExtensionModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '1rem' }}>
                Extending membership for <strong>{selectedStudent.student.name || selectedStudent.student.email}</strong>.
              </p>
              <div className="admin-form-group">
                <label className="admin-form-label">Days to Add *</label>
                <input 
                  type="number" 
                  className="admin-form-input" 
                  min="1" 
                  max="365" 
                  value={extensionDays}
                  onChange={e => setExtensionDays(e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Audit Reason *</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  value={extensionReason}
                  onChange={e => setExtensionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setExtensionModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleExtendMembership}>
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
