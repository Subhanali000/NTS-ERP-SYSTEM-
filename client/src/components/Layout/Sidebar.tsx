import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  BarChart3, 
  FileText,
  UserCheck,
  Briefcase,
  TrendingUp,
  Target,
  CheckCircle,
  Send,
  ChevronDown,
  ChevronRight,
  Award,
  Activity,
  PieChart
} from 'lucide-react';
import { getCurrentUser, isDirector, isManager, isTeamLead, getSimpleDesignation } from '../../utils/auth';
import { mockUsers, mockTasks, mockProgressReports, mockProjects } from '../../data/mockData';

const Sidebar: React.FC = () => {
  const user = getCurrentUser();
  const isDir = isDirector(user.role);
  const isMgr = isManager(user.role);
  const isTeamLd = isTeamLead(user.role);
  const [expandedSections, setExpandedSections] = useState<string[]>(['team-progress']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Calculate team metrics for managers and team leads
  const getTeamMetrics = () => {
    if (!isMgr && !isTeamLd) return null;

    const teamMembers = mockUsers.filter(u => u.managerId === user.id);
    const teamTasks = mockTasks.filter(t => 
      teamMembers.some(member => member.id === t.assigneeId)
    );
    const teamReports = mockProgressReports.filter(r =>
      teamMembers.some(member => member.id === r.userId)
    );

    const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
    const pendingReports = teamReports.filter(r => !r.approved).length;
    const avgProgress = teamTasks.length > 0 
      ? Math.round(teamTasks.reduce((sum, task) => sum + task.progressPct, 0) / teamTasks.length)
      : 0;

    return {
      teamSize: teamMembers.length,
      completedTasks,
      pendingReports,
      avgProgress,
      activeProjects: mockProjects.filter(p => p.managerId === user.id && p.status === 'active').length
    };
  };

  const teamMetrics = getTeamMetrics();

  // Director-specific navigation items
  const directorNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & Analytics' },
    { to: '/projects', icon: Briefcase, label: 'Projects & Teams', description: 'Manage Projects' },
    { to: '/individual-progress', label: 'Manager Progress', description: 'Manager Performance', icon: Target },
    { to: '/manager-leave-approvals', icon: Calendar, label: 'Manager Leave Approvals', description: 'Approve Manager Leaves' },
    { to: '/progress', icon: TrendingUp, label: 'Progress Reports', description: 'Team Progress' },
    { to: '/documents', icon: FileText, label: 'HR Documents', description: 'Company Documents' }
  ];

  // Manager navigation items
  const managerNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Team Overview' },
    { to: '/leave-management', icon: Calendar, label: 'Leave Management', description: 'Approve Employee Leaves' },
    { to: '/tasks', icon: ClipboardList, label: 'Team & Task Management', description: 'Manage Team & Tasks' },
    { to: '/team-progress', icon: TrendingUp, label: 'Progress Reports', description: 'Monitor Team Progress' },
    { to: '/project-approvals', icon: CheckCircle, label: 'Project Approvals', description: 'Review & Approve Projects' },
    { to: '/documents', icon: FileText, label: 'Documents', description: 'Files & Forms' }
  ];

  // Team Lead navigation items
  const teamLeadNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Team Overview' },
    { to: '/leave-management', icon: Calendar, label: 'Leave Management', description: 'Approve Team Leaves' },
    { to: '/tasks', icon: ClipboardList, label: 'Team & Task Management', description: 'Manage Team & Tasks' },
    { to: '/team-progress', icon: TrendingUp, label: 'Team Analytics', description: 'Monitor Team Progress' },
    { to: '/documents', icon: FileText, label: 'Documents', description: 'Files & Forms' }
  ];

  // Employee/Intern navigation items
  const employeeNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'My Overview' },
    { to: '/attendance', icon: UserCheck, label: 'Attendance', description: 'Track Time' },
    { to: '/leave-management', icon: Calendar, label: 'Leave Requests', description: 'Request Leave' },
    { to: '/tasks', icon: ClipboardList, label: 'My Tasks', description: 'Assigned Work' },
    { to: '/daily-progress', icon: Send, label: 'Daily Progress', description: 'Submit Daily Updates' },
    { to: '/progress', icon: TrendingUp, label: 'Progress Reports', description: 'Submit Updates' },
    { to: '/documents', icon: FileText, label: 'Documents', description: 'My Documents' }
  ];

  // Select navigation items based on role
  const navItems = isDir ? directorNavItems : 
                   isMgr ? managerNavItems : 
                   isTeamLd ? teamLeadNavItems : 
                   employeeNavItems;

  return (
    <div className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0 z-30 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              NTS ERP
            </h1>
            <p className="text-sm text-gray-500">People & Projects</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          isDir ? 'bg-purple-100 text-purple-800' :
          isMgr ? 'bg-blue-100 text-blue-800' :
          isTeamLd ? 'bg-indigo-100 text-indigo-800' :
          'bg-green-100 text-green-800'
        }`}>
          {isDir ? '👑 Director Portal' : 
           isMgr ? '👥 Manager Portal' : 
           isTeamLd ? '🎯 Team Lead Portal' :
           '💼 Employee Portal'}
        </div>
      </div>

      {/* Scrollable Navigation Container */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation */}
        <nav className="mt-2 px-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-4 border-blue-600 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className={`font-medium text-sm ${isActive ? 'text-blue-900' : ''}`}>
                          {item.label}
                        </p>
                        <p className={`text-xs ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Enhanced Team Progress Section for Managers only (not Team Leads) */}
        {isMgr && teamMetrics && (
          <div className="mt-8 px-4">
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <button
                onClick={() => toggleSection('team-progress')}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Progress Reports Hub</span>
                </h3>
                {expandedSections.includes('team-progress') ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {expandedSections.includes('team-progress') && (
                <div className="space-y-4">
                  {/* Quick Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-lg font-bold text-blue-900">{teamMetrics.teamSize}</p>
                          <p className="text-xs text-blue-700">Team Size</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-lg font-bold text-green-900">{teamMetrics.completedTasks}</p>
                          <p className="text-xs text-green-700">Completed</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-lg font-bold text-purple-900">{teamMetrics.activeProjects}</p>
                          <p className="text-xs text-purple-700">Projects</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-orange-100">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-orange-600" />
                        <div>
                          <p className="text-lg font-bold text-orange-900">{teamMetrics.pendingReports}</p>
                          <p className="text-xs text-orange-700">Pending</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Performance Indicator */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700 flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>Avg Progress</span>
                      </span>
                      <span className="text-sm font-bold text-gray-900">{teamMetrics.avgProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          teamMetrics.avgProgress >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          teamMetrics.avgProgress >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          teamMetrics.avgProgress >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${teamMetrics.avgProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Action Links */}
                  <div className="space-y-2">
                    <NavLink
                      to="/team-progress"
                      className="flex items-center space-x-2 text-xs text-blue-700 hover:text-blue-900 transition-colors p-2 hover:bg-blue-100 rounded-lg"
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>View Progress Reports</span>
                    </NavLink>
                    <NavLink
                      to="/progress"
                      className="flex items-center space-x-2 text-xs text-purple-700 hover:text-purple-900 transition-colors p-2 hover:bg-purple-100 rounded-lg"
                    >
                      <Award className="w-3 h-3" />
                      <span>Review Progress Reports</span>
                    </NavLink>
                    <NavLink
                      to="/tasks"
                      className="flex items-center space-x-2 text-xs text-green-700 hover:text-green-900 transition-colors p-2 hover:bg-green-100 rounded-lg"
                    >
                      <Target className="w-3 h-3" />
                      <span>Manage Team Tasks</span>
                    </NavLink>
                  </div>

                  {/* Performance Status */}
                  <div className={`p-2 rounded-lg text-center ${
                    teamMetrics.avgProgress >= 80 ? 'bg-green-100 text-green-800' :
                    teamMetrics.avgProgress >= 60 ? 'bg-blue-100 text-blue-800' :
                    teamMetrics.avgProgress >= 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <p className="text-xs font-medium">
                      {teamMetrics.avgProgress >= 80 ? '🎉 Excellent Performance' :
                       teamMetrics.avgProgress >= 60 ? '👍 Good Progress' :
                       teamMetrics.avgProgress >= 40 ? '⚡ Needs Attention' :
                       '🚨 Requires Focus'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats for Directors */}
        {isDir && (
          <div className="mt-8 px-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Total Employees</span>
                  <span className="text-sm font-bold text-blue-600">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Active Projects</span>
                  <span className="text-sm font-bold text-green-600">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Manager Leave Requests</span>
                  <span className="text-sm font-bold text-orange-600">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Progress Reports</span>
                  <span className="text-sm font-bold text-purple-600">18</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions for Employees */}
        {!isDir && !isMgr && !isTeamLd && (
          <div className="mt-8 px-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">My Overview</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">My Tasks</span>
                  <span className="text-sm font-bold text-blue-600">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Completed</span>
                  <span className="text-sm font-bold text-green-600">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Daily Progress</span>
                  <span className="text-sm font-bold text-purple-600">Today</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Leave Balance</span>
                  <span className="text-sm font-bold text-orange-600">{user.leaveBalance}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom padding to ensure last items are accessible */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default Sidebar;