import AdminLiveClassesPage from './pages/admin/AdminLiveClassesPage';
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import Toast from './components/Toast';

// Public Experience & Auth Pages (V3 Warm Editorial)
import PublicHomePage from './pages/PublicHomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PaymentStatusPage from './pages/PaymentStatusPage';
import EnrollmentGate from './components/auth/EnrollmentGate';

// Admin System Pages (V3 Premium Management)
import AdminProtectedLayout from './components/admin/AdminProtectedLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminOnboardingPage from './pages/admin/AdminOnboardingPage';
import AdminAccessPage from './pages/admin/AdminAccessPage';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview';
import AdminStudentDirectory from './pages/admin/AdminStudentDirectory';
import AdminMembershipPlans from './pages/admin/AdminMembershipPlans';
import AdminPaymentSettings from './pages/admin/AdminPaymentSettings';
import AdminPaymentReconciliation from './pages/admin/AdminPaymentReconciliation';
import AdminPaymentGateway from './pages/admin/AdminPaymentGateway';
import AdminSupabaseDiagnostics from './pages/admin/AdminSupabaseDiagnostics';
import AdminReportsAndExports from './pages/admin/AdminReportsAndExports';
import AdminEmailCenter from './pages/admin/AdminEmailCenter';
import AdminGoogleLoginSettings from './pages/admin/AdminGoogleLoginSettings';

