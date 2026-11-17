import React from 'react';
import { NavLink } from 'react-router-dom';

const DotGridIcon = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="me-3 text-secondary"
    style={{ minWidth: '16px' }}
  >
    <circle cx="5" cy="5" r="2.2" />
    <circle cx="12" cy="5" r="2.2" />
    <circle cx="19" cy="5" r="2.2" />
    <circle cx="5" cy="12" r="2.2" />
    <circle cx="12" cy="12" r="2.2" />
    <circle cx="19" cy="12" r="2.2" />
    <circle cx="5" cy="19" r="2.2" />
    <circle cx="12" cy="19" r="2.2" />
    <circle cx="19" cy="19" r="2.2" />
  </svg>
);

export default function StudentSidebar({ isOpen }) {
  const navItems = [
    { label: 'Dashboard', path: '/student', exact: true },
    { label: 'My Courses', path: '/student/courses' },
    { label: 'My Tests', path: '/student/student-tests' },
    { label: 'Learn LiVE', path: '/student/learn-live' },
    { label: 'My Task', path: '/student/student-my-task' },
    { label: 'My Performance', path: '/student/my-performance' },
    { label: 'Purchase History', path: '/student/purchaseHistory' }
  ];

  return (
    <aside className={`main-sidebar ${isOpen ? 'sidebar-open' : ''}`} style={{ backgroundColor: '#ffffff', borderRight: '1px solid #edf2f7' }}>
      <section className="sidebar position-relative h-100 d-flex flex-column justify-content-between">
        <div className="multinav flex-grow-1">
          <div className="multinav-scroll" style={{ height: '100%', overflowY: 'auto' }}>
            <ul className="sidebar-menu pt-3">
              {navItems.map((item) => (
                <li key={item.path} className="mb-1">
                  <NavLink 
                    to={item.path} 
                    end={item.exact}
                    className={({ isActive }) => `d-flex align-items-center py-2 px-3 text-decoration-none transition-all ${
                      isActive ? 'active fw-bold text-dark bg-light' : 'text-secondary hover-bg-light'
                    }`}
                    style={({ isActive }) => ({
                      borderLeft: isActive ? '4px solid #f57105' : '4px solid transparent',
                      color: isActive ? '#181d1f' : '#64748b',
                      fontSize: '0.92rem'
                    })}
                  >
                    <DotGridIcon />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar Footer with Settings Gear icon */}
        <div className="sidebar-footer p-3 border-top bg-light d-flex align-items-center justify-content-start">
          <button 
            type="button" 
            className="btn btn-sm btn-light border p-1 rounded-2 text-danger d-flex align-items-center justify-content-center" 
            title="Settings"
            style={{ width: '32px', height: '32px', backgroundColor: '#fff' }}
          >
            <i className="fa-solid fa-gear fs-16 text-danger"></i>
          </button>
        </div>
      </section>
    </aside>
  );
}
