import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Clock, User, Calendar, Award, Target, BarChart3, Filter, Search, Users, Star, Trophy, Zap, Activity, Brain, Heart } from 'lucide-react';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// Mock auth functions (replace with actual implementation)
const getCurrentUser = () => ({
  id: '1',
  name: 'Director User',
  role: 'director',
  email: 'director@company.com'
});

const isDirector = (role: string) => role === 'director';
const isManager = (role: string) => role === 'manager';

// Mock utility functions
const formatDate = (date: string) => new Date(date).toLocaleDateString();
const getRelativeDate = (date: string) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = Math.abs(now.getTime() - targetDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} days ago`;
};

const getRoleDisplayName = (role: string) => {
  const roleMap: { [key: string]: string } = {
    'director': 'Director',
    'manager': 'Manager',
    'employee': 'Employee',
    'admin': 'Administrator'
  };
  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

// ---------------- TYPES ----------------
// ---------------- TYPES ----------------
type Task = { 
  id: string; 
  title: string; 
  status: 'completed' | 'in-progress' | 'pending'; 
  progressPct?: number; 
  deadline: string; 
  completedAt?: string;
  managerId?: string;
  employeeId?: string;
};

type Attendance = { 
  date: string; 
  status: 'present' | 'late' | 'absent';
  managerId?: string;
  employeeId?: string;
};

type Request = { 
  id: string; 
  type: string; 
  status: 'approved' | 'rejected' | 'pending';
  managerId?: string;
  employeeId?: string;
};

type ProgressReport = { 
  id: string; 
  progress_percent?: number; 
  submittedAt?: string;
  submitted_at?: string;
  date?: string;
  user_id?: string;
  managerId?: string;
};

type Employee = { 
  id: string; 
  name: string; 
  efficiency: number; 
  tasks: Task[];
  attendance?: Attendance[];
  requests?: Request[];
  progressReports?: ProgressReport[];
  progressTrend?: number;
  managerId?: string;
};

type Manager = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  joinDate: string;
  avatar: string;
  tasks: Task[];
  employees: Employee[];
  progressReports: ProgressReport[];
  attendance: Attendance[];
  requests: Request[];
  profile_photo:string;
  progressTrend?: number;
};

// ---------------- HELPERS ----------------

const getProgressTrend = (reports: ProgressReport[]) => {
  if (!reports || reports.length === 0) {
 
    return 0;
  }

  // Only keep reports that have at least one valid date
  const validReports = reports.filter(r =>
    r.submittedAt || r.submitted_at || r.date
  );

  if (validReports.length === 0) {
   
    return 0;
  }

  const sorted = [...validReports].sort(
    (a, b) =>
      new Date(a.submittedAt ?? a.submitted_at ?? a.date!).getTime() -
      new Date(b.submittedAt ?? b.submitted_at ?? b.date!).getTime()
  );

  if (sorted.length === 1) {
    const singleProgress = sorted[0].progress_percent ?? 0;
    
    return singleProgress;
  }

  const latest = sorted[sorted.length - 1].progress_percent ?? 0;
  const prev = sorted[sorted.length - 2].progress_percent ?? 0;

 

  if (prev === 0) return +(latest - prev).toFixed(1);

  return +(((latest - prev) / prev) * 100).toFixed(1);
};


// ---------------- PERFORMANCE FUNCTION ----------------
const getPerformanceMetrics = (manager: Manager) => {
 
  // --- Manager task metrics ---
  const completedTasks = manager.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = manager.tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const avgProgress = totalTasks > 0
    ? manager.tasks.reduce((sum, t) => sum + (t.progressPct || 0), 0) / totalTasks
    : 0;

  // --- Attendance ---
  const attendanceRate = manager.attendance.length > 0
    ? (manager.attendance.filter(a => a.status === 'present' || a.status === 'late').length / manager.attendance.length) * 100
    : 0;

  // --- Team metrics ---
  const teamTasks = manager.employees.flatMap(e => e.tasks || []);
  const completedTeamTasks = teamTasks.filter(t => t.status === 'completed').length;
  const teamTaskRate = teamTasks.length > 0 ? (completedTeamTasks / teamTasks.length) * 100 : 0;
  const teamManagementScore = Math.round(teamTaskRate);

  const employeeEfficiencies = manager.employees.map(e => e.efficiency || 0);
  const avgEfficiency = employeeEfficiencies.length > 0
    ? employeeEfficiencies.reduce((a, b) => a + b, 0) / employeeEfficiencies.length
    : 0;

  // --- Request handling ---
  const requestHandling = manager.requests.length > 0
    ? (manager.requests.filter(r => r.status !== 'pending').length / manager.requests.length) * 100
    : 100;

  const leadershipScore = Math.round((avgEfficiency + attendanceRate + requestHandling) / 3);

  // --- Deadline performance ---
  const deadlinePerformance = manager.tasks.length > 0
    ? manager.tasks.reduce((sum, t) => {
        if (t.completedAt) {
          const daysBeforeDeadline = (new Date(t.deadline).getTime() - new Date(t.completedAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + (daysBeforeDeadline >= 0 ? 100 : 60);
        }
        return sum;
      }, 0) / manager.tasks.length
    : 0;

  const strategicThinkingScore = Math.round(deadlinePerformance);

  // --- Communication score ---
  const totalRequests = manager.requests.length;
  const decidedRequests = manager.requests.filter(r => r.status !== 'pending').length;
  const requestHandlingScore = totalRequests > 0 ? (decidedRequests / totalRequests) * 100 : 100;

  const expectedReports = 4;
  const reportScore = manager.progressReports.length >= expectedReports
    ? 100
    : (manager.progressReports.length / expectedReports) * 100;

  const communicationScore = Math.round((requestHandlingScore + reportScore) / 2);

  // --- Overall management score ---
  const managementScore = Math.round(
    (leadershipScore * 0.25) +
    (teamManagementScore * 0.25) +
    (strategicThinkingScore * 0.25) +
    (communicationScore * 0.25)
  );

  // --- Progress trend ---
  const progressTrend = typeof manager.progressTrend === 'number'
    ? manager.progressTrend
    : getProgressTrend(manager.progressReports);

  const metrics = {
    completionRate: Math.round(completionRate),
    avgProgress: Math.round(avgProgress),
    attendanceRate: Math.round(attendanceRate),
    teamManagementScore,
    leadershipScore,
    strategicThinkingScore,
    communicationScore,
    managementScore,
    performanceScore: managementScore,
    progressTrend,
  };

  console.log('Calculated metrics:', metrics);
  return metrics;
};






// ---------------- MAIN COMPONENT ----------------
const IndividualProgress: React.FC = () => {
  const user = getCurrentUser();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const isDir = user ? isDirector(user.role) : false;

  useEffect(() => {
  const fetchManagers = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch managers data...');

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        setManagers([]);
        setLoading(false);
        return;
      }

      console.log('Fetching data from API with token:', token.substring(0, 20) + '...');

      const [managersRes, attendanceRes, tasksRes, reportsRes, requestsRes, employeesRes] =
        await Promise.all([
          axios.get(`http://localhost:8000/api/director/managers`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:8000/api/director/attendance`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:8000/api/director/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:8000/api/director/progress-report`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:8000/api/director/leaves`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:8000/api/director/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
 // Normalize data
      const rawManagers = Array.isArray(managersRes.data) ? managersRes.data : [];
      const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const attendance = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      const reports = Array.isArray(reportsRes.data) ? reportsRes.data : [];
      const requests = Array.isArray(requestsRes.data) ? requestsRes.data : [];
      const employees = Array.isArray(employeesRes.data) ? employeesRes.data : [];

      // Build combined manager objects
      const combinedManagers: Manager[] = rawManagers.map((m: any) => {
        const managerReports = reports.filter((r: ProgressReport) => r.user_id === m.id || r.managerId === m.id);

        const managerEmployees = employees
          .filter((e: any) => e.managerId === m.id)
          .map((e: any) => {
            const employeeReports = reports.filter((r: ProgressReport) => r.user_id === e.id);

            return {
              ...e,
              tasks: tasks.filter((t: Task) => t.employeeId === e.id),
              attendance: attendance.filter((a: Attendance) => a.employeeId === e.id),
              requests: requests.filter((rq: Request) => rq.employeeId === e.id),
              progressReports: employeeReports,
              progressTrend: getProgressTrend(employeeReports),
            };
          });

        return {
          ...m,
          profile_photo: m.profile_photo || m.avatar || '',
          joinDate: m.joinDate || '2023-01-01',
          tasks: tasks.filter((t: Task) => t.managerId === m.id),
          employees: managerEmployees,
          progressReports: managerReports,
          attendance: attendance.filter((a: Attendance) => a.managerId === m.id),
          requests: requests.filter((rq: Request) => rq.managerId === m.id),
          progressTrend: getProgressTrend(managerReports),
        };
      });

      console.log('✅ Combined managers data:', combinedManagers);
      setManagers(combinedManagers);

    } catch (error: any) {
      console.error('❌ Error fetching managers:', error);
      if (axios.isAxiosError(error)) {
        console.error({
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  if (isDir) fetchManagers();
  else setLoading(false);
}, [isDir]);

  // Get unique departments
  const departments = [...new Set(managers.map(m => m.department))];
  console.log('Available departments:', departments);

  // Filter managers based on search and department
  const filteredUsers = managers.filter(manager => {
    const matchesSearch = manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manager.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || manager.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });



  // ✅ Selected manager data
  const selectedUserData = selectedUser
    ? managers.find(u => u.id === selectedUser)
    : null;

  const selectedUserMetrics = selectedUserData
    ? getPerformanceMetrics(selectedUserData)
    : null;




  // ✅ Example: Performance Comparison Chart
  const performanceComparisonData = {
    labels: managers.slice(0, 10).map(u => u.name.split(" ")[0]),
    datasets: [
      {
        label: "Management Performance Score",
        data: managers.slice(0, 10).map(u => getPerformanceMetrics(u).managementScore),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // ✅ Radar chart for selected user
  const leadershipRadarData = selectedUserMetrics
    ? {
        labels: ["Leadership", "Team Management", "Strategic Thinking", "Communication"],
        datasets: [
          {
            label: "Leadership Assessment",
            data: [
              selectedUserMetrics.leadershipScore,
              selectedUserMetrics.teamManagementScore,
              selectedUserMetrics.strategicThinkingScore,
              selectedUserMetrics.communicationScore,
            ],
            backgroundColor: "rgba(139, 92, 246, 0.2)",
            borderColor: "rgba(139, 92, 246, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(139, 92, 246, 1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(139, 92, 246, 1)",
          },
        ],
      }
    : null;

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 95) return { label: 'Outstanding', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Trophy };
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800 border-green-200', icon: Star };
    if (score >= 80) return { label: 'Very Good', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Award };
    if (score >= 70) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Target };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800 border-red-200', icon: Clock };
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < -5) return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
    return <TrendingUp className="w-4 h-4 text-gray-500" />;
  };

  const getLeadershipDescription = (score: number) => {
    if (score >= 90) return "Exceptional leadership and team guidance";
    if (score >= 80) return "Strong leadership capabilities";
    if (score >= 70) return "Good leadership potential";
    if (score >= 60) return "Developing leadership skills";
    return "Needs leadership development";
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

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        }
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading manager data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            Manager Performance Analytics
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Deep insights into manager performance and leadership capabilities</p>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search managers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm min-w-48"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value || null)}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm min-w-80"
          >
            <option value="">Select for detailed analysis...</option>
            {filteredUsers.map(manager => (
              <option key={manager.id} value={manager.id}>
                {manager.name} - {getRoleDisplayName(manager.role)}
              </option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'quarter')}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Manager Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.slice(0, 12).map(manager => {
          const metrics = getPerformanceMetrics(manager);
          const badge = getPerformanceBadge(metrics.performanceScore);
          const BadgeIcon = badge.icon;
          
          return (
            <div 
              key={manager.id} 
              className={`bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl border-2 p-6 hover:shadow-xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-105 ${
                selectedUser === manager.id ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-xl' : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setSelectedUser(manager.id)}
            >
              <div className="flex items-center space-x-4 mb-6">
  <div className="relative">
    <img
      src={manager.profile_photo || '/default-avatar.png'}
      alt={manager.name}
      className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
    />
    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full p-1">
      <BadgeIcon className="w-4 h-4 text-white" />
    </div>
  </div>


                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{manager.name}</h4>
                  <p className="text-sm text-gray-600 font-medium">{getRoleDisplayName(manager.role)}</p>
                  <p className="text-xs text-gray-500 capitalize">{manager.department.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Management Score</span>
                  <span className={`text-2xl font-bold ${getPerformanceColor(metrics.performanceScore)}`}>
                    {metrics.performanceScore}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      metrics.performanceScore >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                      metrics.performanceScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      metrics.performanceScore >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    }`}
                    style={{ width: `${metrics.performanceScore}%` }}
                  />
                </div>
<div className="flex items-center justify-between">
  <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${badge.color}`}>
    {badge.label}
  </span>
  <div className="flex items-center space-x-1">
    {getTrendIcon(manager.progressTrend ?? 0)}
    <span
      className={`text-xs font-bold ${
        (manager.progressTrend ?? 0) > 0
          ? 'text-green-600'
          : (manager.progressTrend ?? 0) < 0
          ? 'text-red-600'
          : 'text-gray-600'
      }`}
    >
      {(manager.progressTrend ?? 0) > 0 ? '+' : ''}
      {(manager.progressTrend ?? 0).toFixed(1)}
    </span>
  </div>
</div>



                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                  <div className="text-center bg-purple-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-purple-600">{metrics.leadershipScore}%</p>
                    <p className="text-xs text-purple-700 font-medium">Leadership</p>
                  </div>
                  <div className="text-center bg-indigo-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-indigo-600">{metrics.teamManagementScore}%</p>
                    <p className="text-xs text-indigo-700 font-medium">Team Mgmt</p>
                  </div>
                  <div className="text-center bg-blue-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-blue-600">{metrics.strategicThinkingScore}%</p>
                    <p className="text-xs text-blue-700 font-medium">Strategy</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Comparison Chart */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <span>Manager Performance Comparison</span>
        </h3>
        <div className="h-80">
          <Bar data={performanceComparisonData} options={chartOptions} />
        </div>
      </div>

      {/* Detailed Individual Analysis */}
      {selectedUserData && selectedUserMetrics && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6">
              <img
  src={selectedUserData.profile_photo || '/default-avatar.png'} // fallback if empty
  alt={selectedUserData.name}
  className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-100 shadow-lg"
/>

              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedUserData.name}</h2>
                <p className="text-xl text-gray-600 font-medium">{getRoleDisplayName(selectedUserData.role)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedUserData.department.replace('_', ' ').toUpperCase()} • 
                  Joined {formatDate(selectedUserData.joinDate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-6xl font-bold ${getPerformanceColor(selectedUserMetrics.performanceScore)}`}>
                {selectedUserMetrics.performanceScore}%
              </div>
              <p className="text-lg text-gray-600 font-medium">Management Performance</p>
              <p className="text-sm text-gray-500 mt-2 max-w-xs">{getLeadershipDescription(selectedUserMetrics.leadershipScore)}</p>
            </div>
          </div>

          {/* Detailed Management Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-900">{selectedUserMetrics.leadershipScore}%</p>
                  <p className="text-sm text-purple-700 font-medium">Leadership</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-500 rounded-xl shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-indigo-900">{selectedUserMetrics.teamManagementScore}%</p>
                  <p className="text-sm text-indigo-700 font-medium">Team Management</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-900">{selectedUserMetrics.strategicThinkingScore}%</p>
                  <p className="text-sm text-blue-700 font-medium">Strategic Thinking</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-cyan-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-cyan-500 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-cyan-900">{selectedUserMetrics.communicationScore}%</p>
                  <p className="text-sm text-cyan-700 font-medium">Communication</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leadership Skills Radar Chart */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Star className="w-6 h-6 text-purple-600" />
              <span>Leadership Skills Assessment</span>
            </h3>
            <div className="h-80">
              {leadershipRadarData && <Radar data={leadershipRadarData} options={radarOptions} />}
            </div>
          </div>

          {/* Management Excellence Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Leadership Excellence */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 border border-purple-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-900">Leadership Excellence</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700 font-medium">Leadership Score</span>
                  <span className="text-2xl font-bold text-purple-900">{selectedUserMetrics.leadershipScore}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${selectedUserMetrics.leadershipScore}%` }}
                  />
                </div>
                <p className="text-sm text-purple-700 leading-relaxed">
                  {selectedUserMetrics.leadershipScore >= 90 ? "Exceptional leadership with inspiring vision and team guidance" :
                   selectedUserMetrics.leadershipScore >= 80 ? "Strong leadership capabilities with effective team motivation" :
                   selectedUserMetrics.leadershipScore >= 70 ? "Good leadership potential with room for growth" :
                   "Developing leadership skills, focus on team engagement"}
                </p>
              </div>
            </div>

            {/* Team Management */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-8 border border-indigo-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-indigo-500 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-indigo-900">Team Management</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-indigo-700 font-medium">Management Score</span>
                  <span className="text-2xl font-bold text-indigo-900">{selectedUserMetrics.teamManagementScore}%</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${selectedUserMetrics.teamManagementScore}%` }}
                  />
                </div>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  {selectedUserMetrics.teamManagementScore >= 90 ? "Outstanding team management with excellent delegation and support" :
                   selectedUserMetrics.teamManagementScore >= 80 ? "Effective team management with good coordination skills" :
                   selectedUserMetrics.teamManagementScore >= 70 ? "Solid team management with opportunities for improvement" :
                   "Developing team management skills"}
                </p>
              </div>
            </div>

            {/* Strategic Impact */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Strategic Impact</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 font-medium">Strategic Thinking</span>
                  <span className="text-2xl font-bold text-blue-900">{selectedUserMetrics.strategicThinkingScore}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${selectedUserMetrics.strategicThinkingScore}%` }}
                  />
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {selectedUserMetrics.strategicThinkingScore >= 90 ? "Exceptional strategic vision with innovative planning" :
                   selectedUserMetrics.strategicThinkingScore >= 80 ? "Strong strategic thinking with effective planning" :
                   selectedUserMetrics.strategicThinkingScore >= 70 ? "Good strategic awareness with developing skills" :
                   "Focus on strategic thinking development"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-16">
          <Users className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No managers found</h3>
          <p className="text-gray-600 text-lg">Try adjusting your search criteria to see more results.</p>
        </div>
      )}
    </div>
  );
};

export default IndividualProgress;
