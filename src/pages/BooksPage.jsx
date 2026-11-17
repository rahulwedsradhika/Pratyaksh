import React from 'react';
import { Link } from 'react-router-dom';

export default function BooksPage() {
  const books = [
    {
      id: 'bk_1',
      title: 'Charaka Samhita with Chakrapani Teeka (Annotated)',
      author: 'Aacharya Charaka / Commentary by Chakrapanidatta',
      edition: 'Pratyaksh Study Edition',
      category: 'Samhita Classics',
      description: 'The definitive edition with operative word highlighting, tricky verse explanations, and high-yield question cross-references.',
      pages: '1,420 pages',
      icon: 'fa-book-open'
    },
    {
      id: 'bk_2',
      title: 'Sushruta Samhita - Surgical & Marma Compendium',
      author: 'Maharshi Sushruta / Dalhana Nibandha Sangraha',
      edition: 'Pratyaksh Study Edition',
      category: 'Surgical Science',
      description: 'Full coverage of Shareera Sthana Marmas, Shalya Vidhi instruments, and Uttaratantra pediatric & ophthalmic disorders.',
      pages: '1,180 pages',
      icon: 'fa-book-medical'
    },
    {
      id: 'bk_3',
      title: 'AIAPGET Master Formula & Mnemonics Handbook',
      author: 'Pratyaksh Ayurveda Senior Faculty Team',
      edition: '2026 Revised Edition',
      category: 'Exam Revision',
      description: 'Pocket guide containing comparative tables for Rasa-Guna-Virya-Vipaka, Dhatwagnipaka, Agadas, and mineral preparations.',
      pages: '380 pages',
      icon: 'fa-bookmark'
    },
    {
      id: 'bk_4',
      title: 'Rasashastra & Bhaishajya Kalpana Practical Guide',
      author: 'Faculty of Rasa Shastra',
      edition: 'Standard Edition',
      category: 'Pharmaceuticals',
      description: 'Step-by-step procedures for Shodhana, Marana, Bhasma Parikshas, and Panchavidha Kashaya Kalpana formulations.',
      pages: '560 pages',
      icon: 'fa-mortar-pestle'
    }
  ];

  return (
    <div className="books-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Recommended Books</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Samhita Literature</span>
          <h2 className="fw-bold text-dark">Recommended Books &amp; Study Materials</h2>
          <p className="text-muted">Curated classical texts, commentaries, and revision manuals recommended by our faculty for AIAPGET and university exams.</p>
        </div>

        <div className="row g-4">
          {books.map(b => (
            <div key={b.id} className="col-lg-6">
              <div className="ayur-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge bg-light text-warning border fw-bold text-uppercase">
                      {b.category}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                      <i className="fa-solid fa-file-lines me-1"></i> {b.pages}
                    </span>
                  </div>

                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="btn btn-warning rounded-circle p-3 text-dark d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                      <i className={`fa-solid ${b.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark mb-1">{b.title}</h4>
                      <small className="text-muted d-block">By {b.author} • {b.edition}</small>
                    </div>
                  </div>

                  <p className="text-muted mb-4" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {b.description}
                  </p>
                </div>

                <div className="d-flex gap-2 pt-3 border-top">
                  <Link to="/courses" className="btn btn-ayur flex-grow-1 fw-bold">
                    Access Digital Notes in Course <i className="fa-solid fa-arrow-right ms-2"></i>
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

