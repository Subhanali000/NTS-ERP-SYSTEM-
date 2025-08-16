export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
  department: Department;
  avatar?: string;
  joinDate: string;
  leaveBalance: number;
}

export type UserRole = 
  | 'global_hr_director'
  | 'global_operations_director'
  | 'engineering_director'
  | 'director_tech_team'
  | 'director_business_development'
  | 'talent_acquisition_manager'
  | 'project_tech_manager'
  | 'quality_assurance_manager'
  | 'software_development_manager'
  | 'systems_integration_manager'
  | 'client_relations_manager'
  | 'team_lead'
  | 'employee'
  | 'intern';

export type Department = 
  | 'hr'
  | 'operations'
  | 'engineering'
  | 'tech'
  | 'business_development'
  | 'quality_assurance'
  | 'systems_integration'
  | 'client_relations';

export interface Project {
  id: string;
  title: string;
  description: string;
  managerId: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  startDate: string;
  endDate: string;
  progress: number;
  teamMembers: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  progressPct: number;
  createdAt: string;
}
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  progressPct: number;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  inTime?: string;
  outTime?: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  totalHours?: number;
}

export interface LeaveRequest {
  LeaveRequest: any;
  id: string;
  userId: string;
  startDate: string;
  leave_type?: string; // ✅ Add this
  endDate: string;
  reason: string;
  requester?: User; // ✅ Add this
  managerApproval: "pending" | "approved" | "rejected";  // ✅ Add this
  directorApproval: "pending" | "approved" | "rejected"; // ✅ Add this
  type: 'sick' | 'vacation' | 'personal' | 'emergency';
  status: 'pending' | 'approved' | 'rejected';
  approverChain: ApprovalStep[];
  createdAt: string;
}

export interface ApprovalStep {
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comments?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ProgressReport {
  status: string;
  id: string;
  taskId: string;
  userId: string;
  progress: number;
  comments: string;
  timestamp: string;
  managerComments?: string;
  approved: boolean;
}