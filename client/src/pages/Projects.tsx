import React, { useState, useEffect } from 'react';
import {
  Plus, Users, Calendar, TrendingUp, Briefcase, Edit, Trash2, Eye,
  Filter, Search, CheckCircle, Clock, AlertTriangle, MessageSquare,
  Send, X, UserCheck, FileText
} from 'lucide-react';
import {
  getCurrentUser, isDirector, isManager, getSimpleDesignation, getRoleDisplayName
} from '../utils/auth';

import { formatDate, getDaysUntilDeadline, isOverdue } from '../utils/dateUtils';
import axios from 'axios';
interface Task {
  id: string;
  user_id?: string;
  title: string;
}

interface Project {
  id: string;
  name: string;
  tasks?: Task[];
}

const Projects: React.FC = () => {
  
  const user = getCurrentUser();
  const simplifiedRole = getSimpleDesignation(user?.role ?? '');
  const canManageProjects = isDirector(user?.role ?? '') || isManager(user?.role ?? '');
//   const [title, setTitle] = useState('');
// const [description, setDescription] = useState('');
// const [startDate, setStartDate] = useState('');
// const [endDate, setEndDate] = useState('');
// const [assignedManagers, setAssignedManagers] = useState<string[]>([]);
// const [managerSelectCount, setManagerSelectCount] = useState(0);
//   // State management
  const [projects, setProjects] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [directors, setDirectors] = useState<any[]>([]);
  // Modal states
  const [managerId, setManagerId] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAssignEmployees, setShowAssignEmployees] = useState<string | null>(null);
  const [showViewProject, setShowViewProject] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  
  const isDirectorUser = isDirector(user?.role ?? '');
  const isManagerUser = isManager(user?.role ?? '');
  // Load data on component mount
 useEffect(() => {
  loadInitialData();
}, [simplifiedRole]);

