import React, { useState } from 'react';
import { Plus, Users, ClipboardList, Calendar, TrendingUp, CheckCircle, Clock, AlertTriangle, Edit, Trash2, Eye, Filter, Search, Target, Award, Star, Send, MessageSquare } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import { mockUsers, mockTasks as initialTasks, mockProjects } from '../../data/mockData';
import { formatDate, getDaysUntilDeadline, isOverdue } from '../../utils/dateUtils';
import { getRoleDisplayName } from '../../utils/auth';

interface TeamTaskManagementProps {
  onCreateTask: () => void;
}

const TeamTaskManagement: React.FC<TeamTaskManagementProps> = ({ onCreateTask }) => {
  const user = getCurrentUser();
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get team members under this manager
  const teamMembers = user ? mockUsers.filter(u => u.managerId === user.id) : [];
  
  // Get tasks assigned to team members
  const teamTasks = tasks.filter(t => 
    teamMembers.some(member => member.id === t.assigneeId)
  );

  // Filter tasks
  const filteredTasks = teamTasks.filter(task => {
    const assignee = teamMembers.find(u => u.id === task.assigneeId);
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignee?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate metrics
  const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = teamTasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks = teamTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed').length;
  const totalTasks = teamTasks.length;

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: string, progress: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus as any, progressPct: progress }
        : task
    ));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'review': return <AlertTriangle className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const TaskCard = ({ task }: { task: any }) => {
    const assignee = teamMembers.find(u => u.id === task.assigneeId);
    const project = mockProjects.find(p => p.id === task.projectId);
    const daysUntil = getDaysUntilDeadline(task.dueDate);
    const overdue = isOverdue(task.dueDate);

    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPriorityColor(task.priority)}`}>
                {task.priority.toUpperCase()}
              </span>
              {getStatusIcon(task.status)}
            </div>
            <p className="text-gray-600 mb-3 leading-relaxed">{task.description}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <ClipboardList className="w-4 h-4" />
                <span>{project?.title || 'No Project'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className={overdue ? 'text-red-600 font-medium' : ''}>
                  {overdue ? `${Math.abs(daysUntil)} days overdue` : 
                   daysUntil === 0 ? 'Due today' :
                   daysUntil > 0 ? `${daysUntil} days left` : 'Completed'}
                </span>
              </div>
            </div>

            {/* Assignee Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
              <img
                src={assignee?.avatar}
                alt={assignee?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div>
                <p className="font-medium text-gray-900">{assignee?.name}</p>
                <p className="text-sm text-gray-600">{getRoleDisplayName(assignee?.role || 'employee')}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => {
                setSelectedTask(task.id);
                setShowTaskDetails(true);
              }}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedTask(task.id);
                setShowProgressUpdate(true);
              }}
              className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
              title="Update Progress"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-lg font-bold text-gray-900">{task.progressPct}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                task.progressPct >= 90 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                task.progressPct >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                task.progressPct >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                'bg-gradient-to-r from-red-400 to-red-600'
              }`}
              style={{ width: `${task.progressPct}%` }}
            />
          </div>
          
          <div className="text-center text-xs text-gray-500">
            {task.progressPct >= 90 ? '🎉 Almost Complete!' :
             task.progressPct >= 70 ? '🚀 Great Progress' :
             task.progressPct >= 50 ? '⚡ Making Progress' :
             task.progressPct >= 25 ? '🔥 Getting Started' :
             '💪 Just Started'}
          </div>
        </div>
      </div>
    );
  };

  const ProgressUpdateModal = () => {
    const task = tasks.find(t => t.id === selectedTask);
    const [newStatus, setNewStatus] = useState(task?.status || 'todo');
    const [newProgress, setNewProgress] = useState(task?.progressPct || 0);
    const [comments, setComments] = useState('');

    if (!task) return null;

    const handleUpdate = () => {
      handleUpdateTaskStatus(selectedTask!, newStatus, newProgress);
      setShowProgressUpdate(false);
      setSelectedTask(null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Update Task Progress</h3>
            <p className="text-gray-600 mt-1">Update progress for: {task.title}</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as "todo" | "in_progress" | "review" | "completed")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Under Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Progress ({newProgress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any comments about the progress update..."
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex space-x-3">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Update Progress</span>
            </button>
            <button
              onClick={() => {
                setShowProgressUpdate(false);
                setSelectedTask(null);
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
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
          <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            <span>Team & Task Management</span>
          </h2>
          <p className="text-gray-600 mt-2">Manage your team's tasks and track progress</p>
        </div>
        <button
          onClick={onCreateTask}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Tasks</p>
              <p className="text-3xl font-bold mt-2">{totalTasks}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Completed</p>
              <p className="text-3xl font-bold mt-2">{completedTasks}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">In Progress</p>
              <p className="text-3xl font-bold mt-2">{inProgressTasks}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Overdue</p>
              <p className="text-3xl font-bold mt-2">{overdueTasks}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Team Members Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Users className="w-6 h-6 text-purple-600" />
          <span>Team Members</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map(member => {
            const memberTasks = teamTasks.filter(t => t.assigneeId === member.id);
            const completedCount = memberTasks.filter(t => t.status === 'completed').length;
            const avgProgress = memberTasks.length > 0 
              ? Math.round(memberTasks.reduce((sum, task) => sum + task.progressPct, 0) / memberTasks.length)
              : 0;

            return (
              <div key={member.id} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{getRoleDisplayName(member.role)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-lg font-bold text-blue-600">{memberTasks.length}</p>
                    <p className="text-xs text-blue-700">Tasks</p>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <p className="text-lg font-bold text-green-600">{completedCount}</p>
                    <p className="text-xs text-green-700">Done</p>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <p className="text-lg font-bold text-purple-600">{avgProgress}%</p>
                    <p className="text-xs text-purple-700">Avg</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks or team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Under Review</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus || filterPriority 
              ? 'Try adjusting your search criteria.' 
              : 'Create your first task to get started.'
            }
          </p>
          <button
            onClick={onCreateTask}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Task
          </button>
        </div>
      )}

      {/* Modals */}
      {showProgressUpdate && <ProgressUpdateModal />}
    </div>
  );
};

export default TeamTaskManagement;