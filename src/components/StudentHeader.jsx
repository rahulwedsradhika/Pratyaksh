import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function StudentHeader({ onToggleSidebar }) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="main-header bg-white border-bottom shadow-none" style={{ height: '64px' }}>
      <div className="d-flex align-items-center justify-content-between h-100 px-3 w-100">
        {/* Left: Hamburger & Logo */}
        <div className="d-flex align-items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="btn btn-link text-dark p-0 text-decoration-none"
            title="Toggle Navigation"
            style={{ fontSize: '1.25rem', lineHeight: 1 }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <Link to="/" className="d-flex align-items-center text-decoration-none">
            <img 
              src="/assets/website-assets/img/logo.svg" 
              alt="Pratyaksh Ayurveda" 
              height="38" 
              onError={(e) => { e.target.src = '/assets/images/logo-dark-text.png'; }} 
            />
          </Link>
        </div>

        {/* Action Buttons Group (Chat, Task, Document, Globe) */}
        <div className="d-none d-md-flex align-items-center gap-1 ms-3 p-1 rounded-2 border bg-light">
          <Link to="/student" className="btn btn-sm btn-light border-0 text-primary p-2" title="Chat">
            <i className="fa-solid fa-comment-dots fs-16"></i>
          </Link>
          <Link to="/student/student-my-task" className="btn btn-sm btn-light border-0 text-primary p-2" title="Taskboard">
            <i className="fa-solid fa-clipboard-check fs-16"></i>
          </Link>
          <Link to="/student/courses" className="btn btn-sm btn-light border-0 text-primary p-2" title="Study Documents">
            <i className="fa-solid fa-file-lines fs-16"></i>
          </Link>
          <Link to="/" className="btn btn-sm btn-light border-0 text-primary p-2" title="Public Website">
            <i className="fa-solid fa-globe fs-16"></i>
          </Link>
        </div>

        {/* Center: Light Blue Banner Area */}
        <div className="flex-grow-1 mx-3 d-none d-lg-block">
          <div 
            className="w-100 rounded-3 d-flex align-items-center px-3"
            style={{ 
              backgroundColor: '#eaf2fd', 
              height: '38px',
              border: '1px solid #d0e2fb'
            }}
          >
          </div>
        </div>

        {/* Right: Search, Notifications, Power, Profile */}
        <div className="d-flex align-items-center gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="d-none d-sm-block">
            <div className="input-group input-group-sm" style={{ width: '220px' }}>
              <input 
                type="search" 
                className="form-control rounded-start bg-light border" 
                placeholder="Search" 
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary bg-light border-start-0 pe-2" type="submit">
                <i className="fa-solid fa-magnifying-glass text-muted"></i>
              </button>
            </div>
          </form>

          {/* Notifications Bell */}
          <button 
            type="button"
            className="btn btn-link text-dark p-0 position-relative text-decoration-none" 
            title="Notifications"
          >
            <i className="fa-solid fa-bell fs-18 text-secondary"></i>
          </button>

          {/* Red Circular Power/Logout Button */}
          <Link 
            to="/" 
            className="btn btn-danger rounded-circle p-0 d-flex align-items-center justify-content-center text-white text-decoration-none shadow-sm"
            style={{ width: '32px', height: '32px', backgroundColor: '#ea5455', borderColor: '#ea5455' }}
            title="Logout / Exit to Home"
          >
            <i className="fa-solid fa-power-off fs-14"></i>
          </Link>

          {/* User Profile Avatar Silhouette */}
          <div className="dropdown">
            <button 
              className="btn btn-link text-dark p-0 text-decoration-none"
              type="button" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
              title="User Menu"
            >
              <i className="fa-solid fa-user fs-18 text-dark"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3 p-2" style={{ minWidth: '200px' }}>
              <li className="px-3 py-2 border-bottom mb-2">
                <strong className="d-block text-dark">{user?.name || 'Local Learner'}</strong>
                <span className="text-muted small">2026 AIAPGET Scholar</span>
              </li>
              <li>
                <Link className="dropdown-item py-2 rounded-2" to="/student/courses">
                  <i className="fa-solid fa-book-open text-muted me-2"></i> My Courses
                </Link>
              </li>
              <li>
                <Link className="dropdown-item py-2 rounded-2" to="/student/student-tests">
                  <i className="fa-solid fa-pen-to-square text-muted me-2"></i> My Tests
                </Link>
              </li>
              <li>
                <Link className="dropdown-item py-2 rounded-2" to="/student/purchaseHistory">
                  <i className="fa-solid fa-receipt text-muted me-2"></i> Purchase History
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <Link className="dropdown-item py-2 rounded-2 text-danger" to="/">
                  <i className="fa-solid fa-house text-danger me-2"></i> Public Homepage
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
