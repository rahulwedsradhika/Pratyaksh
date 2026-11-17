import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function StudentCourseCard({ course }) {
  const imgSrc = course.img?.startsWith('http') 
    ? course.img 
    : (course.img ? `/${course.img}` : '/upload/1777645147681_28.png');

  const courseId = course._id || course.id;

  return (
    <div className="editorial-card h-100 d-flex flex-column justify-content-between">
      {/* Course Banner Artwork */}
      <div 
        style={{ 
          width: '100%', 
          aspectRatio: '16/9', 
          overflow: 'hidden', 
          backgroundColor: 'var(--bg-subtle)',
          position: 'relative'
        }}
      >
        <img
          src={imgSrc}
          alt={course.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/upload/1777645147681_28.png';
          }}
        />
        {course.categoryID?.name && (
          <span 
            className="editorial-badge" 
            style={{ 
              position: 'absolute', 
              top: '0.65rem', 
              left: '0.65rem', 
              backgroundColor: 'var(--bg-surface)', 
              boxShadow: 'var(--shadow-xs)' 
            }}
          >
            {course.categoryID.name}
          </span>
        )}
      </div>

      {/* Course Info */}
      <div className="p-3 p-md-4 d-flex flex-column justify-content-between flex-grow-1">
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.35 }}>
            {course.name}
          </h3>
          <p 
            style={{ 
              fontSize: '0.84rem', 
              color: 'var(--text-secondary)', 
              marginBottom: '1.25rem', 
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {course.detail || 'Authentic curriculum with high-yield recorded lectures and structured tests.'}
          </p>
        </div>

        {/* View Subjects Button */}
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <Link 
            to={`/subjects/${courseId}`}
            className="editorial-btn editorial-btn-secondary w-100"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
          >
            <span>Explore Subjects</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
