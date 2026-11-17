import React from 'react';

export default function StudentFooter() {
  return (
    <footer className="main-footer bg-white border-top p-3 text-center text-md-start">
      <div className="pull-right d-none d-sm-inline-block float-end">
        <ul className="nav nav-primary nav-dotted nav-dot-separated justify-content-center justify-content-md-end mb-0">
          <li className="nav-item">
            <a className="nav-link text-muted small" href="#faq" onClick={(e) => e.preventDefault()}>FAQ</a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-muted small" href="#help" onClick={(e) => e.preventDefault()}>Help</a>
          </li>
        </ul>
      </div>
      <span className="text-muted small">
        &copy; 2024 <a href="http://pratyakshayurveda.in" target="_blank" rel="noreferrer" className="text-dark fw-bold text-decoration-none">Pratyaksh Ayurveda</a>. All Rights Reserved. Powered by <a href="https://sarthaktech.in" target="_blank" rel="noreferrer" className="text-muted text-decoration-none">Sarthak Tech</a>.
      </span>
    </footer>
  );
}

