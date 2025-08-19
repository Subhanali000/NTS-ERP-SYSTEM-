import React, { useState, useEffect } from 'react';
import { MultiValue } from 'react-select';
import axios from 'axios';
import { getCurrentUser, getSimpleDesignation } from '../utils/auth';
import { getCurrentDate } from '../utils/dateUtils';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Award, 
  TrendingUp, 
  Users, XCircle,
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MessageSquare, 
  X, 
  Send,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import Select from 'react-select';

type AvailableUser = {
  id: string;
  name: string;
  isCurrentUser?: boolean;
};

type TaskOption = {
  label: string;
  value: number;
  isDisabled?: boolean;
};

type FormData = {
  progress: number;
  accomplishments: string;
  challenges: string;
  tomorrowPlan: string;
  tasks: number[];
};
type Report = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  managerFeedback?: string;
  tasks: { title: string }[] | number[];
  // add other fields as needed
};
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Normalize role access
const getUserAccessLevel = (role: string): 'director' | 'manager' | 'employee' => {
  const normalized = role?.toLowerCase().replace(/\s+/g, '_') || '';
  if (normalized.includes('director') || normalized.includes('ceo')) return 'director';
  if (
    normalized.includes('manager') ||
    normalized.includes('lead') ||
    normalized === 'project_tech_manager'
  )
    return 'manager';
  return 'employee';
};

// Get team members user can access
const getAccessibleTeamMembers = (user: any, teamMembers: any[]): any[] => {
  if (!user || !Array.isArray(teamMembers)) return [];

  console.log('Getting accessible team members for user:', user);
  console.log('Available team members:', teamMembers);

  const accessLevel = getUserAccessLevel(user.role);
  console.log('User access level:', accessLevel);

  if (accessLevel === 'director') {
    // Directors can see all team members
    return teamMembers;
  }

  if (accessLevel === 'manager') {
    // Managers can see themselves and their direct reports
    const directReports = teamMembers.filter((m) => m.manager_id === user.id);
    const selfInTeam = teamMembers.find((m) => m.id === user.id);
    
    // If manager is not in the team list, add them
    if (!selfInTeam) {
      return [user, ...directReports];
    }
    
    return [selfInTeam, ...directReports.filter(m => m.id !== user.id)];
  }

  // Employees can only see themselves
  const selfInTeam = teamMembers.find((m) => m.id === user.id);
  return selfInTeam ? [selfInTeam] : [user];
};

const TeamProgress: React.FC = () => {
  const [user] = useState(() => getCurrentUser() || { id: '', role: 'employee' });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState(user?.id || '');
  const [reportUser, setReportUser] = useState<{ id: string; name: string } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showViewReport, setShowViewReport] = useState(false);
  const [viewingReport, setViewingReport] = useState<any>(null);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);

