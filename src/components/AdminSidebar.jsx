import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function AdminSidebar({ isOpen }) {
  const location = useLocation();

  // State for collapsible treeview groups
  const [openGroups, setOpenGroups] = useState({
    courses: false,
    subject: false,
    chapterBank: false,
    questionBank: false,
    liveClasses: false,
    tests: false,
    notification: false,
    webCms: false
  });

  // Automatically expand parent group when active route changes
  useEffect(() => {
    const path = location.pathname;
    setOpenGroups(prev => ({
      ...prev,
      courses: prev.courses || path.includes('category') || path.includes('course'),
      subject: prev.subject || path.includes('subject'),
      chapterBank: prev.chapterBank || path.includes('chapter'),
      questionBank: prev.questionBank || path.includes('question'),
      liveClasses: prev.liveClasses || path.includes('live-class') || path.includes('classes-topic'),
      tests: prev.tests || path.includes('test'),
      notification: prev.notification || path.includes('enquiry') || path.includes('report'),
      webCms: prev.webCms || path.includes('cms') || path.includes('faq') || path.includes('testimonial')
    }));
  }, [location.pathname]);

  const toggleGroup = (groupKey) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  return (
    <aside className={`main-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <section className="sidebar position-relative h-100 d-flex flex-column justify-content-between">
        <div className="multinav flex-grow-1">
          <div className="multinav-scroll" style={{ height: '100%', overflowY: 'auto' }}>
            <ul className="sidebar-menu">
              
              {/* 1. Dashboard */}
              <li>
                <NavLink 
                  to="/admin" 
                  end 
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  <i className="fa-solid fa-table-cells-large"></i>
                  <span>Dashboard</span>
                </NavLink>
              </li>

              {/* 2. Courses (Treeview) */}
              <li className={`treeview ${openGroups.courses ? 'menu-open' : ''}`}>
                <a 
                  href="#courses" 
                  onClick={(e) => { e.preventDefault(); toggleGroup('courses'); }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className="fa-solid fa-graduation-cap"></i>
                    <span>Courses</span>
                  </div>
                  <i className={`fa-solid fa-angle-right transition-transform ${openGroups.courses ? 'rotate-90' : ''}`} style={{ transform: openGroups.courses ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}></i>
                </a>
                {openGroups.courses && (
                  <ul className="treeview-menu">
                    <li>
                      <NavLink to="/admin/add-category" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Add Category</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/add-course" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Add Course</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-course" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Course</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>

              {/* 3. Subject (Treeview) */}
              <li className={`treeview ${openGroups.subject ? 'menu-open' : ''}`}>
                <a 
                  href="#subject" 
                  onClick={(e) => { e.preventDefault(); toggleGroup('subject'); }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className="fa-solid fa-book-bookmark"></i>
                    <span>Subject</span>
                  </div>
                  <i className={`fa-solid fa-angle-right transition-transform`} style={{ transform: openGroups.subject ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}></i>
                </a>
                {openGroups.subject && (
                  <ul className="treeview-menu">
                    <li>
                      <NavLink to="/admin/add-subject" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Add Subject</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-subject" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Subject</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/add-sub-subject" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Add Sub Subject</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-sub-subject" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Sub Subject</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>

              {/* 4. Chapter Bank (Treeview) */}
              <li className={`treeview ${openGroups.chapterBank ? 'menu-open' : ''}`}>
                <a 
                  href="#chapters" 
                  onClick={(e) => { e.preventDefault(); toggleGroup('chapterBank'); }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className="fa-solid fa-layer-group"></i>
                    <span>Chapter Bank</span>
                  </div>
                  <i className="fa-solid fa-angle-right" style={{ transform: openGroups.chapterBank ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}></i>
                </a>
                {openGroups.chapterBank && (
                  <ul className="treeview-menu">
                    <li>
                      <NavLink to="/admin/create-chapter" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Create Chapter</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-chapter-bank" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Chapter Bank</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/add-chapter" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Add Chapter</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>

              {/* 5. Question Bank (Treeview) */}
              <li className={`treeview ${openGroups.questionBank ? 'menu-open' : ''}`}>
                <a 
                  href="#questions" 
                  onClick={(e) => { e.preventDefault(); toggleGroup('questionBank'); }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className="fa-solid fa-circle-question"></i>
                    <span>Question Bank</span>
                  </div>
                  <i className="fa-solid fa-angle-right" style={{ transform: openGroups.questionBank ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}></i>
                </a>
                {openGroups.questionBank && (
                  <ul className="treeview-menu">
                    <li>
                      <NavLink to="/admin/question-bank" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Add Question</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-question-bank" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Question</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>

              {/* 6. Live Classes (Treeview) */}
              <li className={`treeview ${openGroups.liveClasses ? 'menu-open' : ''}`}>
                <a 
                  href="#live" 
                  onClick={(e) => { e.preventDefault(); toggleGroup('liveClasses'); }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className="fa-solid fa-video"></i>
                    <span>Live Classes</span>
                  </div>
                  <i className="fa-solid fa-angle-right" style={{ transform: openGroups.liveClasses ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}></i>
                </a>
                {openGroups.liveClasses && (
                  <ul className="treeview-menu">
                    <li>
                      <NavLink to="/admin/add-live-class" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Create Live Class</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-live-class" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Live Class</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/classes-topic" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Create Topic</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-classes-topic" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Classes Topic</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>

              {/* 7. Tests (Treeview) */}
              <li className={`treeview ${openGroups.tests ? 'menu-open' : ''}`}>
                <a 
                  href="#tests" 
                  onClick={(e) => { e.preventDefault(); toggleGroup('tests'); }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className="fa-solid fa-pen-to-square"></i>
                    <span>Tests</span>
                  </div>
                  <i className="fa-solid fa-angle-right" style={{ transform: openGroups.tests ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}></i>
                </a>
                {openGroups.tests && (
                  <ul className="treeview-menu">
                    <li>
                      <NavLink to="/admin/practice-test-paper" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Create Test Paper</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-practice-test-paper" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Test Paper</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/test-series" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Create Test Series</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/view-test-series" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>View Test Series</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>

              {/* 8. Registered Students */}
              <li>
                <NavLink to="/admin/registered-student" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <i className="fa-solid fa-user-graduate"></i>
                  <span>Registered Students</span>
                </NavLink>
              </li>

              {/* 9. Course Map */}
              <li>
                <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <i className="fa-solid fa-sitemap"></i>
                  <span>Course Map</span>
                </NavLink>
              </li>

              {/* 10. Faculty */}
              <li>
                <NavLink to="/admin/facultycms" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <i className="fa-solid fa-chalkboard-user"></i>
                  <span>Faculty</span>
                </NavLink>
              </li>

              {/* 11. Set Discount */}
              <li>
                <NavLink to="/admin/set-discount" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <i className="fa-solid fa-tags"></i>
                  <span>Set Discount</span>
                </NavLink>
              </li>

              {/* 12. My Performance */}
              <li>
                <NavLink to="/admin/my-performance-config" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <i className="fa-solid fa-chart-line"></i>
                  <span>My Performance</span>
                </NavLink>
              </li>

              {/* 13. Student Performance */}
              <li>
                <NavLink to="/admin/student-performance" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <i className="fa-solid fa-chart-pie"></i>
                  <span>Student Performance</span>
                </NavLink>
              </li>

              {/* 14. Notification (Treeview) */}
              <li className={`treeview ${openGroups.notification ? 'menu-open' : ''}`}>
                <a 
                  href="#notification" 
                  onClick={(e) => { e.preventDefault(); toggleGroup('notification'); }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className="fa-regular fa-bell"></i>
                    <span>Notification</span>
                  </div>
                  <i className="fa-solid fa-angle-right" style={{ transform: openGroups.notification ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}></i>
                </a>
                {openGroups.notification && (
                  <ul className="treeview-menu">
                    <li>
                      <NavLink to="/admin/enquiry" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Enquiry</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/question-report" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Question Reports</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>

              {/* 15. Web CMS (Treeview) */}
              <li className={`treeview ${openGroups.webCms ? 'menu-open' : ''}`}>
                <a 
                  href="#cms" 
                  onClick={(e) => { e.preventDefault(); toggleGroup('webCms'); }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <i className="fa-solid fa-newspaper"></i>
                    <span>Web CMS</span>
                  </div>
                  <i className="fa-solid fa-angle-right" style={{ transform: openGroups.webCms ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}></i>
                </a>
                {openGroups.webCms && (
                  <ul className="treeview-menu">
                    <li>
                      <NavLink to="/admin/prfessional-students" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Student Testimonial</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/cms-about" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>About</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/cms-vision" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>Vision</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/faq" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <i className="fa-regular fa-circle fs-10"></i>
                        <span>FAQ</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar Footer with Settings icon */}
        <div className="sidebar-footer d-flex align-items-center justify-content-start">
          <a 
            href="#settings" 
            className="link text-danger text-decoration-none d-flex align-items-center gap-2" 
            title="Settings" 
            onClick={(e) => e.preventDefault()}
          >
            <i className="fa-solid fa-gear fs-20 text-danger"></i>
            <span className="small text-muted fw-semibold">Settings</span>
          </a>
        </div>
      </section>
    </aside>
  );
}

