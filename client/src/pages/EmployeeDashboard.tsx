import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle,
  FileText,
  Send,
  Plus,
  Target,
  AlertCircle,
} from "lucide-react";

import { getCurrentUser } from "../utils/auth";
import {
  isOverdue,
  formatDate,
  toDateObject,
  getCurrentDate
} from "../utils/dateUtils";
import { differenceInDays } from "date-fns"; // <-- correct source

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  [key: string]: any;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
  [key: string]: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  annual_leave_balance: number | null;
}

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch (error) {
    console.warn("Failed to parse JSON:", error);
    return [];
  }
};

const EmployeeDashboard: React.FC = () => {
  const authUser = getCurrentUser();
  const user = getCurrentUser(); // used in punch out
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState("");
  
  
  const [progress, setProgress] = useState<any[]>([]);
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
      const token = localStorage.getItem("token");
      if (!token) {
        handleInvalidToken();
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch all required data in parallel
      const [userRes, tasksRes, leaveRes, progressRes] = await Promise.all([
        fetch(`https://nts-erp-system-629k.vercel.app/api/employee/profile`, { headers }),
        fetch(`https://nts-erp-system-629k.vercel.app/api/employee/tasks`, { headers }),
        fetch(`https://nts-erp-system-629k.vercel.app/api/employee/leaves`, { headers }),
        fetch(`https://nts-erp-system-629k.vercel.app/api/employee/progress`, { headers }),
      ]);
if (userRes.status === 401 || userRes.status === 403) {
          handleInvalidToken();
          throw new Error("Unauthorized or expired session");
        }
      if (!userRes.ok || !tasksRes.ok || !leaveRes.ok || !progressRes.ok) {
        throw new Error("Failed to fetch one or more endpoints");
      }

      // Parse JSON responses
    // Parse JSON responses
const [userData, tasksRaw, leaveRequests, progressData] = await Promise.all([
  safeJson(userRes),
  safeJson(tasksRes),
  safeJson(leaveRes),
  safeJson(progressRes),
]);

// Ensure tasks is always an array
const tasks = Array.isArray(tasksRaw)
  ? tasksRaw
  : tasksRaw?.tasks ?? []; // if API wraps in { tasks: [...] }

      // 🔄 Add progress percentage to each task
      const enrichedTasks = tasks.map((task: any) => {
        const taskProgress = progressData.find((p: any) => p.task_id === task.id);
        return {
          ...task,
          progressPct: taskProgress?.progress_percent ?? 0,
        };
      });

      // 🟡 Normalize and compute derived leave status
      const enrichedLeaves = leaveRequests.map((leave: any) => {
  let status = leave.status; // ← use backend status as base

  // Optional fallback logic only if status is missing/null
  if (!status || status === "pending") {
    if (
      leave.manager_approval === "approved" ||
      leave.director_approval === "approved"
    ) {
      status = "approved";
    } else if (
      leave.manager_approval === "rejected" ||
      leave.director_approval === "rejected"
    ) {
      status = "rejected";
    } else {
      status = "pending";
    }
  }

  return {
    ...leave,
    status,
  };
});
console.log("✅ Final Enriched leaveRequests:", enrichedLeaves);

console.log("⏺️ Raw leaveRequests from backend", leaveRequests);
      


      // ✅ Update state
      setCurrentUser(userData);
      setMyTasks(enrichedTasks);
      setMyLeaveRequests(enrichedLeaves);
      setProgress(progressData);
    } catch (err: any) {
      console.error("❌ Error fetching employee data:", err.message || err);
    }
  };

  fetchData();
}, [authUser?.id]);



  const LEAVE_QUOTA = 20;

  const approvedLeaves = myLeaveRequests.filter(
    (lr) => lr.user_id === currentUser?.id && lr.status === "approved"
  );

  const usedDays = approvedLeaves.reduce((sum, lr) => {
    const start = new Date(lr.start_date);
    const end = new Date(lr.end_date);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return sum + Math.max(1, days); // Always at least 1 day
  }, 0);

  const remainingDays = Math.max(0, LEAVE_QUOTA - usedDays);
  

  
 const [showNoBalancePopup, setShowNoBalancePopup] = useState(false);
 const handleApplyClick = () => {
    if (remainingDays === 0) {
      setShowNoBalancePopup(true); // 🚨 show popup instead of form
    } else {
      setShowLeaveForm(true);
    }
  };

  const completedTasks = myTasks.filter(
    (t) => t.status?.toLowerCase() === "completed"
  );
  const inProgressTasks = myTasks.filter(
    (t) => t.status?.toLowerCase() === "in_progress"
  );
  const overdueTasks = myTasks.filter(
    (t) =>
      t.dueDate &&
      t.status &&
      isOverdue(t.dueDate) &&
      t.status.toLowerCase() !== "completed"
      
  );

  const getDaysUntilDeadline = (dueDate: string) => {
    const today = new Date();
    const deadline = toDateObject(dueDate);
    if (!deadline) return 0; // or handle as appropriate
    return differenceInDays(deadline, today);
  };
  interface LeaveRequestFormProps {
    onClose: () => void;
    setLeaveRequests: React.Dispatch<React.SetStateAction<any[]>>;
    leaveRequests: any[];
  }

  const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
    onClose,
    setLeaveRequests,
  }) => {
    const user = getCurrentUser();

    const [formData, setFormData] = useState({
      leave_type: "vacation",
      startDate: "",
      endDate: "",
      reason: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.startDate) newErrors.startDate = "Start date is required";
      if (!formData.endDate) newErrors.endDate = "End date is required";
      if (!formData.reason.trim()) newErrors.reason = "Reason is required";

      const now = new Date();
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start < new Date(now.setHours(0, 0, 0, 0))) {
        newErrors.startDate = "Start date cannot be in the past";
      }

      if (start > end) {
        newErrors.endDate = "End date must be after start date";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleLeaveSubmission = async () => {
      try {
        if (!user || !user.role) throw new Error("Unauthorized");
        const role = user.role.toLowerCase();
        const token = localStorage.getItem("token");
        if (!token || !user?.id) throw new Error("Unauthorized");

        const payload = {
          leave_type: formData.leave_type,
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason,
          userId: user.id,
        };

        const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/${role}/leave`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const body = await res.json();

        if (!res.ok)
          throw new Error(body.error || "Failed to submit leave request");

        const mappedLeave = {
          id: body.id,
          userId: body.user_id,
          type: body.leave_type,
          startDate: body.start_date,
          endDate: body.end_date,
          reason: body.reason,
          status: body.status,
          managerApproval: body.manager_approval,
          directorApproval: body.director_approval,
          createdAt: body.created_at,
        };

        setLeaveRequests((prev) => [...prev, mappedLeave]);
        onClose();
      } catch (err) {
        console.error("Error submitting leave:", err);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (validateForm()) {
        handleLeaveSubmission();
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Request Leave
            </h3>
            <p className="text-gray-600 mt-1">
              Submit a new leave request for approval
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type *
              </label>
              <select
                name="leave_type"
                value={formData.leave_type}
                onChange={(e) =>
                  setFormData({ ...formData, leave_type: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className={`w-full border rounded-lg px-3 py-2 ${
                  errors.startDate ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.startDate && (
                <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className={`w-full border rounded-lg px-3 py-2 ${
                  errors.endDate ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.endDate && (
                <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                className={`w-full border rounded-lg px-3 py-2 ${
                  errors.reason ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Please provide a reason for your leave request..."
              />
              {errors.reason && (
                <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Request</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  interface ProgressReportFormProps {
  onClose: () => void;
  myTasks: Task[];
  user: { role: string }; // ✅ required for URL
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>; // ✅ to update local task list
}

const ProgressReportForm: React.FC<ProgressReportFormProps> = ({
  onClose,
  myTasks, // ✅ this is your task list
  user,
  setTasks, // ✅ use this to update parent state
}) => {
  const [selectedTask, setSelectedTask] = useState("");
  const [status, setStatus] = useState("select");
  const [progressPct, setProgressPct] = useState(50);
  const [progressDetails, setProgressDetails] = useState("");
  const [loading, setLoading] = useState(false);
// const [showProgressForm, setShowProgressForm] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTask) {
      alert("Please select a task");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized");
      return;
    }

    const payload = {
      task_id: selectedTask,
      progress_percent: progressPct,
      status: status,
      comment: progressDetails,
    };

    try {
      setLoading(true);
      console.log("📤 Sending progress update payload:", payload);

      const res = await fetch(
        `https://nts-erp-system-629k.vercel.app/api/${user.role}/update-task-progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const resBody = await res.json();

      if (!res.ok) {
        console.error("❌ Server error:", resBody);
        throw new Error(resBody?.error || "Failed to update progress");
      }

      console.log("🟢 Progress updated successfully:", resBody);

      // ✅ Update local task list
      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask
            ? {
                ...task,
                status: status,
                progress_percent: progressPct,
                comment: progressDetails,
              }
            : task
        )
      );

      onClose();
    } catch (err: any) {
      console.error("❌ Submission error:", err.message);
      alert("Failed to update progress: " + err.message);
    } finally {
      setLoading(false);
    }
  };


    return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Submit Progress Report
      </h3>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Select Task */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Task
          </label>
          <select
  value={selectedTask}
  onChange={(e) => setSelectedTask(e.target.value)}
  className="w-full border border-gray-300 rounded-lg px-3 py-2"
  required
>
  <option value="">Choose a task...</option>
  {myTasks.map((task) => (
    <option
      key={task.id}
      value={task.id}
      disabled={task.status === "completed"} // ✅ Disable if task is completed
    >
      {task.title} {task.status === "completed" ? "(Completed)" : ""}
    </option>
  ))}
</select>
        </div>

        {/* Progress Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Progress Percentage
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={progressPct}
            onChange={(e) => setProgressPct(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-600 mt-1">{progressPct}%</div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          >
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Progress Details
          </label>
          <textarea
            rows={4}
            value={progressDetails}
            onChange={(e) => setProgressDetails(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Describe what you've accomplished and any challenges faced..."
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "Submitting..." : "Submit Report"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
);
  }
  useEffect(() => {
  const storedPunchStatus = localStorage.getItem("isPunchedIn");
  const storedPunchTime = localStorage.getItem("punchInTime");

  if (storedPunchStatus === "true" && storedPunchTime) {
    setIsPunchedIn(true);
    setPunchInTime(storedPunchTime);
  }
}, []);

const today = new Date().toISOString().split("T")[0]; // ✅ Define this once

const handlePunchToggle = async () => {
  if (isPunchedIn) {
    await handlePunchOut();
  } else {
    await handlePunchIn();
  }
};

const handlePunchIn = async () => {
  const currentTime = new Date().toTimeString().slice(0, 5); // "HH:MM" in 24-hour format


  if (isPunchedIn) {
    console.warn("Already punched in for today.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/employee/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        punch_in: currentTime,
        date: today, // ✅ Use properly formatted date
        status: "present",
      }),
    });

    if (!res.ok) throw new Error("Failed to punch in");

    setIsPunchedIn(true);
    setPunchInTime(currentTime);

    localStorage.setItem("isPunchedIn", "true");
    localStorage.setItem("punchInTime", currentTime);

    console.log("✅ Punched in at:", currentTime);
  } catch (err: any) {
    console.error("❌ Punch in error:", err.message || err);
  }
};

const handlePunchOut = async () => {
  const currentTime = new Date().toTimeString().slice(0, 5); // "HH:MM" in 24-hour format


  try {
    const token = localStorage.getItem("token");
    const user = getCurrentUser(); // ✅ Needed to resolve user?.id
    if (!token || !user?.id) throw new Error("Unauthorized");

    const res = await fetch(
      `https://nts-erp-system-629k.vercel.app/api/employee/attendance/${today}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ punch_out: currentTime }),
      }
    );

    if (!res.ok) throw new Error("Failed to punch out");

    setIsPunchedIn(false);
    setPunchInTime("");

    localStorage.removeItem("isPunchedIn");
    localStorage.removeItem("punchInTime");

    console.log("✅ Punched out at:", currentTime);
  } catch (err: any) {
    console.error("❌ Punch out error:", err.message || err);
  }
};


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {currentUser?.name || "Employee"}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's your personal dashboard overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">My Tasks</p>
              <p className="text-3xl font-bold mt-2">{myTasks.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Completed</p>
              <p className="text-3xl font-bold mt-2">{completedTasks.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">In Progress</p>
              <p className="text-3xl font-bold mt-2">
                {inProgressTasks.length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Leave Balance</p>
              <p className="text-3xl font-bold mt-2">{remainingDays}</p>{" "}
              {/* <-- use computed value */}
            </div>
            <Calendar className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Apply Leave Button */}
      <button
        onClick={handleApplyClick}
        className={`p-4 border border-gray-200 rounded-lg text-left group transition-colors ${
          remainingDays === 0
            ? "bg-gray-100 text-gray-400"
            : "hover:bg-gray-50 cursor-pointer"
        }`}
      >
        <Calendar
          className={`w-6 h-6 mb-2 group-hover:scale-110 transition-transform ${
            remainingDays === 0 ? "text-gray-400" : "text-blue-500"
          }`}
        />
        <h4 className="font-medium text-gray-900">Apply for Leave</h4>
        <p className="text-sm text-gray-600">
          {remainingDays === 0
            ? "No leave days remaining"
            : "Submit a new leave request"}
        </p>
      </button>
      {/* Popup Modal */}
      {showNoBalancePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              No Leave Balance
            </h3>
            <p className="text-gray-600 mb-4">
              You have no remaining leave days available.
            </p>
            <button
              onClick={() => setShowNoBalancePopup(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}


          <button
            onClick={handlePunchToggle}
            className={`p-4 border border-gray-200 rounded-lg transition-colors text-left group hover:bg-gray-50 ${
              isPunchedIn ? "bg-red-100" : "bg-white"
            }`}
          >
            <Clock
              className={`w-6 h-6 mb-2 group-hover:scale-110 transition-transform ${
                isPunchedIn ? "text-red-600" : "text-green-500"
              }`}
            />
            <h4
              className={`font-medium ${
                isPunchedIn ? "text-red-700" : "text-gray-900"
              }`}
            >
              {isPunchedIn ? "Punch Out" : "Punch In"}
            </h4>
            <p className="text-sm text-gray-600">
              {isPunchedIn ? "End your shift" : "Start your shift"}
            </p>
          </button>

          <button
            onClick={() => setShowProgressForm(true)}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <TrendingUp className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-medium text-gray-900">Submit Progress</h4>
            <p className="text-sm text-gray-600">Update task progress</p>
          </button>
        </div>
      </div>

      {/* My Tasks Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Tasks</h3>
          <Link
            to="/tasks"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All Tasks
          </Link>
        </div>

        {myTasks.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.slice(0, 5).map((task) => {
              const daysUntil = getDaysUntilDeadline(task.dueDate);
              const overdue = isOverdue(task.dueDate);

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <span
                        className={`text-xs ${
                          overdue ? "text-red-600 font-medium" : "text-gray-500"
                        }`}
                      >
                        {overdue
                          ? `${Math.abs(daysUntil)} days overdue`
                          : daysUntil === 0
                          ? "Due today"
                          : daysUntil > 0
                          ? `${daysUntil} days left`
                          : "Completed"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
  <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
    <div
      className="bg-blue-600 h-2"
      style={{ width: `${task.progressPct || 0}%` }}
    />
  </div>
  <span className="text-sm text-gray-600">
    {(task.progressPct ?? 0)}%
  </span>
  {overdue && (
    <AlertCircle className="w-4 h-4 text-red-500">
    <title>Overdue</title>
  </AlertCircle>
)}
</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Leave Requests
          </h3>
          <Link
            to="/leave-management"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All Requests
          </Link>
        </div>

        {myLeaveRequests.length === 0 ? (
  <div className="text-center py-8">
    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">No leave requests yet</p>
    <button
      onClick={() => setShowLeaveForm(true)}
      disabled={remainingDays === 0} // 🚫 Disable when no days left
      className={`mt-2 font-medium ${
        remainingDays === 0
          ? "text-gray-400 cursor-not-allowed"
          : "text-blue-600 hover:text-blue-800"
      }`}
    >
      Apply for leave
    </button>
    {remainingDays === 0 && (
      <p className="text-red-500 mt-2 text-sm">
        You have no remaining leave days left
      </p>
    )}
  </div>
) : (
  <div className="space-y-3">
    {myLeaveRequests.slice(0, 3).map((request) => {
      // ✅ More accurate leave days calculation
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);

      // Include both start & end date, ensure at least 1 day
      const days =
        Math.max(
          1,
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        );

      const status =
        request.status === "approved"
          ? "Approved"
          : request.status === "rejected"
          ? "Rejected"
          : "Pending";


    return (
      <div
        key={request.id}
        className="p-3 border border-gray-200 rounded-lg bg-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 capitalize">
              {request.leave_type?.replace("_", " ") || "Unknown"} Leave
            </h4>
            <p className="text-sm text-gray-600">
              {formatDate(request.start_date)} - {formatDate(request.end_date)} ({days} days)
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === "Approved"
                ? "bg-green-100 text-green-800"
                : status === "Rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status}
          </span>
        </div>

        {/* Show who approved it + comments if available */}
        {(request.managerApproval === "approved" ||
          request.directorApproval === "approved") && (
          <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-xs text-green-700 font-semibold">Approved By:</p>

            {request.managerApproval === "approved" && (
              <p className="text-sm text-gray-700">✅ Manager</p>
            )}
            {request.managerComment && (
              <p className="text-gray-600 italic text-sm ml-4">
                “{request.managerComment}”
              </p>
            )}

            {request.directorApproval === "approved" && (
              <p className="text-sm text-gray-700">✅ Director</p>
            )}
            {request.directorComment && (
              <p className="text-gray-600 italic text-sm ml-4">
                “{request.directorComment}”
              </p>
            )}
          </div>
        )}
      </div>
    );
  })}
</div>
        )}
      </div>

      {/* Modals */}
      {showLeaveForm && (
        <LeaveRequestForm
          onClose={() => setShowLeaveForm(false)}
          leaveRequests={myLeaveRequests}
          setLeaveRequests={setMyLeaveRequests}
        />
      )}

      {showProgressForm && (
  <ProgressReportForm
    onClose={() => setShowProgressForm(false)}
    myTasks={myTasks}
    user={{ role: user?.role ?? "" }}
    setTasks={setMyTasks}
  />

      )}
    </div>
  );
};

export default EmployeeDashboard;
