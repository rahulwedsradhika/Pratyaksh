import React, { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function EnrollmentGate({ children }) {
  const { user, studentState, loading } = useAuth();
  // A new checkout may verify identity and pay within this visit. Returning
  // unpaid accounts must use payment recovery rather than register again.
  const returningAccount = useRef(Boolean(localStorage.getItem('ayur_auth_token')));
  if (!loading && returningAccount.current && user && studentState === 'awaiting_payment') {
    return <Navigate to="/payment-status" replace />;
  }
  return children;
}
