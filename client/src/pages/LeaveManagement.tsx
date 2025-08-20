import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Filter,

  Send,
  MessageSquare,

} from "lucide-react";
import {  isDirector, isManager } from "../utils/auth";
import { formatDate, getRelativeDate } from "../utils/dateUtils";

const LeaveManagement: React.FC = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  // const [approvalComments, setApprovalComments] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const normalizeRole = (role: string) => {
  const lower = role.toLowerCase();
  if (["employee", "intern"].includes(lower)) return "employee";
  if (
    lower.includes("manager") || 
    lower.includes("team_lead") || 
    lower === "talent_acquisition_manager"
  ) return "manager";
  if (lower.includes("director")) return "director";
  return lower;
};


const [activeTab, setActiveTab] = useState<'my-requests' | 'approvals'>('my-requests');


const [showDateErrorPopup, setShowDateErrorPopup] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const isDir = isDirector(user?.role);
  const isMgr = isManager(user?.role);
  const canApprove = isDir || isMgr;

 const myRequests = leaveRequests.filter((lr) => lr.userId === user?.id);

const pendingApprovals = leaveRequests.filter((lr) => {
  const requester = users.find((u) => u.id === lr.userId);

  if (!requester) return false;

  const isFinalApproved =
    lr.managerApproval === "approved" || lr.directorApproval === "approved";
  const isCOA = user.role === "coa";

  // COA should not see leaves that are already approved
  if (isCOA && isFinalApproved) return false;

  if (isDir) {
    return (
      normalizeRole(requester.role) === "manager" &&
      requester.manager_id === user.id
    );
  }

  if (isMgr) {
    return (
      normalizeRole(requester.role) === "employee" &&
      requester.manager_id === user.id
    );
  }

  return false;
});


  const handleApproval = async (
  requestId: string,
  approve: boolean,
  comment: string
) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("❌ No auth token found.");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const role = normalizeRole(user.role); // e.g., "manager" or "director"
    const decision = approve ? "approved" : "rejected";

    console.log("🔁 Submitting approval:", {
      leaveId: requestId,
      status: decision,
      comments: comment,
      role,
    });

    const res = await fetch(
      `https://nts-erp-system-629k.vercel.app/api/${role}/approve-leaves`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          leaveId: requestId,
          status: decision,
          comments: comment,
          role,
        }),
      }
    );

    if (!res.ok) {
      const errorMessage = await res.text(); // get server error message
      console.error("❌ Approval failed:", errorMessage);
      throw new Error("Approval request failed");
    }

    const updatedLeave = await res.json();

    if (!updatedLeave || typeof updatedLeave !== "object" || !updatedLeave.id) {
      console.warn("⚠️ updatedLeave is null or missing 'id':", updatedLeave);
      return;
    }

    console.log("✅ Approval response:", updatedLeave);

    setLeaveRequests((prev) =>
      prev.map((lr) =>
        lr.id === updatedLeave.id
          ? {
              ...lr,
              managerApproval: updatedLeave.manager_approval,
              directorApproval: updatedLeave.director_approval,
              comments: updatedLeave.comments ?? comment, // fallback if backend omits it
            }
          : lr
      )
    );
  } catch (err) {
    console.error("❌ Error during approval:", err);
  }
};


  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        if (!token) {
          console.error("No token found, redirecting to login");
          window.location.href = "/login";
          return;
        }
        // Fetch logged-in user
        const authUserRes = await fetch(
          `https://nts-erp-system-629k.vercel.app/api/user/profile`,
          { headers }
        );
        if (!authUserRes.ok) throw new Error("Failed to fetch user");
        const authUser = await authUserRes.json();
        setUser(authUser);

        const role = normalizeRole(authUser.role);

        const leaveUrl =
          role === "employee" || role === "intern"
            ? `https://nts-erp-system-629k.vercel.app/api/employee/leaves`
            : `https://nts-erp-system-629k.vercel.app/api/${role}/leaves`;

        // Fetch leaves and users in parallel
        const [leaveRes, userListRes] = await Promise.all([
          fetch(leaveUrl, { headers }),
          fetch(`https://nts-erp-system-629k.vercel.app/api/users`, { headers }),
        ]);

        if (!leaveRes.ok || !userListRes.ok)
          throw new Error("Failed to fetch data");

        const leaveData = await leaveRes.json();
        const userList = await userListRes.json();

        // ✅ Map users (fixing snake_case to camelCase)
        const mappedUsers = userList.map((u: any) => ({
          ...u,
          role: u.role?.toLowerCase(),
          managerId: u.manager_id ?? null,
        }));

        setUsers(mappedUsers);
       const mappedLeaves = leaveData.map((leave: any) => ({
  id: leave.id,
  userId: leave.user_id,
  type: leave.leave_type,
  startDate: leave.start_date,
  endDate: leave.end_date,
  reason: leave.reason,
  status: leave.status?.toLowerCase(),
  comments: leave.comments,  // only one comment field from backend
  managerApproval: leave.manager_approval,
  directorApproval: leave.director_approval,
  createdAt: leave.created_at,
}));

