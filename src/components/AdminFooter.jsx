import React from 'react';

export default function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer bg-white border-top p-3 text-center text-md-start">
      <div className="pull-right d-none d-sm-inline-block float-end">
        <ul className="nav nav-primary nav-dotted nav-dot-separated justify-content-center justify-content-md-end mb-0">
          <li className="nav-item">
            <a className="nav-link text-muted small" href="#/admin/faq">FAQ</a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-muted small" href="#/admin/enquiry">Support</a>
          </li>
        </ul>
      </div>
      <span className="text-muted small">
        &copy; {currentYear} <a href="http://pratyakshayurveda.in" target="_blank" rel="noreferrer" className="text-dark fw-bold text-decoration-none">PRATYAKSH AYURVEDA SOLUTIONS PRIVATE LIMITED</a>. All Rights Reserved. || Design &amp; Developed by <a href="https://sarthaktech.in" target="_blank" rel="noreferrer" className="text-muted text-decoration-none">Sarthak Tech</a>.
      </span>
    </footer>
  );
}

