import React, { useState, useEffect, ReactNode, Key } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Users,
  ClipboardList,
  Calendar,
  TrendingUp,
  CheckCircle,
  Briefcase,
  BarChart3,
  Plus,
  Clock,
  AlertTriangle,
  MessageSquare,
  Award,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { getCurrentUser, getRoleDisplayName } from "../utils/auth";
import {
  formatDate,
  getDaysUntilDeadline,
  isOverdue,
  getRelativeDate,
} from "../utils/dateUtils";
import { getPriorityColor, getStatusColor } from "../utils/colors";
import AddEmployee from "../components/Manager/AddEmployee";
import { LeaveRequest, ProgressReport, Task, User} from "../types";


interface LeaveReviewModalProps {
  requestId: string;
  leaveRequests: LeaveRequest[];
  teamMembers: User[];
 
  comment: string;
  setComment: (value: string) => void;
   onApprove: (id: string, approved: boolean, commentsText: string) => void; 
  onClose: () => void;
}

interface ProgressReviewModalProps {
  reportId: string;
  reports: ProgressReport[];
  tasks: Task[];
  employees: User[];
  onApprove: (reportId: string, approved: boolean, comments: string) => void;
  onClose: () => void;
}

interface CreateTaskFormProps {
  onClose: () => void;
  onSave: (task: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    priority: string;
    dueDate: string;
  }) => void;
  teamMembers: User[];
  projects: Project[];
}
type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "approved";

