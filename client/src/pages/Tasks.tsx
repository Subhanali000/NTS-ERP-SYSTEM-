import React, { useState, useEffect } from 'react';
import {
  Plus, Filter, Calendar, CheckCircle,
  Clock, AlertCircle, TrendingUp, Send, Edit,
  Trash2
} from 'lucide-react';
import { getCurrentUser, isDirector, isManager,getSimpleDesignation } from '../utils/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Task = {
  user_id: string;
  manager: any;
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  latest_note: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  createdAt?: string;
  assigned_by?: string;
  updatedAt?: string;
  status?:string;
  progress_percent?: number; // <-- Add this line
};


interface Progress {
  task_id: string;
  // other fields like percentage, status, updated_at...
}


type User = {
  id: string;
  name: string;
  managerId?: string;
};




const Tasks: React.FC = () => {
  
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'team-tasks'>('my-tasks');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const user = getCurrentUser();
if (!user) return <div>Loading...</div>;
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

 
  
  const canManageTasks = isDirector(user?.role) || isManager(user?.role);
  const canEditTasks = isDirector(user?.role); // Only directors can edit tasks
  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const deadline = new Date(dueDate);
    return deadline < today;
  };

  // Fetch tasks and related data
const [hasFetched, setHasFetched] = useState(false);
const [projectsFetched, setProjectsFetched] = useState(false);
useEffect(() => {
  if (!user || hasFetched) return;

  const token = localStorage.getItem('token');
  if (!token) return;

  const role = getSimpleDesignation(user.role);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchData = async () => {
  try {
    const tasksUrl = `https://nts-erp-system-629k.vercel.app/api/${role}/tasks`;
    
    const [tasksRes, progressRes, usersRes, allUsersRes] = await Promise.all([
      fetch(tasksUrl, { headers }),
      fetch(`https://nts-erp-system-629k.vercel.app/api/${role}/progress`, { headers }),
      fetch(`https://nts-erp-system-629k.vercel.app/api/user/profile`, { headers }),
      fetch(`https://nts-erp-system-629k.vercel.app/api/users`, { headers }),
    ]);

    if (!tasksRes.ok) throw new Error(await tasksRes.text());
    if (!usersRes.ok) throw new Error(await usersRes.text());
    if (!allUsersRes.ok) throw new Error(await allUsersRes.text());

    const [tasksDataRaw, progressData, userData, allUsers] = await Promise.all([
      tasksRes.json(),
      progressRes.json(),
      usersRes.json(),
      allUsersRes.json(),
    ]);

    // Normalize tasks array
    const tasksData = Array.isArray(tasksDataRaw) ? tasksDataRaw : tasksDataRaw.tasks ?? [];

    console.groupCollapsed('🧾 Fetched Task Debug Info');
    console.log('Role:', role);
    console.log('User ID:', user.id);
    console.log('Tasks URL:', tasksUrl);
    console.log('🧾 Raw tasks response:', tasksData);
    console.log('📈 Progress data:', progressData);
    console.log('👤 User profile:', userData);
    console.log('👥 All users:', allUsers);
    console.groupEnd();

    const enrichedTasks = tasksData.map((task: Task) => {
      const update = progressData.find((p: Progress) => p.task_id === task.id);
      const manager = task.manager ?? allUsers.find((u: User) => u.id === task.assigned_by);

      return {
        ...task,
        user_id: task.assigneeId ?? task.user_id, // ✅ Normalize here
        progress_percent: update?.progress_percent || task.progress_percent || 0,
        status: update?.status || task.status || 'todo',
        latest_note: update?.progress_note || task.latest_note || '',
        manager,
      };
    });

    console.log('🔍 Enriched tasks:', enrichedTasks);

    setTasks(enrichedTasks);
    setUsers(allUsers);
    setHasFetched(true);
  } catch (err: any) {
    console.error('❌ Error fetching dashboard data:', err.message);
  }
};

  fetchData();
}, [user, hasFetched]);

