import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminFooter from './AdminFooter';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`wrapper theme-primary ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <AdminHeader onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <AdminSidebar isOpen={sidebarOpen} />
      <div className="content-wrapper">
        <div className="container-full">
          <section className="content p-4">
            {children}
          </section>
        </div>
      </div>
      <AdminFooter />
    </div>
  );
}

