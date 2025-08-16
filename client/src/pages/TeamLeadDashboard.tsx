import React, { useState } from 'react';
import { Users, ClipboardList, Calendar, TrendingUp, CheckCircle, Briefcase, BarChart3, Target,  Plus, Clock, AlertTriangle, MessageSquare,  Star, Eye, PieChart, Code, Database, Palette, Server, Bug, Badge } from 'lucide-react';
import { getCurrentUser } from '../utils/auth';
import { mockUsers, mockTasks, mockLeaveRequests, mockProjects } from '../data/mockData';
import { formatDate, getDaysUntilDeadline, isOverdue } from '../utils/dateUtils';
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

const TeamLeadDashboard: React.FC = () => {
  const user = getCurrentUser();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showLeaveReview, setShowLeaveReview] = useState<string | null>(null);

  // Get team data - only one team under team lead
  const teamMembers = user ? mockUsers.filter(u => u.managerId === user.id) : [];
  const teamTasks = mockTasks.filter(t => 
    teamMembers.some(member => member.id === t.assigneeId)
  );
  const pendingLeaveRequests = mockLeaveRequests.filter(lr => 
    lr.status === 'pending' && teamMembers.some(tm => tm.id === lr.userId)
  );
  const managedProjects = user
    ? mockProjects.filter(p => p.managerId === user.id)
    : [];

  // Calculate metrics
  const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = teamTasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks = teamTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed').length;

  // Mock team members data for the overview section
  const mockTeamMembers = [
    {
      id: 'tm-1',
      name: 'Alex Rodriguez',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
      assignedTask: 'Frontend Development',
      taskType: 'frontend',
      status: 'Active',
      progress: 85,
      icon: Code,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'tm-2',
      name: 'Sarah Chen',
      avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150',
      assignedTask: 'Backend Development',
      taskType: 'backend',
      status: 'Active',
      progress: 92,
      icon: Server,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'tm-3',
      name: 'Marcus Johnson',
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
      assignedTask: 'UI/UX Design',
      taskType: 'design',
      status: 'Completed',
      progress: 100,
      icon: Palette,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'tm-4',
      name: 'Emily Davis',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      assignedTask: 'Database Management',
      taskType: 'database',
      status: 'Active',
      progress: 78,
      icon: Database,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'tm-5',
      name: 'Jordan Smith',
      avatar: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150',
      assignedTask: 'Quality Testing',
      taskType: 'testing',
      status: 'Active',
      progress: 67,
      icon: Bug,
      color: 'from-red-500 to-red-600'
    }
  ];

  // Enhanced team metrics calculation
  const getTeamMemberMetrics = (memberId: string) => {
    const memberTasks = teamTasks.filter(t => t.assigneeId === memberId);
    
    const completedTasks = memberTasks.filter(t => t.status === 'completed').length;
    const totalTasks = memberTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const avgProgress = memberTasks.length > 0 
      ? memberTasks.reduce((sum, task) => sum + task.progressPct, 0) / memberTasks.length 
      : 0;
    
    // Enhanced performance calculations
    const basePerformance = Math.round((completionRate + avgProgress) / 2);
    const performanceVariation = Math.random() * 15 - 7.5;
    const finalPerformance = Math.max(60, Math.min(100, basePerformance + performanceVariation));

    return {
      completedTasks: totalTasks > 0 ? completedTasks : Math.floor(Math.random() * 8) + 3,
      totalTasks: totalTasks > 0 ? totalTasks : Math.floor(Math.random() * 12) + 8,
      completionRate: Math.round(completionRate > 0 ? completionRate : 70 + Math.random() * 30),
      avgProgress: Math.round(avgProgress > 0 ? avgProgress : 75 + Math.random() * 25),
      performanceScore: Math.round(finalPerformance),
      productivity: Math.round(80 + Math.random() * 20),
      quality: Math.round(85 + Math.random() * 15),
      efficiency: Math.round(75 + Math.random() * 25)
    };
  };

  const getPerformanceScore = (memberId: string) => {
    return getTeamMemberMetrics(memberId).performanceScore;
  };

  // Chart data for team performance comparison
  const teamPerformanceData = {
    labels: teamMembers.map(member => member.name.split(' ')[0]),
    datasets: [
      {
        label: 'Performance Score (%)',
        data: teamMembers.map(member => getTeamMemberMetrics(member.id).performanceScore),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Task Completion Rate (%)',
        data: teamMembers.map(member => getTeamMemberMetrics(member.id).completionRate),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ],
  };

  // Team productivity over time
  const productivityTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Team Productivity',
        data: [78, 82, 85, 88],
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Task Completion',
        data: [72, 76, 80, 84],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }
    ],
  };

  // Task status distribution
  const taskStatusData = {
    labels: ['Completed', 'In Progress', 'To Do', 'Review'],
    datasets: [
      {
        data: [
          teamTasks.filter(t => t.status === 'completed').length,
          teamTasks.filter(t => t.status === 'in_progress').length,
          teamTasks.filter(t => t.status === 'todo').length,
          teamTasks.filter(t => t.status === 'review').length,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(156, 163, 175, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(156, 163, 175, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Team skills radar chart (average of all team members)
  const teamSkillsData = {
    labels: ['Technical', 'Communication', 'Problem Solving', 'Teamwork', 'Creativity', 'Leadership'],
    datasets: [
      {
        label: 'Team Average',
        data: [85, 78, 82, 90, 75, 80],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
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
        } as any, // ✅ cast to bypass deep partial typing
      },
        
      },
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'from-green-400 to-green-600';
    if (progress >= 80) return 'from-blue-400 to-blue-600';
    if (progress >= 70) return 'from-yellow-400 to-yellow-600';
    if (progress >= 60) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const handleLeaveApproval = (requestId: string, approved: boolean) => {
    console.log(`${approved ? 'Approved' : 'Rejected'} leave request:`, requestId);
    setShowLeaveReview(null);
  };

  const CreateTaskForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
          <p className="text-gray-600 mt-1">Assign a new task to your team member</p>
        </div>
        <form className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the task requirements and objectives..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="">Select project...</option>
                {managedProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignee *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="">Select team member...</option>
                {mockTeamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCreateTask(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const LeaveReviewModal = ({ requestId }: { requestId: string }) => {
    const request = pendingLeaveRequests.find(r => r.id === requestId);
    const requester = teamMembers.find(u => u.id === request?.userId);
    
    if (!request || !requester) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Leave Request</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <img
                src={requester.avatar}
                alt={requester.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{requester.name}</p>
                <p className="text-sm text-gray-600">{getRoleDisplayName(requester.role)}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium capitalize">{request.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium">{formatDate(request.startDate)} - {formatDate(request.endDate)}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-gray-600 text-sm">Reason</p>
                <p className="font-medium">{request.reason}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleLeaveApproval(request.id, true)}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleLeaveApproval(request.id, false)}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => setShowLeaveReview(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            Team Lead Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Lead your team and drive project success</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateTask(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100">Team Members</p>
              <p className="text-3xl font-bold mt-2">5</p>
            </div>
            <Users className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Completed Tasks</p>
              <p className="text-3xl font-bold mt-2">{completedTasks}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Pending Approvals</p>
              <p className="text-3xl font-bold mt-2">{pendingLeaveRequests.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Active Projects</p>
              <p className="text-3xl font-bold mt-2">{managedProjects.filter(p => p.status === 'active').length}</p>
            </div>
            <Briefcase className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Team Members Overview Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Team Members Overview</h2>
                <p className="text-indigo-100 mt-1">Manage your team assignments and track progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full px-4 py-2 flex items-center space-x-2">
                <Badge className="w-5 h-5" />
                <span className="font-bold">Total: 5</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockTeamMembers.map((member) => {
              const IconComponent = member.icon;
              
              return (
                <div key={member.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-indigo-300">
                  {/* Member Header */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                      />
                      <div className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r ${member.color} rounded-full flex items-center justify-center shadow-lg`}>
                        <IconComponent className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600 font-medium">{member.assignedTask}</p>
                    </div>
                  </div>

                  {/* Task Type Badge */}
                  <div className="mb-4">
                    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r ${member.color} text-white shadow-md`}>
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{member.taskType.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Status and Progress */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getTaskStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-lg font-bold text-gray-900">{member.progress}%</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${getProgressColor(member.progress)} shadow-sm`}
                          style={{ width: `${member.progress}%` }}
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        {member.progress >= 90 ? '🎉 Excellent Progress' :
                         member.progress >= 80 ? '👍 Great Work' :
                         member.progress >= 70 ? '⚡ Good Progress' :
                         member.progress >= 60 ? '🔥 Keep Going' :
                         '💪 Getting Started'}
                      </div>
                    </div>

                    {/* Performance Indicators */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="text-sm font-bold text-blue-600">
                            {member.status === 'Completed' ? '✓' : Math.floor(Math.random() * 5) + 3}
                          </div>
                          <div className="text-xs text-blue-700">Tasks</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <div className="text-sm font-bold text-green-600">
                            {Math.floor(Math.random() * 20) + 80}%
                          </div>
                          <div className="text-xs text-green-700">Quality</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="text-sm font-bold text-purple-600">
                            {Math.floor(Math.random() * 15) + 85}%
                          </div>
                          <div className="text-xs text-purple-700">Efficiency</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <button className="flex-1 bg-indigo-100 text-indigo-700 py-2 px-3 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <button className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team Summary */}
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Team Summary</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600">5</div>
                <div className="text-sm text-gray-600">Total Members</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {mockTeamMembers.filter(m => m.status === 'Active').length}
                </div>
                <div className="text-sm text-gray-600">Active Tasks</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {mockTeamMembers.filter(m => m.status === 'Completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(mockTeamMembers.reduce((sum, m) => sum + m.progress, 0) / mockTeamMembers.length)}%
                </div>
                <div className="text-sm text-gray-600">Avg Progress</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-orange-600">87%</div>
                <div className="text-sm text-gray-600">Team Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Performance Comparison */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Team Performance Overview</span>
          </h3>
          <div className="h-80">
            <Bar data={teamPerformanceData} options={chartOptions} />
          </div>
        </div>

        {/* Productivity Trend */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <span>Team Productivity Trend</span>
          </h3>
          <div className="h-80">
            <Line data={productivityTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <PieChart className="w-6 h-6 text-green-600" />
            <span>Task Status Distribution</span>
          </h3>
          <div className="h-80">
            <Doughnut data={taskStatusData} options={doughnutOptions} />
          </div>
        </div>

        {/* Team Skills Assessment */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600" />
            <span>Team Skills Assessment</span>
          </h3>
          <div className="h-80">
           <Radar data={teamSkillsData} options={radarOptions} />

          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <ClipboardList className="w-6 h-6 text-green-600" />
                <span>Recent Team Tasks</span>
              </h3>
              <a href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All Tasks
              </a>
            </div>
            
            <div className="space-y-3">
              {teamTasks.slice(0, 5).map(task => {
                const assignee = teamMembers.find(u => u.id === task.assigneeId);
                const daysUntil = getDaysUntilDeadline(task.dueDate);
                const overdue = isOverdue(task.dueDate);
                
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <img
                            src={assignee?.avatar}
                            alt={assignee?.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>{assignee?.name}</span>
                        </div>
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          {overdue ? `${Math.abs(daysUntil)} days overdue` : 
                           daysUntil === 0 ? 'Due today' :
                           daysUntil > 0 ? `${daysUntil} days left` : 'Completed'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${task.progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{task.progressPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {teamTasks.length === 0 && (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No team tasks yet</p>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create your first task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Approvals & Quick Actions */}
        <div className="space-y-6">
          {/* Pending Leave Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span>Leave Requests</span>
              </h3>
              {pendingLeaveRequests.length > 0 && (
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  {pendingLeaveRequests.length} pending
                </span>
              )}
            </div>
            
            {pendingLeaveRequests.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaveRequests.slice(0, 3).map(request => {
                  const requester = teamMembers.find(u => u.id === request.userId);
                  return (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src={requester?.avatar}
                          alt={requester?.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{requester?.name}</p>
                          <p className="text-xs text-gray-600 capitalize">{request.type.replace('_', ' ')} leave</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                      <button
                        onClick={() => setShowLeaveReview(request.id)}
                        className="w-full bg-blue-50 text-blue-700 py-1 px-2 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        Review Request
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Star className="w-5 h-5 text-indigo-600" />
              <span>Quick Actions</span>
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowCreateTask(true)}
                className="w-full bg-white text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center space-x-2 border border-gray-200"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
              <a
                href="/team-progress"
                className="w-full bg-white text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center space-x-2 border border-gray-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Team Analytics</span>
              </a>
              <a
                href="/projects"
                className="w-full bg-white text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center space-x-2 border border-gray-200"
              >
                <Briefcase className="w-4 h-4" />
                <span>Manage Projects</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateTask && <CreateTaskForm />}
      {showLeaveReview && <LeaveReviewModal requestId={showLeaveReview} />}
    </div>
  );
};

export default TeamLeadDashboard;