const myTasks = tasks.filter(
  (task) =>
    (task.user_id === user.id || 
    (task.manager_id === user.id && task.created_by_director !== null)) &&
    task.status !== 'pending' // exclude pending tasks
);

// ✅ Team Tasks: tasks I assigned to my team (not to myself), excluding pending
const teamTasks = canManageTasks
  ? tasks.filter(
      (t) =>
        t.assigned_by === user.id &&
        t.user_id !== user.id &&
        t.status !== 'pending' // exclude pending tasks
    )
  : [];


  const currentTasks = activeTab === 'my-tasks' ? myTasks : teamTasks;

  const filteredTasks = currentTasks.filter(task => {
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const handleCreateTask = async (taskData: any) => {
    const token = localStorage.getItem('token');
    
    const payload = {
      title: taskData.title,
      description: taskData.description,
      project_id: taskData.projectId,
       assignee: taskData.assigneeId, 
      assigned_by: user.id,
      priority: taskData.priority,
      due_date: taskData.dueDate,
      status: 'todo'
    };

    console.log('📤 Creating task with payload:', payload);

    const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/${getSimpleDesignation(user.role)}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const created = await res.json();
      console.log('✅ Task created:', created);
      setTasks(prev => [...prev, created]);
      setShowCreateForm(false);
      // Refresh the data to get the latest tasks
      setHasFetched(false);
    } else {
      const errorText = await res.text();
      console.error('❌ Error creating task:', errorText);
      alert('Failed to create task: ' + errorText);
    }
  };

// Fetch active projects for managers/directors
useEffect(() => {
  const fetchActiveProjects = async () => {
    if (!user?.role || projectsFetched) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const role = getSimpleDesignation(user.role);
    const allowedRoles = ["manager", "director"];
    if (!allowedRoles.includes(role?.toLowerCase())) return;

    try {
      const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/${role.toLowerCase()}/active-projects`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch active projects:", errorText);
        return;
      }

      const body = await res.json();
const projectsData = Array.isArray(body) ? body : body.data || [];


      console.log("Active projects fetched:", projectsData);
      setProjects(projectsData);
      setProjectsFetched(true);
    } catch (err) {
      console.error("Error fetching active projects:", err);
      setProjectsFetched(true);
    }
  };

  fetchActiveProjects();
}, [user?.role, projectsFetched]);

// Example: logging team members once
useEffect(() => {
  if (teamMembers?.length) {
    console.log("Team members loaded:", teamMembers);
  }
}, [teamMembers]);








useEffect(() => {
  const fetchTeam = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const role = getSimpleDesignation(user?.role)?.toLowerCase();

    // Only allow manager or director
    const allowedRoles = ['manager', 'director'];
    if (!allowedRoles.includes(role)) {
      return;
    }

    try {
      const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/${role}/users/team`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await res.json();

      if (res.ok) {
        setTeamMembers(Array.isArray(body) ? body : body.data || []);

      }
    } catch (err) {
      // silently fail
    }
  };

  if (user?.role) {
    fetchTeam();
  }
}, [user?.role]);


const handleEditTask = async (taskId: string, taskData: any) => {
  const token = localStorage.getItem('token');
  const role = getSimpleDesignation(user?.role)?.toLowerCase();

  if (!token || !role || !user?.id) {
    alert('Unauthorized: Missing role, token, or user ID.');
    return;
  }

  try {
    const payload = {
      task_id: taskId,
      progress_percent: taskData.progress,
      status: taskData.status,
      comment: taskData.progressNotes,
      manager_id: user.id,
      project_status: taskData.projectStatus || taskData.status, // 👈 optional override
      project_id: taskData.project_id, // 👈 make sure you're passing project_id too
    };

    console.log('📤 Sending edit task payload to backend:', payload);

    const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/${role}/update-task-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const resBody = await res.json();

    if (!res.ok) {
      console.error('❌ Error from backend:', resBody);
      throw new Error(resBody?.error || 'Failed to update task');
    }

    if (resBody.data) {
      setTasks(prev =>
        prev.map(task => (task.id === taskId ? resBody.data : task))
      );
    }
setHasFetched(false);
    setShowEditForm(false);
    setSelectedTask(null);
    console.log('✅ Task updated successfully in backend');
  } catch (err: any) {
    console.error('❌ Task update failed:', err.message);
    alert('Failed to update task: ' + err.message);
  }
};



  const handleDeleteTask = async (taskId: string) => {
  const confirmDelete = window.confirm('Are you sure you want to delete this task?');
  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem('token');
    const role = getSimpleDesignation(user.role); // assuming this exists

    const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/${role}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(errorMsg);
    }

    // ✅ Remove from UI if delete was successful
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast.success('Task deleted successfully');
  } catch (error: any) {
    console.error('❌ Failed to delete task:', error.message);
    toast.error('Failed to delete task');
  }
};

  
  const handleUpdateProgress = async (taskId: string, progressData: any) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const payload = {
      task_id: taskId,
      progress_percent: progressData.progress,
      status: progressData.status,
      comment: progressData.comments, // ✅ backend expects `comment`
    };

    console.log('📤 Sending progress update payload:', payload);

    const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/${getSimpleDesignation(user.role)}/update-task-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // ✅ Parse once
    const resBody = await res.json();

    if (!res.ok) {
      console.error('❌ Server error response:', resBody);
      throw new Error(resBody?.error || 'Failed to update progress');
    }

    console.log('🟢 Backend response body:', resBody);

    // ✅ Update local state
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: progressData.status,
              progress_percent: progressData.progress,
              latest_note: progressData.comments,
            }
          : task
      )
    );

    setShowProgressForm(false);
    setSelectedTask(null);
  } catch (err: any) {
    console.error('❌ Failed to update progress:', err.message);
    alert('Failed to update progress: ' + err.message);
  }
};


  const getDaysUntilDeadline = (dueDate: string) => {
    const today = new Date();
    const deadline = new Date(dueDate);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-green-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'review': return <AlertCircle className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

 const TaskCard = ({ task, showAssignee = false }: { task: any; showAssignee?: boolean }) => {
  const project = projects?.find(p => p.id === task.project_id);
  const assignee = users?.find(u => u.id === task.user_id);
  const isMyTask = task.user_id === user.id;
if (task.status === 'pending') return null;
const manager = task.manager; // ✅ Already embedded



  const daysUntil = getDaysUntilDeadline(task.due_date);
  const overdue = isOverdue(task.due_date);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    if (isMyTask && task.status !== 'completed') {
      setSelectedTask(task.id);
      setShowProgressForm(true);
    }
  };

  return (
   <div
  onClick={handleCardClick}
  tabIndex={0}
  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow cursor-pointer"
>
      <div className="flex items-start justify-between mb-3">
  <div className="flex-1">
    {/* Title, priority and status icon */}
<div className="flex items-center space-x-2 mb-2">
  <h3 className="font-medium text-gray-900">{task.title}</h3>
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
      task.priority || 'none' // fallback for color handling
    )}`}
  >
    {task.priority || ":-)"} {/* fallback for text display */}
  </span>
  {getStatusIcon(task.status)}
</div>

    {/* Description */}
    <p className="text-sm text-gray-600 mb-2">{task.description}</p>

    {/* Project title, Manager, and Assignee */}
    <div className="flex items-center space-x-2 text-xs text-gray-500">
      {/* Project */}
      <span>{project?.title}</span>

      {/* Manager */}
      {manager && (
        <>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <img
  src={manager?.profile_photo || '/default-avatar.png'}
  alt={manager?.name || 'Manager'}
  className="w-4 h-4 rounded-full object-cover"
/>

            <span>{manager.name}</span>
            <span className="text-gray-400">(Manager)</span>
          </div>
        </>
      )}

      {/* Assignee */}
      {showAssignee && assignee && (
        <>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <img
  src={assignee?.avatar || '/default-avatar.png'}
  alt={assignee?.name || 'Assignee'}
  className="w-4 h-4 rounded-full object-cover"
/>
            <span>{assignee.name}</span>
            {assignee.role && (
              <span className="text-gray-400 text-xs">({assignee.role})</span>
            )}
          </div>
        </>
      )}
    </div>
  </div>
        

        <div className="flex items-center space-x-1">
  {/* Edit Task - only in 'my-tasks' and task status not pending */}
{activeTab === 'my-tasks' && (user.id === task.user_id || user.id === task.manager_id) && task.status !== 'pending' && (
  <button
    onClick={() => {
      setSelectedTask(task.id);
      setShowEditForm(true);
    }}
    className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
    title="Edit Task"
  >
    <Edit className="w-4 h-4" />
  </button>
)}

{/* Delete Task - only in 'team-tasks' and task status not pending */}
{activeTab === 'team-tasks' && task.status !== 'pending' && (
  <button
    onClick={() => handleDeleteTask(task.id)}
    className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
    title="Delete Task"
  >
    <Trash2 className="w-4 h-4" />
  </button>
)}
      </div>


      </div>

      {/* Status, Due Date, Progress */}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span className={overdue ? 'text-red-600 font-medium' : ''}>
              {overdue
                ? `${Math.abs(daysUntil)} days overdue`
                : daysUntil === 0
                ? 'Due today'
                : daysUntil > 0
                ? `${daysUntil} days left`
                : 'Completed'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${task.progress_percent || 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{task.progress_percent || 0}%</span>

          {isMyTask && task.status !== 'completed' && (
            <button
              onClick={() => {
                setSelectedTask(task.id);
                setShowProgressForm(true);
              }}
              className="ml-2 p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
              title="Update Progress"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface CreateTaskFormProps {
  handleCreateTask: (task: Task) => void;
  projects: any[];
  teamMembers: any[];
  setShowCreateForm: (show: boolean) => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  handleCreateTask,
  projects,
  teamMembers,
  setShowCreateForm,
}) => {
  // Add debugging at the top of the form component
  console.log("🎯 FORM DEBUG - Projects prop:", projects);
  console.log("🎯 FORM DEBUG - Projects length:", projects?.length || 0);
  console.log("🎯 FORM DEBUG - Projects is array:", Array.isArray(projects));

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    priority: 'low',
    dueDate: '',
    progress_percent: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.assigneeId) newErrors.assigneeId = 'Assignee is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      handleCreateTask(formData as Task);
    }
  };

  

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
            <p className="text-gray-600 mt-1">Assign a new task to your team member</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter task title..."
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe the task requirements and objectives..."
                />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>

  <select
    name="projectId"
    value={formData.projectId ?? ''}

    onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors.projectId ? 'border-red-300' : 'border-gray-300'
    }`}
  >
    <option value="">Select project...</option>
    {projects?.map((project: any) => {
      console.log("🔍 DROPDOWN DEBUG - Mapping project:", project);
      return (
      <option key={project.id} value={project.id}>
        {project.title}
      </option>
      );
    }) || <option disabled>No projects available</option>}
  </select>
  {/* Show debug info in UI */}
  <div className="text-xs text-gray-500 mt-1">
    Debug: {projects?.length || 0} projects loaded, Type: {typeof projects}, Array: {Array.isArray(projects) ? 'Yes' : 'No'}
  </div>
  {errors.projectId && <p className="text-red-600 text-sm mt-1">{errors.projectId}</p>}
