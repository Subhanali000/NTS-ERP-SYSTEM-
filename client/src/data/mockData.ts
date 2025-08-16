import { User, Project, Task, Attendance, LeaveRequest, Notification, ProgressReport } from '../types';

export const mockUsers: User[] = [
  // Directors
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@nts.com',
    role: 'global_hr_director',
    department: 'hr',
    joinDate: '2020-01-15',
    leaveBalance: 25,
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@nts.com',
    role: 'global_operations_director',
    department: 'operations',
    joinDate: '2019-03-20',
    leaveBalance: 22,
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@nts.com',
    role: 'engineering_director',
    department: 'engineering',
    joinDate: '2018-07-10',
    leaveBalance: 28,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@nts.com',
    role: 'director_tech_team',
    department: 'tech',
    joinDate: '2019-11-05',
    leaveBalance: 20,
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@nts.com',
    role: 'director_business_development',
    department: 'business_development',
    joinDate: '2020-05-12',
    leaveBalance: 24,
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  // Managers
  {
    id: '6',
    name: 'James Wilson',
    email: 'james.wilson@nts.com',
    role: 'talent_acquisition_manager',
    department: 'hr',
    managerId: '1',
    joinDate: '2021-02-18',
    leaveBalance: 18,
    avatar: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '7',
    name: 'Anna Martinez',
    email: 'anna.martinez@nts.com',
    role: 'project_tech_manager',
    department: 'tech',
    managerId: '4',
    joinDate: '2020-09-14',
    leaveBalance: 21,
    avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '8',
    name: 'Robert Davis',
    email: 'robert.davis@nts.com',
    role: 'software_development_manager',
    department: 'engineering',
    managerId: '3',
    joinDate: '2019-12-03',
    leaveBalance: 19,
    avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  // Team Leads
  {
    id: '12',
    name: 'Marcus Thompson',
    email: 'marcus.thompson@nts.com',
    role: 'team_lead',
    department: 'engineering',
    managerId: '8',
    joinDate: '2021-08-15',
    leaveBalance: 18,
    avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '13',
    name: 'Isabella Rodriguez',
    email: 'isabella.rodriguez@nts.com',
    role: 'team_lead',
    department: 'tech',
    managerId: '7',
    joinDate: '2021-11-10',
    leaveBalance: 19,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '14',
    name: 'Oliver Brown',
    email: 'oliver.brown@nts.com',
    role: 'team_lead',
    department: 'hr',
    managerId: '6',
    joinDate: '2021-06-12',
    leaveBalance: 20,
    avatar: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  // Employees
  {
    id: '9',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@nts.com',
    role: 'employee',
    department: 'engineering',
    managerId: '8',
    joinDate: '2022-01-10',
    leaveBalance: 15,
    avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '10',
    name: 'Alex Johnson',
    email: 'alex.johnson@nts.com',
    role: 'employee',
    department: 'tech',
    managerId: '7',
    joinDate: '2022-03-15',
    leaveBalance: 16,
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  // Interns
  {
    id: '11',
    name: 'Sam Parker',
    email: 'sam.parker@nts.com',
    role: 'intern',
    department: 'engineering',
    managerId: '8',
    joinDate: '2023-06-01',
    leaveBalance: 10,
    avatar: 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=150'
  }
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Customer Portal Redesign',
    description: 'Complete overhaul of the customer-facing portal with modern UI/UX',
    managerId: '7',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-04-30',
    progress: 65,
    teamMembers: ['9', '10', '11']
  },
  {
    id: 'proj-2',
    title: 'API Integration Platform',
    description: 'Build a unified platform for third-party API integrations',
    managerId: '8',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-06-15',
    progress: 40,
    teamMembers: ['9', '10']
  },
  {
    id: 'proj-3',
    title: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android',
    managerId: '7',
    status: 'planning',
    startDate: '2024-03-01',
    endDate: '2024-08-30',
    progress: 15,
    teamMembers: ['10', '11']
  }
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Design System Implementation',
    description: 'Implement the new design system components',
    assigneeId: '9',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-02-15',
    progressPct: 75,
    createdAt: '2024-01-20'
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    title: 'User Authentication Flow',
    description: 'Implement secure user authentication and authorization',
    assigneeId: '10',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-02-10',
    progressPct: 100,
    createdAt: '2024-01-18'
  },
  {
    id: 'task-3',
    projectId: 'proj-2',
    title: 'API Documentation',
    description: 'Create comprehensive API documentation',
    assigneeId: '11',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-02-20',
    progressPct: 0,
    createdAt: '2024-02-01'
  }
];

export const mockAttendance: Attendance[] = [
  {
    id: 'att-1',
    userId: '9',
    date: '2024-02-01',
    inTime: '09:00',
    outTime: '18:00',
    status: 'present',
    totalHours: 9
  },
  {
    id: 'att-2',
    userId: '10',
    date: '2024-02-01',
    inTime: '09:15',
    outTime: '18:30',
    status: 'late',
    totalHours: 9.25
  },
  {
    id: 'att-3',
    userId: '11',
    date: '2024-02-01',
    inTime: '08:45',
    outTime: '17:45',
    status: 'present',
    totalHours: 9
  }
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    userId: '9',
    startDate: '2024-02-15',
    endDate: '2024-02-16',
    reason: 'Personal work',
    type: 'personal',
    status: 'pending',
    approverChain: [
      { approverId: '8', status: 'pending' },
      { approverId: '3', status: 'pending' }
    ],
    createdAt: '2024-02-01'
  },
  {
    id: 'leave-2',
    userId: '10',
    startDate: '2024-02-20',
    endDate: '2024-02-22',
    reason: 'Family vacation',
    type: 'vacation',
    status: 'approved',
    approverChain: [
      { approverId: '7', status: 'approved', timestamp: '2024-02-02T10:30:00Z' },
      { approverId: '4', status: 'approved', timestamp: '2024-02-02T14:15:00Z' }
    ],
    createdAt: '2024-01-30'
  },
  {
    id: 'leave-3',
    userId: '7',
    startDate: '2024-03-01',
    endDate: '2024-03-03',
    reason: 'Medical appointment',
    type: 'sick',
    status: 'pending',
    approverChain: [
      { approverId: '4', status: 'pending' }
    ],
    createdAt: '2024-02-15'
  },
  {
    id: 'leave-4',
    userId: '8',
    startDate: '2024-03-10',
    endDate: '2024-03-12',
    reason: 'Conference attendance',
    type: 'personal',
    status: 'pending',
    approverChain: [
      { approverId: '3', status: 'pending' }
    ],
    createdAt: '2024-02-20'
  }
];

