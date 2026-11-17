import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      showToast('Please provide your name and email.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.status) {
        showToast('Your inquiry has been recorded locally! Our team will contact you.', 'success');
        setForm({ name: '', email: '', phone: '', message: '' });
      } else {
        showToast(data.message || 'Error sending message', 'error');
      }
    } catch (e) {
      showToast('Error recording inquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-us-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Contact Us</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Get in Touch</span>
          <h2 className="fw-bold text-dark">We'd Love to Hear From You</h2>
          <p className="text-muted">Have a query regarding our batches, test series, or faculty guidance? Reach out to us directly or fill in the form below.</p>
        </div>

        <div className="row g-5">
          <div className="col-lg-5">
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border h-100 d-flex flex-column justify-content-between">
              <div>
                <h4 className="fw-bold text-dark mb-4">Contact Information</h4>

                <div className="d-flex align-items-start gap-3 mb-4">
                  <div className="btn btn-warning rounded-circle p-3 text-dark d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Head Office</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                      Pratyaksh Ayurveda, Varanasi (Kashi), Uttar Pradesh - 221005, India
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 mb-4">
                  <div className="btn btn-warning rounded-circle p-3 text-dark d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Helpline Phone</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                      <a href="tel:+918795776006" className="text-dark text-decoration-none fw-semibold">
                        +91 87957 76006
                      </a>
                      <span className="d-block text-muted" style={{ fontSize: '0.8rem' }}>(Monday to Saturday, 9:00 AM - 8:00 PM)</span>
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 mb-4">
                  <div className="btn btn-warning rounded-circle p-3 text-dark d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Email Support</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                      <a href="mailto:infopratyakshayurveda@gmail.com" className="text-dark text-decoration-none fw-semibold">
                        infopratyakshayurveda@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 mb-4">
                  <div className="btn btn-success rounded-circle p-3 text-white d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                    <i className="fa-brands fa-whatsapp"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">WhatsApp Broadcast &amp; Help</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                      <a href="https://wa.me/918795776006" target="_blank" rel="noreferrer" className="text-success text-decoration-none fw-semibold">
                        Click here to chat instantly
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-top">
                <small className="text-muted fw-bold d-block mb-2 text-uppercase">Connect on Social Media</small>
                <div className="d-flex gap-2">
                  <a href="https://wa.me/918795776006" target="_blank" rel="noreferrer" className="btn btn-light rounded-circle p-2 text-success"><i className="fa-brands fa-whatsapp fa-lg"></i></a>
                  <a href="https://t.me/pratyakshayurveda1" target="_blank" rel="noreferrer" className="btn btn-light rounded-circle p-2 text-primary"><i className="fa-brands fa-telegram fa-lg"></i></a>
                  <a href="https://www.youtube.com/@PratyakshAyurveda" target="_blank" rel="noreferrer" className="btn btn-light rounded-circle p-2 text-danger"><i className="fa-brands fa-youtube fa-lg"></i></a>
                  <a href="https://www.facebook.com/pratyakshayurvedavns" target="_blank" rel="noreferrer" className="btn btn-light rounded-circle p-2 text-primary"><i className="fa-brands fa-facebook fa-lg"></i></a>
                  <a href="https://www.instagram.com/pratyakshayurveda/" target="_blank" rel="noreferrer" className="btn btn-light rounded-circle p-2 text-danger"><i className="fa-brands fa-instagram fa-lg"></i></a>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
              <h4 className="fw-bold text-dark mb-2">Send Us an Inquiry</h4>
              <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                Fill out the form below. Inquiries are stored directly in your local SQLite database.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@example.com"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Mobile / WhatsApp Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Your Message / Query *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Ask about batch timings, fee structure, mock tests, or offline centers..."
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-ayur btn-lg w-100 py-3 fw-bold"
                  disabled={submitting}
                >
                  {submitting ? 'Saving Message...' : 'Send Message Now'} <i className="fa-solid fa-paper-plane ms-2"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

