import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminHeader({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFullScreen = (e) => {
    e.preventDefault();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.warn);
    } else {
      document.exitFullscreen().catch(console.warn);
    }
  };

  const toggleTheme = (e) => {
    e.preventDefault();
    document.body.classList.toggle('dark-theme');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/view-course?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const signOut = async () => {
    await adminLogout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="main-header">
      {/* 1. Logo Box */}
      <div className="d-flex align-items-center logo-box justify-content-start px-3">
        <button 
          onClick={onToggleSidebar}
          className="btn btn-link text-dark p-0 me-3 d-inline-block text-decoration-none"
          title="Toggle Navigation"
          style={{ fontSize: '1.25rem' }}
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <Link to="/admin" className="logo d-flex align-items-center text-decoration-none">
          <img 
            src="/assets/website-assets/img/logo.svg" 
            alt="Pratyaksh Ayurveda Admin" 
            height="36" 
            onError={(e) => { e.target.src = '/assets/images/logo-dark-text.png'; }} 
          />
          <span className="badge bg-danger ms-2 px-2 py-1 text-white fw-bold" style={{ fontSize: '0.65rem' }}>
            ADMIN
          </span>
        </Link>
      </div>

      {/* 2. Top Static Navbar */}
      <nav className="navbar navbar-static-top px-3">
        <div className="app-menu d-flex align-items-center">
          <ul className="header-megamenu nav align-items-center mb-0 list-unstyled d-flex gap-2">
            {/* Quick Link back to public website */}
            <li className="nav-item">
              <Link 
                to="/" 
                className="btn btn-outline-secondary text-dark fw-bold d-flex align-items-center px-3 py-1 rounded-pill" 
                title="Go to website"
                style={{ fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-globe me-2 text-primary"></i>
                <span className="d-none d-md-inline">Public Website</span>
              </Link>
            </li>

            {/* Quick Link to Student LMS */}
            <li className="nav-item">
              <Link 
                to="/student" 
                className="btn btn-outline-warning text-dark fw-bold d-flex align-items-center px-3 py-1 rounded-pill" 
                title="Student Dashboard"
                style={{ fontSize: '0.85rem', borderColor: '#f57105', backgroundColor: '#fffaf5' }}
              >
                <i className="fa-solid fa-graduation-cap me-2 text-warning"></i>
                <span className="d-none d-md-inline">Student Portal</span>
              </Link>
            </li>

            {/* Theme toggle */}
            <li className="nav-item d-none d-sm-inline-block">
              <button 
                onClick={toggleTheme} 
                className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" 
                title="Toggle Dark Theme"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="fa-regular fa-moon fs-16 text-secondary"></i>
              </button>
            </li>
          </ul>
        </div>

        {/* Right side tools & Admin Profile */}
        <div className="navbar-custom-menu r-side d-flex align-items-center gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="d-none d-lg-block">
            <div className="input-group input-group-sm" style={{ width: '240px' }}>
              <input 
                type="search" 
                className="form-control rounded-start-pill border-end-0 ps-3" 
                placeholder="Search catalog..." 
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary rounded-end-pill border-start-0 pe-3" type="submit">
                <i className="fa-solid fa-magnifying-glass text-muted"></i>
              </button>
            </div>
          </form>

          {/* Fullscreen button */}
          <button 
            onClick={toggleFullScreen} 
            className="btn btn-light rounded-circle p-2 d-none d-md-flex align-items-center justify-content-center text-decoration-none" 
            title="Full Screen"
            style={{ width: '38px', height: '38px' }}
          >
            <i className="fa-solid fa-expand fs-16 text-secondary"></i>
          </button>

          {/* Notifications Bell */}
          <button 
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center position-relative text-decoration-none" 
            title="Notifications"
            style={{ width: '38px', height: '38px' }}
          >
            <i className="fa-regular fa-bell fs-16 text-secondary"></i>
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">New alerts</span>
            </span>
          </button>

          {/* Admin Avatar & Dropdown */}
          <div className="dropdown">
            <button 
              className="btn btn-light d-flex align-items-center gap-2 px-3 py-1 rounded-pill border"
              type="button" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
            >
              <i className="fa-solid fa-shield-halved fs-18 text-danger"></i>
              <span className="fw-semibold text-dark small d-none d-sm-inline">
                {adminUser?.full_name || 'Administrator'}
              </span>
              <i className="fa-solid fa-chevron-down fs-12 text-muted ms-1"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3 p-2" style={{ minWidth: '240px' }}>
              <li className="px-3 py-2 border-bottom mb-2">
                <strong className="d-block text-dark">{adminUser?.full_name || 'Administrator'}</strong>
                <span className="text-muted small d-block">{adminUser?.email}</span>
                <span className="text-muted small d-block" style={{ textTransform: 'capitalize' }}>{adminUser?.role?.replaceAll('_', ' ')}</span>
                {adminUser?.phone && <span className="text-muted small d-block">{adminUser.phone}</span>}
                {adminUser?.address && <span className="text-muted small d-block" style={{ whiteSpace: 'normal' }}>{adminUser.address}</span>}
              </li>
              <li>
                <Link className="dropdown-item py-2 rounded-2" to="/admin">
                  <i className="fa-solid fa-gauge text-muted me-2"></i> Admin Dashboard
                </Link>
              </li>
              <li>
                <Link className="dropdown-item py-2 rounded-2" to="/admin/view-course">
                  <i className="fa-solid fa-book text-muted me-2"></i> Manage Courses
                </Link>
              </li>
              <li>
                <Link className="dropdown-item py-2 rounded-2" to="/admin/registered-student">
                  <i className="fa-solid fa-users text-muted me-2"></i> Registered Students
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button type="button" className="dropdown-item py-2 rounded-2 text-danger" onClick={signOut}>
                  <i className="fa-solid fa-right-from-bracket text-danger me-2"></i> Sign out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

