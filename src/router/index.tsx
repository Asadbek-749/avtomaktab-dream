import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { LoginPage } from '../pages/Login/LoginPage';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { GroupsPage } from '../pages/admin/Groups/GroupsPage';
import { GroupDetailsPage } from '../pages/admin/Groups/GroupDetailsPage';
import { PaymentsPage } from '../pages/admin/Payments/PaymentsPage';
import { SchedulePage } from '../pages/admin/Schedule/SchedulePage';
import { SuperDashboard } from '../pages/superadmin/Dashboard';
import { AdminsPage } from '../pages/superadmin/AdminsPage';
import { BranchesPage } from '../pages/superadmin/BranchesPage';
import { BranchDetailsPage } from '../pages/superadmin/BranchDetailsPage';
import { FinancePage } from '../pages/superadmin/FinancePage';
import { AnalyticsPage } from '../pages/superadmin/AnalyticsPage';
import { AttendanceReportsPage } from '../pages/admin/Reports/AttendanceReportsPage';

import { DocumentsPage } from '../pages/admin/Documents/DocumentsPage';
import { ArchivePage } from '../pages/admin/Archive/ArchivePage';
import { MonthlyArchivePage } from '../pages/admin/Archive/MonthlyArchivePage';

import { TeacherDashboard } from '../pages/teacher/Dashboard';
import { MyGroups } from '../pages/teacher/MyGroups';
import { MySchedule } from '../pages/teacher/MySchedule';

import { InstructorsPage } from '../pages/admin/InstructorsPage';
import { InstructorProfilePage } from '../pages/admin/Instructors/InstructorProfilePage';
import { PracticeGroupProfilePage } from '../pages/admin/PracticeGroups/PracticeGroupProfilePage';

import { InstructorDashboard } from '../pages/instructor/InstructorDashboard';
import { InstructorStudents } from '../pages/instructor/InstructorStudents';
import { InstructorLessons } from '../pages/instructor/InstructorLessons';

// Protected Route wrapper that checks role
const RoleRoute = ({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) => {
  const user = useAuthStore(state => state.user);
  
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;
  
  return <>{children}</>;
};

// Placeholder components for pages we haven't built yet
const DashboardPlaceholder = ({ role }: { role: string }) => (
  <div className="p-6 bg-bg-card rounded-xl border border-border">
    <h2 className="text-xl font-semibold capitalize">{role} Dashboard - Tez kunda</h2>
  </div>
);

export const AppRouter = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} replace /> : <LoginPage />
      } />
      
      <Route path="/" element={<Layout />}>
        {/* Default redirect based on role */}
        <Route index element={
          isAuthenticated 
            ? <Navigate to={`/${user?.role}/dashboard`} replace /> 
            : <Navigate to="/login" replace />
        } />
        
        {/* Superadmin Routes */}
        <Route path="superadmin">
          <Route path="dashboard" element={<RoleRoute allowedRoles={['superadmin']}><SuperDashboard /></RoleRoute>} />
          <Route path="branches" element={<RoleRoute allowedRoles={['superadmin']}><BranchesPage /></RoleRoute>} />
          <Route path="branches/:id" element={<RoleRoute allowedRoles={['superadmin']}><BranchDetailsPage /></RoleRoute>} />
          <Route path="admins" element={<RoleRoute allowedRoles={['superadmin']}><AdminsPage /></RoleRoute>} />
          <Route path="documents" element={<RoleRoute allowedRoles={['superadmin']}><DocumentsPage /></RoleRoute>} />
          <Route path="archive" element={<RoleRoute allowedRoles={['superadmin']}><ArchivePage /></RoleRoute>} />
          <Route path="archive/:monthId" element={<RoleRoute allowedRoles={['superadmin']}><MonthlyArchivePage /></RoleRoute>} />
          <Route path="analytics" element={<RoleRoute allowedRoles={['superadmin']}><AnalyticsPage /></RoleRoute>} />
          <Route path="expenses" element={<Navigate to="/superadmin/dashboard?tab=expense" replace />} />
          <Route path="finance" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="reports" element={<RoleRoute allowedRoles={['superadmin']}><AttendanceReportsPage /></RoleRoute>} />
          <Route path="instructors" element={<RoleRoute allowedRoles={['superadmin']}><InstructorsPage /></RoleRoute>} />
          <Route path="instructors/:id" element={<RoleRoute allowedRoles={['superadmin']}><InstructorProfilePage /></RoleRoute>} />
          <Route path="practice-groups/:id" element={<RoleRoute allowedRoles={['superadmin', 'admin']}><PracticeGroupProfilePage /></RoleRoute>} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="admin">
          <Route path="dashboard" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />
          <Route path="groups" element={<RoleRoute allowedRoles={['admin']}><GroupsPage /></RoleRoute>} />
          <Route path="groups/:id" element={<RoleRoute allowedRoles={['admin']}><GroupDetailsPage /></RoleRoute>} />
          <Route path="finance" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="payments" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="documents" element={<RoleRoute allowedRoles={['admin', 'superadmin']}><DocumentsPage /></RoleRoute>} />
          <Route path="archive" element={<RoleRoute allowedRoles={['admin']}><ArchivePage /></RoleRoute>} />
          <Route path="archive/:monthId" element={<RoleRoute allowedRoles={['admin']}><MonthlyArchivePage /></RoleRoute>} />
          <Route path="schedule" element={<RoleRoute allowedRoles={['admin']}><SchedulePage /></RoleRoute>} />
          <Route path="expenses" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="reports" element={<RoleRoute allowedRoles={['admin']}><AttendanceReportsPage /></RoleRoute>} />
          <Route path="instructors" element={<RoleRoute allowedRoles={['admin']}><InstructorsPage /></RoleRoute>} />
          <Route path="instructors/:id" element={<RoleRoute allowedRoles={['admin']}><InstructorProfilePage /></RoleRoute>} />
          <Route path="practice-groups/:id" element={<RoleRoute allowedRoles={['superadmin', 'admin']}><PracticeGroupProfilePage /></RoleRoute>} />
        </Route>
        
        {/* Teacher Routes */}
        <Route path="teacher">
          <Route path="dashboard" element={<RoleRoute allowedRoles={['teacher']}><TeacherDashboard /></RoleRoute>} />
          <Route path="groups" element={<RoleRoute allowedRoles={['teacher']}><MyGroups /></RoleRoute>} />
          <Route path="schedule" element={<RoleRoute allowedRoles={['teacher']}><MySchedule /></RoleRoute>} />
        </Route>

        {/* Instructor Routes */}
        <Route path="instructor">
          <Route path="dashboard" element={<RoleRoute allowedRoles={['instructor']}><InstructorDashboard /></RoleRoute>} />
          <Route path="students" element={<RoleRoute allowedRoles={['instructor']}><InstructorStudents /></RoleRoute>} />
          <Route path="lessons" element={<RoleRoute allowedRoles={['instructor']}><InstructorLessons /></RoleRoute>} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
