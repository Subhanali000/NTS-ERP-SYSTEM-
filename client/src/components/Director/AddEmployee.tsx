import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Briefcase, Save, X, UserPlus, Building, Shield, Clock } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import axios from "axios";

interface AddEmployeeProps {
  onClose: () => void;
  onSave: (employee: any) => void;
}

const AddEmployee: React.FC<AddEmployeeProps> = ({ onClose, onSave }) => {
  const currentUser = getCurrentUser();
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  React.useEffect(() => {
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      };
    }, [previewUrl]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    department: "engineering",
    joinDate: new Date().toISOString().split("T")[0],
     dob: "", // <-- new field
  bio: "", // <-- new field
  github_profile_link: "", // <-- new field
  linkedin_profile_link: "", // <-- new field
    annual_salary: "",
    address: "",
    manager_id: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    annual_leave_balance: 20,
    employee_id: "",
    position: "",
    reportingManager: "",
    directorId: "",
    profile_photo: null as File | null,
    college: null,
    internship_start_date: null,
    internship_end_date: null,
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

      const response = await fetch(`https://nts-erp-system-629k.vercel.app/api/director/managers`, {
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

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid email address";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.annual_salary.trim())
      newErrors.annual_salary = "Annual salary is required";
    if (!formData.dob.trim()) newErrors.dob = "Date of birth is required";
if (!formData.bio.trim()) newErrors.bio = "Bio is required";
// Optional: validate URLs
if (
  formData.github_profile_link &&
  !/^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+$/.test(
    formData.github_profile_link
  )
)
  newErrors.github_profile_link = "Enter a valid GitHub profile URL";
if (
  formData.linkedin_profile_link &&
  !/^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+$/.test(
    formData.linkedin_profile_link
  )
)
  newErrors.linkedin_profile_link = "Enter a valid LinkedIn profile URL";
    if (!formData.emergency_contact_name.trim())
      newErrors.emergency_contact_name = "Emergency contact name is required";
    if (!formData.emergency_contact_phone.trim())
      newErrors.emergency_contact_phone = "Emergency contact phone is required";
    if (!formData.employee_id.trim())
      newErrors.employee_id = "Employee ID is required";
    if (!formData.position.trim())
      newErrors.position = "Position/Job title is required";

    // Only require manager for certain roles
    const rolesRequiringManager = ['employee', 'intern', 'senior_employee', 'team_lead'];
    if (rolesRequiringManager.includes(formData.role) && !formData.manager_id.trim()) {
      newErrors.manager_id = "Manager is required for this role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      console.log("Token:", token);

      const multipartForm = new FormData();
      multipartForm.append("name", formData.name);
      multipartForm.append("email", formData.email);
      multipartForm.append("phone", formData.phone);
      multipartForm.append("role", formData.role);
      multipartForm.append("department", formData.department);
      multipartForm.append("join_date", formData.joinDate); // ✅ use camelCase from state
      multipartForm.append("annual_salary", formData.annual_salary);
      multipartForm.append("address", formData.address);
      multipartForm.append("dob", formData.dob);
      multipartForm.append("bio", formData.bio);
      multipartForm.append("github_profile_link", formData.github_profile_link);
      multipartForm.append("linkedin_profile_link", formData.linkedin_profile_link);
      multipartForm.append(
        "emergency_contact_name",
        formData.emergency_contact_name
      );
      multipartForm.append(
        "emergency_contact_phone",
        formData.emergency_contact_phone
      );
      multipartForm.append(
        "annual_leave_balance",
        formData.annual_leave_balance.toString()
      );
      multipartForm.append("employee_id", formData.employee_id);
      multipartForm.append("position", formData.position);
      multipartForm.append("manager_id", formData.manager_id);

      // Optional fields
      if (formData.role === "intern") {
        multipartForm.append("college", formData.college || "Default College");
        multipartForm.append(
          "internship_start_date",
          formData.internship_start_date || new Date().toISOString().split("T")[0]
        );
        multipartForm.append(
          "internship_end_date",
          formData.internship_end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        );
      }

      // Append profile photo if provided
      if (formData.profile_photo) {
        multipartForm.append("profile_photo", formData.profile_photo);
      }

      const response = await axios.post(
        `https://nts-erp-system-629k.vercel.app/api/director/add-employee`,
        multipartForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onSave(response.data.employee);
  console.log("Employee added successfully:", response.data.employee);
    } catch (error) {
      console.error("Error adding employee:", error);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };
const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const generateEmployeeId = () => {
    const prefix = formData.department.replace(' ', '').substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const employeeId = `${prefix}${randomNum}`;
    setFormData(prev => ({ ...prev, employee_id: employeeId }));
  };

  // Add college and internship date fields for interns
  const renderInternFields = () => {
    if (formData.role !== 'intern') return null;

    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 mt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-yellow-600" />
          <span>Internship Details</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">College/University</label>
            <input
              type="text"
              name="college"
              value={formData.college || ''}
              onChange={handleChange}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-white"
              placeholder="Enter college/university name"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Internship Start Date</label>
              <input
                type="date"
                name="internship_start_date"
                value={formData.internship_start_date || ''}
                onChange={handleChange}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Internship End Date</label>
              <input
                type="date"
                name="internship_end_date"
                value={formData.internship_end_date || ''}
                onChange={handleChange}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    );
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
                {/* Profile Photo Upload */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
                    <UserPlus className="w-6 h-6 text-green-600" />
                    <span>Profile Photo</span>
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
                    {/* Preview Box */}
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-300 bg-white shadow">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Photo
                        </div>
                      )}
                    </div>

                    {/* Upload Input */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-bold text-gray-700">
                        Upload Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData((prev) => ({
                              ...prev,
                              profile_photo: file,
                            }));
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="text-sm text-gray-700 bg-white border-2 border-gray-300 rounded-xl px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent file:bg-green-600 file:text-white file:font-medium file:rounded-md file:px-4 file:py-2 file:border-0 file:mr-3 hover:file:bg-green-700"
                      />
                    </div>
                  </div>
                </div>

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
{/* DOB */}
<div>
  <label className="block text-sm font-bold text-gray-700 mb-2">
    Date of Birth *
  </label>
  <input
    type="date"
    name="dob"
    value={formData.dob}
    onChange={handleChange}
    className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
      errors.dob ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
    }`}
  />
  {errors.dob && (
    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
      <X className="w-4 h-4" />
      <span>{errors.dob}</span>
    </p>
  )}
</div>

{/* Bio */}
<div>
  <label className="block text-sm font-bold text-gray-700 mb-2">
    Bio
  </label>
  <textarea
    name="bio"
    value={formData.bio}
    onChange={handleChange}
    className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
      errors.bio ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
    }`}
    placeholder="Write a short bio"
  />
  {errors.bio && (
    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
      <X className="w-4 h-4" />
      <span>{errors.bio}</span>
    </p>
  )}
</div>

{/* GitHub Profile */}
<div>
  <label className="block text-sm font-bold text-gray-700 mb-2">
    GitHub Profile
  </label>
  <input
    type="url"
    name="github_profile_link"
    value={formData.github_profile_link}
    onChange={handleChange}
    className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
      errors.github_profile_link ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
    }`}
    placeholder="https://github.com/username"
  />
  {errors.github_profile_link && (
  <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
    <X className="w-4 h-4" />
    <span>{errors.github_profile_link}</span>
  </p>

  )}
</div>

{/* LinkedIn Profile */}
<div>
  <label className="block text-sm font-bold text-gray-700 mb-2">
    LinkedIn Profile
  </label>
  <input
    type="url"
    name="linkedin_profile_link"
    value={formData.linkedin_profile_link}
    onChange={handleChange}
    className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
      errors.linkedin_profile_link ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
    }`}
    placeholder="https://linkedin.com/in/username"
  />
  {errors.linkedin_profile_link && (
    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
      <X className="w-4 h-4" />
      <span>{errors.linkedin_profile_link}</span>
    </p>
  )}
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
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                      Employee ID *
                                    </label>
              
                                    <div className="flex flex-col space-y-2">
                                      <input
                                        type="text"
                                        name="employee_id"
                                        value={formData.employee_id}
                                        onChange={handleChange}
                                        className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                                          errors.employee_id
                                            ? "border-red-300 bg-red-50"
                                            : "border-gray-300 bg-white"
                                        }`}
                                        placeholder="EMP001"
                                      />
              
                                      <button
                                        type="button"
                                        onClick={generateEmployeeId}
                                        className="w-[200px] h-[50px] bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium self-start"
                                      >
                                        Generate Employee ID
                                      </button>
                                    </div>
              
                                    {errors.employee_id && (
                                      <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                                        <X className="w-4 h-4" />
                                        <span>{errors.employee_id}</span>
                                      </p>
                                    )}
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
        name="joinDate"               // ✅ matches state
        value={formData.joinDate}     // ✅ matches state
        onChange={handleChange}       // ✅ updates state correctly
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
                        name="annual_leave_balance"
                        value={formData.annual_leave_balance}
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

              {/* Internship Fields - Only show for interns */}
              {renderInternFields()}

              {/* Preview Card */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Employee Preview
                </h3>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    {/* Avatar or Image Preview */}
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {formData.name
                          ? formData.name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold text-gray-900">
                        {formData.name || "Employee Name"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formData.position || "Position"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.employee_id || "Employee ID"}
                      </p>
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
                      <span className="ml-1 font-medium">{formData.annual_leave_balance} days</span>
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