export let mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: '8',
    title: 'Leave Request Pending',
    message: 'Jennifer Lee has requested leave for Feb 15-16. Please review and approve.',
    type: 'info',
    read: false,
    createdAt: '2024-02-01T09:00:00Z',
    actionUrl: '/leave-management'
  },
  {
    id: 'notif-2',
    userId: '9',
    title: 'Task Assigned',
    message: 'New task "Design System Implementation" has been assigned to you by Robert Davis.',
    type: 'info',
    read: true,
    createdAt: '2024-01-20T14:30:00Z',
    actionUrl: '/tasks'
  },
  {
    id: 'notif-3',
    userId: '10',
    title: 'Leave Approved',
    message: 'Your leave request for Feb 20-22 has been approved by Anna Martinez.',
    type: 'success',
    read: false,
    createdAt: '2024-02-02T14:15:00Z'
  },
  {
    id: 'notif-4',
    userId: '7',
    title: 'Project Deadline Approaching',
    message: 'Customer Portal Redesign project deadline is in 5 days. Please review progress.',
    type: 'warning',
    read: false,
    createdAt: '2024-02-10T10:00:00Z',
    actionUrl: '/projects'
  },
  {
    id: 'notif-5',
    userId: '8',
    title: 'Team Progress Report',
    message: 'Weekly team progress report is ready for review. 3 tasks completed this week.',
    type: 'info',
    read: false,
    createdAt: '2024-02-12T16:00:00Z',
    actionUrl: '/team-progress'
  },
  {
    id: 'notif-6',
    userId: '3',
    title: 'Manager Leave Request',
    message: 'Robert Davis has requested leave for Mar 10-12. Director approval required.',
    type: 'info',
    read: false,
    createdAt: '2024-02-20T11:30:00Z',
    actionUrl: '/leave-management'
  },
  {
    id: 'notif-7',
    userId: '4',
    title: 'Project Proposal Submitted',
    message: 'Anna Martinez has submitted a new project proposal for review and approval.',
    type: 'info',
    read: false,
    createdAt: '2024-02-18T13:45:00Z',
    actionUrl: '/projects'
  },
  {
    id: 'notif-8',
    userId: '9',
    title: 'Task Deadline Tomorrow',
    message: 'Your task "Design System Implementation" is due tomorrow. Please update progress.',
    type: 'warning',
    read: false,
    createdAt: '2024-02-14T09:00:00Z',
    actionUrl: '/tasks'
  },
  {
    id: 'notif-9',
    userId: '11',
    title: 'Welcome to the Team',
    message: 'Welcome to NTS Technologies! Please complete your profile and review company policies.',
    type: 'info',
    read: true,
    createdAt: '2023-06-01T08:00:00Z'
  },
  {
    id: 'notif-10',
    userId: '6',
    title: 'New Employee Onboarding',
    message: 'Sam Parker has joined as an intern. Please prepare onboarding materials.',
    type: 'info',
    read: true,
    createdAt: '2023-06-01T10:00:00Z'
  }
];

export const mockProgressReports: ProgressReport[] = [
  {
    id: 'progress-1',
    taskId: 'task-1',
    userId: '9',
    progress: 75,
    comments: 'Completed component library setup and implemented 8 out of 12 core components',
    timestamp: '2024-02-01T17:00:00Z',
    approved: true,
    managerComments: 'Great progress! Keep up the good work.'
  },
  {
    id: 'progress-2',
    taskId: 'task-2',
    userId: '10',
    progress: 100,
    comments: 'Authentication flow completed with JWT implementation and role-based access control',
    timestamp: '2024-02-10T16:30:00Z',
    approved: true,
    managerComments: 'Excellent work! Ready for production deployment.'
  }
];