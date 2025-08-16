import React, { useState, useEffect } from "react";
import Select from "react-select";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Send,

  Clock,
  CheckCircle,
  TrendingUp,
  Eye,
  X,
  XCircle,
  Award,
  
  Target,
  MessageSquare,
 
  
  Users,
  
  AlertCircle,
} from "lucide-react";
import { getCurrentUser,  getUserAccessLevel } from "../utils/auth";
import { formatDate, getCurrentDate } from "../utils/dateUtils";

export interface User {
  id: string;
  role: string;
  name?: string;
  email?: string;
  managerId?: string;
  department?: string;
}

interface ApprovalModalProps {
  report: any;
  onClose: () => void;
  role: "manager" | "director";
  handleReviewReport: (
    reportId: string,
    feedback: string,
    status: "approved" | "rejected"
  ) => void;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  report,
  onClose,
  handleReviewReport,
}) => {
  const [feedback, setFeedback] = useState("");

   return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="flex flex-col bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="bg-green-600 p-6 text-white flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">Progress Report Details</h3>
           <p className="text-sm mt-1">
  
  {new Date(report.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })}
</p>

            <p className="text-xs text-green-100">
              Submitted:{" "}
              {report.submittedAt
                ? new Date(report.submittedAt).toLocaleString("en-US", {
                    dateStyle: "short",
                    timeStyle: "medium",
                  })
                : "Not submitted"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">

          {/* Progress Overview */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Progress Overview</h4>
              <div className="flex items-center space-x-2">
                {report.status === "approved" ? (
                  <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-bold">Approved</span>
                  </div>
                ) : report.status === "rejected" ? (
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
              {/* Overall Progress */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${
                        report.progress >= 90
                          ? "bg-gradient-to-r from-green-400 to-green-600"
                          : report.progress >= 80
                          ? "bg-gradient-to-r from-blue-400 to-blue-600"
                          : report.progress >= 70
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                          : report.progress >= 60
                          ? "bg-gradient-to-r from-orange-400 to-orange-600"
                          : "bg-gradient-to-r from-red-400 to-red-600"
                      }`}
                      style={{ width: `${report.progress}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{report.progress}%</span>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-4  rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Tasks Completed</p>
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-lg font-semibold text-gray-800">
                    {Array.isArray(report.tasks) ? report.tasks.length : 0} task
                    {Array.isArray(report.tasks) && report.tasks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {Array.isArray(report.tasks) && report.tasks.length > 0 ? (
                  <ul className="space-y-1 list-disc list-inside text-gray-700 text-sm">
                    {report.tasks.map((task: { id: string; title: string }) => (
                      <li key={task.id}>{task.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No tasks completed</p>
                )}
              </div>
            </div>
          </div>

          {/* Accomplishments */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-600" />
              <span>Key Accomplishments</span>
            </h4>
            <p className="text-gray-800 text-sm bg-green-50 p-3 rounded-lg border border-green-100">
              {report.accomplishments || "No accomplishments recorded"}
            </p>
          </div>

          {/* Challenges */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>Challenges Faced</span>
            </h4>
            <p className="text-gray-800 text-sm bg-orange-50 p-3 rounded-lg border border-orange-100">
              {report.challenges || "No challenges recorded"}
            </p>
          </div>

          {/* Next Day Plan */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Next Day's Plan</span>
            </h4>
            <p className="text-gray-800 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
              {report.nextPlan || "No plan recorded"}
            </p>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Feedback (required for rejection)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Write your feedback here..."
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 p-4 bg-white border-t border-gray-200">
          <button
            onClick={() => {
              handleReviewReport(report.id, feedback, "approved");
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white"
          >
            Approve
          </button>
          <button
            onClick={() => {
              if (!feedback.trim()) {
                alert("Please provide feedback to reject the report.");
                return;
              }
              handleReviewReport(report.id, feedback, "rejected");
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white"
          >
            Reject
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 font-bold"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};


// Form Component
interface SubmitProgressFormProps {
  formData: {
    progress: number;
    accomplishments: string;
    challenges: string;
    tomorrowPlan: string;
    tasks: string[]; // ✅ new
  };
  setFormData: React.Dispatch<
    React.SetStateAction<SubmitProgressFormProps["formData"]>
  >;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  selectedDate: string;
  hasSubmittedToday: boolean;
  availableTasks: {
    value: string;
    label: string;
    isDisabled?: boolean; // ✅ Add this
  }[];
  // ✅ new prop
}

const SubmitProgressForm: React.FC<SubmitProgressFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onClose,
  selectedDate,
  hasSubmittedToday,
  availableTasks,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Submit Daily Progress Report</h3>
            <p className="text-blue-100 mt-1">
              Date: {formatDate(selectedDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Overall Progress (%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                progress: parseInt(e.target.value),
              }))
            }
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>0%</span>
            <span className="text-lg font-bold text-blue-600">
              {formData.progress}%
            </span>
            <span>100%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                formData.progress >= 90
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : formData.progress >= 80
                  ? "bg-gradient-to-r from-blue-400 to-blue-600"
                  : formData.progress >= 70
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                  : formData.progress >= 60
                  ? "bg-gradient-to-r from-orange-400 to-orange-600"
                  : "bg-gradient-to-r from-red-400 to-red-600"
              }`}
              style={{ width: `${formData.progress}%` }}
            />
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Tasks Completed
          </label>
          <Select
  isMulti
  options={availableTasks}
  value={availableTasks.filter(task =>
    formData.tasks.includes(task.value)
  )}
  onChange={(selected) =>
    setFormData(prev => ({
      ...prev,
      tasks: selected ? selected.map(task => task.value) : [],
    }))
  }
  placeholder="Select tasks..."
  getOptionLabel={e => e.label}
  getOptionValue={e => e.value}
  isClearable={false}
  isSearchable
  isOptionDisabled={(option) => option.isDisabled === true}
/>


          <p className="text-xs text-gray-500 mt-1 italic">
            * Select all tasks you completed today.
          </p>
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
            required
            rows={4}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your key accomplishments for today..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Challenges Faced
          </label>
          <textarea
            value={formData.challenges}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, challenges: e.target.value }))
            }
            rows={3}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any challenges or blockers encountered..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Tomorrow's Plan
          </label>
          <textarea
            value={formData.tomorrowPlan}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, tomorrowPlan: e.target.value }))
            }
            rows={3}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What do you plan to work on tomorrow..."
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={hasSubmittedToday}
            className={`flex-1 py-3 px-4 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 transition-transform ${
              hasSubmittedToday
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl transform hover:scale-105"
            }`}
          >
            <Send className="w-5 h-5" />
            <span>
              {hasSubmittedToday ? "Already Submitted" : "Submit Report"}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-400 font-bold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ProgressReports: React.FC = () => {
  const fallbackUser = { id: "", role: "employee", name: "" };
  const user = getCurrentUser() ?? fallbackUser;

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  // const [calendarView, setCalendarView] = useState<"month" | "week">("month");
  const [reports, setReports] = useState<any[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showViewReport, setShowViewReport] = useState(false);
  const [viewingReport, setViewingReport] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState(user.id);
  const [loading, setLoading] = useState(true);
  const [availableTasks, setAvailableTasks] = useState<
    { value: string; label: string; isDisabled?: boolean }[]
  >([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [reportToReview, setReportToReview] = useState<any>(null);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
// Define access level permissions:
// - Employee: Can only see their own data
// - Manager: Can see their own data + their direct reports (team members assigned to them)
// - Director: Can see their own data + managers assigned to them + those managers' team members
const getAccessibleTeamMembers = (currentUser: any, allTeamMembers: any[]): any[] => {
  if (!currentUser || !Array.isArray(allTeamMembers)) return [];

  const accessLevel = getUserAccessLevel(currentUser.role);

  if (accessLevel === "employee") {
    // Employee can only see themselves (no dropdown needed)
    return [];
  }

  if (accessLevel === "manager") {
    // Manager can see their direct reports only (not themselves in dropdown)
    return allTeamMembers.filter(member => member.managerId === currentUser.id);
  }

  if (accessLevel === "director" || accessLevel === "global_hr_director") {
    // Director can see all members EXCEPT themselves
    return allTeamMembers.filter(m => m.id !== currentUser.id);
  }

  return [];
};

console.log("📋 Available Users for dropdown:", availableUsers);
const [formData, setFormData] = useState<{
  progress: number;
  accomplishments: string;
  challenges: string;
  tomorrowPlan: string;
  tasks: string[];
}>({
  progress: 50,
  accomplishments: "",
  challenges: "",
  tomorrowPlan: "",
  tasks: [], // now correctly typed as string[]
});

  const canReviewReports = ["manager", "director"].includes(
    getUserAccessLevel(user.role)
  );
  
  // Define access level variables
  const userAccessLevel = getUserAccessLevel(user.role);
  const isDir = userAccessLevel === 'director';
  // const isMgr = userAccessLevel === 'manager';
  // const isEmp = userAccessLevel === 'employee';

const fetchReports = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    const role = getUserAccessLevel(user.role);

    const res = await fetch(
      `http://localhost:8000/api/${role}/progress-report`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to fetch reports");

    const rawData = await res.json();

    // Normalize reports
    const normalized = rawData.map((report: any) => {
      // Match user from availableUsers if possible
      const matchingUser = availableUsers.find(u => u.id === report.user_id);

      // Ensure tasks array exists
      const tasksArray = Array.isArray(report.tasks) ? report.tasks : [];

      // Map tasks to include only id & title
      const tasks = tasksArray.map((task: any) => ({
        id: task.id,
        title: task.title || task.name || `Task ${task.id}`,
      }));

      return {
        id: report.id,
        date: report.report_date,
        user_id: report.user_id,
        user_name: matchingUser?.name || report.user_name || report.user_email || `User ${report.user_id}`,
        user_role: matchingUser?.role || report.user_role || "employee",
        submitted: !!report.submitted_at,
        submittedAt: report.submitted_at,
        progress: report.progress_percent ?? 0,
        tasks,
        approved: report.status === "approved",
        rejected: report.status === "rejected",
        approvedAt: report.approved_at,
        approvedBy: report.approved_by,
        approvedByRole: report.approved_by_role,
        status: report.status,
        accomplishments: report.accomplishments ?? "",
        challenges: report.challenges ?? "",
        tomorrowPlan: report.tomorrow_plan ?? "",
        managerFeedback: report.manager_feedback ?? "",
      };
    });

    console.log("📄 Normalized Reports:", normalized);

    setReports(normalized);

    // Handle director-specific pending reports
    if (role === "director") {
      const pending = normalized.filter(
        (report: any) => report.submitted && report.status === "pending" && report.user_id !== user.id
      );
      setPendingReports(pending);
    }

  } catch (err) {
    console.error("Error loading reports:", err);
  } finally {
    setLoading(false);
  }
};



const fetchTeam = async () => {
  try {
    const token = localStorage.getItem("token");
    const endpoint = `http://localhost:8000/api/users`;

    console.log("📡 Fetching team from:", endpoint);

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("📥 Response status:", res.status);

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log("📄 Response data:", data);

    // ✅ Normalize response shape
    const usersArray = Array.isArray(data) ? data : data.users || [];
    console.log("🌍 allTeamMembers before filtering:", usersArray);

    if (!Array.isArray(usersArray)) {
      console.warn("⚠️ Unexpected API response shape. Falling back to current user.");
      setAvailableUsers([user]);
      setSelectedUser(user.id);
      return;
    }

    // ✅ Filter based on current user access level
    const accessibleUsers = getAccessibleTeamMembers(user, usersArray);
    console.log(
      "✅ Accessible team members:",
      accessibleUsers.map(u => ({ id: u.id, name: u.name }))
    );

    setAvailableUsers(accessibleUsers);

    // ✅ Select default user
    let defaultUserId = selectedUser;

    // If no user is selected OR previously selected user is not in the team anymore
    if (!defaultUserId || !accessibleUsers.find(u => u.id === defaultUserId)) {
      if (accessibleUsers.length > 0) {
        defaultUserId = accessibleUsers[0].id; // pick first available member
      } else {
        defaultUserId = user.id; // fallback to self
      }
     const chosenUser = accessibleUsers.find(u => u.id === defaultUserId);
console.log(
  "🎯 Default selected user set to:",
  defaultUserId,
  "| Name:",
  chosenUser?.name || user.name || `User ${user.id}`
);
      setSelectedUser(defaultUserId);
    } else {
      const existingUser = accessibleUsers.find(u => u.id === defaultUserId);
      console.log(
        "✅ Keeping previously selected user:",
        defaultUserId,
        "| Name:",
        existingUser ? existingUser.name : "Unknown"
      );
    }

    console.log("🙋 Current user:", { id: user.id, name: user.name });

  } catch (err) {
    console.error("❌ Failed to fetch team:", err);
    setAvailableUsers([user]);
    setSelectedUser(user.id);
  }
};


const handleReviewReport = async (
  reportId: string,
  feedback: string,
  status: "approved" | "rejected"
) => {
  try {
    const token = localStorage.getItem("token");
    const role = getUserAccessLevel(user.role);

    const res = await fetch(
      `http://localhost:8000/api/${role}/approve-progress-report/${reportId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedback, status }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || `Failed to ${status} report`);
    }

    alert(`Report ${status} successfully!`);
    await fetchReports();
  } catch (error) {
    console.error(`Review error:`, error);
    alert(`Failed to ${status} report. Please try again.`);
  }
};
  const hasSubmittedToday = () => {
    const today = getCurrentDate();
    return reports.some(
      (r) => r.user_id === user.id && r.date === today && r.submitted
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasSubmittedToday()) {
      alert("You've already submitted a report for today.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const role = user?.role;

      const res = await fetch(
        `http://localhost:8000/api/${role}/progress-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            progress_percent: formData.progress,
            accomplishments: formData.accomplishments,
            challenges: formData.challenges,
            tomorrow_plan: formData.tomorrowPlan,
            tasks: formData.tasks,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Failed to submit");
      } else {
        alert("Report submitted!");
        await fetchReports();
        setFormData({
          progress: 50,
          accomplishments: "",
          challenges: "",
          tomorrowPlan: "",
          tasks: [],
        });
        setShowSubmitForm(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };
// Fetch and normalize tasks (employee-only)
const fetchTasks = async () => {
  if (user?.role !== "employee") {
    
    setAvailableTasks([]);
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const res = await fetch(`http://localhost:8000/api/employee/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);

    const data = await res.json();
    console.log("📡 Raw tasks API response:", data);

    const tasksArray = Array.isArray(data) ? data : [];
    const tasksWithIdAndTitle = tasksArray.map((task: any) => ({
      value: String(task.id),
      label: task.title || `Task ${task.id}`,
    }));

    console.log("📋 Tasks fetched with value & label:", tasksWithIdAndTitle);
    setAvailableTasks(tasksWithIdAndTitle);

  } catch (err) {
    console.error("Error fetching tasks:", err);
    setAvailableTasks([]);
  }
};

// Trigger only if employee
useEffect(() => {
  if (user?.role === "employee") {
    fetchTasks();
  } else {
    console.log("Tasks API is restricted to employees. Skipping fetch.");
    setAvailableTasks([]);
  }
}, [user?.role]);


useEffect(() => {
  const initialize = async () => {
    try {
      await fetchTeam();
      await Promise.all([fetchReports(), fetchTasks()]);
    } catch (err) {
      console.error("Initialization error:", err);
    }
  };
  initialize();
}, []);


// const matchingUser = availableUsers.find(u => u.id === report.user_id);

// const userReports = isDir
//   ? (() => {
//       const selected = availableUsers.find(u => u.id === selectedUser);
//       if (!selected) return [];

//       if (getUserAccessLevel(selected.role) === 'manager') {
//         // include manager + their employees
//         const teamIds = availableUsers
//           .filter(u => u.managerId === selected.id)
//           .map(u => u.id);
//         return reports.filter(r => r.user_id === selected.id || teamIds.includes(r.user_id));
//       }
      
//       return reports.filter(r => r.user_id === selected.id);
//     })()
//   : reports.filter(r => r.user_id === user.id);

const userReports = (() => {
  // ✅ Case 1: Non-directors (employee/manager)
  if (!isDir) {
    return reports.filter(r => r.user_id === selectedUser);
  }

  // ✅ Case 2: Directors
  const selected = availableUsers.find(u => u.id === selectedUser);
  if (!selected) return [];

  const accessLevel = getUserAccessLevel(selected.role);

  if (accessLevel === "manager") {
    // Director selects a manager → include manager + their employees
    const teamIds = availableUsers
      .filter(u => u.managerId === selected.id)
      .map(u => u.id);

    return reports.filter(
      r => r.user_id === selected.id || teamIds.includes(r.user_id)
    );
  }

  if (accessLevel === "employee") {
    // Director selects an employee → only that employee’s reports
    return reports.filter(r => r.user_id === selected.id);
  }

  if (accessLevel === "director" || accessLevel === "global_hr_director") {
    // Director selects another director (or themselves) → show all reports
    return reports;
  }

  // Fallback
  return [];
})();


  const CalendarView = () => {
    const today = getCurrentDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const reportData = userReports.find((r) => r.date === dateStr);
      const isToday = dateStr === today;
      const isPast = new Date(dateStr) < new Date(today);
      const isFuture = new Date(dateStr) > new Date(today);
      const isCurrentUser = selectedUser === user.id;

      days.push(
        <div
          key={day}
          onClick={() => {
            setSelectedDate(dateStr);
            if (isToday && !reportData?.submitted && isCurrentUser && userAccessLevel !== 'director') {
              setShowSubmitForm(true);
            } else if (reportData?.submitted && !isDir) {
              setViewingReport(reportData);
              setShowViewReport(true);
            } else if (reportData?.submitted && isDir) {
              // Directors can review reports
              if (reportData.status === 'pending') {
                setReportToReview(reportData);
                setShowApprovalModal(true);
              } else {
                setViewingReport(reportData);
                setShowViewReport(true);
              }
            }
          }}
          className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 min-h-[140px] hover:shadow-lg transform hover:scale-105 ${
            isToday
              ? "bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200 border-blue-500 ring-2 ring-blue-300 shadow-xl"
              : isPast && reportData?.submitted
              ? "bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 border-green-300 hover:bg-green-100"
              : isPast && !reportData?.submitted
              ? "bg-gradient-to-br from-red-50 via-red-100 to-pink-100 border-red-300"
              : isFuture
              ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-lg font-bold text-gray-900 mb-2">{day}</div>

          {reportData?.submitted && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-semibold">
                  Submitted
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(reportData.submittedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">
                    {reportData.progress}%
                  </span>
                  <div className="flex items-center space-x-1">
                    {reportData.approved ? (
                      <Award className="w-3 h-3 text-green-600" />
                    ) : reportData.rejected ? (
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-yellow-600" />
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      reportData.progress >= 90
                        ? "bg-gradient-to-r from-green-400 to-green-600"
                        : reportData.progress >= 80
                        ? "bg-gradient-to-r from-blue-400 to-blue-600"
                        : reportData.progress >= 70
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                        : reportData.progress >= 60
                        ? "bg-gradient-to-r from-orange-400 to-orange-600"
                        : "bg-gradient-to-r from-red-400 to-red-600"
                    }`}
                    style={{ width: `${reportData.progress}%` }}
                  />
                </div>

                <div className="text-xs text-gray-600 mb-2 flex items-center space-x-2">
  <span>
    {Array.isArray(reportData.tasks) ? reportData.tasks.length : 0} tasks
  </span>

  {/* Status Badge */}
  <span
    className={`px-2 py-0.5 rounded-full font-medium ${
      reportData.approved
        ? "bg-green-100 text-green-700"
        : reportData.rejected
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {reportData.approved
      ? "Approved"
      : reportData.rejected
      ? "Rejected"
      : "Under Review"}
  </span>
</div>


                {reportData.managerFeedback && (
                  <div className="bg-blue-50 rounded p-2 mb-2">
                    <div className="flex items-center space-x-1 mb-1">
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">
                        Feedback
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 line-clamp-2">
                      {reportData.managerFeedback}
                    </p>
                  </div>
                )}
              </div>

              <div
  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-2 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow flex items-center justify-center space-x-1"
>
  <Eye className="w-3 h-3" />
  <span>View Details</span>
</div>
            </div>
          )}

          

          {/* Conditional buttons */}
          {isToday && !reportData?.submitted && isCurrentUser && userAccessLevel !== 'director' && (
            <div className="mt-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-2 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow animate-pulse">
                📝 Submit Today's Report
              </div>
            </div>
          )}

          {isPast && !reportData?.submitted && (
            <div className="mt-2">
              <div className="bg-red-100 border border-red-300 text-red-700 text-xs font-medium px-2 py-1 rounded-lg text-center">
                ❌ Missing Report
              </div>
            </div>
          )}
        </div>
      );
    }

    const navigateMonth = (direction: "prev" | "next") => {
      if (direction === "prev") {
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
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {new Date(currentYear, currentMonth).toLocaleDateString(
                  "en-US",
                  { month: "long", year: "numeric" }
                )}
              </h2>
              <p className="text-blue-100 mt-1">Progress Reports Calendar</p>
            </div>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* User Selection for Directors/Managers */}
{availableUsers.length > 1 && (
  <div className="flex items-center justify-center space-x-4">
    <div className="flex items-center space-x-2">
      <Users className="w-5 h-5" />
      <span className="font-medium">
        {userAccessLevel === 'director' ? 'Viewing Team Member:' : 
         userAccessLevel === 'manager' ? 'Viewing Team Member:' : 
         'Viewing:'}
      </span>
    </div>
    <select
      value={selectedUser}
      onChange={(e) => setSelectedUser(e.target.value)}
      className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:bg-white/30 focus:outline-none min-w-[200px]"
    >
      {availableUsers.map((user) => (
        <option
          key={user.id}
          value={user.id}
          className="text-gray-900"
        >
          {user.name || user.email || `User ${user.id}`} 
          {getUserAccessLevel(user.role) !== 'employee' && 
            ` (${getUserAccessLevel(user.role)})`}
        </option>
      ))}
    </select>
  </div>
)}
  </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-bold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-3">{days}</div>

          {/* Enhanced Legend */}
          <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Calendar Legend
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200 border border-blue-500 rounded-lg"></div>
                <span className="text-gray-700 font-medium">
                  Today - Submit Report
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 border border-green-300 rounded-lg"></div>
                <span className="text-gray-700 font-medium">
                  Report Submitted
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-red-50 via-red-100 to-pink-100 border border-red-300 rounded-lg"></div>
                <span className="text-gray-700 font-medium">
                  Missing Report
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-50 border border-gray-200 rounded-lg opacity-60"></div>
                <span className="text-gray-700 font-medium">Future Date</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">
                Progress Indicators:
              </h4>
              <div className="flex items-center space-x-6 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
                  <span>90-100%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
                  <span>80-89%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded"></div>
                  <span>70-79%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded"></div>
                  <span>60-69%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-gradient-to-r from-red-400 to-red-600 rounded"></div>
                  <span>Below 60%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  interface Report {
    rejected: any;
    date: string;
    submittedAt: string;
    progress: number;
    tasks: { id: string; title: string }[]; // can be array or JSON string
    accomplishments: string;
    challenges: string;
    tomorrowPlan: string;
    approved: boolean;
    managerFeedback?: string;
  }

  interface Props {
    viewingReport: Report | null;
    setShowViewReport: (show: boolean) => void;
  }

  const ViewReportModal: React.FC<Props> = ({
    viewingReport,
    setShowViewReport,
  }) => {
    if (!viewingReport) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Progress Report Details</h3>
                <p className="text-green-100 mt-1">
                  Date: {formatDate(viewingReport.date)}
                </p>
                <p className="text-green-100 text-sm">
                  Submitted:{" "}
                  {new Date(viewingReport.submittedAt).toLocaleString()}
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
            {/* Progress Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">
                  Progress Overview
                </h4>
                <div className="flex items-center space-x-2">
  {viewingReport.approved ? (
    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-medium">Approved</span>
    </div>
  ) : viewingReport.rejected ? (
    <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full">
      <XCircle className="w-4 h-4" />
      <span className="text-sm font-medium">Rejected</span>
    </div>
  ) : (
    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium">Under Review</span>
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
                          viewingReport.progress >= 90
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : viewingReport.progress >= 80
                            ? "bg-gradient-to-r from-blue-400 to-blue-600"
                            : viewingReport.progress >= 70
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : viewingReport.progress >= 60
                            ? "bg-gradient-to-r from-orange-400 to-orange-600"
                            : "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                        style={{ width: `${viewingReport.progress}%` }}
                      />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {viewingReport.progress}%
                    </span>
                  </div>
                </div>

                {/* Tasks Section */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tasks Completed</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-2xl font-bold text-gray-900">
                      {Array.isArray(viewingReport.tasks)
                        ? viewingReport.tasks.length
                        : 0}
                    </span>
                    <span className="text-sm text-gray-600">tasks</span>
                  </div>

                  {Array.isArray(viewingReport.tasks) &&
                  viewingReport.tasks.length > 0 ? (
                    <div className="space-y-1">
                      {viewingReport.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 text-sm text-gray-700"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>
                            {typeof task === "object" && task?.title
                              ? task.title
                              : String(task)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tasks completed</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tasks Completed */}

            {/* Accomplishments */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-600" />
                <span>Key Accomplishments</span>
              </h4>
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <p className="text-gray-700 leading-relaxed">
                  {viewingReport.accomplishments ||
                    "No accomplishments recorded for this date."}
                </p>
              </div>
            </div>

            {/* Challenges */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Challenges Faced</span>
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-gray-700 leading-relaxed">
                  {viewingReport.challenges ||
                    "No challenges recorded for this date."}
                </p>
              </div>
            </div>

            {/* Tomorrow's Plan */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Next Day's Plan</span>
              </h4>
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-gray-700 leading-relaxed">
                  {viewingReport.tomorrowPlan ||
                    "No plans recorded for the next day."}
                </p>
              </div>
            </div>

            {/* Manager Feedback */}
            {viewingReport.managerFeedback && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span>Manager Feedback</span>
                </h4>
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="text-gray-700 leading-relaxed">
                    {viewingReport.managerFeedback}
                  </p>
                </div>
              </div>
            )}

            {/* Report Metadata */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Submission Date:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatDate(viewingReport.date)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`ml-2 font-medium ${
                      viewingReport.approved
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {viewingReport.approved ? "Approved" : "Under Review"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Submitted At:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(viewingReport.submittedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Progress Level:</span>
                  <span
                    className={`ml-2 font-medium ${
                      viewingReport.progress >= 90
                        ? "text-green-600"
                        : viewingReport.progress >= 80
                        ? "text-blue-600"
                        : viewingReport.progress >= 70
                        ? "text-yellow-600"
                        : "text-orange-600"
                    }`}
                  >
                    {viewingReport.progress >= 90
                      ? "Excellent"
                      : viewingReport.progress >= 80
                      ? "Good"
                      : viewingReport.progress >= 70
                      ? "Satisfactory"
                      : "Needs Improvement"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
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
    {/* Header */}
    <div className="text-center">
      {/* You can add team member selector here */}
    </div>

    {/* Enhanced Summary Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Reports */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">This Month</p>
            <p className="text-3xl font-bold mt-2">
              {userReports.filter((r) => r.submitted).length || 0}
            </p>
            <p className="text-blue-100 text-sm">Reports Submitted</p>
          </div>
          <Calendar className="w-8 h-8 text-blue-200" />
        </div>
      </div>

      {/* Approved */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100">Approved</p>
            <p className="text-3xl font-bold mt-2">
              {userReports.filter((r) => r.approved).length || 0}
            </p>
            <p className="text-green-100 text-sm">Reports Approved</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-200" />
        </div>
      </div>

      {/* Pending */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100">Pending</p>
            <p className="text-3xl font-bold mt-2">
              {userReports.filter(
                (r) => r.submitted && !r.approved && !r.rejected
              ).length || 0}
            </p>
            <p className="text-orange-100 text-sm">Awaiting Review</p>
          </div>
          <Clock className="w-8 h-8 text-orange-200" />
        </div>
      </div>

      {/* Avg Progress */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100">Avg Progress</p>
            <p className="text-3xl font-bold mt-2">
              {userReports.filter((r) => r.submitted).length > 0
                ? Math.round(
                    userReports
                      .filter((r) => r.submitted)
                      .reduce((sum, r) => sum + (r.progress || 0), 0) /
                      userReports.filter((r) => r.submitted).length
                  )
                : 0}
              %
            </p>
            <p className="text-purple-100 text-sm">This Month</p>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-200" />
        </div>
      </div>
    </div>

    {/* Calendar */}
    <CalendarView />
  


      {showSubmitForm && userAccessLevel !== 'director' && (
        <SubmitProgressForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowSubmitForm(false)}
          selectedDate={selectedDate}
          hasSubmittedToday={hasSubmittedToday()}
          availableTasks={availableTasks} // ✅ pass it here
        />
      )}

      {showViewReport && (
        <ViewReportModal
          viewingReport={viewingReport}
          setShowViewReport={setShowViewReport}
        />
      )}

      {showApprovalModal && reportToReview && (
  <ApprovalModal
    report={reportToReview}
    onClose={() => {
      setShowApprovalModal(false);
      setReportToReview(null);
    }}
    role={getUserAccessLevel(user.role) as "manager" | "director"} // pass the role
    handleReviewReport={handleReviewReport} // ✅ unified handler
  />
)}
    </div>
  );
};

export default ProgressReports;

