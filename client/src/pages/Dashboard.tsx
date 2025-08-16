import React from 'react';
import {
  getCurrentUser,
  isDirector,
  isManager,
  isTeamLead,
} from '../utils/auth';

import DirectorDashboard from './DirectorDashboard';
import ManagerDashboard from './ManagerDashboard';
import TeamLeadDashboard from './TeamLeadDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard: React.FC = () => {
  const user = getCurrentUser();

  if (!user) {
    console.warn('⚠️ No user found in localStorage. Redirecting to employee dashboard.');
    return <EmployeeDashboard />;
  }

  const { role } = user;
  console.log('📌 Dashboard role check:', role);

  const isDir = isDirector(role);
  const isMgr = isManager(role);
  const isTeamLd = isTeamLead(role);

  if (isDir) {
    return <DirectorDashboard />;
  }

  if (isMgr) {
    return <ManagerDashboard />;
  }

  if (isTeamLd) {
    return <TeamLeadDashboard />;
  }

  return <EmployeeDashboard />;
};

export default Dashboard;