mappedLeaves.forEach((leave: { id: any; comments: any; }) => {
  console.log(`Leave ID: ${leave.id} | Comments: ${leave.comments}`);
});



        
        console.log("✅ Mapped leaves:", mappedLeaves);
        console.log("👥 Users:", userList);
        console.log("📥 Pending approvals:", pendingApprovals);
        console.log("🧾 Filtered My Requests:", leaveRequests.filter(leave => leave.user_id === user.id));

        setLeaveRequests(mappedLeaves); // ✅ Use mapped version

        console.log("🖥️ Rendered leaveRequests:", mappedLeaves);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  const fetchAndSetLeaveRequests = async () => {
  if (!user) return;

  const token = localStorage.getItem("token");
  const role = normalizeRole(user.role);
  const headers = { Authorization: `Bearer ${token}` };

  try {
    let allLeaves: any[] = [];

    // ✅ Employees: only fetch their own leaves
    if (role === "employee") {
      const ownLeavesRes = await fetch(
        `https://nts-erp-system-629k.vercel.app/api/employee/leaves`,
        { headers }
      );
      if (!ownLeavesRes.ok) throw new Error("Failed to fetch own leaves");

      const ownLeaves = await ownLeavesRes.json();

      allLeaves = ownLeaves.map((leave: any) => ({
        id: leave.id,
        userId: leave.user_id,
        type: leave.leave_type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        reason: leave.reason,
        comments: leave.comments,
        status: leave.status?.toLowerCase(),
        managerApproval: leave.manager_approval,
        directorApproval: leave.director_approval,
        createdAt: leave.created_at,
      }));
    }

    // ✅ Managers/Directors: only fetch team leaves
    if (role === "manager" || role === "director") {
      const teamLeavesRes = await fetch(
        `https://nts-erp-system-629k.vercel.app/api/${role}/leaves`,
        { headers }
      );
      if (!teamLeavesRes.ok) throw new Error("Failed to fetch team leaves");

      const teamLeaves = await teamLeavesRes.json();

      allLeaves = teamLeaves
        .filter((leave: any) => {
          const requester = users.find((u) => u.id === leave.user_id);
          return (
            requester &&
            ["employee", "intern"].includes(normalizeRole(requester.role))
          );
        })
        .map((leave: any) => ({
          id: leave.id,
          userId: leave.user_id,
          type: leave.leave_type,
          startDate: leave.start_date,
          endDate: leave.end_date,
          comments: leave.comments,
          status: leave.status?.toLowerCase(),
          managerApproval: leave.manager_approval,
          directorApproval: leave.director_approval,
          createdAt: leave.created_at,
        }));
    }

    setLeaveRequests(allLeaves);
  } catch (err) {
    console.error("Error fetching updated leave list:", err);
  }
};


  const handleLeaveSubmission = async (formData: any) => {
    try {
      const role = normalizeRole(user.role);
      console.log("📤 Submitting leave request:", formData);

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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      console.log("📡 Response status:", res.status);
      console.log("📦 Response body:", body);

      if (!res.ok) {
        throw new Error(`Failed to submit leave request (${res.status})`);
      }

      // ✅ Refresh state after submission
      await fetchAndSetLeaveRequests();
    } catch (err) {
      console.error("Error submitting leave:", err);

      // Retry refetching on error
      try {
        const fallbackRole = normalizeRole(user.role);
        const token = localStorage.getItem("token");
        const updatedRes = await fetch(
          `https://nts-erp-system-629k.vercel.app/api/${fallbackRole}/leaves`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const updatedList = await updatedRes.json();
        const mapped = updatedList.map((leave: any) => ({
          id: leave.id,
          userId: leave.user_id,
          type: leave.leave_type,
          startDate: leave.start_date,
          endDate: leave.end_date,
          reason: leave.reason,
          status: leave.status?.toLowerCase(),
          comments: leave.comments,
          managerApproval: leave.manager_approval,
          directorApproval: leave.director_approval,
          createdAt: leave.created_at,
        }));

        setLeaveRequests(mapped);
      } catch (refetchErr) {
        console.error("Error refetching leaves after failure:", refetchErr);
      }
    }
  };

const LEAVE_QUOTA = 20;

// ✅ Count only approved leaves belonging to this user
const approvedLeaves = leaveRequests.filter(
  (lr) =>
    lr.userId === user?.id &&
    (
      lr.status === "approved" ||
      lr.managerApproval === "approved" ||
      lr.directorApproval === "approved"
    )
);

const usedDays = approvedLeaves.reduce((sum, lr) => {
  const start = new Date(lr.startDate);
  const end = new Date(lr.endDate);

  // 🔑 Normalize times to midnight to avoid timezone off-by-one
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Inclusive days difference
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

  return sum + (days > 0 ? days : 1); // Always at least 1 day
}, 0);

const remainingDays = Math.max(0, LEAVE_QUOTA - usedDays);

//////handle  calulation of balance whiel applying leaves 



  const filteredRequests = (requests: any[]) => {
    return requests.filter((request) => {
      const status = (request.status ?? "").toLowerCase();
      const type = (request.type ?? "").toLowerCase();
      const matchesStatus =
        !filterStatus || status === filterStatus.toLowerCase();
      const matchesType = !filterType || type === filterType.toLowerCase();
      return matchesStatus && matchesType;
    });
  };

  const LeaveRequestForm = () => {
    const [formData, setFormData] = useState({
      leave_type: "vacation", // ✅ correct
      startDate: "",
      endDate: "",
      reason: "",
    });
    console.log("🔍 Filter Status:", filterStatus);
    console.log("🔍 Filter Type:", filterType);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.startDate) newErrors.startDate = "Start date is required";
      if (!formData.endDate) newErrors.endDate = "End date is required";
      if (!formData.reason.trim()) newErrors.reason = "Reason is required";

      if (formData.startDate && formData.endDate) {
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
          newErrors.endDate = "End date must be after start date";
        }
        if (new Date(formData.startDate) < new Date()) {
          newErrors.startDate = "Start date cannot be in the past";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (validateForm()) {
        handleLeaveSubmission(formData);
      }
    };
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Request...</p>
          </div>
        </div>
      );
    }