const loadInitialData = async () => {
  setLoading(true);

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No authentication token found');
    setLoading(false);
    return;
  }

  if (!simplifiedRole) {
    console.error('❌ No role found for current user');
    setLoading(false);
    return;
  }

  try {
    // Load projects (for managers/directors)
    if (canManageProjects) {
      const projectsRes = await axios.get(
        `https://nts-erp-system-629k.vercel.app/api/${simplifiedRole}/active-projects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

   

const raw = projectsRes.data;

const projects =
  Array.isArray(raw)
    ? raw
    : Array.isArray(raw.active_projects)
      ? raw.active_projects
      : Array.isArray(raw.projects)
        ? raw.projects
        : [];


      setProjects(projects);


      console.groupCollapsed('📁 Active Projects Fetched');
      console.log('📦 Raw response:', projectsRes.data);
      console.log('✅ Parsed projects:', projects);
      projects.forEach((project: { name: any; id: any; assigned_managers: string | any[]; assigned_employees: string | any[]; }) => {
        console.log(`📌 Project: ${project.name || project.id}`);
        console.log(`   Assigned Managers: ${project.assigned_managers?.length || 0}`);
        console.log(`   Assigned Employees: ${project.assigned_employees?.length || 0}`);
      });
      console.groupEnd();
    }

    // 👉 For Director: Load both managers and employees
    if (isDirector(user?.role ?? '')) {
      const [managersRes, employeesRes] = await Promise.all([
        axios.get(`https://nts-erp-system-629k.vercel.app/api/director/managers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`https://nts-erp-system-629k.vercel.app/api/director/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const managers = Array.isArray(managersRes.data?.managers)
        ? managersRes.data.managers
        : managersRes.data;

      const employees = Array.isArray(employeesRes.data?.employees)
        ? employeesRes.data.employees
        : employeesRes.data;

      setManagers(managers);
      setEmployees(employees);

      console.groupCollapsed('👥 Director Team Debug');
      console.log('🧑‍💼 Director:', user?.name, `(ID: ${user?.id})`);
      console.log('📦 Managers:', managers);
      console.log('👥 Employees:', employees);
      console.groupEnd();
    }

    // 👉 For Manager: Load team members
    if (isManager(user?.role?? '')) {
      const teamRes = await axios.get(`https://nts-erp-system-629k.vercel.app/api/manager/users/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const teamData = Array.isArray(teamRes.data)
        ? teamRes.data
        : teamRes.data?.data || [];

      setEmployees(teamData);

      projects.forEach(project => {
        console.log(`📌 Project: ${project.name || project.id} — Assigned Employees: ${project.assigned_employee_count || 0}`);
      });

      console.groupCollapsed('👥 Manager Team Debug');
      console.log('🧑‍💼 Manager:', user?.name, `(ID: ${user?.id})`);
      console.log('📦 Raw response:', teamRes.data);
      console.log('✅ Parsed team data:', teamData);
      console.groupEnd();
    }
  } catch (error) {
    console.error('❌ Error loading initial data:', error);
  } finally {
    setLoading(false);
  }
};


  // Filter projects based on user role and permissions
  const getUserProjects = () => {
    if (isDirector(user?.role?? '')) {
      // Directors see all projects
      return projects;
    } else if (isManager(user?.role?? '')) {
      // Managers see all projects (their own and others)
      return projects;
    } else {
      // Employees see projects they're assigned to
      return user ? projects.filter(p => p.team_members?.includes(user.id)) : [];
    }
  };

  const userProjects = getUserProjects();

const pendingApprovals = user && isDirector(user.role)
  ? projects.filter(p => p.status === 'pending_approval' && p.manager_id !== user.id)
  : [];


  // Get approved projects (active, completed, etc.)
  const approvedProjects = userProjects.filter(p => p.status !== 'pending');

  // Filter projects based on search and status
  const filteredProjects = userProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
const handleCreateProject = async (projectData: any) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const payload: any = {
      title: projectData.title,
      description: projectData.description,
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      priority: projectData.priority, // ✅ Added priority from frontend form
      status: isManager(user?.role?? '')
        ? 'pending_approval'
        : isDirector(user?.role?? '')
          ? 'active'
          : 'pending',
    };

    if (isDirector(user?.role?? '')) {
      payload.manager_id = projectData.managerId;
      payload.assigned_managers = projectData.assignedManagers || [];
    } else if (isManager(user?.role?? '')) {
      payload.assigned_employees = projectData.assignedEmployees || [];
    }

    console.log("📦 Payload before submit (raw):", payload);
    console.log("📤 Sending project creation request with data:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `https://nts-erp-system-629k.vercel.app/api/${simplifiedRole}/create-project`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('🧪 Role:', user?.role);
    console.log('🧪 Assigned Employees:', projectData.assignedEmployees);
 await loadInitialData(); 
    setShowCreateProject(false);
    setProjects(prev => [...prev, response.data.project]);
    setShowCreateProject(false);
    setShowAssignEmployees(response.data.project.id);

    console.log('✅ Project created successfully');
  } catch (error: any) {
    console.error('❌ Error creating project:', error?.response?.data?.error || error.message);
  }
};

////assigneTaskEmployee///


const handleProjectApproval = async (
  projectId: string,
  approved: boolean,
  approvalComments?: string,
  status?: string,
  priority?: string
) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    console.log(`📤 Sending project approval:
      Project ID: ${projectId}
      Approved: ${approved}
      Status: ${status}
      Priority: ${priority}
      Comments: ${approvalComments}
    `);

    const response = await axios.post(
      `https://nts-erp-system-629k.vercel.app/api/director/approve-project`,
      {
        project_id: projectId,
        approval_comments: approvalComments || '', // matches backend
        status,    // optional, your backend derives status if missing
        priority,  // required when approving
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Update project status locally
    setProjects(prev =>
      prev.map(project =>
        project.id === projectId
          ? {
              ...project,
              status: approved ? status || 'active' : 'rejected',
              priority,
              approval_comments: approvalComments || '',
            }
          : project
      )
    );

    await loadInitialData();

    setShowApprovalModal(false);
    setSelectedProject(null);
    setApprovalComments('');

    console.log(
      `✅ Project ${approved ? 'approved' : 'rejected'} successfully with status: ${status} and priority: ${priority}`
    );
  } catch (error) {
    console.error('❌ Error approving project:', error);
  }
};

  // Assign employees to project
  const handleAssignEmployees = async (projectId: string, employeeIds: string[]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.post(
        `https://nts-erp-system-629k.vercel.app/api/manager/assigne-task-employee`,
        {
          project_id: projectId,
          employee_ids: employeeIds,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
await loadInitialData();
    setShowApprovalModal(false);
      setProjects(prev => prev.map(project =>
        project.id === projectId ? { ...project, team_members: employeeIds } : project
      ));
      setShowAssignEmployees(null);
      console.log('✅ Employees assigned successfully');
    } catch (error) {
      console.error('❌ Error assigning employees:', error);
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        await axios.delete(`https://nts-erp-system-629k.vercel.app/api/${simplifiedRole}/delete-projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProjects(prev => prev.filter(p => p.id !== projectId));
        console.log('✅ Project deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting project:', error);
      }
    }
  };

// Update project (for directors)
const handleUpdateProject = async (projectId: string, updateData: any) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    // Add tasks array with one task that mirrors the project details (example)
    // You can customize the task fields as needed
    const tasks = [
      {
        id: updateData.taskId || null,  // you may pass an existing task ID to update, or null for a new task
        title: updateData.title,         // same title as project
        description: updateData.description || '',  // same description as project
        priority: updateData.priority || 'medium',
        due_date: updateData.end_date || null,      // due date maybe project end_date
        // no status sent here, backend will force 'in_progress'
      }
    ];

    const dataToSend = {
      ...updateData,
      tasks, // attach tasks array here
    };

    console.log('🚀 Sending update data with tasks:', JSON.stringify(dataToSend, null, 2));

    await axios.put(
      `https://nts-erp-system-629k.vercel.app/api/director/update-project/${projectId}`,
      dataToSend,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await loadInitialData();
    setShowViewProject(null);
    console.log('✅ Project and tasks updated successfully');
  } catch (error) {
    console.error('❌ Error updating project:', error);
  }
};

 

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'pen': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending_approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // ✅ Add this
    
    case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'low':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

  // Create Project Form Component
  const CreateProjectForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    managerId: isDirector(user?.role ?? '') ? '' : user?.id ?? '',
    startDate: '',
    projectId: '',  
    endDate: '',
    assignedEmployees: [] as string[],
    assignedManagers: [] as string[],
    priority: '', // ✅ Added
    taskStatus: 'in_progress', // ✅ Added with default
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableManagers = isDirector(user?.role ?? '') ? managers : [];
  const availableEmployees = isDirector(user?.role ?? '') ? managers : employees;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (isDirector(user?.role?? '') && !formData.managerId) {
      newErrors.managerId = 'Project manager is required';
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
      if (new Date(formData.startDate) < new Date()) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      handleCreateProject(formData); // ✅ taskPriority & taskStatus now included
    }
  };

  const toggleAssignedEmployee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(id)
        ? prev.assignedEmployees.filter(eid => eid !== id)
        : [...prev.assignedEmployees, id],
    }));
  };

  const toggleAssignedManager = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assignedManagers: prev.assignedManagers.includes(id)
        ? prev.assignedManagers.filter(mid => mid !== id)
        : [...prev.assignedManagers, id],
    }));
  };

    

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
            <p className="text-gray-600 mt-1">
              {isManager(user?.role ?? '') 
                ? 'Create a project proposal for director approval'
                : 'Set up a new project and assign team members'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Project Details</span>
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter project title"
                  />
                  {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Describe the project objectives and scope"
                  />
                  {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                </div>
                {/* Task Priority Only */}
         <div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Project Priority
  </label>
  <select
    value={formData.priority}
    onChange={(e) =>
      setFormData(prev => ({ ...prev, priority: e.target.value }))
    }
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select priority</option>
    <option value="high">High</option>
    <option value="medium">Medium</option>
    <option value="low">Low</option>
  </select>
</div>

{isDirector(user?.role ?? '') && availableManagers.length > 0 && (
  <div>
    <label
      htmlFor="manager"
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      Project Manager *
    </label>

    <select
      id="manager"
      value={formData.managerId}
      onChange={(e) => {
        const selectedId = e.target.value;
        setFormData(prev => ({ ...prev, managerId: selectedId }));
      }}
      className={`w-full border rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
        errors.managerId ? 'border-red-500' : 'border-gray-300'
      }`}
    >
      <option value="" disabled>Select a manager</option>
      {availableManagers.map(manager => (
        <option key={manager.id} value={String(manager.id)}>
          {manager.name}
        </option>
      ))}
    </select>

    {errors.managerId && (
      <p className="text-red-600 text-sm mt-1">{errors.managerId}</p>
    )}
  </div>
)}




                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.startDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.endDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
                  </div>
                </div>
              </div>

              {/* Team Assignment - Only show for Directors */}
              {isDirector(user?.role ?? '') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Assign Managers</span>
                  </h3>

                  <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {availableEmployees.length > 0 ? (
                        availableEmployees.map(member => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.assignedManagers.includes(member.id)}
                              onChange={() => toggleAssignedManager(member.id)}
                            />
                            <img
  src={member.profile_photo || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"}
  alt={member.name}
  className="w-8 h-8 rounded-full object-cover"
/>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-600">{getRoleDisplayName(member.role)}</p>
                              <p className="text-xs text-gray-500 capitalize">{member.department?.replace('_', ' ')}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No managers available.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>{formData.assignedManagers.length}</strong> managers selected
                    </p>
                  </div>
                </div>
              )}

              {/* Manager Note */}
              {isManager(user?.role ?? '') && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This project will be submitted for director approval. 
                    You can assign employees after the project is approved.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
  {/* Cancel Button */}
  <button
    type="button"
    onClick={() => setShowCreateProject(false)}
    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
  >
    Cancel
  </button>

  {/* Submit Button */}
  <button
  type="submit"
  disabled={isDirector(user?.role?? '') && formData.assignedManagers.length === 0}
  className={`px-6 py-2 rounded-lg flex items-center space-x-2 text-white transition-all duration-300
    bg-gradient-to-r from-blue-600 to-purple-600
    ${
      isDirector(user?.role?? '') && formData.assignedManagers.length === 0
        ? 'opacity-50 cursor-not-allowed bg-gradient-to-r from-gray-400 to-gray-500'
        : 'hover:from-blue-700 hover:to-purple-700'
    }
  `}
>
  <Plus className="w-4 h-4" />
  <span>{isManager(user?.role?? '') ? 'Submit for Approval' : 'Create Project'}</span>
</button>

</div>

          </form>
        </div>
      </div>
    );
  };

 const ProjectApprovalModal = ({ projectId }: { projectId: string }) => {
  const project = projects.find(p => p.id === projectId);
  const manager = managers.find(u => u.id === project?.manager_id) || 
                 employees.find(u => u.id === project?.manager_id);

  // const [projectStatus, setProjectStatus] = useState(project?.status || '');
  const [taskPriority, setTaskPriority] = useState('');
  const [approvalComments, setApprovalComments] = useState('');

  if (!project || !manager) return null;

  const isDirectorUser = isDirector(user?.role?? '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Review Project Proposal</h3>
          <p className="text-gray-600 mt-1">Approve or reject this project proposal</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Project Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{project.title}</h4>
            <p className="text-gray-700 mb-4">{project.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Project Manager:</span>
                <span className="ml-2 font-medium text-gray-900">{manager.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">
                  {manager.department?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Start Date:</span>
                <span className="ml-2 font-medium text-gray-900">{formatDate(project.start_date)}</span>
              </div>
              <div>
                <span className="text-gray-600">End Date:</span>
                <span className="ml-2 font-medium text-gray-900">{formatDate(project.end_date)}</span>
              </div>
              <div>
                <span className="text-gray-600">Assigned Managers:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {project.assigned_manager_count || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Manager Card */}
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <img
              src={manager.profile_photo || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`}
              alt={manager.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900">{manager.name}</p>
              <p className="text-sm text-gray-600">{getRoleDisplayName(manager.role)}</p>
              <p className="text-xs text-gray-500">{manager.department?.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>

          {/* Task Priority Only */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Comments */}
          {isDirectorUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any comments for the project manager..."
              />
            </div>
          )}
        </div>

       {/* Footer Buttons */}
<div className="p-6 border-t border-gray-200 flex space-x-3">
  {isDirectorUser && (
    <>
      <button
        onClick={() => handleProjectApproval(project.id, true, approvalComments, 'approved', taskPriority)}
        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
      >
        <CheckCircle className="w-5 h-5" />
        <span>Approve Project</span>
      </button>
      <button
        onClick={() => handleProjectApproval(project.id, false, approvalComments, 'rejected', taskPriority)}
        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
      >
        <X className="w-5 h-5" />
        <span>Reject Project</span>
      </button>
    </>
  )}
  <button
    onClick={() => {
      setShowApprovalModal(false);
      setSelectedProject(null);
      setApprovalComments('');
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

 // View Project Modal Component
const ViewProjectModal = ({ projectId, edit = false }: { projectId: string; edit?: boolean }) => {
  const project = projects.find(p => p.id === projectId);
  const manager =
    managers.find(u => u.id === project?.manager_id) ||
    employees.find(u => u.id === project?.manager_id);

  const [isEditing, setIsEditing] = useState(edit); // start in edit mode if passed true
  const [editData, setEditData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    priority: project?.priority || '',
    status: project?.status || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
  });

  if (!project) return null;

  const canEdit =
    isDirector(user?.role ?? '') &&
    (project.status === 'approved');

  const handleUpdate = () => {
    handleUpdateProject(project.id, editData);
    setIsEditing(false);
  };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Project Details</h3>
                <p className="text-gray-600 mt-1">View project information and comments</p>
              </div>
              <div className="flex items-center space-x-2">
                {canEdit && (
                   <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Project</span>
                </button>
              )}
                <button
                  onClick={() => setShowViewProject(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Project Status and Priority */}
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ').toUpperCase()}
              </span>
              {project.priority && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)}`}>
                  {project.priority.toUpperCase()} PRIORITY
                </span>
              )}
            </div>

            {/* Project Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{project.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  {isEditing ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{project.description}</p>
                  )}
                </div>

                {isEditing && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={editData.priority}
                        onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending_approval">Pending approval</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Project Manager */}
                {manager && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Project Manager</h4>
                    <div className="flex items-center space-x-3">
                      <img
                        src={manager.profile_photo || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`}
                        alt={manager.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{manager.name}</p>
                        <p className="text-sm text-gray-600">{getRoleDisplayName(manager.role)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Dates */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{formatDate(project.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{formatDate(project.end_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Team Information */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Team</h4>
                  <div className="space-y-2 text-sm">
                    {isDirector(user?.role?? '') ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned Managers:</span>
                        <span className="font-medium">{project.assigned_manager_count || 0}</span>
                      </div>
                    ) : (
                     <div className="flex justify-between">
  <span className="text-gray-600">Assigned Employees:</span>
  <span className="font-medium">
    {(() => {
      const employeeIds = project.tasks
  ?.map((task: Task) => task.user_id)
  .filter(Boolean) || [];
      return new Set(employeeIds).size;
    })()}
  </span>
</div>

                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            {project.approval_comments && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Director Comments</span>
                </h4>
                <p className="text-gray-700">{project.approval_comments}</p>
              </div>
            )}

            {/* Progress Bar */}
            {typeof project.progress === 'number' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            {isEditing && (
              <button
                onClick={handleUpdate}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            )}
            <button
              onClick={() => setShowViewProject(null)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
type UserRole = "admin" | "manager" | "director";

interface User {
  id: string;
  role: UserRole;
  // other fields like name, email, etc.
}



  // Assign Employees Form Component
  const AssignEmployeesForm = ({ projectId }: { projectId: string }) => {
    const project = projects.find(p => p.id === projectId);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>(project?.team_members || []);
  const isManager = user?.role.toLowerCase() === "manager";


    const availableEmployees = user
      ? employees.filter(e => e.manager_id === user.id)
      : [];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedEmployees.length > 0) {
        handleAssignEmployees(projectId, selectedEmployees);
      }
    };

    const toggleEmployee = (employeeId: string) => {
      setSelectedEmployees(prev =>
        prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Assign Employees to {project?.title}</h2>
            <p className="text-gray-600 mt-1">Select employees to assign to this project</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {availableEmployees.length > 0 ? (
                    availableEmployees.map(employee => (
                      <div key={employee.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => toggleEmployee(employee.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <img
                          src={employee.profile_photo || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`}
                          alt={employee.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{employee.name}</p>
                          <p className="text-sm text-gray-600">{getRoleDisplayName(employee.role)}</p>
                          <p className="text-xs text-gray-500 capitalize">{employee.department?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No employees available to assign.</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>{selectedEmployees.length}</strong> employees selected
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAssignEmployees(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Assign Employees</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ProjectCard = ({ project, user }: { project: any; user: any }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  
  const manager = managers.find(u => u.id === project.manager_id) || 
                 employees.find(u => u.id === project.manager_id);
  const director = directors.find(d => d.id === project.director_id);
  const teamMembers = employees.filter(u => project.team_members?.includes(u.id));
  const daysUntil = getDaysUntilDeadline(project.end_date);
  const overdue = isOverdue(project.end_date);

  const isManagerUser = isManager(user?.role ?? "");

useEffect(() => {
  const fetchTasks = async () => {
    try {
      const simplifiedRole = getSimpleDesignation(user?.role ?? "employee");

      const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/${simplifiedRole}/tasks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const data = await res.json();
      console.log(`📦 All fetched data for role "${simplifiedRole}":`, data);

      // For director, backend returns { tasks: [...], managers: [...], employees: [...] }
      const tasksArray = Array.isArray(data.tasks) ? data.tasks : Array.isArray(data) ? data : [];

      // Filter only tasks related to this project
      let relatedTasks = tasksArray.filter((task: { project_id: any; }) => task.project_id === project.id);
      console.log(`📝 Tasks for project "${project.title}" (ID: ${project.id}):`, relatedTasks);

      // Role-based filtering
      if (user?.role === "employee") {
        // Employee sees only their own tasks
        relatedTasks = relatedTasks.filter((task: any) => task.user_id === user.id);
      } else if (user?.role === "director") {
        // Director sees all tasks for this project, including managers' tasks
        // Already included if backend returns all tasks for managers/employees under this director
      } 
      // Manager sees all tasks for their project
      setTasks(relatedTasks);

      // Progress calculation
      const completedTasksCount = relatedTasks.filter((task: any) => task.progress_percent === 100).length;
      const totalTasksCount = relatedTasks.length;
      console.log(`✅ Completed tasks: ${completedTasksCount} / ${totalTasksCount}`);
    } catch (err) {
      console.error("❌ Error fetching tasks:", err);
    }
  };

  fetchTasks();
}, [user?.role, project.id, project.title]);






  // Only tasks for this project
  let projectTasks = tasks.filter(
  task => task.project_id === project.id
);

if (user?.role === "employee") {
  projectTasks = projectTasks.filter(task => task.user_id === user.id);
} else if (user?.role === "manager") {
  projectTasks = projectTasks.filter(task => task.manager_id === user.id);
}


  // Progress calculation
  const completedTasksCount = projectTasks.filter(task => task.progress_percent === 100).length;
  const totalTasksCount = projectTasks.length;
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                {project.status === 'pending_approval' ? 'Pending Approval' : project.status.replace('_', ' ')}
              </span>
              {/* Priority Badge */}
              {project.priority && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                    project.priority
                  )}`}
                >
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                </span>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-3">{project.description}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
              </div>
               
              {project.status !== 'pending_approval' && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span className={overdue ? 'text-red-600 font-medium' : ''}>
                    {overdue ? `${Math.abs(daysUntil)} days overdue` : 
                     daysUntil === 0 ? 'Due today' :
                     daysUntil > 0 ? `${daysUntil} days left` : 'Completed'}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Approval Button - Director Only */}
        {isDirectorUser && project.status === "pending_approval" && (
          <button
            onClick={() => {
              setSelectedProject(project.id);
              setShowApprovalModal(true);
            }}
            className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
            title="Review Project"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      


        {canManageProjects && (
  <div className="flex items-center space-x-2">
    {/* View Button - ONLY for Managers */}
    {canManageProjects &&  (
      <button 
        onClick={() => setShowViewProject(project.id)}
        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
        title="Views Project"
      >
        <Eye className="w-4 h-4" />
      </button>
    )}


              {isManagerUser && project.status === "approved" && (
  <button
    onClick={() => setShowAssignEmployees(project.id)}
    className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
    title="Assign Employees"
  >
    <Users className="w-4 h-4" />
  </button>
)}


          {isDirectorUser && project.status === "approved" && (
  <div className="flex space-x-2">
    <button
      onClick={() => setShowViewProject(project.id)}
      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
      title="Edit Project"
      aria-label="Edit Project"
    >
      <Edit className="w-4 h-4" />
    </button>

      <button
        onClick={() => handleDeleteProject(project.id)}
        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
        title="Delete Project"
        aria-label="Delete Project"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )}
 




            </div>
          )}
        </div>

        {/* Progress Bar */}
        {typeof project.progress === 'number' && project.status !== 'pending_approval' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Project Manager */}
        <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <img
            src={manager?.profile_photo || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`}
            alt={manager?.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{manager?.name}</p>
            <p className="text-xs text-gray-600">Project Manager</p>
          </div>
        </div>

        {/* Team Members and Task Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {(isDirectorUser ? project.assigned_managers : project.assigned_employees)
                ?.slice(0, 4)
               .map((person: { id: string; name: string; image?: string }) => (
  <img
    key={person.id}
    src={person.image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'}
    alt={person.name}
    className="w-8 h-8 rounded-full object-cover border-2 border-white"
    title={person.name}
  />
))
              }
              

              {(isDirectorUser ? project.assigned_managers?.length : project.assigned_employees?.length) > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{(isDirectorUser ? project.assigned_managers.length : project.assigned_employees.length) - 4}
                  </span>
                </div>
              )}
            </div>

            <span className="text-sm text-gray-600">
 <span className="text-sm text-gray-600">
  {isDirectorUser
    ? `${project.assigned_manager_count || 0} manager${project.assigned_manager_count === 1 ? '' : 's'}`
    : (() => {
        // Extract unique employee IDs from tasks
        const employeeIds = project.tasks?.map((task: any) => task.user_id) || [];
        const uniqueEmployeeCount = new Set(employeeIds).size;
        return `${uniqueEmployeeCount} employee${uniqueEmployeeCount === 1 ? '' : 's'}`;
      })()
  }
</span>
            </span> 

          </div>

          <div className="text-right">
    <div className="text-right text-sm text-gray-600">
        {completedTasksCount}/{totalTasksCount} tasks completed
      </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isDirector(user?.role ?? '') ? 'Project Management' : canManageProjects ? 'All Projects' : 'Assigned Projects'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isDirector(user?.role ?? '') 
              ? 'Review project proposals and manage organizational projects'
              : canManageProjects 
                ? 'View all projects, create new ones, and assign teams to your approved projects'
                : 'View your assigned projects and track progress'
            }
          </p>
        </div>
        {canManageProjects && (
          <button
            onClick={() => setShowCreateProject(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Projects</p>
              <p className="text-3xl font-bold mt-2">{approvedProjects.length}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Approved</p>
              <p className="text-3xl font-bold mt-2">{approvedProjects.filter(p => p.status === 'approved').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">
                {isDirector(user?.role ?? '') ? 'Pending Approval' : 'Pending'}
              </p>
              <p className="text-3xl font-bold mt-2">
                {isDirector(user?.role ?? '') ? pendingApprovals.length : userProjects.filter(p => p.status === 'pending_approval' && p.manager_id === (user?.role ?? "")).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Completed</p>
              <p className="text-3xl font-bold mt-2">{approvedProjects.filter(p => p.status === 'completed').length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
         
            
            <option value="pending_approval">Pending Approval</option>
            <option value="planning">Planning</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} user={user} />

          ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search criteria.' 
                : canManageProjects 
                  ? 'Create your first project to get started.'
                  : 'No projects have been assigned to you yet.'
              }
            </p>
            {canManageProjects && !searchTerm && !statusFilter && (
              <button
                onClick={() => setShowCreateProject(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateProject && <CreateProjectForm />}
      {showApprovalModal && selectedProject && <ProjectApprovalModal projectId={selectedProject} />}
      {showAssignEmployees && <AssignEmployeesForm projectId={showAssignEmployees} />}
      {showViewProject && <ViewProjectModal projectId={showViewProject} />}
    </div>
  );
};

export default Projects;
