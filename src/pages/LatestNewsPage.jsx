import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LatestNewsPage() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetch('/api/blogs')
      .then(r => r.json())
      .then(d => { if (d.status) setBlogs(d.data || []); });
  }, []);

  return (
    <div className="latest-news-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Latest News &amp; Blog</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Aptopadesha Blog</span>
          <h2 className="fw-bold text-dark">Latest News &amp; Academic Insights</h2>
          <p className="text-muted">Stay ahead with the latest announcements, examination notifications, syllabus dissection, and preparation strategies.</p>
        </div>

        <div className="row g-4">
          {blogs.map(b => (
            <div key={b.id} className="col-lg-6">
              <div className="ayur-card d-flex flex-column flex-md-row overflow-hidden h-100">
                <div className="w-100 w-md-40 bg-light" style={{ minHeight: '220px' }}>
                  <img 
                    src={b.img} 
                    alt={b.title}
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/assets/website-assets/img/news/news1.jpg'; }}
                  />
                </div>
                <div className="p-4 d-flex flex-column justify-content-between w-100">
                  <div>
                    <small className="text-warning fw-bold text-uppercase">{b.published_at} • By {b.author}</small>
                    <h5 className="fw-bold text-dark mt-2 mb-2">
                      <Link to="/news-details" className="text-dark text-decoration-none">
                        {b.title}
                      </Link>
                    </h5>
                    <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                      {b.excerpt}
                    </p>
                  </div>
                  <Link to="/news-details" className="btn btn-sm btn-outline-warning text-dark fw-bold align-self-start mt-3">
                    Read Full Article <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