const handleDateChange = (field: "startDate" | "endDate", value: string) => {
  if (remainingDays <= 0) {
    // 🚨 No balance at all
    setShowNoBalancePopup(true);
    return; // ❌ stop further date selection
  }

  setFormData((prev) => {
    const updated = { ...prev, [field]: value };

    if (updated.startDate && updated.endDate) {
      const start = new Date(updated.startDate);
      const end = new Date(updated.endDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      const diffDays =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

      if (diffDays > remainingDays) {
        setShowDateErrorPopup(true); // 🚨 too many days selected
        return prev; // ❌ don’t accept invalid range
      }
    }

    return updated;
  });
};
    if (!user) return null;

  return (
    <>
      {/* Main Leave Form */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative">
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
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.reason ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Please provide a reason for your leave request..."
              />
              {errors.reason && (
                <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Action Buttons */}
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
                onClick={() => setShowRequestForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 🚨 Error Popup - Always overlays above */}
      {showDateErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">
              📅 Invalid Selection
            </h3>
            <p className="text-gray-700 mb-4">
              You selected more days than your remaining leave balance of{" "}
              <span className="font-bold">{remainingDays}</span>. <br />
              Please pick fewer days.
            </p>
            <button
              onClick={() => setShowDateErrorPopup(false)}
              className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

  const ApprovalModal = ({ requestId }: { requestId: string }) => {
  const [approvalComments, setApprovalComments] = useState("");

  if (!user || leaveRequests.length === 0 || users.length === 0) {
    return <div className="text-center text-gray-600 py-4">Loading...</div>;
  }

  const request = leaveRequests.find((r) => r.id === requestId);
  if (!request) {
    return <div className="text-center text-red-500 py-4">Leave request not found</div>;
  }

  const requester = users.find((u) => u.id === request.userId || request.user_id);
  if (!requester) {
    return <div className="text-center text-red-500 py-4">Requester not found</div>;
  }

  const disableActions =
  request.managerApproval === "approved" ||
  request.managerApproval === "rejected" ||
  request.directorApproval === "approved" ||
  request.directorApproval === "rejected";

  const daysDifference =
    Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 3600 * 24)) + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Review Leave Request</h3>
          <p className="text-gray-600 mt-1">Approve or reject this leave request</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <img src={requester.avatar} alt={requester.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-gray-900">{requester.name}</p>
              <p className="text-sm text-gray-600">{requester.role.replace("_", " ").toUpperCase()}</p>
              <p className="text-xs text-gray-500">{requester.department.replace("_", " ").toUpperCase()}</p>
            </div>
          </div>

          {/* Leave Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Leave Type</p>
              <p className="text-lg font-semibold text-blue-900 capitalize">
                {request.type.replace("_", " ")}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Duration</p>
              <p className="text-lg font-semibold text-green-900">
                {daysDifference} day{daysDifference > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium mb-2">Dates</p>
            <p className="text-gray-900">{formatDate(request.startDate)} - {formatDate(request.endDate)}</p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium mb-2">Reason</p>
            <p className="text-gray-900">{request.reason}</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium mb-2">Submitted</p>
            <p className="text-gray-900">{getRelativeDate(request.createdAt)}</p>
          </div>

          {/* Comments Section */}  

          <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Comments 
  </label>

  {disableActions ? (
    <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 text-gray-700">
      {request.comments || "No comment provided."}

    </div>
  ) : (
    <textarea
      value={approvalComments}
      onChange={(e) => setApprovalComments(e.target.value)}
      rows={3}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder="Add any comments for the employee..."
    />
  )}


          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            disabled={disableActions}
            onClick={() => handleApproval(request.id, true, approvalComments)}
            className={`flex-1 py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2
              ${disableActions ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            <CheckCircle className="w-5 h-5" />
            <span>Approve</span>
          </button>

          <button
            disabled={disableActions}
            onClick={() => handleApproval(request.id, false, approvalComments)}
            className={`flex-1 py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2
              ${disableActions ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"}`}
          >
            <XCircle className="w-5 h-5" />
            <span>Reject</span>
          </button>

          <button
            onClick={() => {
              setSelectedRequest(null);
              setApprovalComments("");
            }}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isDir
              ? "Manager Leave Approvals"
              : isMgr
              ? "Employee Leave Management"
              : "Leave Requests"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isDir
              ? "Approve leave requests from managers"
              : isMgr
              ? "Approve employee and intern leave requests"
              : "Request and track your leave applications"}
          </p>
        </div>
        {user && (
  <button
    onClick={() => {
      if (remainingDays <= 0) {
        setShowPopup(true); // ✅ show popup when clicked
      } else {
        setShowRequestForm(true); // open form if balance > 0
      }
    }}
    className="mt-2 text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
  >
    <Plus className="w-4 h-4" />
    <span>Request Leave</span>
  </button>
)}

</div>

{/* Leave Balance Card - Only for employees */}
{!canApprove && user && (
  <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold mb-2">Leave Balance</h2>
        <p className="text-green-100">Available days for this year</p>
      </div>
      <div className="text-right">
        <div className="text-4xl font-bold">{remainingDays}</div>
        <p className="text-green-100">days remaining</p>
      </div>
    </div>
  </div>
)}

{/* Popup Modal */}
{showPopup && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center animate-fadeIn">
      <h3 className="text-lg font-semibold text-red-600 mb-2">⚠️ No Leave Balance</h3>
      <p className="text-gray-700 mb-4">
        You have already used all your {LEAVE_QUOTA} leave days for this year.
      </p>
      <button
        onClick={() => setShowPopup(false)}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition"
      >
        OK
      </button>
    </div>
  </div>
)}

      {canApprove && (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {/* Filter data based on active tab */}
    {(() => {
      const relevantRequests =
        activeTab === "my-requests"
          ? leaveRequests.filter((r) => r.userId === user.id) // only my requests
          : pendingApprovals; // only employee requests to approve

      return (
        <>
          {/* Pending */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-900">
                  {
                    relevantRequests.filter(
                      (r) =>
                        r.managerApproval === "pending" ||
                        r.directorApproval === "pending"
                    ).length
                  }
                </p>
                <p className="text-sm text-yellow-700">Pending Approval</p>
              </div>
            </div>
          </div>

          {/* Approved */}
<div className="bg-green-50 rounded-lg p-4 border border-green-200">
  <div className="flex items-center space-x-3">
    <div className="p-2 bg-green-100 rounded-lg">
      <CheckCircle className="w-5 h-5 text-green-600" />
    </div>
    <div>
      <p className="text-2xl font-bold text-green-900">
        {
          relevantRequests.filter(
            (r) =>
              r.managerApproval === "approved" ||
              r.directorApproval === "approved"
          ).length
        }
      </p>
      <p className="text-sm text-green-700">Approved</p>
    </div>
  </div>
</div>

{/* Rejected */}
<div className="bg-red-50 rounded-lg p-4 border border-red-200">
  <div className="flex items-center space-x-3">
    <div className="p-2 bg-red-100 rounded-lg">
      <XCircle className="w-5 h-5 text-red-600" />
    </div>
    <div>
      <p className="text-2xl font-bold text-red-900">
        {
          relevantRequests.filter(
            (r) =>
              r.managerApproval === "rejected" ||
              r.directorApproval === "rejected"
          ).length
        }
      </p>
      <p className="text-sm text-red-700">Rejected</p>
    </div>
  </div>
</div>


          {/* Total */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {relevantRequests.length}
                </p>
                <p className="text-sm text-blue-700">Total Requests</p>
              </div>
            </div>
          </div>
        </>
      );
    })()}
  </div>
)}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="vacation">Vacation</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </div>
<nav className="flex space-x-8 px-6">
  {/* My Requests Tab */}
  {!isDir && (
    <button
      onClick={() => setActiveTab("my-requests")}
      className={`py-4 px-1 border-b-2 text-sm font-medium ${
        activeTab === "my-requests"
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300"
      }`}
    >
      {canApprove ? "My Leave Requests" : "My Requests"} (
      {filteredRequests(myRequests).length})
    </button>
  )}

  {/* Approval Tab */}
  {canApprove && (
    <button
      onClick={() => setActiveTab("approvals")}
      className={`py-4 px-1 border-b-2 text-sm font-medium ${
        activeTab === "approvals"
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300"
      }`}
    >
      {isDir ? "Manager Approvals" : "Employee Approvals"} (
      {filteredRequests(pendingApprovals).length})
    </button>
  )}
</nav>
      


        <div className="p-6">
          {/* For Directors: Show only pending approvals */}
          {isDir ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pending Manager Leave Approvals
              </h3>
              {filteredRequests(pendingApprovals).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No pending manager leave requests to review
                  </p>
                </div>
              ) : (
                filteredRequests(pendingApprovals).map((request) => {
                  const requester = users.find((u) => u.id === request.userId);

                  const start = new Date(
                    request?.start_date ?? request?.startDate ?? ""
                  );
                  const end = new Date(
                    request?.end_date ?? request?.endDate ?? ""
                  );
                  const isValidDates =
                    !isNaN(start.getTime()) && !isNaN(end.getTime());

                  const daysDifference = isValidDates
                    ? Math.max(
                        1,
                        Math.ceil(
                          (end.getTime() - start.getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1
                      )
                    : 0;

                  if (!requester) return null;

                  return (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <img
                              src={requester?.avatar}
                              alt={requester?.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {requester?.name}
                              </h3>
                              <p className="text-sm text-gray-600 capitalize">
                                {requester?.role?.replace("_", " ") ??
                                  "Unknown"}{" "}
                                •{" "}
                                {request?.type?.replace("_", " ") ?? "Unknown"}{" "}
                                Leave
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              {daysDifference > 0
                                ? `${daysDifference} day${
                                    daysDifference > 1 ? "s" : ""
                                  }`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="ml-13">
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Duration:</strong>{" "}
                              {formatDate(request.startDate)} -{" "}
                              {formatDate(request.endDate)}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Reason:</strong> {request.reason}
                            </p>
                            <p className="text-xs text-gray-500">
                              Requested{" "}
                              {getRelativeDate(request?.createdAt) ?? "Unknown"}
                            </p>
                          </div>
                        </div>
<div className="flex space-x-2">
  {(request.managerApproval === "approved" || request.directorApproval === "approved") ? (
    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1">
      <CheckCircle className="w-4 h-4" />
      <span>Approved</span>
    </span>
  ) : (request.managerApproval === "rejected" || request.directorApproval === "rejected") ? (
    <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1">
      <XCircle className="w-4 h-4" />
      <span>Rejected</span>
    </span>
  ) : (
    <button
      onClick={() => setSelectedRequest(request.id)}
      className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <MessageSquare className="w-4 h-4" />
      <span>Review</span>
    </button>
  )}
</div>


                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
          ) : (
            
            <div className="space-y-6">
  {/* My Requests Section */}
{activeTab === "my-requests" && (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      My Leave Requests
    </h3>

    <div className="space-y-4">
      {!user ? (
        <p className="text-gray-500">Loading your requests...</p>
      ) : (
        <>
          {filteredRequests(myRequests).length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leave requests found</p>
              {!canApprove && (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create your first request
                </button>
              )}
            </div>
          ) : (
            filteredRequests(myRequests).map((request) => {
              const daysDifference =
                request?.startDate && request?.endDate
                  ? Math.max(
                      1,
                      Math.ceil(
                        (new Date(request.endDate).getTime() -
                          new Date(request.startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1
                    )
                  : 0;

             const visualStatus =
  request.managerApproval === "rejected" ||
  request.directorApproval === "rejected"
    ? "rejected"
    : request.managerApproval === "approved" ||
      request.directorApproval === "approved"
    ? "approved"
    : request.status ?? "pending";

return (
  <div
    key={request.id}
    className="border border-gray-200 rounded-lg p-4"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900 capitalize">
            {request?.type ? request.type.replace("_", " ") : "Unknown"}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              visualStatus === "approved"
                ? "bg-green-100 text-green-800"
                : visualStatus === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {visualStatus}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {daysDifference > 0
              ? `${daysDifference} day${daysDifference > 1 ? "s" : ""}`
              : "N/A"}
          </span>
        </div>

        <p className="text-sm text-gray-600 mt-1">
          {formatDate(request?.startDate)} - {formatDate(request?.endDate)}
        </p>

        <p className="text-sm text-gray-500 mt-1">{request.reason}</p>

        {/* ✅ Show approval or rejection comments */}
        {(visualStatus === "approved" || visualStatus === "rejected") && (
          <div
            className={`mt-3 rounded-lg p-3 space-y-2 border ${
              visualStatus === "approved"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                visualStatus === "approved" ? "text-green-700" : "text-red-700"
              }`}
            >
              {visualStatus === "approved" ? "Approved By:" : "Rejected By:"}
            </p>

            {/* ✅ Manager */}
            {request.managerApproval === visualStatus && (
              <div className="text-sm text-gray-800">
                <p>{visualStatus === "approved" ? "✅ Manager" : "❌ Manager"}</p>
                {(request.managerComment || request.comments) && (
                  <p className="text-gray-600 italic ml-4">
                    “{request.managerComment || request.comments}”
                  </p>
                )}
              </div>
            )}{(request.directorComment || request.director_comment || request.comments) && (
  <p className="text-gray-600 italic ml-4">
    “{request.directorComment || request.director_comment || request.comments}”
  </p>
)}


            {/* ✅ Director */}
           {request.directorApproval === visualStatus && (
  <div className="text-sm text-gray-800">
    <p>{visualStatus === "approved" ? "✅  Director" : "❌ Director"}</p>
    {(request.directorComment || request.director_comment) && (
      <p className="text-gray-600 italic ml-4">
        “{request.directorComment || request.director_comment}”
      </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-right mt-2">
        <p className="text-sm text-gray-500">
          Requested {getRelativeDate(request?.createdAt) ?? "Unknown"}
        </p>
      </div>
    </div>
  </div>
);

            })
          )}
        </>
      )}
    </div>
  </div>
)}


              {/* Approvals Section for Managers */}
  {canApprove && activeTab === "approvals" && (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isMgr ? "Employee Approvals" : "Approvals"}
      </h3>
                  <div className="space-y-4">
                    {filteredRequests(pendingApprovals).length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No pending approvals</p>
                        <p className="text-sm text-gray-400 mt-1">
                          No employee leave requests to review
                        </p>
                      </div>
                    ) : (
                      filteredRequests(pendingApprovals).map((request) => {
                        const requester = users.find(
                          (u) => u.id === request.userId
                        );

                        if (!requester) return null;

                        const daysDifference =
                          request?.startDate && request?.endDate
                            ? Math.max(
                                1,
                                Math.ceil(
                                  (new Date(request.endDate).getTime() -
                                    new Date(request.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                ) + 1
                              )
                            : 0;

                       return (
  <div
    key={request.id}
    onClick={() => setSelectedRequest(request.id)} // Click anywhere to open modal
    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          <img
            src={requester?.avatar}
            alt={requester?.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-900">{requester?.name}</h3>
            <p className="text-sm text-gray-600 capitalize">
              {requester?.role ? requester.role.replace("_", " ") : "Unknown"}
            </p>
          </div>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            {daysDifference > 0
              ? `${daysDifference} day${daysDifference > 1 ? "s" : ""}`
              : "N/A"}
          </span>
        </div>

        <div className="ml-13">
          <p className="text-sm text-gray-600 mb-1">
            <strong>Leave Type:</strong> {request.type}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Duration:</strong> {formatDate(request.startDate)} -{" "}
            {formatDate(request.endDate)}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Reason:</strong> {request.reason}
          </p>
          <p className="text-xs text-gray-500">
            Requested {getRelativeDate(request.createdAt)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
<div className="flex space-x-2">
  {request.managerApproval === "approved" || request.directorApproval === "approved" ? (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent parent click
        setSelectedRequest(request.id);
      }}
      className="flex items-center space-x-1 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition-colors"
    >
      <CheckCircle className="w-4 h-4" />
      <span>Approved</span>
    </button>
  ) : request.managerApproval === "rejected" || request.directorApproval === "rejected" ? (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent parent click
        setSelectedRequest(request.id);
      }}
      className="flex items-center space-x-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors"
    >
      <XCircle className="w-4 h-4" />
      <span>Rejected</span>
    </button>
  ) : (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent parent click
        setSelectedRequest(request.id);
      }}
      className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <MessageSquare className="w-4 h-4" />
      <span>Review</span>
    </button>
  )}
</div>

    </div>
  </div>
);

                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      

      {/* Modals */}
      {showRequestForm && <LeaveRequestForm />}
     {selectedRequest && (
  <ApprovalModal requestId={selectedRequest} />
)}
    </div>
  );
};

export default LeaveManagement;
function setShowNoBalancePopup(arg0: boolean) {
  throw new Error("Function not implemented.");
}

