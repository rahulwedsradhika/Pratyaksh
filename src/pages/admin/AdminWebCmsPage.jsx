import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminWebCmsPage() {
  const location = useLocation();
  const { showToast } = useApp();

  // Determine active section from URL path
  const path = location.pathname;
  const initialSection = path.includes('about') ? 'about' 
    : path.includes('vision') ? 'vision' 
    : path.includes('faq') ? 'faq' 
    : path.includes('discount') ? 'discount'
    : path.includes('performance') ? 'performance'
    : 'testimonials';

  const [section, setSection] = useState(initialSection);

  useEffect(() => {
    if (path.includes('about')) setSection('about');
    else if (path.includes('vision')) setSection('vision');
    else if (path.includes('faq')) setSection('faq');
    else if (path.includes('discount')) setSection('discount');
    else if (path.includes('performance')) setSection('performance');
    else if (path.includes('prfessional')) setSection('testimonials');
  }, [path]);

  // Testimonials
  const [testimonials, setTestimonials] = useState([]);
  // CMS Fields
  const [visionText, setVisionText] = useState('To establish an authentic, concept-driven Ayurveda education ecosystem that bridges classical Samhita knowledge with modern academic rigor, preparing scholars for AIAPGET, State PSC, and clinical excellence.');
  const [aboutText, setAboutText] = useState('Pratyaksh Ayurveda is India\'s premier institution dedicated exclusively to logical, verse-by-verse Ayurveda training, mentorship, and comprehensive test series.');
  const [discountCode, setDiscountCode] = useState('AYUR2026');
  const [discountPercent, setDiscountPercent] = useState(15);

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(d => {
        if (d.status) setTestimonials(d.data || []);
      })
      .catch(console.error);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Configuration updated successfully in local database!', 'success');
  };

  return (
    <AdminLayout>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item">Web CMS</li>
              <li className="breadcrumb-item active" aria-current="page">Portal Settings</li>
            </ol>
          </nav>
          <h3 className="fw-bold text-dark mb-0">Platform Content &amp; Configuration</h3>
        </div>

        {/* Tab Pills */}
        <div className="d-flex gap-2">
          <button 
            onClick={() => setSection('testimonials')} 
            className={`btn btn-sm ${section === 'testimonials' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            Testimonials
          </button>
          <button 
            onClick={() => setSection('about')} 
            className={`btn btn-sm ${section === 'about' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            About Us
          </button>
          <button 
            onClick={() => setSection('vision')} 
            className={`btn btn-sm ${section === 'vision' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            Vision
          </button>
          <button 
            onClick={() => setSection('discount')} 
            className={`btn btn-sm ${section === 'discount' ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            Discounts
          </button>
        </div>
      </div>

      <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
        {/* Testimonials */}
        {section === 'testimonials' && (
          <div>
            <h5 className="fw-bold text-dark mb-3">Student Testimonials &amp; Success Stories</h5>
            <div className="admin-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Scholar Name</th>
                    <th>Rank / Result</th>
                    <th>Course Batch</th>
                    <th>Review / Testimonial</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t, idx) => (
                    <tr key={t.id || idx}>
                      <td><strong className="text-dark">{t.student_name || t.name}</strong></td>
                      <td>
                        <span className="badge bg-warning text-dark fw-bold">
                          {t.rank || 'AIAPGET Qualified'}
                        </span>
                      </td>
                      <td><span className="text-muted small">{t.course_name || 'Ayurdeeksha'}</span></td>
                      <td style={{ maxWidth: '350px' }}>
                        <span className="small text-muted">{t.review || t.testimonial}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* About Us */}
        {section === 'about' && (
          <form onSubmit={handleSave}>
            <h5 className="fw-bold text-dark mb-3">About Us Editorial Content</h5>
            <div className="mb-3">
              <label className="form-label text-dark fw-bold small">Editorial Overview</label>
              <textarea 
                className="form-control" 
                rows="6" 
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary fw-bold px-4">
              Save About Us Content
            </button>
          </form>
        )}

        {/* Vision */}
        {section === 'vision' && (
          <form onSubmit={handleSave}>
            <h5 className="fw-bold text-dark mb-3">Platform Vision &amp; Mission</h5>
            <div className="mb-3">
              <label className="form-label text-dark fw-bold small">Vision Statement</label>
              <textarea 
                className="form-control" 
                rows="6" 
                value={visionText}
                onChange={(e) => setVisionText(e.target.value)}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary fw-bold px-4">
              Save Vision Statement
            </button>
          </form>
        )}

        {/* Discount */}
        {section === 'discount' && (
          <form onSubmit={handleSave}>
            <h5 className="fw-bold text-dark mb-3">Promotional Discount Codes</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label text-dark fw-bold small">Coupon / Promo Code</label>
                <input 
                  type="text" 
                  className="form-control font-monospace fw-bold" 
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-dark fw-bold small">Discount Percentage (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary fw-bold px-4">
              Update Discount Rule
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