// Student Educational Pages
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseCategoryPage from './pages/CourseCategoryPage';
import SubjectModulesPage from './pages/SubjectModulesPage';
import ChapterLessonsPage from './pages/ChapterLessonsPage';
import LessonViewPage from './pages/LessonViewPage';
import StudentTestSeriesPage from './pages/StudentTestSeriesPage';
import StudentTestPapersPage from './pages/StudentTestPapersPage';
import ExamEnginePage from './pages/ExamEnginePage';
import TestResultPage from './pages/TestResultPage';
import PerformancePage from './pages/PerformancePage';
import BookmarksPage from './pages/BookmarksPage';
import MorePage from './pages/MorePage';
import StudentTasksPage from './pages/StudentTasksPage';
import LearnLivePage from './pages/LearnLivePage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentMembershipPage from './pages/StudentMembershipPage';
import SettingsPage from './pages/SettingsPage';
import CrumpledPaperBackground from './components/canvas/CrumpledPaperBackground';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <AppProvider>
          <HashRouter>
          <ScrollToTop />
          <CrumpledPaperBackground />
          <div className="app-viewport min-vh-100 d-flex flex-column" style={{ backgroundColor: 'transparent', position: 'relative', zIndex: 1 }}>
            <main className="flex-grow-1">
              <Routes>
                {/* ==========================================================
                    1. PUBLIC WEBSITE & AUTH EXPERIENCES (V3 WARM EDITORIAL)
                    ========================================================== */}
                <Route path="/" element={<PublicHomePage />} />
                <Route path="/pricing" element={<PublicHomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/payment-status" element={<PaymentStatusPage />} />
                <Route path="/register" element={<EnrollmentGate><RegisterPage /></EnrollmentGate>} />
                <Route path="/onboarding" element={<EnrollmentGate><OnboardingPage /></EnrollmentGate>} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* ==========================================================
                    2. PRIMARY STUDENT LEARNING PLATFORM (GATED & PROTECTED)
                    ========================================================== */}
                <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/learn" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                <Route path="/courses/:id" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                <Route path="/course/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
                <Route path="/course-category" element={<ProtectedRoute><CourseCategoryPage /></ProtectedRoute>} />
                <Route path="/subjects/:id" element={<ProtectedRoute><SubjectModulesPage /></ProtectedRoute>} />
                <Route path="/chapters/:id" element={<ProtectedRoute><ChapterLessonsPage /></ProtectedRoute>} />
                <Route path="/lesson/:id" element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>} />
                <Route path="/tests" element={<ProtectedRoute><StudentTestSeriesPage /></ProtectedRoute>} />
                <Route path="/tests/series/:id" element={<ProtectedRoute><StudentTestPapersPage /></ProtectedRoute>} />
                <Route path="/practice/:id" element={<Navigate to="/courses" replace />} />
                <Route path="/exam/:id" element={<ProtectedRoute><ExamEnginePage /></ProtectedRoute>} />
                <Route path="/exam/result" element={<ProtectedRoute><TestResultPage /></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
                <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><StudentTasksPage /></ProtectedRoute>} />
                <Route path="/learn-live" element={<ProtectedRoute><LearnLivePage /></ProtectedRoute>} />

                {/* Account & Membership (Accessible even when membership needs renewal) */}
                <Route path="/membership" element={<ProtectedRoute allowExpired={true}><StudentMembershipPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute allowExpired={true}><StudentProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowExpired={true}><SettingsPage /></ProtectedRoute>} />
                <Route path="/more" element={<ProtectedRoute><MorePage /></ProtectedRoute>} />

                {/* Safe compatibility redirects */}
                <Route path="/practice" element={<Navigate to="/courses" replace />} />
                <Route path="/practice-mode" element={<Navigate to="/courses" replace />} />
                <Route path="/notes" element={<Navigate to="/courses" replace />} />
                <Route path="/purchase-history" element={<Navigate to="/membership" replace />} />

                {/* ==========================================================
                    3. LEGACY ROUTE COMPATIBILITY ALIASES & REDIRECTS
                    Ensures all existing student bookmarks and deep-links work
                    ========================================================== */}
                <Route path="/student" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/student/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/student/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                <Route path="/student/courses/:id" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                <Route path="/student-courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                <Route path="/student/course-category" element={<ProtectedRoute><CourseCategoryPage /></ProtectedRoute>} />
                <Route path="/student/subject/:id" element={<ProtectedRoute><SubjectModulesPage /></ProtectedRoute>} />
                <Route path="/student/mysubject/:id" element={<ProtectedRoute><SubjectModulesPage /></ProtectedRoute>} />
                <Route path="/student/chapter/:id" element={<ProtectedRoute><ChapterLessonsPage /></ProtectedRoute>} />
                <Route path="/student/mychapter/:id" element={<ProtectedRoute><ChapterLessonsPage /></ProtectedRoute>} />
                <Route path="/student/chapter-details/:id" element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>} />
                <Route path="/student/chapter-details/:subId/:id" element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>} />
                <Route path="/student/chapter_details/:subId/:id" element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>} />
                <Route path="/student/chapter%20details/:subId/:id" element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>} />
                <Route path="/chapter-details/:id" element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>} />
                <Route path="/student/lesson/:id" element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>} />
                <Route path="/student/student-tests" element={<ProtectedRoute><StudentTestSeriesPage /></ProtectedRoute>} />
                <Route path="/student-tests" element={<ProtectedRoute><StudentTestSeriesPage /></ProtectedRoute>} />
                <Route path="/student/my-tests" element={<ProtectedRoute><StudentTestSeriesPage /></ProtectedRoute>} />
                <Route path="/student/student-tests-testpaper/:id" element={<ProtectedRoute><StudentTestPapersPage /></ProtectedRoute>} />
                <Route path="/student-tests-testpaper/:id" element={<ProtectedRoute><StudentTestPapersPage /></ProtectedRoute>} />
                <Route path="/student/my-tests/:id" element={<ProtectedRoute><StudentTestPapersPage /></ProtectedRoute>} />
                <Route path="/student/quiz-practice/:id" element={<Navigate to="/courses" replace />} />
                <Route path="/quiz-practice/:id" element={<Navigate to="/courses" replace />} />
                <Route path="/student/practice-mode" element={<Navigate to="/courses" replace />} />
                <Route path="/student/practice" element={<Navigate to="/courses" replace />} />
                <Route path="/student/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
                <Route path="/student/more" element={<ProtectedRoute><MorePage /></ProtectedRoute>} />
                <Route path="/student/exam-mode/:id" element={<ProtectedRoute><ExamEnginePage /></ProtectedRoute>} />
                <Route path="/exam-mode/:id" element={<ProtectedRoute><ExamEnginePage /></ProtectedRoute>} />
                <Route path="/student/quiz-result" element={<ProtectedRoute><TestResultPage /></ProtectedRoute>} />
                <Route path="/quiz-result" element={<ProtectedRoute><TestResultPage /></ProtectedRoute>} />
                <Route path="/student/my-performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
                <Route path="/my-performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
                <Route path="/student/purchaseHistory" element={<Navigate to="/membership" replace />} />
                <Route path="/student/membership" element={<Navigate to="/membership" replace />} />
                <Route path="/student/student-my-task" element={<ProtectedRoute><StudentTasksPage /></ProtectedRoute>} />
                <Route path="/student/learn-live" element={<ProtectedRoute><LearnLivePage /></ProtectedRoute>} />
                <Route path="/student/edit-student-profile" element={<ProtectedRoute allowExpired={true}><StudentProfilePage /></ProtectedRoute>} />
                <Route path="/student/settings" element={<ProtectedRoute allowExpired={true}><SettingsPage /></ProtectedRoute>} />
                <Route path="/student/notes" element={<Navigate to="/courses" replace />} />

                {/* ==========================================================
                    4. V3 PREMIUM ADMINISTRATION & FINANCIAL MANAGEMENT
                    Gated with role-based access control (Super, Admissions, Finance)
                    ========================================================== */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/onboarding" element={<AdminOnboardingPage />} />
                <Route path="/admin" element={<AdminProtectedLayout title="Executive Overview"><AdminDashboardOverview /></AdminProtectedLayout>} />
                <Route path="/admin/admins" element={<AdminProtectedLayout title="Administrator Access"><AdminAccessPage /></AdminProtectedLayout>} />
                <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
                <Route path="/admin/students" element={<AdminProtectedLayout title="Student Directory"><AdminStudentDirectory /></AdminProtectedLayout>} />
                <Route path="/admin/registered-students" element={<Navigate to="/admin/students" replace />} />
                <Route path="/admin/live-classes" element={<AdminProtectedLayout title="Live Classes & Updates"><AdminLiveClassesPage /></AdminProtectedLayout>} />
                <Route path="/admin/plans" element={<AdminProtectedLayout title="Membership Plans"><AdminMembershipPlans /></AdminProtectedLayout>} />
                <Route path="/admin/payments/gateway" element={<AdminProtectedLayout title="Razorpay Payment Gateway"><AdminPaymentGateway /></AdminProtectedLayout>} />
                <Route path="/admin/gateway" element={<Navigate to="/admin/payments/gateway" replace />} />
                <Route path="/admin/payments/reconciliation" element={<Navigate to="/admin/reports" replace />} />
                <Route path="/admin/payments/settings" element={<Navigate to="/admin/payments/gateway" replace />} />
                <Route path="/admin/integrations/bank-email" element={<Navigate to="/admin/payments/gateway" replace />} />
                <Route path="/admin/integrations/supabase" element={<Navigate to="/admin/reports" replace />} />
                <Route path="/admin/reports" element={<AdminProtectedLayout title="Institutional Reports & Ledger"><AdminReportsAndExports /></AdminProtectedLayout>} />
                <Route path="/admin/email" element={<AdminProtectedLayout title="Email Center (Hostinger SMTP)"><AdminEmailCenter /></AdminProtectedLayout>} />
                <Route path="/admin/email-center" element={<Navigate to="/admin/email" replace />} />
                <Route path="/admin/smtp" element={<Navigate to="/admin/email" replace />} />

                {/* Authentication & Google Login Settings */}
                <Route path="/admin/auth/google" element={<AdminProtectedLayout title="Google Login Settings"><AdminGoogleLoginSettings /></AdminProtectedLayout>} />
                <Route path="/admin/auth" element={<Navigate to="/admin/auth/google" replace />} />
                <Route path="/admin/settings/auth" element={<Navigate to="/admin/auth/google" replace />} />
                <Route path="/admin/google-login" element={<Navigate to="/admin/auth/google" replace />} />

                {/* Fallback to Public Homepage */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Toast />
          </div>
        </HashRouter>
      </AppProvider>
    </AdminAuthProvider>
  </AuthProvider>
);
}
