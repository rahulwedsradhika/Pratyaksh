import React from 'react';
import { Link } from 'react-router-dom';

export default function ResultsPage() {
  const toppers = [
    { name: 'Dr. Smita Pandey', exam: 'AIAPGET 2022', rank: 'AIR 4', quote: 'Pratyaksh Ayurveda conceptual Samhita classes transformed my preparation. The unique teaching of verse-by-verse understanding gave me complete clarity and confidence.', img: '/assets/website-assets/img/faculty/std1.jpg' },
    { name: 'Dr. Vivek Tiwari', exam: 'AIAPGET 2021', rank: 'AIR 7', quote: 'Dr. Rahul and the entire faculty team guide like personal mentors. If you truly wish to master Ayurveda Samhitas with modern clinical correlation, this is the destination.', img: '/assets/website-assets/img/faculty/std4.jpg' },
    { name: 'Dr. Suraj Kumar Sahu', exam: 'AIAPGET 2022', rank: 'AIR 11', quote: 'The Pragya Vitarka test series framing matched the exact NTA AIAPGET paper standard. The negative marking control and timer simulation were instrumental in my rank.', img: '/assets/website-assets/img/faculty/std3.jpg' },
    { name: 'Dr. Shatabdee Pati', exam: 'AIAPGET 2021', rank: 'AIR 14', quote: 'From Charaka Sutra to Sushruta Uttaratantra, every tricky question became second nature. The detailed explanatory answer keys helped rectify all misconceptions.', img: '/assets/website-assets/img/faculty/std5.jpg' },
    { name: 'Dr. Pooja Dadhich', exam: 'AIAPGET 2022', rank: 'AIR 22', quote: 'The daily revision modules and subject-wise MCQ practice helped me score 360+ marks in AIAPGET. Pratyaksh Ayurveda made my PG dream a reality.', img: '/assets/website-assets/img/faculty/std6.jpg' },
    { name: 'Dr. Krishna Bihari Rajput', exam: 'AIAPGET 2020', rank: 'AIR 29', quote: 'Consistent quality tests and deep commentary insights allowed me to solve even the most controversial Samhita questions with ease.', img: '/assets/website-assets/img/faculty/std7.jpg' },
    { name: 'Dr. Pankaj Kumar', exam: 'AIAPGET 2022', rank: 'AIR 34', quote: 'The dedication of the mentors is unmatched. They do not just teach you what is written in texts; they teach you how an examiner thinks.', img: '/assets/website-assets/img/faculty/std8.jpg' },
    { name: 'Dr. Swati Gupta', exam: 'AIAPGET 2020', rank: 'AIR 45', quote: 'The best online coaching for Ayurveda aspirants in India. Structured, disciplined, and clinically oriented.', img: '/assets/website-assets/img/faculty/std1.jpg' }
  ];

  return (
    <div className="results-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Results &amp; Hall of Fame</li>
          </ol>
        </nav>

        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-warning text-dark px-3 py-2 mb-2">Hall of Fame</span>
          <h2 className="fw-bold text-dark">Proven Track Record of All India Ranks</h2>
          <p className="text-muted">
            Our scholars have consistently captured top single and double-digit ranks in AIAPGET, UPSC AMO, and state medical officer examinations.
          </p>
          <a 
            href="https://portal.pratyakshayurveda.in/upload/RESULTS%20-%20AIAPGET%202025%20%283%29_compressed.pdf"
            target="_blank" 
            rel="noreferrer"
            className="btn btn-outline-warning text-dark fw-bold btn-sm px-3 py-2 mt-2"
          >
            <i className="fa-solid fa-file-pdf text-danger me-2"></i> Download Official AIAPGET Results PDF
          </a>
        </div>

        <div className="row g-4">
          {toppers.map((t, idx) => (
            <div key={idx} className="col-lg-3 col-md-6">
              <div className="ayur-card p-4 h-100 text-center d-flex flex-column align-items-center">
                <div className="position-relative mb-3">
                  <img 
                    src={t.img} 
                    alt={t.name}
                    className="rounded-circle shadow border border-3 border-warning"
                    style={{ width: '110px', height: '110px', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/assets/website-assets/img/icon/icons8-male-user-96.png'; }}
                  />
                  <span className="position-absolute bottom-0 start-50 translate-middle-x badge bg-success fw-bold px-2 py-1 shadow-sm">
                    {t.rank}
                  </span>
                </div>

                <h5 className="fw-bold text-dark mb-1">{t.name}</h5>
                <span className="badge bg-light text-warning border fw-bold mb-3">
                  {t.exam}
                </span>

                <p className="text-muted flex-grow-1" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                  "{t.quote}"
                </p>

                <div className="text-warning mt-auto pt-2">
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

