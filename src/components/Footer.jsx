import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const isStudentPortal = location.pathname.startsWith('/dashboard') ||
                          location.pathname.startsWith('/student') ||
                          location.pathname.startsWith('/student-') ||
                          location.pathname.startsWith('/my-') ||
                          location.pathname.startsWith('/chapters/') ||
                          location.pathname.startsWith('/chapter-details/') ||
                          location.pathname.startsWith('/subjects/') ||
                          location.pathname.startsWith('/admin');

  if (isStudentPortal) return null;

  return (
    <footer className="bg-dark text-light pt-5 pb-4 mt-5">
      <div className="container">
        <div className="row g-4 mb-4">
          {/* Brand & Sanskrit Shloka */}
          <div className="col-lg-4 col-md-6">
            <Link to="/" className="d-inline-block mb-3">
              <img 
                src="/assets/website-assets/img/logo.svg" 
                alt="Pratyaksh Ayurveda" 
                height="48"
                style={{ filter: 'brightness(0) invert(1)' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/favicon.png'; }}
              />
            </Link>
            
            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'rgba(245, 113, 5, 0.15)', borderLeft: '4px solid #f57105' }}>
              <p className="sanskrit-text text-warning mb-1" style={{ fontSize: '1.05rem' }}>
                तिष्ठत्युपरि युक्तिज्ञो द्रव्यज्ञानवतां सदा ||
              </p>
              <small className="text-white-50 fst-italic">
                "The physician who knows how to rationally apply medicine always stands above one who merely knows the names of drugs." — Charaka Samhita
              </small>
            </div>

            <p className="text-white-50" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              India's premier institute for AIAPGET, NExT &amp; BAMS university exam preparation. Comprehensive live &amp; recorded lectures, authentic Samhita dissection, and high-yield question series.
            </p>

            <div className="d-flex align-items-center gap-2 mt-3">
              <a href="https://wa.me/918795776006" target="_blank" rel="noreferrer" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '36px', height: '36px' }} title="WhatsApp"><i className="fa-brands fa-whatsapp"></i></a>
              <a href="https://t.me/pratyakshayurveda1" target="_blank" rel="noreferrer" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '36px', height: '36px' }} title="Telegram"><i className="fa-brands fa-telegram"></i></a>
              <a href="https://www.youtube.com/@PratyakshAyurveda" target="_blank" rel="noreferrer" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '36px', height: '36px' }} title="YouTube"><i className="fa-brands fa-youtube"></i></a>
              <a href="https://www.facebook.com/pratyakshayurvedavns" target="_blank" rel="noreferrer" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '36px', height: '36px' }} title="Facebook"><i className="fa-brands fa-facebook"></i></a>
              <a href="https://www.instagram.com/pratyakshayurveda/" target="_blank" rel="noreferrer" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '36px', height: '36px' }} title="Instagram"><i className="fa-brands fa-instagram"></i></a>
              <a href="https://www.linkedin.com/company/pratyaksh-ayurveda/" target="_blank" rel="noreferrer" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '36px', height: '36px' }} title="LinkedIn"><i className="fa-brands fa-linkedin"></i></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h5 className="text-white fw-bold mb-3 border-bottom border-secondary pb-2">Academic Tracks</h5>
            <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
              <li><Link to="/courses/63745016ab8725670aed2a32" className="text-white-50 text-decoration-none hover-warning">AIAPGET Preparation</Link></li>
              <li><Link to="/courses/63744f0aab8725670aed2a2e" className="text-white-50 text-decoration-none hover-warning">BAMS Prof 1-3</Link></li>
              <li><Link to="/courses/637452acab8725670aed2a36" className="text-white-50 text-decoration-none hover-warning">Ayurveda Graduates</Link></li>
              <li><Link to="/courses/63745436ab8725670aed2a3a" className="text-white-50 text-decoration-none hover-warning">Practicing Vaidya</Link></li>
              <li><Link to="/student-tests" className="text-white-50 text-decoration-none hover-warning">Pragya Vitarka Mock Series</Link></li>
              <li><Link to="/course-category" className="text-white-50 text-decoration-none hover-warning">Free Guest Scholar Access</Link></li>
            </ul>
          </div>

          {/* Institutional Links */}
          <div className="col-lg-2 col-md-6">
            <h5 className="text-white fw-bold mb-3 border-bottom border-secondary pb-2">Know Us</h5>
            <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
              <li><Link to="/about-us" className="text-white-50 text-decoration-none">About Us</Link></li>
              <li><Link to="/vision" className="text-white-50 text-decoration-none">Vision &amp; Philosophy</Link></li>
              <li><Link to="/faculty" className="text-white-50 text-decoration-none">Faculty Team</Link></li>
              <li><Link to="/results" className="text-white-50 text-decoration-none">Hall of Fame Results</Link></li>
              <li><Link to="/students-review" className="text-white-50 text-decoration-none">Student Reviews</Link></li>
              <li><Link to="/latest-news" className="text-white-50 text-decoration-none">Aptopadesha Blog</Link></li>
              <li><Link to="/books" className="text-white-50 text-decoration-none">Recommended Samhitas</Link></li>
              <li><Link to="/researches" className="text-white-50 text-decoration-none">Research Articles</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="col-lg-4 col-md-6">
            <h5 className="text-white fw-bold mb-3 border-bottom border-secondary pb-2">Contact Us</h5>
            <ul className="list-unstyled text-white-50 d-flex flex-column gap-3" style={{ fontSize: '0.9rem' }}>
              <li className="d-flex align-items-start gap-2">
                <i className="fa-solid fa-location-dot text-warning mt-1"></i>
                <span>Pratyaksh Ayurveda Head Office, Varanasi (Kashi), Uttar Pradesh, India</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <i className="fa-solid fa-envelope text-warning"></i>
                <a href="mailto:infopratyakshayurveda@gmail.com" className="text-white-50 text-decoration-none">
                  infopratyakshayurveda@gmail.com
                </a>
              </li>
              <li className="d-flex align-items-center gap-2">
                <i className="fa-solid fa-phone text-warning"></i>
                <a href="tel:+918795776006" className="text-white-50 text-decoration-none">
                  +91 87957 76006
                </a>
              </li>
              <li className="d-flex align-items-center gap-2">
                <i className="fa-brands fa-whatsapp text-success"></i>
                <a href="https://wa.me/918795776006" target="_blank" rel="noreferrer" className="text-white-50 text-decoration-none">
                  Instant WhatsApp Helpdesk
                </a>
              </li>
            </ul>

            <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#212529', border: '1px dashed #495057' }}>
              <small className="text-muted d-block mb-1">Local Development Server:</small>
              <div className="d-flex align-items-center justify-content-between">
                <span className="badge bg-success">Status: Healthy</span>
                <span className="font-monospace text-warning" style={{ fontSize: '0.8rem' }}>No Authentication Required</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-secondary my-4" />

        <div className="d-flex flex-wrap justify-content-between align-items-center text-white-50" style={{ fontSize: '0.85rem' }}>
          <div>
            &copy; {new Date().getFullYear()} Pratyaksh Ayurveda. All Rights Reserved. Rebuilt as a fully functional local development replica.
          </div>
          <div className="d-flex gap-3 mt-2 mt-sm-0">
            <Link to="/privacy" className="text-white-50 text-decoration-none">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="text-white-50 text-decoration-none">Terms &amp; Conditions</Link>
            <span>•</span>
            <Link to="/admin" className="text-warning text-decoration-none">Admin CMS</Link>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Quick Action */}
      <a 
        href="https://wa.me/918795776006" 
        target="_blank" 
        rel="noreferrer" 
        className="floating-whatsapp"
        title="Chat on WhatsApp"
      >
        <i className="fa-brands fa-whatsapp"></i>
      </a>
    </footer>
  );
}

