import React from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const bgClass = toast.type === 'error' ? 'bg-danger' : (toast.type === 'info' ? 'bg-info text-dark' : 'bg-success');

  return (
    <div 
      className="position-fixed bottom-0 start-50 translate-middle-x mb-4 p-3 z-3"
      style={{ minWidth: '320px', zIndex: 9999 }}
    >
      <div className={`toast show align-items-center text-white ${bgClass} border-0 shadow-lg`}>
        <div className="d-flex">
          <div className="toast-body fw-semibold d-flex align-items-center gap-2">
            <i className={`fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
            {toast.message}
          </div>
        </div>
      </div>
    </div>
  );
}

