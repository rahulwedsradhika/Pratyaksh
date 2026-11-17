import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faculty')
      .then(r => r.json())
      .then(d => {
        if (d.status && d.data) setFaculty(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="faculty-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Faculty Directory</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Academic Mentors</span>
          <h2 className="fw-bold text-dark">Meet Our Esteemed Faculty</h2>
          <p className="text-muted">
            Distinguished academicians, MD scholars from Banaras Hindu University (BHU), National Institute of Ayurveda (NIA), and top research centers committed to nurturing the next generation of Ayurveda leaders.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : (
          <div className="row g-4">
            {faculty.map((f, idx) => {
              const fallbackImg = `/assets/website-assets/img/faculty/fac${(idx % 2) + 1}.jpg`;
              const imgSrc = f.img ? (f.img.startsWith('http') ? f.img : `/${f.img}`) : fallbackImg;

              return (
                <div key={f._id} className="col-lg-4 col-md-6">
                  <div className="ayur-card h-100 p-4 text-center d-flex flex-column align-items-center">
                    <div className="position-relative mb-4">
                      <img 
                        src={imgSrc} 
                        alt={f.name}
                        className="rounded-circle shadow border border-3 border-warning"
                        style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
                      />
                      <span className="position-absolute bottom-0 end-0 badge bg-success rounded-pill p-2" title="Verified Mentor">
                        <i className="fa-solid fa-check"></i>
                      </span>
                    </div>

                    <h5 className="fw-bold text-dark mb-1">{f.name}</h5>
                    <div className="text-warning fw-bold mb-2" style={{ fontSize: '0.9rem' }}>
                      {f.qualification || 'MD(Ay), BHU'}
                    </div>

                    <div className="badge bg-light text-dark border px-3 py-1 mb-3" style={{ fontSize: '0.8rem' }}>
                      <i className="fa-solid fa-certificate text-warning me-1"></i>
                      {f.specializtion || 'Samhita & Siddhant'}
                    </div>

                    <p className="text-muted mb-4 flex-grow-1" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                      {f.detail || 'Passionate educator renowned for verse-by-verse commentary analysis, conceptual decoding, and high-yield question mentorship.'}
                    </p>

                    <div className="w-100 pt-3 border-top mt-auto">
                      <Link to="/courses" className="btn btn-outline-warning text-dark btn-sm w-100 fw-bold">
                        <i className="fa-solid fa-graduation-cap me-1"></i> View Taught Courses
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

