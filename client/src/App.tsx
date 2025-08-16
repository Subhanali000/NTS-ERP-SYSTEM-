import React, { useState, useEffect } from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DirectorDashboard from './pages/DirectorDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamLeadDashboard from './pages/TeamLeadDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import IndividualProgress from './pages/IndividualProgress';
import ManagerLeaveApprovals from './pages/ManagerLeaveApprovals';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Projects from './pages/Projects';
import ProgressReports from './pages/ProgressReports';
import DailyProgress from './pages/DailyProgress';
import TeamProgress from './pages/TeamProgress';
import { clearCurrentUser } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing authentication on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const currentUser = localStorage.getItem('currentUser');
    if (authStatus === 'true' && currentUser) {
      setIsAuthenticated(true);
    }
  }, []);

  // Function to handle login
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    clearCurrentUser(); // Clear user data
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        {isAuthenticated ? (
          <>
            {/* Role-specific dashboard routes */}
            <Route path="/dashboard/director" element={<Layout onLogout={handleLogout}><DirectorDashboard /></Layout>} />
            <Route path="/dashboard/manager" element={<Layout onLogout={handleLogout}><ManagerDashboard /></Layout>} />
            <Route path="/dashboard/team-lead" element={<Layout onLogout={handleLogout}><TeamLeadDashboard /></Layout>} />
            <Route path="/dashboard/employee" element={<Layout onLogout={handleLogout}><EmployeeDashboard /></Layout>} />
            
            {/* Main layout with nested routes */}
            <Route path="/" element={<Layout onLogout={handleLogout} />}>
              <Route index element={<Dashboard />} />
              <Route path="individual-progress" element={<IndividualProgress />} />
              <Route path="manager-leave-approvals" element={<ManagerLeaveApprovals />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leave-management" element={<LeaveManagement />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="documents" element={<Documents />} />
              <Route path="projects" element={<Projects />} />
              <Route path="progress" element={<ProgressReports />} />
              <Route path="daily-progress" element={<DailyProgress />} />
              <Route path="team-progress" element={<TeamProgress />} />
              <Route path="project-approvals" element={<Projects />} />
            </Route>
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;