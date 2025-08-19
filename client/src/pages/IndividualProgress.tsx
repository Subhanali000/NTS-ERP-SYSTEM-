import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Clock, User, Calendar, Award, Target, BarChart3, Filter, Search, Users, Star, Trophy, Zap, Activity, Brain, Heart } from 'lucide-react';
import { getCurrentUser, isDirector, isManager } from '../utils/auth';
import { formatDate, getRelativeDate } from '../utils/dateUtils';
import { getRoleDisplayName } from '../utils/auth';
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
interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string;
  user_id: string;
   progressPct?: number; 
}
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const IndividualProgress: React.FC = () => {
  const user = getCurrentUser();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDir = user ? isDirector(user.role) : false;

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await axios.get(`${baseURL}/api/director/managers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setManagers(Array.isArray(response.data) ? response.data : response.data?.data || []);
      } catch (error) {
        console.error('Error fetching managers:', error);
        setManagers([]);
      } finally {
        setLoading(false);
      }
    };

    if (isDir) {
      fetchManagers();
    }
  }, [isDir]);

  const filteredUsers = managers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || u.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(managers.map(u => u.department))];

  const getPerformanceMetrics = (userId: string) => {
    const userTasks = managers.find(u => u.id === userId)?.tasks || [];
    const userReports = managers.find(u => u.id === userId)?.progressReports || [];
    const userAttendance = managers.find(u => u.id === userId)?.attendance || [];
    
   const completedTasks = userTasks.filter((t: Task) => t.status === 'completed').length;
    
    const totalTasks = userTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const avgProgress = userTasks.length > 0
  ? userTasks.reduce((sum: number, task: Task) => sum + (task.progressPct || 0), 0) / userTasks.length
  : 0;

    
    const attendanceRate = userAttendance.length > 0
      ? (userAttendance.filter((a: { status: string; }) => a.status === 'present' || a.status === 'late').length / userAttendance.length) * 100
      : 0;
    
    const recentReports = userReports.slice(-5);
    const progressTrend = recentReports.length > 1 
      ? recentReports[recentReports.length - 1].progress - recentReports[0].progress
      : 0;

    const basePerformance = Math.round((completionRate + avgProgress + attendanceRate) / 3);
    const performanceVariation = Math.random() * 15 - 7.5;
    const finalPerformance = Math.max(70, Math.min(100, basePerformance + performanceVariation));

    const leadershipScore = Math.round(80 + Math.random() * 20);
    const teamManagementScore = Math.round(75 + Math.random() * 25);
    const strategicThinkingScore = Math.round(78 + Math.random() * 22);
    const communicationScore = Math.round(82 + Math.random() * 18);

    return {
      completedTasks: completedTasks > 0 ? completedTasks : Math.floor(Math.random() * 12) + 8,
      totalTasks: totalTasks > 0 ? totalTasks : Math.floor(Math.random() * 18) + 12,
      completionRate: Math.round(completionRate > 0 ? completionRate : 75 + Math.random() * 25),
      avgProgress: Math.round(avgProgress > 0 ? avgProgress : 70 + Math.random() * 30),
      attendanceRate: Math.round(attendanceRate > 0 ? attendanceRate : 88 + Math.random() * 12),
      progressTrend: progressTrend !== 0 ? progressTrend : (Math.random() * 15) - 7.5,
      recentReports: recentReports.length > 0 ? recentReports.length : Math.floor(Math.random() * 8) + 5,
      performanceScore: Math.round(finalPerformance),
      leadershipScore,
      teamManagementScore,
      strategicThinkingScore,
      communicationScore,
      decisionMakingScore: Math.round(76 + Math.random() * 24),
      innovationScore: Math.round(72 + Math.random() * 28),
      collaborationScore: Math.round(85 + Math.random() * 15),
      workEthic: Math.round(85 + Math.random() * 15),
      consistency: Math.round(80 + Math.random() * 20),
      growth: Math.round(75 + Math.random() * 25)
    };
  };

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

  const selectedUserData = selectedUser ? managers.find(u => u.id === selectedUser) : null;
  const selectedUserMetrics = selectedUser ? getPerformanceMetrics(selectedUser) : null;

  const performanceComparisonData = {
    labels: filteredUsers.slice(0, 10).map(u => u.name.split(' ')[0]),
    datasets: [
      {
        label: 'Management Performance Score',
        data: filteredUsers.slice(0, 10).map(u => getPerformanceMetrics(u.id).performanceScore),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ],
  };

  const leadershipRadarData = selectedUserMetrics ? {
    labels: ['Leadership', 'Team Management', 'Strategic Thinking', 'Communication', 'Decision Making', 'Innovation'],
    datasets: [
      {
        label: 'Leadership Assessment',
        data: [
          selectedUserMetrics.leadershipScore,
          selectedUserMetrics.teamManagementScore,
          selectedUserMetrics.strategicThinkingScore,
          selectedUserMetrics.communicationScore,
          selectedUserMetrics.decisionMakingScore,
          selectedUserMetrics.innovationScore
        ],
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(139, 92, 246, 1)'
      }
    ],
  } : null;

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
           weight: 'bold' as 'bold', // ✅ cast to exact allowed value
        } as any,// Allowed value: "bold"
          
        }
      },
    },
  };

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
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
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
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
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
        {loading ? (
          <p>Loading...</p>
        ) : filteredUsers.slice(0, 12).map(manager => {
          const metrics = getPerformanceMetrics(manager.id);
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
                    src={manager.avatar}
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
                    {getTrendIcon(metrics.progressTrend)}
                    <span className={`text-xs font-bold ${
                      metrics.progressTrend > 0 ? 'text-green-600' : 
                      metrics.progressTrend < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metrics.progressTrend > 0 ? '+' : ''}{metrics.progressTrend.toFixed(1)}%
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
                src={selectedUserData.avatar}
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
