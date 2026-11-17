import React from 'react';
import { Link } from 'react-router-dom';

export default function ResearchesPage() {
  const papers = [
    {
      id: 1,
      title: 'Evidence-Based Clinical Efficacy of Rasayana Dravyas in Neuro-Cognitive Enhancement',
      journal: 'International Journal of Ayurvedic & Clinical Research',
      year: '2025',
      author: 'Faculty of Samhita & Siddhant, Pratyaksh Ayurveda',
      abstract: 'A systematic review and meta-analysis of Medhya Rasayana formulations (Mandukaparni, Shankhapushpi, Guduchi, Yashtimadhu) in age-related cognitive decline and academic memory optimization.'
    },
    {
      id: 2,
      title: 'Standardization and Physicochemical Profiling of Swarna Bhasma in Classical Therapeutics',
      journal: 'Journal of Research in Ayurvedic Sciences',
      year: '2024',
      author: 'Department of Rasashastra & Bhaishajya Kalpana',
      abstract: 'Investigating particle size distribution, FTIR, XRD, and SEM-EDX elemental validation of classical putapaka Swarna Bhasma conforming to classical Bhasma Parikshas.'
    },
    {
      id: 3,
      title: 'Correlation of Tridosha Prakriti Phenotyping with Metabolic Biomarkers',
      journal: 'Ayurveda Integrative Health Journal',
      year: '2024',
      author: 'Clinical Research Division',
      abstract: 'Clinical evaluation of 500 volunteers exploring phenotypic correlations between Prakriti diagnostics and lipid profiles, fasting glucose, and BMI indices.'
    }
  ];

  return (
    <div className="researches-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Researches &amp; Publications</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Scientific Validation</span>
          <h2 className="fw-bold text-dark">Research &amp; Publications</h2>
          <p className="text-muted">Advancing clinical proof and modern pharmacological validation of classical Ayurvedic therapies.</p>
        </div>

        <div className="row g-4">
          {papers.map(p => (
            <div key={p.id} className="col-lg-12">
              <div className="ayur-card p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge bg-warning text-dark fw-bold">Published: {p.year}</span>
                  <span className="text-muted fst-italic" style={{ fontSize: '0.85rem' }}>{p.journal}</span>
                </div>
                <h4 className="fw-bold text-dark mb-2">{p.title}</h4>
                <div className="text-warning fw-semibold mb-3" style={{ fontSize: '0.9rem' }}>By {p.author}</div>
                <p className="text-muted mb-4" style={{ lineHeight: '1.7', fontSize: '0.95rem' }}>{p.abstract}</p>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-dark" onClick={() => alert('Research paper accessible under library catalog.')}>
                    <i className="fa-solid fa-file-pdf text-danger me-1"></i> Read Full Paper
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