const [formData, setFormData] = useState<FormData>({
  progress: 0,
  accomplishments: '',
  challenges: '',
  tomorrowPlan: '',
  tasks: [],
});

  const canViewTeam = getUserAccessLevel(user.role) !== 'employee';
  const userAccessLevel = getUserAccessLevel(user.role);

  // Fetch data
  useEffect(() => {
  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [reportRes, teamRes] = await Promise.all([
        axios.get(`${baseURL}/api/manager/progress-reports`, { headers }),
        canViewTeam
          ? axios.get(`${baseURL}/api/manager/users/team`, { headers }).catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: [user] }),
      ]);

      console.log('Team members fetched:', teamRes.data);
      console.log('Reports fetched:', reportRes.data);

      const normalizedReports = reportRes.data.map((report: any) => {
        const status = report.status || 'pending'; // ✅ fallback to 'pending'

        return {
          ...report,
          userId: report.user_id,
          date: report.report_date?.split('T')[0] || report.created_at?.split('T')[0],
          submittedAt: report.submitted_at || report.created_at || null,
          submitted: true,
          progress: report.progress_percent || report.progress || 0,
          accomplishments: report.accomplishments || '',
          challenges: report.challenges || '',
          tomorrowPlan: report.tomorrow_plan || '',
          tasks: report.taskCount || 0,
          taskDetails: Array.isArray(report.tasks) && typeof report.tasks[0] === 'object'
            ? report.tasks.map((task: any) => task.title || 'Untitled Task')
            : [],
          approved: status === 'approved',         // ✅ interpret status
          rejected: status === 'rejected',         // ✅ add rejected flag
          pending: status === 'pending',           // ✅ optional: track pending
          status: status,                          // ✅ retain raw status
          managerFeedback: report.manager_feedback || '',
        };
      });

      console.log("Approved status of first report:", normalizedReports[0]?.approved);

      setReports(normalizedReports);
      // Handle the nested data structure from your API
      const teamData = teamRes.data?.data ? teamRes.data.data : (Array.isArray(teamRes.data) ? teamRes.data : []);
      setTeamMembers(teamData);
      
      console.log('Accessible team members:', getAccessibleTeamMembers(user, teamData));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Could not load team or report data.');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [user.id, canViewTeam]);


  // Update user reports when selectedUser changes
  useEffect(() => {
    const filtered = reports.filter(
      (r) => r.userId === selectedUser || r.user_id === selectedUser
    );
    setUserReports(filtered);
  }, [selectedUser, reports]);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!user?.id) return;

        const token = localStorage.getItem("token");
        const apiRole = getSimpleDesignation(user.role);

        const res = await fetch(`${baseURL}/api/${apiRole}/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch tasks");

        const data = await res.json();
        const formattedTasks = data
          .map((task: any) => ({
            label: task.title + (task.status === "completed" ? " (Completed)" : ""),
            value: task.id,
            isDisabled: task.status === "completed",
          }))
          .sort((a: any, b: any) =>
            a.isDisabled === b.isDisabled ? 0 : a.isDisabled ? 1 : -1
          );

        setAvailableTasks(formattedTasks);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
        setAvailableTasks([]);
      }
    };

    if (user?.id && availableTasks.length === 0) {
      fetchTasks();
    }
  }, [user?.id, availableTasks.length]);

  // Handle approval/rejection
const handleApproval = async (isApproved: boolean) => {
  if (!viewingReport) return;

  try {
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const apiRole = getSimpleDesignation(user.role);

    await axios.post(
      `${baseURL}/api/${apiRole}/progress-reports/${viewingReport.id}/review`,//manager routes
      {
        managerFeedback: feedback,
        approved: isApproved,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const newStatus = isApproved ? 'approved' : 'rejected';

    // Update the report in state
    setReports(prevReports => 
      prevReports.map(report => 
        report.id === viewingReport.id 
          ? { ...report, status: newStatus, managerFeedback: feedback }
          : report
      )
    );

    setViewingReport((prev: Report | null) =>
  prev ? { ...prev, status: 'approved', managerFeedback: feedback } : prev
);


    alert(`Report ${isApproved ? 'approved' : 'rejected'} successfully`);
    setFeedback('');
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Failed to submit review.');
  } finally {
    setIsSubmitting(false);
  }
};


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-xl">Loading...</div></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600"><div>Error: {error}</div></div>;

  // Build user options
  const accessibleTeamMembers = getAccessibleTeamMembers(user, teamMembers);
  console.log('Final accessible team members:', accessibleTeamMembers);
  
  const getUserDisplayName = (member: any) => {
    if (!member) return 'Unknown User';
    
    // Try different name fields
    if (member.name?.trim()) return member.name.trim();
    
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    if (fullName) return fullName;
    
    if (member.email) return member.email;
    
    return 'Unnamed User';
  };

  const availableUsers: AvailableUser[] = canViewTeam
    ? accessibleTeamMembers.map((m) => {
        const displayName = getUserDisplayName(m);
        return {
        id: m.id,
        name: displayName,
        isCurrentUser: m.id === user.id,
      };
    })
    : [{ id: user.id, name: 'My Progress', isCurrentUser: true }];

  console.log('Available users for dropdown:', availableUsers);

  // Calendar View Component
  const CalendarView: React.FC<any> = () => {
    const today = getCurrentDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = [];
    const isCurrentUser = selectedUser === user?.id;

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const reportData = userReports.find((r) => r.date === dateStr);
      const isToday = dateStr === today;
      const isPast = new Date(dateStr) < new Date(today);
      const isFuture = new Date(dateStr) > new Date(today);

      days.push(
        <div
          key={day}
          onClick={() => {
            if (isFuture) return;

            const isSubmitted = reportData?.submitted;
            const isOwnUnsubmittedToday = isToday && !isSubmitted && isCurrentUser;

            if (isOwnUnsubmittedToday) {
              setSelectedDate(dateStr);
              setShowSubmitForm(true);
              return;
            }

            if (isSubmitted) {
              setViewingReport(reportData);
              const reportUser = availableUsers.find(
                (u) => u.id === (reportData.userId || reportData.user_id)
              );
              setReportUser(reportUser || null);
              setShowViewReport(true);
            }
          }}
          className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 min-h-[160px] hover:shadow-lg transform hover:scale-105 ${
            isToday
              ? 'bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200 border-blue-500 ring-2 ring-blue-300 shadow-xl'
              : isPast && reportData?.submitted
              ? 'bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 border-green-300 hover:bg-green-100'
              : isPast && !reportData?.submitted
              ? 'bg-gradient-to-br from-red-50 via-red-100 to-pink-100 border-red-300'
              : isFuture
              ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-lg font-bold text-gray-900 mb-2">{day}</div>

          {reportData?.submitted && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-semibold">Submitted</span>
                <span className="text-xs text-gray-500">
                  {reportData?.submittedAt
                    ? new Date(reportData.submittedAt).toLocaleString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </span>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">{reportData.progress}%</span>
                  <div className="flex items-center space-x-1">
                    {reportData.approved ? (
                      <Award className="w-3 h-3 text-green-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-yellow-600" />
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      reportData.progress >= 90
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : reportData.progress >= 80
                        ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                        : reportData.progress >= 70
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                        : reportData.progress >= 60
                        ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${reportData.progress}%` }}
                  />
                </div>
