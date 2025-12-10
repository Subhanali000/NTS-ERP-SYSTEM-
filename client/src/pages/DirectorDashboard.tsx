import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CheckCircle, Filter, Building, UserCheck, Briefcase, Star, Activity, Globe, UserPlus } from 'lucide-react';
import { getCurrentUser, getRoleDisplayName } from '../utils/auth';
import { Bar } from 'react-chartjs-2';
import AddEmployee from '../components/Director/AddEmployee';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DirectorDashboard: React.FC = () => {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState<'director' | 'manager' | 'employee'>('director');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [enhancedUsers, setEnhancedUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [progressReports, setProgressReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
const handleInvalidToken = () => {
  alert('⚠️ Session expired or invalid. Please login again.');
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userRoleLabel');
  window.location.href = '/login'; // or use navigate('/login') if you have useNavigate
};

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        handleInvalidToken();
        return;
      }

      // --- Fetch users
      const usersResponse = await fetch(`https://nts-erp-system-629k.vercel.app/api/director/employees`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (usersResponse.status === 401 || usersResponse.status === 403) {
        handleInvalidToken();
        throw new Error("Unauthorized or expired session");
      }
      if (!usersResponse.ok) throw new Error(await usersResponse.text());
      const usersData = await usersResponse.json();
      setEnhancedUsers(usersData);

      // --- Fetch managers
      const managersResponse = await fetch(`https://nts-erp-system-629k.vercel.app/api/director/managers`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (managersResponse.status === 401 || managersResponse.status === 403) {
        handleInvalidToken();
        throw new Error("Unauthorized or expired session");
      }
      if (!managersResponse.ok) throw new Error(await managersResponse.text());
      const managersData = await managersResponse.json();
      setManagers(managersData);

      // --- Fetch tasks
      const tasksResponse = await fetch(`https://nts-erp-system-629k.vercel.app/api/director/tasks`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (tasksResponse.status === 401 || tasksResponse.status === 403) {
        handleInvalidToken();
        throw new Error("Unauthorized or expired session");
      }
      if (!tasksResponse.ok) throw new Error(await tasksResponse.text());
      const tasksData = await tasksResponse.json();
      console.log("tasksData from API:", tasksData);
      setTasks(tasksData.tasks || []);

      // --- Fetch progress reports
      const progressResponse = await fetch(`https://nts-erp-system-629k.vercel.app/api/director/progress-report`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (progressResponse.status === 401 || progressResponse.status === 403) {
        handleInvalidToken();
        throw new Error("Unauthorized or expired session");
      }
      if (!progressResponse.ok) throw new Error(await progressResponse.text());
      const progressData = await progressResponse.json();
      setProgressReports(progressData);

      // --- Fetch projects
      const projectsResponse = await fetch(`https://nts-erp-system-629k.vercel.app/api/director/active-projects`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (projectsResponse.status === 401 || projectsResponse.status === 403) {
        handleInvalidToken();
        throw new Error("Unauthorized or expired session");
      }
      if (!projectsResponse.ok) throw new Error(await projectsResponse.text());
      const projectsData = await projectsResponse.json();
      console.log("project data", projectsData);
      setProjects(projectsData.active_projects || []);

      // --- Fetch attendance
      const attendanceResponse = await fetch(`https://nts-erp-system-629k.vercel.app/api/director/attendance`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (attendanceResponse.status === 401 || attendanceResponse.status === 403) {
        handleInvalidToken();
        throw new Error("Unauthorized or expired session");
      }
      if (!attendanceResponse.ok) throw new Error(await attendanceResponse.text());
      const attendanceData = await attendanceResponse.json();
      console.log('attendance', attendanceData);
      setAttendance(attendanceData);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  const departments = [...new Set(enhancedUsers.map(u => u.department))];
  const employees = enhancedUsers.filter(u => u.role === 'employee' || u.role === 'intern');

  const handleAddEmployee = (newEmployee: any) => {
    setEnhancedUsers(prev => [...prev, newEmployee]);
    console.log('New employee added to organization:', newEmployee);
    // TODO: Send to backend
  };

const getDepartmentMetrics = (dept: string) => {
  // Get all users in this department
  const deptUsers = enhancedUsers.filter(u => u.department === dept);

  // Get all tasks assigned to these users
  const deptTasks = tasks.filter(t => deptUsers.some(user => user.id === t.user_id));

  // Count completed tasks
  const completedTasks = deptTasks.filter(t => t.status === 'completed').length;

  // Calculate average progress across tasks
  const avgProgress = deptTasks.length > 0
    ? Math.round(
        deptTasks.reduce((sum, task) => sum + (task.progress_percent || 0), 0) / deptTasks.length
      )
    : 0;

  // Count active projects where a department user is a manager
  const activeProjects = projects.filter(p =>
    deptUsers.some(u => u.id === p.manager_id)
  ).length;

  return {
    totalEmployees: deptUsers.length,
    totalTasks: deptTasks.length,
    completedTasks,
    avgProgress,
    activeProjects
  };
};


  const getTeamMetrics = (teamId: string) => {
  const team = managers.find(m => m.id === teamId);
  if (!team) return null;

  // ✅ Use manager_id (backend field) instead of managerId
  const teamMembers = enhancedUsers.filter(u => u.manager_id === team.id);

  const teamTasks = tasks.filter(t =>
    teamMembers.some(member => member.id === t.user_id)
  );

  const completedTasks = teamTasks.filter(t => t.status === 'completed').length;

  const avgProgress = teamTasks.length > 0 
    ? Math.round(
        teamTasks.reduce((sum, task) => sum + (task.progress_percent || 0), 0) / teamTasks.length
      )
    : 0;

  return {
    id: team.id,
    name: team.name || `Team ${team.id}`,
    managerId: team.id,
    department: team.department || 'N/A',
    members: teamMembers.length,
    manager: team.name,
    totalTasks: teamTasks.length,
    completedTasks,
    avgProgress,
    efficiency: avgProgress,
    productivity: avgProgress,
    collaboration: avgProgress,
    innovation: avgProgress,
  };
};

const getEmployeeAttendancePct = (empId: string) => {
  const empRecords = attendance.filter(a => a.user_id === empId);
  if (empRecords.length === 0) return 0;

  let totalMinutesWorked = 0;
  let totalDays = 0; // total working days in records

  empRecords.forEach(record => {
    totalDays++;

    if (
  !record.punch_in ||
  !record.punch_out ||
  !record.punch_in.includes(':') ||
  !record.punch_out.includes(':')
) {
  return; // skip invalid row
}

const [inHours, inMinutes] = record.punch_in.split(':').map(v => Number(v) || 0);
const [outHours, outMinutes] = record.punch_out.split(':').map(v => Number(v) || 0);


    let minutesWorked = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);

    // Cap at 480 minutes per day
    if (minutesWorked > 480) minutesWorked = 480;
    if (minutesWorked < 0) minutesWorked = 0;

    totalMinutesWorked += minutesWorked;
  });

  const totalExpectedMinutes = totalDays * 480; // 8 hours per recorded day
  const attendancePct = totalExpectedMinutes > 0
    ? Math.round((totalMinutesWorked / totalExpectedMinutes) * 100)
    : 0;

  console.log(`Employee ID: ${empId} | Days Recorded: ${totalDays} | Total Minutes Worked: ${totalMinutesWorked} | Attendance %: ${attendancePct}`);

  return attendancePct;
};



const getManagerById = (managerId: string) => {
  return managers.find(m => m.id === managerId) || { name: 'N/A' };
};
const getEmployeeMetrics = (empId: string) => {
  const employee = enhancedUsers.find(u => u.id === empId);
  if (!employee) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      avgProgress: 0,
      performance: 0,
      attendance: 0,
      quality: 0,
      growth: 0,
      managerName: "N/A"
    };
  }

  const empTasks = tasks.filter(t => t.user_id === empId);
  const completedTasks = empTasks.filter(t => t.status === 'completed').length;

  const avgProgress = empTasks.length > 0
    ? Math.round(
        empTasks.reduce((sum, task) => sum + (task.progress_percent || 0), 0) / empTasks.length
      )
    : 0;

  const empAttendance = getEmployeeAttendancePct(empId);

  // ✅ Use employee.manager_id (from backend)
  const manager = getManagerById(employee.manager_id || '');

  console.log(`Employee: ${employee.name} | Manager: ${manager.name}`);

  return {
    totalTasks: empTasks.length,
    completedTasks,
    avgProgress,
    performance: avgProgress,
    attendance: empAttendance,
    quality: avgProgress,
    growth: avgProgress,
    managerName: manager.name,
  };
};



  const departmentChartData = {
    labels: departments.map(dept => dept.replace('_', ' ').toUpperCase()),
    datasets: [
      {
        label: 'Average Progress (%)',
        data: departments.map(dept => getDepartmentMetrics(dept).avgProgress),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(236, 72, 153, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ],
  };

  const teamChartData = {
    labels: selectedTeam ? [managers.find(t => t.id === selectedTeam)?.name] : managers.map(manager => manager.name),
    datasets: [
      {
        label: 'Team Efficiency (%)',
        data: (selectedTeam ? [managers.find(t => t.id === selectedTeam)] : managers).map(manager => getTeamMetrics(manager.id)?.efficiency || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Productivity (%)',
        data: (selectedTeam ? [managers.find(t => t.id === selectedTeam)] : managers).map(manager => getTeamMetrics(manager.id)?.productivity || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ],
  };

  const employeeChartData = {
    labels: employees.filter(emp => !selectedDepartment || emp.department === selectedDepartment).slice(0, 10).map(emp => emp.name.split(' ')[0]),
    datasets: [
      {
        label: 'Performance Score (%)',
        data: employees.filter(emp => !selectedDepartment || emp.department === selectedDepartment).slice(0, 10).map(emp => getEmployeeMetrics(emp.id).performance),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const DirectorView = () => (
    <div className="space-y-8">
      {/* Company Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Employees</p>
              <p className="text-3xl font-bold mt-2">{enhancedUsers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Active Projects</p>
              <p className="text-3xl font-bold mt-2">{projects.length}</p>
            </div>
            <Briefcase className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Departments</p>
              <p className="text-3xl font-bold mt-2">{departments.length}</p>
            </div>
            <Building className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Avg Performance</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round(enhancedUsers.reduce((sum, emp) => sum + getEmployeeMetrics(emp.id).performance, 0) / enhancedUsers.length)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Department Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Department Performance Overview</h3>
        <div className="h-80">
          <Bar data={departmentChartData} options={chartOptions} />
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments
          .filter(dept => !selectedDepartment || dept === selectedDepartment)
          .map(dept => {
            const metrics = getDepartmentMetrics(dept);
            return (
              <div key={dept} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 capitalize">
                      {dept.replace('_', ' ')} Department
                    </h4>
                    <p className="text-sm text-gray-600">{metrics.totalEmployees} employees</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-xl font-bold text-gray-900">{metrics.avgProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.avgProgress}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{metrics.completedTasks}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{metrics.totalTasks}</p>
                      <p className="text-xs text-gray-500">Total Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">{projects.length}</p>
                      <p className="text-xs text-gray-500">Projects</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const ManagerView = () => (
    <div className="space-y-8">
      {/* Manager Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100">Total Managers</p>
              <p className="text-3xl font-bold mt-2">{managers.length}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Active Managers</p>
              <p className="text-3xl font-bold mt-2">{managers.length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100">Team Efficiency</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round(managers.reduce((sum, manager) => sum + (getTeamMetrics(manager.id)?.efficiency || 0), 0) / managers.length)}%
              </p>
            </div>
            <Activity className="w-8 h-8 text-rose-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100">Collaboration</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round(managers.reduce((sum, manager) => sum + (getTeamMetrics(manager.id)?.collaboration || 0), 0) / managers.length)}%
              </p>
            </div>
            <Globe className="w-8 h-8 text-amber-200" />
          </div>
        </div>
      </div>

      {/* Enhanced Team Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filter Teams:</span>
          </div>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Teams</option>
            {managers.map(manager => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </select>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All89 Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Team Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {selectedTeam ? `${managers.find(t => t.id === selectedTeam)?.name} Performance` : 'Team Performance Overview'}
        </h3>
        <div className="h-80">
          <Bar data={teamChartData} options={chartOptions} />
        </div>
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managers
          .filter(manager => !selectedTeam || manager.id === selectedTeam)
          .filter(manager => !selectedDepartment || manager.department === selectedDepartment)
          .map(manager => {
            const metrics = getTeamMetrics(manager.id);
            if (!metrics) return null;
            
            return (
              <div key={manager.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{metrics.name}</h4>
                    <p className="text-sm text-gray-600">{metrics.members} members • {metrics.department.replace('_', ' ')}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src={manager.avatar}
                      alt={manager.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{manager.name}</p>
                      <p className="text-xs text-gray-600">Team Manager</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Efficiency</span>
                    <span className="text-xl font-bold text-gray-900">{metrics.efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.efficiency}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center bg-green-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-600">{metrics.completedTasks}</p>
                      <p className="text-xs text-green-700">Completed</p>
                    </div>
                    <div className="text-center bg-blue-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-blue-600">{metrics.totalTasks}</p>
                      <p className="text-xs text-blue-700">Total Tasks</p>
                    </div>
                    <div className="text-center bg-purple-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-purple-600">{metrics.productivity}%</p>
                      <p className="text-xs text-purple-700">Productivity</p>
                    </div>
                    <div className="text-center bg-orange-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-orange-600">{metrics.collaboration}%</p>
                      <p className="text-xs text-orange-700">Collaboration</p>
                    </div>
                  </div>

                  {/* Team Performance Indicators */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Innovation Score</span>
                      <span className="font-bold text-gray-900">{metrics.innovation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-gradient-to-r from-purple-400 to-pink-500 h-1 rounded-full"
                        style={{ width: `${metrics.innovation}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Team Comparison Table */}
      {!selectedTeam && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Team Performance Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Team</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Manager</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Members</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Efficiency</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Productivity</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {managers
                  .filter(manager => !selectedDepartment || manager.department === selectedDepartment)
                  .map(manager => {
                    const metrics = getTeamMetrics(manager.id);
                    if (!metrics) return null;
                    return (
                      <tr key={manager.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{metrics.name}</div>
                          <div className="text-sm text-gray-600 capitalize">{metrics.department.replace('_', ' ')}</div>
                        </td>
                        <td className="py-4 px-4 text-gray-900">{metrics.manager}</td>
                        <td className="py-4 px-4 text-gray-900">{metrics.members}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${metrics.efficiency}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{metrics.efficiency}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${metrics.productivity}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{metrics.productivity}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-green-600 font-medium">{metrics.completedTasks}</span>
                          <span className="text-gray-500">/{metrics.totalTasks}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const EmployeeView = () => (
    <div className="space-y-8">
      {/* Employee Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100">Total Employees</p>
              <p className="text-3xl font-bold mt-2">{employees.length}</p>
            </div>
            <Users className="w-8 h-8 text-cyan-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100">High Performers</p>
              <p className="text-3xl font-bold mt-2">{employees.filter(emp => getEmployeeMetrics(emp.id).performance >= 90).length}</p>
            </div>
            <Star className="w-8 h-8 text-teal-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100">Avg Performance</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round(employees.reduce((sum, emp) => sum + getEmployeeMetrics(emp.id).performance, 0) / employees.length)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-violet-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100">Avg Attendance</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round(employees.reduce((sum, emp) => sum + getEmployeeMetrics(emp.id).attendance, 0) / employees.length)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-pink-200" />
          </div>
        </div>
      </div>

      {/* Employee Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Employee Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Employee Performance Overview</h3>
        <div className="h-80">
          <Bar data={employeeChartData} options={chartOptions} />
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees
          .filter(emp => !selectedDepartment || emp.department === selectedDepartment)
          .slice(0, 12)
          .map(employee => {
            const metrics = getEmployeeMetrics(employee.id);
            const manager = managers.find(u => u.id === employee.managerId);
            
            return (
              <div key={employee.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-4 mb-4">
                  <img
  src={employee.profile_photo || 'https://via.placeholder.com/150'}
  alt={employee.name}
  className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
/>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{employee.name}</h4>
                    <p className="text-sm text-gray-600">{getRoleDisplayName(employee.role)}</p>
                    <p className="text-xs text-gray-500 capitalize">{employee.department.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      metrics.performance >= 90 ? 'text-green-600' :
                      metrics.performance >= 80 ? 'text-blue-600' :
                      metrics.performance >= 70 ? 'text-yellow-600' :
                      'text-orange-600'
                    }`}>
                      {metrics.performance}%
                    </div>
                    <p className="text-xs text-gray-500">Performance</p>
                  </div>
                </div>

                {manager && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <img
                        src={manager.avatar || 'https://via.placeholder.com/150'}
                        alt={manager.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div>
    <p className="text-sm font-medium text-gray-900">{manager?.name || 'N/A'}</p>
    <p className="text-xs text-gray-600">Manager</p>
  </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        metrics.performance >= 90 ? 'bg-green-500' :
                        metrics.performance >= 80 ? 'bg-blue-500' :
                        metrics.performance >= 70 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      }`}
                      style={{ width: `${metrics.performance}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center bg-blue-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-blue-600">{metrics.completedTasks}</p>
                      <p className="text-xs text-blue-700">Completed</p>
                    </div>
                    <div className="text-center bg-purple-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-purple-600">{metrics.totalTasks}</p>
                      <p className="text-xs text-purple-700">Total Tasks</p>
                    </div>
                    <div className="text-center bg-green-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-600">{metrics.attendance}%</p>
                      <p className="text-xs text-green-700">Attendance</p>
                    </div>
                    <div className="text-center bg-orange-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-orange-600">{metrics.quality}%</p>
                      <p className="text-xs text-orange-700">Quality</p>
                    </div>
                  </div>

                  {/* Growth Indicator */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Growth Score</span>
                      <span className="font-bold text-gray-900">{metrics.growth}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full"
                        style={{ width: `${metrics.growth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Employee Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Employee</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Department</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Manager</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Performance</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Attendance</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {employees
                .filter(emp => !selectedDepartment || emp.department === selectedDepartment)
                .slice(0, 10)
                .map(employee => {
                  const metrics = getEmployeeMetrics(employee.id);
                  
                  return (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={employee.avatar || 'https://via.placeholder.com/150'}
                            alt={employee.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-600">{getRoleDisplayName(employee.role)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900 capitalize">{employee.department.replace('_', ' ')}</td>
                      <td className="py-4 px-4 text-gray-900">{metrics.managerName || 'N/A'}</td> {/* use managerName from metrics */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                metrics.performance >= 90 ? 'bg-green-500' :
                                metrics.performance >= 80 ? 'bg-blue-500' :
                                metrics.performance >= 70 ? 'bg-yellow-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${metrics.performance}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{metrics.performance}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-green-600 font-medium">{metrics.attendance}%</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-blue-600 font-medium">{metrics.completedTasks}</span>
                        <span className="text-gray-500">/{metrics.totalTasks}</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            Executive Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Comprehensive organizational oversight and management</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddEmployee(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Employee</span>
          </button>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('director')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'director'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Director Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'manager'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manager Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('employee')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'employee'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Employee Dashboard</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'director' && <DirectorView />}
          {activeTab === 'manager' && <ManagerView />}
          {activeTab === 'employee' && <EmployeeView />}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployee
          onClose={() => setShowAddEmployee(false)}
          onSave={handleAddEmployee}
        />
      )}
    </div>
  );
};

export default DirectorDashboard;
