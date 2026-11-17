import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function StudentsReviewPage() {
  const { showToast } = useApp();
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: 'Dr. Aarav Sharma',
      college: 'Faculty of Ayurveda, IMS BHU',
      rating: 5,
      date: 'October 2026',
      review: 'The Charaka Samhita classes are unmatched. Rahul Sir’s clarity on Chakrapani commentary makes all difficult verses effortless to recall during exams.'
    },
    {
      id: 2,
      name: 'Dr. Priya Patel',
      college: 'Govt. Akhandanand Ayurveda College, Ahmedabad',
      rating: 5,
      date: 'September 2026',
      review: 'Pragya Vitarka mock tests were a game changer for my preparation. The question explanations and Samhita references cleared all my doubts.'
    },
    {
      id: 3,
      name: 'Dr. Rohan Verma',
      college: 'National Institute of Ayurveda (NIA), Jaipur',
      rating: 5,
      date: 'August 2026',
      review: 'I joined as a BAMS 3rd prof student. It gave me both university exam excellence and early AIAPGET orientation.'
    }
  ]);

  const [form, setForm] = useState({ name: '', college: '', rating: 5, review: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.review) {
      showToast('Please fill out your name and review', 'error');
      return;
    }
    const newRev = {
      id: Date.now(),
      name: form.name,
      college: form.college || 'Ayurveda Scholar',
      rating: parseInt(form.rating),
      date: 'Just now',
      review: form.review
    };
    setReviews([newRev, ...reviews]);
    showToast('Thank you! Your review has been saved locally.', 'success');
    setForm({ name: '', college: '', rating: 5, review: '' });
  };

  return (
    <div className="students-review-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Student Reviews</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Real Feedback</span>
          <h2 className="fw-bold text-dark">What Our Scholars Say</h2>
          <p className="text-muted">Honest reviews and testimonials from Ayurveda scholars across India preparing with Pratyaksh Ayurveda.</p>
        </div>

        <div className="row g-4">
          {/* Reviews List */}
          <div className="col-lg-7">
            <div className="d-flex flex-column gap-3">
              {reviews.map(r => (
                <div key={r.id} className="ayur-card p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold text-dark mb-0">{r.name}</h5>
                      <small className="text-muted">{r.college} • {r.date}</small>
                    </div>
                    <div className="text-warning">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <i key={i} className="fa-solid fa-star"></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                    "{r.review}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Review Form */}
          <div className="col-lg-5">
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border sticky-top" style={{ top: '100px' }}>
              <h4 className="fw-bold text-dark mb-2">Share Your Experience</h4>
              <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                Studied with Pratyaksh Ayurveda? Leave your feedback for future scholars.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Your Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. Rajesh Kumar"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Ayurveda College / Institute</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Govt. Ayurvedic College"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Rating</label>
                  <select 
                    className="form-select"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars - Exceptional</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars - Very Good</option>
                    <option value="3">⭐⭐⭐ 3 Stars - Good</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Your Review *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Describe how the lectures, faculty, and test series aided your preparation..."
                    required
                    value={form.review}
                    onChange={(e) => setForm({ ...form, review: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-ayur w-100 py-2 fw-bold">
                  Submit Review Locally
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