<div className="text-xs text-gray-600 mb-2">
  {reportData.tasks || 0} tasks •{" "}
  <span
    className={`px-2 py-0.5 rounded font-semibold ${
      reportData.status === "approved"
        ? "bg-green-100 text-green-800"
        : reportData.status === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800"
    }`}
  >
    {reportData.status === "approved"
      ? "Approved"
      : reportData.status === "rejected"
      ? "Rejected"
      : "Under Review"}
  </span>
</div>



                {reportData.managerFeedback && (
                  <div className="bg-blue-50 rounded p-2 mb-2">
                    <div className="flex items-center space-x-1 mb-1">
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">Feedback</span>
                    </div>
                    <p className="text-xs text-blue-700 line-clamp-2">{reportData.managerFeedback}</p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-2 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow flex items-center justify-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>View Details</span>
              </div>
            </div>
          )}

          {isToday && !reportData?.submitted && isCurrentUser && (
            <div className="mt-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-2 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow animate-pulse">
                📝 Submit Today's Report
              </div>
            </div>
          )}

          {isPast && !reportData?.submitted && isCurrentUser && (
            <div className="mt-2">
              <div className="bg-red-100 border border-red-300 text-red-700 text-xs font-medium px-2 py-1 rounded-lg text-center">
                ❌ Missing Report
              </div>
            </div>
          )}
        </div>
      );
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
      if (direction === 'prev') {
        if (currentMonth === 0) {
          setCurrentMonth(11);
          setCurrentYear(currentYear - 1);
        } else {
          setCurrentMonth(currentMonth - 1);
        }
      } else {
        if (currentMonth === 11) {
          setCurrentMonth(0);
          setCurrentYear(currentYear + 1);
        } else {
          setCurrentMonth(currentMonth + 1);
        }
      }
    };

    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <p className="text-blue-100 mt-1">Team Progress Reports Calendar</p>
            </div>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {canViewTeam && (
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-white" />
                <span className="font-medium text-white">Viewing:</span>
              </div>

              <select
                value={selectedUser}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  console.log('Selected user ID:', selectedId);
                  setSelectedUser(selectedId);
                }}
                className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:bg-white/30 focus:outline-none min-w-[200px]"
              >
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id} className="text-gray-900">
                    {user.name} {user.isCurrentUser ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-bold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {days}
          </div>
        </div>
      </div>
    );
  };

  // Submit Progress Form Component
  const SubmitProgressForm: React.FC<any> = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');

        await axios.post(
          `${baseURL}/api/manager/progress-reports`,
          {
            report_date: selectedDate,
            progress_percent: formData.progress,
            accomplishments: formData.accomplishments,
            challenges: formData.challenges,
            tomorrow_plan: formData.tomorrowPlan,
            task_completed: formData.tasks,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Refresh reports
        const response = await axios.get(
          `${baseURL}/api/manager/progress-reports`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const normalizedReports = response.data.map((report: any) => ({
          ...report,
          userId: report.user_id,
          date: report.report_date?.split('T')[0] || report.created_at?.split('T')[0] || report.date,
          submitted: true,
          submittedAt: report.created_at,
          progress: report.progress_percent || 0,
          accomplishments: report.accomplishments || '',
          challenges: report.challenges || '',
          tomorrowPlan: report.tomorrow_plan || '',
          tasks: report.taskCount || 0,
          taskDetails: report.tasks || [],
          approved: report.approved || false,
          managerFeedback: report.manager_feedback || '',
        }));

        setReports(normalizedReports);
        setFormData({
          progress: 0,
          accomplishments: '',
          challenges: '',
          tomorrowPlan: '',
          tasks: [],
        });
        setShowSubmitForm(false);
        alert('Report submitted successfully!');
      } catch (error) {
        console.error('Error submitting report:', error);
        setError('Failed to submit report. Please try again.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Submit Daily Progress Report</h3>
                <p className="text-blue-100 mt-1">Date: {formatDate(selectedDate)}</p>
              </div>
              <button
                onClick={() => setShowSubmitForm(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 pt-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">Tasks Completed</label>
            <Select
              isMulti
              options={availableTasks}
              value={availableTasks.filter((task: TaskOption) => formData.tasks.includes(task.value))}
              onChange={(selectedOptions: MultiValue<TaskOption>) =>
                setFormData(prev => ({
                  ...prev,
                  tasks: selectedOptions.map(option => option.value),
                }))
              }
              className="w-full"
              placeholder="Select tasks..."
              isClearable={false}
              isSearchable
              getOptionLabel={e => e.label}
              getOptionValue={(e) => e.value.toString()}
              isOptionDisabled={option => option.isDisabled === true}
            />
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 pt-0">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Overall Progress (%)</label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      progress: parseInt(e.target.value),
                    }))
                  }
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>0%</span>
                  <span className="text-lg font-bold text-blue-600">{formData.progress}%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    formData.progress >= 90 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    formData.progress >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                    formData.progress >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    formData.progress >= 60 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                  style={{ width: `${formData.progress}%` }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Key Accomplishments *
              </label>
              <textarea
                value={formData.accomplishments}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    accomplishments: e.target.value,
                  }))
                }
                rows={3}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Describe your key accomplishments for today..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Challenges Faced</label>
              <textarea
                value={formData.challenges}
                onChange={e => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                rows={3}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Any challenges or blockers encountered..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Tomorrow's Plan</label>
              <textarea
                value={formData.tomorrowPlan}
                onChange={e => setFormData(prev => ({ ...prev, tomorrowPlan: e.target.value }))}
                rows={3}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="What do you plan to work on tomorrow..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Send className="w-5 h-5" />
                <span>Submit Report</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-400 transition-colors font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // View Report Modal Component
  const ViewReportModal: React.FC<any> = () => {
    if (!viewingReport) return null;

    const isManagerOrDirector = userAccessLevel === 'manager' || userAccessLevel === 'director';
const isNotSelf = selectedUser !== user.id;

const canApprove = isManagerOrDirector && isNotSelf;


    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Progress Report Details</h3>
                <p className="text-green-100 mt-1">
                  {reportUser?.name} - {formatDate(viewingReport.date)}
                </p>
                <p className="text-green-100 text-sm">
                  Submitted: {viewingReport.submittedAt ? new Date(viewingReport.submittedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setShowViewReport(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">Progress Overview</h4>
                <div className="flex items-center space-x-2">
                 {viewingReport.status === 'approved' ? (
  <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
    <CheckCircle className="w-4 h-4" />
    <span className="text-sm font-bold">Approved</span>
  </div>
) : viewingReport.status === 'rejected' ? (
  <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full">
    <XCircle className="w-4 h-4" />
    <span className="text-sm font-bold">Rejected</span>
  </div>
) : (
  <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
    <Clock className="w-4 h-4" />
    <span className="text-sm font-bold">Under Review</span>
  </div>
)}

                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          viewingReport.progress >= 90 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          viewingReport.progress >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          viewingReport.progress >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          viewingReport.progress >= 60 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${viewingReport.progress}%` }}
                      />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{viewingReport.progress}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tasks Completed</p>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {Array.isArray(viewingReport.taskDetails) ? viewingReport.taskDetails.length : 0} Tasks
                  </p>

                  {Array.isArray(viewingReport.taskDetails) && viewingReport.taskDetails.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside text-gray-700 text-sm">
                      {viewingReport.taskDetails.map((title: string, idx: number) => (
                        <li key={idx}>{title}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No tasks completed</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-green-600" />
                <span>Key Accomplishments</span>
              </h4>
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <p className="text-gray-700 leading-relaxed">
                  {viewingReport.accomplishments || "No accomplishments recorded for this date."}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Challenges Faced</span>
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-gray-700 leading-relaxed">
                  {viewingReport.challenges || "No challenges recorded for this date."}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Next Day's Plan</span>
              </h4>
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-gray-700 leading-relaxed">
                  {viewingReport.tomorrowPlan || "No plans recorded for the next day."}
                </p>
              </div>
            </div>
{canApprove && viewingReport?.status === 'pending' && (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
      <MessageSquare className="w-5 h-5 text-indigo-600" />
      <span>Manager Review</span>
    </h4>

    <textarea
      className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:ring focus:ring-indigo-200"
      rows={4}
      placeholder="Write your feedback here..."
      value={feedback}
      onChange={(e) => setFeedback(e.target.value)}
    />

    <div className="flex items-center space-x-4 mt-4">
      <button
        onClick={() => handleApproval(true)}
        disabled={isSubmitting}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{isSubmitting ? 'Approving...' : 'Approve'}</span>
      </button>

      <button
        onClick={() => handleApproval(false)}
        disabled={isSubmitting}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ThumbsDown className="w-4 h-4" />
        <span>{isSubmitting ? 'Rejecting...' : 'Reject'}</span>
      </button>
    </div>
  </div>
)}

            {viewingReport.managerFeedback && (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
      <MessageSquare className="w-5 h-5 text-purple-600" />
      <span>Manager Feedback</span>
    </h4>
    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
      <p className="text-gray-700 leading-relaxed">{viewingReport.managerFeedback}</p>
    </div>
  </div>
)}
          </div>

          {/* Close button */}

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowViewReport(false)}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors font-bold"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        {selectedUser !== user.id && (
          <div className="mb-4">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              <Users className="w-4 h-4" />
              <span className="font-medium">
                Viewing: {availableUsers.find(u => u.id === selectedUser)?.name}
              </span>
            </div>
          </div>
        )}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
          {selectedUser !== user.id 
            ? `${availableUsers.find(u => u.id === selectedUser)?.name}'s Progress Reports`
            : userAccessLevel === 'director' ? 'Director Dashboard - Progress Reports' :
              userAccessLevel === 'manager' ? 'Manager Dashboard - Team Progress' :
              'My Progress Reports'}
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          {selectedUser !== user.id 
            ? `Individual progress tracking for ${availableUsers.find(u => u.id === selectedUser)?.name}`
            : userAccessLevel === 'director' ? 'Monitor progress across all managers and teams' :
              userAccessLevel === 'manager' ? 'Monitor daily progress across your team' :
              'Track your daily progress and submissions'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">This Month</p>
              <p className="text-3xl font-bold mt-2">
                {userReports.filter(r => r.submitted).length}
              </p>
              <p className="text-blue-100 text-sm">Reports Submitted</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Approved</p>
              <p className="text-3xl font-bold mt-2">
                {userReports.filter(r => r.approved).length}
              </p>
              <p className="text-green-100 text-sm">Reports Approved</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Pending Review</p>
              <p className="text-3xl font-bold mt-2">
                {userReports.filter(r => r.submitted && !r.approved).length}
              </p>
              <p className="text-orange-100 text-sm">Awaiting Review</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Avg Progress</p>
              <p className="text-3xl font-bold mt-2">
                {userReports.filter(r => r.submitted).length > 0
                  ? Math.round(
                      userReports
                        .filter(r => r.submitted)
                        .reduce((sum, r) => sum + r.progress, 0) /
                      userReports.filter(r => r.submitted).length
                    )
                  : 0
                }%
              </p>
              <p className="text-purple-100 text-sm">This Month</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      <CalendarView />

      {showSubmitForm && <SubmitProgressForm />}
      {showViewReport && viewingReport && <ViewReportModal />}
    </div>
  );
};

export default TeamProgress;