interface Project {
  title: ReactNode;
  id: Key | null | undefined;
  status: ProjectStatus;
  // other fields...
}
const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  onClose,
  onSave,
  teamMembers,
  projects,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !projectId || !assigneeId || !dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    onSave({ title, description, projectId, assigneeId, priority, dueDate });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Task
            </h3>
            <p className="text-gray-600 mt-1">
              Assign a new task to your team member
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the task requirements and objectives..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Select project...</option>
                {projects.map((project) => (
                  <option key={String(project.id)} value={project.id != null ? String(project.id) : ""}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignee *
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Select team member...</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  requestId,
  leaveRequests,
  teamMembers,
comment,
  setComment,
  onApprove,
  onClose,
}) => {
  const request = leaveRequests.find((r) => r.id === requestId);
  const requester = teamMembers.find((u) => u.id === request?.userId);

  if (!request || !requester) return null;

return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Review Leave Request
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center space-x-3">
          <img
            src={requester.avatar}
            alt={requester.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-gray-900">{requester.name}</p>
            <p className="text-sm text-gray-600">
              {getRoleDisplayName(requester.role)}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Type</p>
              <p className="font-medium capitalize">
                {request.type ? request.type.replace("_", " ") : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-medium">
                {formatDate(request.startDate)} - {formatDate(request.endDate)}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-gray-600 text-sm">Reason</p>
            <p className="font-medium">{request.reason}</p>
          </div>
        </div>

        {/* Comment Section */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manager's Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment about this request..."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => onApprove(request.id, true, comment)}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Approve</span>
        </button>
        <button
          onClick={() => onApprove(request.id, false, comment)}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  </div>
);
};

const ProgressReviewModal: React.FC<ProgressReviewModalProps> = ({
  reportId,
  reports,
  tasks,
  employees,
  onApprove,
  onClose,
}) => {
  const [comments, setComments] = React.useState("");
  const report = reports.find((r) => r.id === reportId);
  const task = tasks.find((t) => t.id === report?.taskId);
  const employee = employees.find((e) => e.id === report?.userId);

 

  if (!report || !task || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Review Progress Report
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mb-6">
          <div className="flex items-center space-x-3">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900">{employee.name}</p>
              <p className="text-sm text-gray-600">
                {getRoleDisplayName(employee.role)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{task.description}</p>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${report.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {report.progress}%
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Updated {getRelativeDate(report.timestamp)}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Employee Comments
            </h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-700">{report.comments}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager Feedback
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide feedback on the progress report..."
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onApprove(report.id, true, comments)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => onApprove(report.id, false, comments)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Request Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ManagerDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [teams, setTeams] = useState<any[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [comment, setComment] = useState("");
const [membersCount, setMembersCount] = useState(0);

const [managerComment, setManagerComment] = useState("");
const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showLeaveReview, setShowLeaveReview] = useState<string | null>(null);
  const [showProgressReview, setShowProgressReview] = useState<string | null>(
    null
  );
// ✅ Manual invalid token handler
  const handleInvalidToken = () => {
    alert('⚠️ Session expired or invalid. Please login again.');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoleLabel');
    window.location.href = '/login';
  }; 
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      setUser(currentUser);

      const token = localStorage.getItem("token");
     if (!token) {
          handleInvalidToken();
          return;
        }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      // Fetch all necessary data
      const [
        teamRes,
        tasksRes,
        leavesRes,
        reportsRes,
        projectsRes
      ] = await Promise.all([
        axios.get(`https://nts-erp-system-629k.vercel.app/api/manager/users/team`, config),
        axios.get(`https://nts-erp-system-629k.vercel.app/api/manager/tasks`, config),
        axios.get(`https://nts-erp-system-629k.vercel.app/api/manager/leaves`, config),
        axios.get(`https://nts-erp-system-629k.vercel.app/api/manager/progress-reports`, config),
        axios.get(`https://nts-erp-system-629k.vercel.app/api/manager/active-projects`, config),
      ]);

      const mappedTeamMembers = Array.isArray(teamRes.data) ? teamRes.data : [];
      const mappedTasks = Array.isArray(tasksRes.data) ? tasksRes.data.map(t => ({
        ...t,
        taskId: t.id,
        projectId: t.project_id,
        status: t.status,
        assigneeId: t.user_id,
        progressPct: t.progress_percent,
        dueDate: t.due_date,
      })) : [];
      const mappedProjects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const mappedProgressReports = Array.isArray(reportsRes.data) ? reportsRes.data.map(r => ({
        ...r,
        userId: r.user_id,
        taskId: r.task_id,
        progress: r.progress_percent,
      })) : [];
      const mappedLeaves = Array.isArray(leavesRes.data) ? leavesRes.data.map(lr => ({
        ...lr,
        userId: lr.user_id,
        type: lr.leave_type,
        startDate: lr.start_date,
        endDate: lr.end_date,
        managerApproval: lr.manager_approval,
        directorApproval: lr.director_approval,
        createdAt: lr.created_at,
      })) : [];

      setTeamMembers(mappedTeamMembers);
      setTasks(mappedTasks);
      setProjects(mappedProjects);
      setProgressReports(mappedProgressReports);
      setLeaveRequests(mappedLeaves);

     const membersCount = mappedTeamMembers.length;
setMembersCount(membersCount);
console.log("📌 Team Member Count:", membersCount);

setMembersCount(membersCount);


      // Enrich each member
      const enrichedMembers = mappedTeamMembers.map(member => {
        const memberTasks = mappedTasks.filter(task => task.assigneeId === member.id);
        const memberProgressReports = mappedProgressReports.filter(r => r.userId === member.id);

        const avgProgress = memberProgressReports.length
          ? Math.round(memberProgressReports.reduce((sum, r) => sum + (r.progress || 0), 0) / memberProgressReports.length)
          : 0;

        return {
          ...member,
          tasks: memberTasks,
          avgProgress
        };
      });

      setTeams(enrichedMembers);
      console.log("Team Member Count:", membersCount);

    }  catch (error: any) {
      
      // ✅ Check for 401 / 403
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleInvalidToken();
        return;
      }
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);



const handleReviewClick = (reportId: string) => {
  const report = progressReports.find((r) => r.id === reportId);
  setSelectedReport(report);
  setManagerComment("");
  setShowProgressReview(reportId);
};


  const handleLeaveApproval = async (
  requestId: string,
  approved: boolean,
  commentsText: string // pass the comment from the UI
) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not logged in");
      return;
    }

    const payload = {
      leaveId: requestId,
      status: approved ? "approved" : "rejected",
      role: "manager",
      comments: commentsText?.trim() || null, // ✅ match backend field
    };

    console.log("📤 Sending leave approval payload:", payload);

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    await axios.post(
      `https://nts-erp-system-629k.vercel.app/api/manager/approve-leaves`,
      payload,
      config
    );

    setLeaveRequests((prev) =>
      prev.map((lr) =>
        lr.id === requestId
          ? { ...lr, managerApproval: approved ? "approved" : "rejected", comments: commentsText }
          : lr
      )
    );
  } catch (err) {
    console.error("❌ Leave approval error:", err);
    setError("Failed to update leave request");
  }
  setShowLeaveReview(null);
};

  const handleProgressApproval = async (
  reportId: string,
  approved: boolean,
  comments?: string
) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not logged in");
      return;
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    await axios.post(
      `https://nts-erp-system-629k.vercel.app/api/manager/report/approve`,
      {
        reportId,
        status: approved ? "approved" : "rejected",
        manager_feedback: comments || "",
      },
      config
    );

    setProgressReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: approved ? "approved" : "rejected",
              manager_feedback: comments || "",
              approved_by: "me", // Optional: mark locally without reload
              approved_at: new Date().toISOString(),
            }
          : r
      )
    );
  } catch (err) {
    console.error("Progress approval error:", err);
    setError("Failed to update progress report");
  }
  setShowProgressReview(null);
};

  const handleAddEmployee = async (newEmployee: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not logged in");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const res = await axios.post(
        `https://nts-erp-system-629k.vercel.app/api/manager/add-employee`,
        newEmployee,
        config
      );
      setTeamMembers((prev) => [...prev, res.data]);
      setShowAddEmployee(false);
    } catch (error: any) {
      console.error("Error adding employee:", error);
      setError("Failed to add employee");
    }
  };

  const handleCreateTask = async (newTask: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not logged in");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const res = await axios.post(
        `https://nts-erp-system-629k.vercel.app/api/manager/task`,
        {
          ...newTask,
          status: "todo",
          progressPct: 0,
        },
        config
      );

      setTasks((prev) => [...prev, res.data]);
      setShowCreateTask(false);
    } catch (error: any) {
      console.error("Error creating task:", error);
      setError("Failed to create task");
    }
  };

  // Derived data
  const pendingLeaveRequests = leaveRequests.filter((lr) => 
    lr && lr.status === "pending"
  );
  const pendingReports = Array.isArray(progressReports)
    ? progressReports.filter((r) => !r.approved).length
    : 0;
 const teamTasks = tasks.filter((task) =>
  task && teamMembers.some((member) => member && member.id === task.assigneeId)
);
const getDaysUntilDeadline = (dueDate: string | Date | null) => {
  if (!dueDate) return null; // No due date
  const deadline = new Date(dueDate);
  const now = new Date();
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const completedTasksCount = teamTasks.filter(
  (task) => task.status?.toLowerCase() === "completed"
).length;
console.log("All tasks:", tasks);
console.log("Team tasks:", teamTasks);
console.log("Completed team tasks count:", completedTasksCount);

const trulyPendingLeaves = pendingLeaveRequests.filter(
  req =>
    req.managerApproval === "pending" &&
    req.directorApproval === "pending"
);
  const activeProjects = projects.filter((project) => 
    project && project.status === "approved"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }


  if (!user) return null;

   return (
    <div className="space-y-8">
  {/* Header */}
  <div className="mb-8 px-4 py-6 bg-white shadow-sm rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
          Manager Dashboard
        </h1>
        
        <p className="text-lg text-gray-800 mt-3">Welcome back, {user.name}</p>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowCreateTask(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
        <button
          onClick={() => setShowAddEmployee(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Employee</span>
        </button>
      </div>
    </div>
    <div className="h-2 md:h-4"></div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Teams</p>
                <p className="text-3xl font-bold mt-2">{teamMembers.length}</p>
              </div>

              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Completed Tasks</p>
              <p className="text-3xl font-bold mt-2">
                  {
                    teamTasks.filter((task) => task.status === "completed")
                      .length
                  }
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Pending Approvals</p>
                <p className="text-3xl font-bold mt-2">
                  {pendingLeaveRequests.length}
                </p>
              </div>
              
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
            
          </div>

         <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-purple-100">Active Projects</p>
      <p className="text-3xl font-bold mt-2">
        {activeProjects.filter(project => project.status === "approved").length}
      </p>
    </div>

    <Briefcase className="w-8 h-8 text-purple-200" />
  </div>
</div>
</div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Main Content */}
  <div className="lg:col-span-2 space-y-8">
    {/* Teams Progress */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Users className="w-7 h-7 text-blue-600" />
          <span>Teams Progress</span>
        </h3>
        <div className="flex items-center space-x-3">
          <span className="text-base text-gray-600 font-medium">
            {teams.length} Teams
          </span>
          <button
            onClick={() => setShowAddEmployee(true)}
            className="bg-green-100 text-green-700 px-4 py-1.5 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center space-x-1"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add</span>
          </button>
        </div>
      </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {teams.map((team) => {
    // const memberCount = team.membersCount || 0;

    const activeProjectsCount = team.projects?.filter(
      (p: { status: string; }) => p.status === "approved"
    ).length || 0;

    const completedTasksCount = team.tasks?.filter(
      (t: { status: string; }) => t.status?.toLowerCase() === "completed"
    ).length || 0;

    // teams is an array of team members, each with a `tasks` array
const calculateTeamAverageProgress = (teams: { tasks?: { progress_percent?: number }[] }[]) => {
  let totalTasks = 0;
  let totalProgress = 0;

  teams.forEach(team => {
    const tasks = team.tasks ?? [];
    totalTasks += tasks.length;
    totalProgress += tasks.reduce(
      (sum, t) => sum + (t.progress_percent ?? 0),
      0
    );
  });

  // Avoid division by zero
  return totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;
};

// Usage
const avgProgress = calculateTeamAverageProgress(teams);
console.log("Average Team Progress:", avgProgress, "%");

    return (
     <div
  key={team.id}
  className="md:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
>
        {/* Team Header */}
        <div className="flex items-center space-x-4 mb-5">
          <div className="text-4xl">👥</div>
          <div className="flex-1">
           <div className="flex-1">
  <h4 className="font-bold text-xl">{team.name}</h4>
  <p className="text-white/90 text-base">{membersCount} member{membersCount !== 1 ? "s" : ""}</p>
</div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-base">Progress</span>
            <span className="text-2xl font-bold">{avgProgress}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3">
            
            <div className="text-center">
              <p className="text-xl font-bold">{activeProjectsCount}</p>
              <p className="text-sm text-white/70">Active</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{completedTasksCount}</p>
              <p className="text-sm text-white/70">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{avgProgress}%</p>
              <p className="text-sm text-white/70">Progress</p>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>
    </div>

            {/* Recent Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <ClipboardList className="w-6 h-6 text-green-600" />
                  <span>Recent Team Tasks</span>
                </h3>
                

<Link
  to="/tasks"
  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
>
  View All Tasks
</Link>

              </div>

              <div className="space-y-3">
                {teamTasks.length === 0 ? (
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
                ) : (
                  teamTasks.slice(0, 5).map((task) => {
  const assignee = teamMembers.find(
    (u) => u.id === task.assigneeId
  );

  const daysUntil = getDaysUntilDeadline(task.dueDate);
  const overdue = isOverdue(task.dueDate);

  const dueText = daysUntil === null
    ? "No due date"
    : overdue
      ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} overdue`
      : daysUntil === 0
        ? "Due today"
        : `${daysUntil} day${daysUntil !== 1 ? "s" : ""} left`;

                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
  <h4 className="font-medium text-gray-900">
    {task.title}
  </h4>

  {task.status?.toLowerCase() !== "completed" && (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}
    >
      {task.priority}
    </span>
  )}
</div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              {assignee?.avatar && (
                                <img
                                  src={assignee.avatar}
                                  alt={assignee.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              )}
                              <span>{assignee?.name || "Unassigned"}</span>
                            </div>
                            <span
                              className={
                                overdue
                                  ? "text-red-600 font-medium"
                                  : "text-gray-600"
                              }
                            >
                              {dueText}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 ml-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${task.progressPct || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">
                            {task.progressPct || 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

         {/* Sidebar - Approvals & Quick Actions */}
<div className="space-y-6">
  {/* Leave Requests */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-orange-600" />
        <span>Leave Requests</span>
      </h3>
      {pendingLeaveRequests.filter(
        req =>
          req.managerApproval === "pending" &&
          req.directorApproval === "pending"
      ).length > 0 && (
        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
          {
            pendingLeaveRequests.filter(
              req =>
                req.managerApproval === "pending" &&
                req.directorApproval === "pending"
            ).length
          }{" "}
          pending
        </span>
      )}
    </div>

    {pendingLeaveRequests.filter(
      req =>
        req.managerApproval === "pending" &&
        req.directorApproval === "pending"
    ).length === 0 ? (
      <div className="text-center py-6">
        <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No pending requests</p>
      </div>
    ) : (
      <div className="space-y-3">
        {pendingLeaveRequests
          .filter(
            req =>
              req.managerApproval === "pending" &&
              req.directorApproval === "pending"
          )
          .slice(0, 3)
          .map((request) => {
            const requester = teamMembers.find((u) => u.id === request.userId);
            return (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <img
                    src={requester?.avatar}
                    alt={requester?.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {requester?.name}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      {request.leave_type?.replace("_", " ") || "Unknown"} leave
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {formatDate(request.startDate)} -{" "}
                  {formatDate(request.endDate)}
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


{(() => {
  const pendingEmployeeReports = progressReports.filter((r) => {
    const employee = teamMembers.find((u) => String(u.id) === String(r.userId));
    // Only show reports where status is 'pending' and the user is an employee
    return r.status === "pending" && employee?.role === "employee";
  });

  // Don't render the card if there are no pending reports
  if (pendingEmployeeReports.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span>Progress Reports</span>
        </h3>
        {pendingEmployeeReports.length > 0 && (
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
            {pendingEmployeeReports.length} pending
          </span>
        )}
      </div>

      <div className="space-y-3">
        {pendingEmployeeReports.slice(0, 3).map((report) => {
          const employee = teamMembers.find(
            (u) => String(u.id) === String(report.userId)
          );
          return (
            <div
              key={report.id}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={employee?.avatar || "/default-avatar.png"}
                  alt={employee?.name || "Unknown Employee"}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {employee?.name || "Unknown Employee"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Progress report submitted
                  </p>
                </div>
                <span className="text-xs font-medium text-purple-600">
                  {report.progress}%
                </span>
              </div>
              <button
                onClick={() => handleReviewClick(report.id)}
                className="w-full bg-purple-50 text-purple-700 py-1 px-2 rounded text-xs font-medium hover:bg-purple-100 transition-colors"
              >
                Review Progress
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
})()}


{showProgressReview && selectedReport && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Progress Report Details
      </h3>

     <p>
  <strong>Next Day's Plan:</strong>{" "}
  {selectedReport.tomorrow_plan?.trim() ||
   selectedReport.nextPlan?.trim() ||
   "N/A"}
</p>


      <p className="text-xs text-gray-500 mb-4">
        Submitted: {new Date(selectedReport.submittedAt).toLocaleString()}
      </p>

     <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
  <p><strong>Overall Progress:</strong> {selectedReport.progress_percent ?? 0}%</p>
  <p><strong>Tasks Completed:</strong> {selectedReport.taskCount ?? 0} Tasks</p>
  <p><strong>Key Accomplishments:</strong> {selectedReport.accomplishments?.trim() || "N/A"}</p>
  <p><strong>Challenges Faced:</strong> {selectedReport.challenges?.trim() || "N/A"}</p>
  <p><strong>Next Day's Plan:</strong> {selectedReport.tomorrow_plan?.trim() || "N/A"}</p>
</div>


      {/* Manager's Comment */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Manager's Comment
        </label>
        <textarea
          value={managerComment}
          onChange={(e) => setManagerComment(e.target.value)}
          placeholder="Write a comment about this report..."
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
        />
      </div>

      <div className="flex space-x-3 mt-4">
        <button
          onClick={() => handleProgressApproval(selectedReport.id, true, managerComment)}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => handleProgressApproval(selectedReport.id, false, managerComment)}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => setShowProgressReview(null)}
          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Star className="w-5 h-5 text-blue-600" />
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="w-full bg-white text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center space-x-2 border border-gray-200"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
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
               
<Link
  to="/project-approvals"
  className="w-full bg-white text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center space-x-2 border border-gray-200"
>
  <Briefcase className="w-4 h-4" />
  <span>Manage Projects</span>
</Link>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskForm
          onClose={() => setShowCreateTask(false)}
          onSave={handleCreateTask}
          projects={projects}
          teamMembers={teamMembers}
        />
      )}

      {showAddEmployee && (
        <AddEmployee
          onClose={() => setShowAddEmployee(false)}
          onSave={handleAddEmployee}
        />
      )}

     {showLeaveReview && (
  <LeaveReviewModal
    requestId={showLeaveReview}
    leaveRequests={leaveRequests}
    teamMembers={teamMembers}
    comment={comment}
    setComment={setComment}  // ✅ pass setter too
    onApprove={handleLeaveApproval}
    onClose={() => setShowLeaveReview(null)}
  />
)}


      {showProgressReview && (
        <ProgressReviewModal
          reportId={showProgressReview}
          reports={progressReports}
          tasks={tasks}
          employees={teamMembers}
          onApprove={handleProgressApproval}
          onClose={() => setShowProgressReview(null)}
        />
      )}
    </div>
  );
};

export default ManagerDashboard;
