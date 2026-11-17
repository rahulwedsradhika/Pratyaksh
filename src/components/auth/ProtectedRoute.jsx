import React from 'react';
import StudentStateGuard from './StudentStateGuard';

export default function ProtectedRoute({ children, allowExpired = false }) {
  return (
    <StudentStateGuard allowExpired={allowExpired}>
      {children}
    </StudentStateGuard>
  );
}