</div>


              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Assignee *</label>
  <select 
    value={formData.assigneeId}
    onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors.assigneeId ? 'border-red-300' : 'border-gray-300'
    }`}
  >
    <option value="">Select team member...</option>
    {teamMembers.map(member => (
      <option key={member.id} value={member.id}>{member.name}</option>
    ))}
  </select>
  {errors.assigneeId && <p className="text-red-600 text-sm mt-1">{errors.assigneeId}</p>}
</div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
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
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dueDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.dueDate && <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
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
  };

  const ProgressUpdateForm = () => {
  const task = tasks.find(t => t.id === selectedTask);

  const [formData, setFormData] = useState({
    progress: task?.progress_percent || 0,
    status: task?.status || 'todo',
    comments: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTask) {
      handleUpdateProgress(selectedTask, formData);
    }
  };

  if (!task) return null; // Guard: prevents form from rendering without task
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Update Task Progress</h3>
            <p className="text-gray-600 mt-1">Update your progress on this task</p>
          </div>
          
          <div className="p-6">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{task?.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{task?.description}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress Percentage</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="font-bold text-blue-600">{formData.progress}%</span>
                  <span>100%</span>
                </div>

              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Update</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Ready for Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress Notes</label>
                <textarea
                  rows={4}
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what you've accomplished, challenges faced, and next steps..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Update Progress</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProgressForm(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };
interface EditTaskFormProps {
  tasks: any[];
  users: any[];
  selectedTask: string | null;
  user: User;
  setShowEditForm: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTask: React.Dispatch<React.SetStateAction<string | null>>;
  handleEditTask: (taskId: string, taskData: any) => Promise<void>;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({
  tasks,
  users,
  selectedTask,
  user,
  setShowEditForm,
  setSelectedTask,
  handleEditTask,
}) => {
  const task = tasks.find((t) => t.id === selectedTask);

  const [formData, setFormData] = useState({
    progress: task?.progress_percent || 0,
    status: task?.status || 'todo',
    progressNotes: task?.latest_note || ''
  });

  useEffect(() => {
    setFormData({
      progress: task?.progress_percent || 0,
      status: task?.status || 'todo',
      progressNotes: task?.latest_note || ''
    });
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTask) {
      handleEditTask(selectedTask, {
        ...formData,
        title: task?.title, // ensure title is preserved
        project_id: task?.project_id,
        projectStatus: formData.status,
      });
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
          <p className="text-gray-600 mt-1">Update progress for the task</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Name (Read-Only) */}
          <div>
            <input
              type="text"
              value={task?.title || ''}
              readOnly
              className="w-full text-center font-semibold border border-gray-200 bg-gray-100 text-gray-700 rounded-lg px-3 py-2"
            />
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={formData.progress}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, progress: parseInt(e.target.value) }))
              }
              className="w-full"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Ready for Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Progress Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Progress Notes</label>
            <textarea
              rows={4}
              value={formData.progressNotes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, progressNotes: e.target.value }))
              }
              placeholder="Add notes, blockers, or next steps..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowEditForm(false);
                setSelectedTask(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Update Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {canManageTasks ? 'Team & Task Management' : 'My Tasks'}
          </h1>
          <p className="text-gray-600 mt-1">
            {canManageTasks 
              ? 'Manage your team tasks and track progress' 
              : 'Track your assigned tasks and update progress'
            }
          </p>
        </div>
        {canManageTasks && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Tasks
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {currentTasks.length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {currentTasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {currentTasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {currentTasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Tasks ({myTasks.length})
            </button>
            {canManageTasks && (
              <button
                onClick={() => setActiveTab('team-tasks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'team-tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Team Tasks ({teamTasks.length})
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                showAssignee={activeTab === 'team-tasks'} 
              />
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tasks found</p>
              {canManageTasks && activeTab === 'team-tasks' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create your first task
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && (
        <CreateTaskForm
          handleCreateTask={handleCreateTask}
          projects={projects || []}
          teamMembers={teamMembers || []}
          setShowCreateForm={setShowCreateForm}
        />
      )}

      {showProgressForm && <ProgressUpdateForm />}
      {showEditForm && (
  <EditTaskForm
    tasks={tasks}
    users={users}
    selectedTask={selectedTask}
    user={user}
    setShowEditForm={setShowEditForm}
    setSelectedTask={setSelectedTask}
    handleEditTask={handleEditTask}
  />
)}

    </div>
  );
};

export default Tasks;
