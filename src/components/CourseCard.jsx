import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function CourseCard({ course }) {
  const { addToCart, enrolledCourses } = useApp();
  const isEnrolled = enrolledCourses.includes(course._id || course.id);

  const imgSrc = course.img?.startsWith('http') 
    ? course.img 
    : (course.img ? `/${course.img}` : '/assets/upload/Aiapget 1.png');

  return (
    <div className="ayur-card d-flex flex-column" style={{ minHeight: '440px', height: '100%' }}>
      {/* Thumbnail */}
      <div className="position-relative overflow-hidden bg-light" style={{ height: '190px', width: '100%' }}>
        <img
          src={imgSrc}
          alt={course.name}
          style={{ height: '190px', width: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/upload/Aiapget 1.png';
          }}
        />
        <div className="position-absolute top-0 start-0 m-3">
          <span className="badge bg-warning text-dark fw-bold px-2 py-1">
            {course.categoryID?.name || course.category_name || 'Ayurveda'}
          </span>
        </div>
        {isEnrolled && (
          <div className="position-absolute top-0 end-0 m-3">
            <span className="badge bg-success text-white fw-bold px-2 py-1">
              <i className="fa-solid fa-check-circle me-1"></i> Enrolled
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2" style={{ fontSize: '0.85rem' }}>
            <div className="text-warning">
              <i className="fa-solid fa-star me-1"></i>
              <span className="fw-bold text-dark">{course.rating || '4.9'}</span>
              <span className="text-muted ms-1">(120+ reviews)</span>
            </div>
            <div className="text-muted">
              <i className="fa-solid fa-users me-1 text-primary"></i>
              {course.studentCount || '1,250'}+ Scholars
            </div>
          </div>

          <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1.15rem', minHeight: '2.4rem' }}>
            <Link to={`/courses/${course._id || course.id}`} className="text-dark text-decoration-none">
              {course.name}
            </Link>
          </h5>

          <p className="text-muted mb-3" style={{ fontSize: '0.9rem', lineHeight: '1.5', minHeight: '40px' }}>
            {course.detail?.length > 110 ? `${course.detail.slice(0, 110)}...` : course.detail}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-top d-flex align-items-center justify-content-between">
          <div>
            <span className="fw-bold text-dark" style={{ fontSize: '1.25rem' }}>
              ₹{course.discount_price ? course.discount_price.toLocaleString() : '8,499'}
            </span>
            {course.price && (
              <span className="text-muted text-decoration-line-through ms-2" style={{ fontSize: '0.85rem' }}>
                ₹{course.price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="d-flex gap-2">
            <Link to={`/courses/${course._id || course.id}`} className="btn btn-sm btn-outline-secondary">
              Details
            </Link>
            {isEnrolled ? (
              <Link to={`/courses/${course._id || course.id}`} className="btn btn-sm btn-success">
                <i className="fa-solid fa-book-open"></i> Learn
              </Link>
            ) : (
              <button 
                onClick={() => addToCart(course)}
                className="btn btn-sm btn-ayur"
                title="Add to shopping bag"
              >
                <i className="fa-solid fa-bag-shopping"></i> Bag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
