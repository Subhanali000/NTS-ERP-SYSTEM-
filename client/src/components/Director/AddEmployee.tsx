import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Briefcase, Save, X, UserPlus, Building, Shield, Clock } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';

interface AddEmployeeProps {
  onClose: () => void;
  onSave: (employee: any) => void;
}

const AddEmployee: React.FC<AddEmployeeProps> = ({ onClose, onSave }) => {
  const currentUser = getCurrentUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee',
    department: 'Human Resources',
    join_date: new Date().toISOString().split('T')[0],
    annual_salary: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    leaveBalance: 20,
    employee_id: '',
    position: '',
    manager_id: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<{ id: string; name: string; role: string; department: string }[]>([]);

  const roles = [
    { value: 'employee', label: 'Employee' },
    { value: 'intern', label: 'Intern' },
    { value: 'senior_employee', label: 'Senior Employee' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'talent_acquisition_manager', label: 'Talent Acquisition Manager' },
    { value: 'project_tech_manager', label: 'Project/Tech Manager' },
    { value: 'quality_assurance_manager', label: 'Quality Assurance Manager' },
    { value: 'software_development_manager', label: 'Software Development Manager' },
    { value: 'systems_integration_manager', label: 'Systems Integration Manager' },
    { value: 'client_relations_manager', label: 'Client Relations Manager' }
  ];

  const departments = [
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Business Development', label: 'Business Development' },
    { value: 'Quality Assurance', label: 'Quality Assurance' },
    { value: 'Systems Integration', label: 'Systems Integration' },
    { value: 'Client Relations', label: 'Client Relations' }
  ];

  // Fetch managers from API
useEffect(() => {
  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:8000/api/director/managers', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch managers: ${text} (Status: ${response.status})`);
      }
      const data = await response.json();
      console.log('Fetched managers:', data); // Debug log
      setManagers(data);
    } catch (error: any) {
      console.error('Error fetching managers:', error.message);
    }
  };
  fetchManagers();
}, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.annual_salary.trim()) newErrors.annual_salary = 'Annual salary is required';
    if (!formData.emergency_contact_name.trim()) newErrors.emergency_contact_name = 'Emergency contact name is required';
    if (!formData.emergency_contact_phone.trim()) newErrors.emergency_contact_phone = 'Emergency contact phone is required';
    if (!formData.employee_id.trim()) newErrors.employee_id = 'Employee ID is required';
    if (!formData.position.trim()) newErrors.position = 'Position/Job title is required';
    if (['employee', 'intern', 'senior_employee', 'team_lead'].includes(formData.role) && !formData.manager_id.trim()) {
      newErrors.manager_id = 'Manager assignment is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/director/add-employee', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: `emp-${Date.now()}`,
          avatar: `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=150`,
          createdAt: new Date().toISOString(),
          status: 'active',
          director_id: currentUser?.id ?? ''
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add employee: ${errorText}`);
      }

      const newEmployee = await response.json();
      onSave(newEmployee);
      setIsSubmitting(false);
      onClose();
      console.log('Employee added successfully:', newEmployee);
    } catch (error: any) {
      console.error('Error adding employee:', error.message);
      setIsSubmitting(false);
      alert(`Failed to add employee: ${error.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generateEmployeeId = () => {
    const prefix = formData.department.replace(' ', '').substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const employeeId = `${prefix}${randomNum}`;
    setFormData(prev => ({ ...prev, employee_id: employeeId }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <UserPlus className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Add New Employee</h2>
                <p className="text-blue-100 mt-1">Add a new team member to the organization</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <User className="w-6 h-6 text-blue-600" />
                  <span>Personal Information</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.name}</span>
                    </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full border-2 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {errors.email && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full border-2 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.phone && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.phone}</span>
                    </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        className="w-full border-2 border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-orange-600" />
                  <span>Emergency Contact</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Contact Name *</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.emergency_contact_name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      placeholder="Emergency contact name"
                    />
                    {errors.emergency_contact_name && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.emergency_contact_name}</span>
                    </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Contact Phone *</label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.emergency_contact_phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      placeholder="Emergency contact phone"
                    />
                    {errors.emergency_contact_phone && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.emergency_contact_phone}</span>
                    </p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <Briefcase className="w-6 h-6 text-green-600" />
                  <span>Employment Details</span>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Employee ID *</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="employee_id"
                          value={formData.employee_id}
                          onChange={handleChange}
                          className={`flex-1 border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                            errors.employee_id ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                          }`}
                          placeholder="EMP001"
                        />
                        <button
                          type="button"
                          onClick={generateEmployeeId}
                          className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                        >
                          Generate
                        </button>
                      </div>
                      {errors.employee_id && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                        <X className="w-4 h-4" />
                        <span>{errors.employee_id}</span>
                      </p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Position/Job Title *</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                          errors.position ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                        placeholder="e.g., Software Developer"
                      />
                      {errors.position && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                        <X className="w-4 h-4" />
                        <span>{errors.position}</span>
                      </p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Role *</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        {roles.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Department *</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                        >
                          {departments.map(dept => (
                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Reporting Manager</label>
                    <select
                      name="manager_id"
                      value={formData.manager_id}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white ${
                        errors.manager_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      disabled={['talent_acquisition_manager', 'project_tech_manager', 'quality_assurance_manager', 'software_development_manager', 'systems_integration_manager', 'client_relations_manager'].includes(formData.role)}
                    >
                      <option value="">Select reporting manager</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name} - {manager.role.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                    {errors.manager_id && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.manager_id}</span>
                    </p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Join Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          name="join_date"
                          value={formData.join_date}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Annual Salary *</label>
                      <input
                        type="number"
                        name="annual_salary"
                        value={formData.annual_salary}
                        onChange={handleChange}
                        className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                          errors.annual_salary ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                        placeholder="Enter salary amount"
                      />
                      {errors.annual_salary && <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                        <X className="w-4 h-4" />
                        <span>{errors.annual_salary}</span>
                      </p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Annual Leave Balance</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="leaveBalance"
                        value={formData.leaveBalance}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="Annual leave days"
                        min="0"
                        max="30"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Standard allocation is 20 days per year</p>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Employee Preview</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{formData.name || 'Employee Name'}</h4>
                      <p className="text-sm text-gray-600">{formData.position || 'Position'}</p>
                      <p className="text-xs text-gray-500">{formData.employee_id || 'Employee ID'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Department:</span>
                      <span className="ml-1 font-medium">{formData.department}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Role:</span>
                      <span className="ml-1 font-medium">{formData.role.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Manager:</span>
                      <span className="ml-1 font-medium">
                        {managers.find(m => m.id === formData.manager_id)?.name || 'Not assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Leave Balance:</span>
                      <span className="ml-1 font-medium">{formData.leaveBalance} days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 mt-10 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding Employee...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Add Employee</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;