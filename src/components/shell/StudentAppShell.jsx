import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNavigation from './MobileBottomNavigation';
import MoreSheet from './MoreSheet';

export default function StudentAppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ayur_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const closeMoreSheet = useCallback(() => setMoreSheetOpen(false), []);
  const toggleMoreSheet = useCallback(() => setMoreSheetOpen(value => !value), []);
  const location = useLocation();

  // Close more sheet on route change
  useEffect(() => {
    setMoreSheetOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ayur_sidebar_collapsed', String(next));
      } catch (e) {
        console.warn('Could not save sidebar preference:', e);
      }
      return next;
    });
  };

  return (
    <div 
      className="app-shell-root" 
      data-sidebar={sidebarCollapsed ? 'collapsed' : 'expanded'}
    >
      {/* 1. Fixed Header (Brand Logo, Global Search, Theme Switcher, Profile) */}
      <AppHeader />

      {/* 2. Main Body: Flex Sibling Container */}
      <div className="app-shell-body">
        {/* Desktop & Tablet Sidebar with Bottom-Mounted Collapse Control */}
        <DesktopSidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebar} 
        />

        {/* Main Content Area */}
        <main className="app-shell-main">
          {children}
        </main>
      </div>

      {/* 3. Mobile Fixed Bottom Navigation (5 Items) */}
      <MobileBottomNavigation
        isMoreOpen={moreSheetOpen}
        onOpenMore={toggleMoreSheet}
      />

      {/* 4. Mobile More Drawer Sheet */}
      <MoreSheet
        isOpen={moreSheetOpen}
        onClose={closeMoreSheet}
      />
    </div>
  );
}
