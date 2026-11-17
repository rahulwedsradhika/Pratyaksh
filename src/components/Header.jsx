import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { user, cartCount } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isStudentPortal = location.pathname.startsWith('/dashboard') ||
                          location.pathname.startsWith('/student') ||
                          location.pathname.startsWith('/student-') ||
                          location.pathname.startsWith('/my-') ||
                          location.pathname.startsWith('/chapters/') ||
                          location.pathname.startsWith('/chapter-details/') ||
                          location.pathname.startsWith('/subjects/') ||
                          location.pathname.startsWith('/admin');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleDirectLogin = (e) => {
    e.preventDefault();
    // Direct Access to Student Dashboard Without Credentials
    navigate('/student');
  };

  if (isStudentPortal) return null;

  return (
    <header className="header header-page header-fixed">
      {/* 1. Main Navigation Bar */}
      <nav className="navbar navbar-expand-lg header-nav scroll-sticky py-2 bg-white border-bottom shadow-sm">
        <div className="container">
          <div className="navbar-header d-flex align-items-center">
            {/* Mobile Toggle Button */}
            <button 
              id="mobile_btn" 
              className="btn btn-light d-lg-none me-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              <i className="fa-solid fa-bars"></i>
            </button>

            {/* Logo */}
            <Link to="/" className="navbar-brand logo">
              <img 
                src="/assets/website-assets/img/logo.svg" 
                alt="Pratyaksh Ayurveda" 
                className="img-fluid"
                style={{ height: '38px', width: 'auto' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/favicon.png'; }}
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="d-none d-lg-flex align-items-center gap-4 main-menu-wrapper">
            <ul className="main-nav d-flex align-items-center gap-3 list-unstyled mb-0">
              <li className="nav-item">
                <Link to="/" className="nav-link text-dark fw-bold">Home</Link>
              </li>

              {/* Free Demo Dropdown */}
              <li className="nav-item dropdown has-submenu">
                <a className="nav-link text-dark fw-bold dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  Free Demo
                </a>
                <ul className="dropdown-menu shadow-sm border-0 submenu">
                  <li><Link className="dropdown-item" to="/course-category">As a guest scholar</Link></li>
                  <li><Link className="dropdown-item" to="/courses">Complete course demo</Link></li>
                </ul>
              </li>

              {/* Courses */}
              <li className="nav-item">
                <Link to="/courses" className="nav-link text-dark fw-bold">Courses</Link>
              </li>

              {/* News */}
              <li className="nav-item">
                <Link to="/latest-news" className="nav-link text-dark fw-bold">News</Link>
              </li>

              {/* Achievements Dropdown */}
              <li className="nav-item dropdown has-submenu">
                <a className="nav-link text-dark fw-bold dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  Achievments
                </a>
                <ul className="dropdown-menu shadow-sm border-0 submenu">
                  <li><Link className="dropdown-item" to="/students-review">Student Review</Link></li>
                  <li><Link className="dropdown-item" to="/results">Results</Link></li>
                </ul>
              </li>

              {/* Know Us Dropdown */}
              <li className="nav-item dropdown has-submenu">
                <a className="nav-link text-dark fw-bold dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  Know Us
                </a>
                <ul className="dropdown-menu shadow-sm border-0 submenu">
                  <li><Link className="dropdown-item" to="/about-us">About Us</Link></li>
                  <li><Link className="dropdown-item" to="/vision">Vision</Link></li>
                  <li><Link className="dropdown-item" to="/faculty">Faculty</Link></li>
                  <li><Link className="dropdown-item" to="/contact-us">Contact Us</Link></li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Right Header Navigation */}
          <div className="header-navbar-rht d-flex align-items-center gap-3">
            {/* Search Tool */}
            <div className="position-relative">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="d-flex align-items-center">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-pill"
                    placeholder="Search courses, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{ width: '200px' }}
                  />
                  <button type="submit" className="btn btn-sm btn-warning py-1 px-2 ms-1 rounded-circle"><i className="fa-solid fa-search"></i></button>
                  <button type="button" className="btn btn-sm btn-light py-1 px-2 ms-1 rounded-circle" onClick={() => setSearchOpen(false)}>✕</button>
                </form>
              ) : (
                <button 
                  className="btn btn-light rounded-circle p-2 text-muted" 
                  onClick={() => setSearchOpen(true)}
                  title="Search platform"
                  style={{ width: '38px', height: '38px' }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>
              )}
            </div>

            {/* Shopping Cart Icon with Badge */}
            <Link to="/cart" className="btn btn-light position-relative rounded-circle p-2" title="Shopping Cart" style={{ width: '38px', height: '38px' }}>
              <i className="fa-solid fa-cart-shopping text-dark"></i>
              {cartCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7rem' }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* DIRECT ACCESS LOGIN & REGISTER (No Credentials Required) */}
            {isStudentPortal ? (
              /* When in student portal, show learner profile pill */
              <div className="dropdown">
                <a 
                  href="#" 
                  className="d-flex align-items-center gap-2 text-decoration-none text-dark dropdown-toggle" 
                  data-bs-toggle="dropdown"
                >
                  <img 
                    src={user.avatar || "/assets/website-assets/img/icon/icons8-male-user-96.png"} 
                    alt={user.name} 
                    className="rounded-circle border border-warning"
                    width="36" 
                    height="36"
                  />
                  <span className="d-none d-md-inline fw-bold" style={{ fontSize: '0.9rem' }}>
                    {user.name}
                  </span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                  <li><Link className="dropdown-item" to="/dashboard"><i className="fa-solid fa-gauge me-2 text-warning"></i> Dashboard</Link></li>
                  <li><Link className="dropdown-item" to="/student-courses"><i className="fa-solid fa-book-open me-2 text-warning"></i> My Courses</Link></li>
                  <li><Link className="dropdown-item" to="/student-tests"><i className="fa-solid fa-pencil me-2 text-warning"></i> My Tests</Link></li>
                  <li><Link className="dropdown-item" to="/my-performance"><i className="fa-solid fa-chart-line me-2 text-warning"></i> Performance</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/"><i className="fa-solid fa-house me-2"></i> Public Homepage</Link></li>
                </ul>
              </div>
            ) : (
              /* Public Header: Authentic Register and Login Buttons */
              <div className="d-flex align-items-center gap-2">
                <button 
                  onClick={handleDirectLogin}
                  className="btn btn-outline-warning fw-bold px-3 py-2 text-dark rounded-pill d-none d-sm-inline-block"
                  style={{ fontSize: '0.9rem' }}
                >
                  Register
                </button>

                <button 
                  onClick={handleDirectLogin}
                  className="btn btn-warning fw-bold px-4 py-2 text-dark rounded-pill shadow-sm header-login"
                  style={{ fontSize: '0.9rem' }}
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="d-lg-none bg-white border-top p-3 w-100 shadow">
            <ul className="list-unstyled d-flex flex-column gap-2 mb-3">
              <li><Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">Home</Link></li>
              <li><Link to="/courses" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">Courses</Link></li>
              <li><Link to="/course-category" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">Free Demo</Link></li>
              <li><Link to="/student-tests" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">Test Series</Link></li>
              <li><Link to="/latest-news" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">News &amp; Blog</Link></li>
              <li><Link to="/results" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">Results</Link></li>
              <li><Link to="/about-us" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">About Us</Link></li>
              <li><Link to="/faculty" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">Faculty</Link></li>
              <li><Link to="/contact-us" onClick={() => setMobileMenuOpen(false)} className="text-dark fw-bold text-decoration-none d-block py-1">Contact Us</Link></li>
            </ul>

            <div className="d-grid gap-2 pt-2 border-top">
              <button 
                onClick={(e) => { setMobileMenuOpen(false); handleDirectLogin(e); }}
                className="btn btn-warning fw-bold text-dark w-100"
              >
                Login to Student LMS
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
