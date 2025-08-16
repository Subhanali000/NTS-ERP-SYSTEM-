import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, MapPin, Briefcase, Save, X, Camera, Edit3,
  Shield, Key, Bell, Globe, Palette, Monitor, Moon, Sun
} from 'lucide-react';
import { getCurrentUser, setCurrentUser, getRoleDisplayName } from '../../utils/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security' | 'preferences'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


   const departmentName = user.department ? user.department.replace('_', ' ') : 'Unknown';
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: '',
    address: '',
    bio: '',
    emergencyContact: '',
    emergencyPhone: '',
    linkedin: '',
    github: ''
  });

  const [settingsData, setSettingsData] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    taskReminders: true,
    leaveAlerts: true,
    projectUpdates: true,
    autoSave: true,
    compactView: false,
    showAvatars: true,
    animationsEnabled: true
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: '30',
    loginAlerts: true,
    deviceManagement: true
  });

  useEffect(() => {
    const fetchAll = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch profile
        const profileRes = await fetch('http://localhost:8000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        const profile = await profileRes.json();
        setCurrentUser(profile);
        setProfileData(prev => ({
          ...prev,
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          bio: profile.bio || '',
          emergencyContact: profile.emergencyContact || '',
          emergencyPhone: profile.emergencyPhone || '',
          linkedin: profile.linkedin || '',
          github: profile.github || ''
        }));

        // Fetch settings
        const settingsRes = await fetch('http://localhost:8000/api/user/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          
          setSettingsData(settings);
        }


        // Fetch security settings
        const securityRes = await fetch('http://localhost:8000/api/user/security', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (securityRes.ok) {
          const security = await securityRes.json();
          setSecurityData(prev => ({
            ...prev,
            twoFactorEnabled: security.twoFactorEnabled,
            sessionTimeout: security.sessionTimeout,
            loginAlerts: security.loginAlerts,
            deviceManagement: security.deviceManagement
          }));
        }

      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    if (isOpen) {
      fetchAll();
    }
  }, [isOpen]);

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      setIsEditing(false);
      console.log('✅ Profile updated successfully');
      console.log("Role Rendered:", user.role, "→", getRoleDisplayName(user.role));

    } catch (err) {
      console.error('❌ Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsData),
      });

      if (!res.ok) throw new Error('Failed to update settings');

      if (settingsData.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      console.log('✅ Settings updated successfully');
    } catch (err) {
      console.error('❌ Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecuritySave = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/user/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(securityData),
      });

      if (!res.ok) throw new Error('Failed to update security settings');

      setSecurityData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      console.log('✅ Security settings updated');
    } catch (err) {
      console.error('❌ Error saving security settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const ProfileTab = () => (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
            <p className="text-lg text-gray-600">
  {getRoleDisplayName(user.role)}
</p>

            <p className="text-sm text-gray-500 capitalize">
  {departmentName} Department
</p>

            <div className="mt-3 flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span>{user.leaveBalance} days leave balance</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              isEditing 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Personal Information</span>
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className={`w-full border rounded-lg pl-10 pr-3 py-2 transition-colors ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className={`w-full border rounded-lg pl-10 pr-3 py-2 transition-colors ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full border rounded-lg pl-10 pr-3 py-2 transition-colors ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!isEditing}
                rows={4}
                className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact & Social Links */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-orange-600" />
            <span>Emergency Contact</span>
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
              <input
                type="text"
                value={profileData.emergencyContact}
                onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                disabled={!isEditing}
                className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                value={profileData.emergencyPhone}
                onChange={(e) => setProfileData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                disabled={!isEditing}
                className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>
          </div>

          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mt-8">
            <Globe className="w-5 h-5 text-green-600" />
            <span>Social Links</span>
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
              <input
                type="url"
                value={profileData.linkedin}
                onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
                disabled={!isEditing}
                className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
              <input
                type="url"
                value={profileData.github}
                onChange={(e) => setProfileData(prev => ({ ...prev, github: e.target.value }))}
                disabled={!isEditing}
                className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          {/* Employment Details (Read-only) */}
          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mt-8">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <span>Employment Details</span>
          </h4>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Employee ID:</span>
                <span className="ml-2 font-medium text-gray-900">{user.id.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">{user.department.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-600">Role:</span>
                <span className="ml-2 font-medium text-gray-900">{getRoleDisplayName(user.role)}</span>
              </div>
              <div>
                <span className="text-gray-600">Join Date:</span>
                <span className="ml-2 font-medium text-gray-900">{new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => setIsEditing(false)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProfileSave}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              isSaving
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-8">
      {/* Appearance Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <span>Appearance</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="space-y-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor }
              ].map(({ value, label, icon: Icon }) => (
                <label key={value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={settingsData.theme === value}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, theme: e.target.value }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Language</label>
            <select
              value={settingsData.language}
              onChange={(e) => setSettingsData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Timezone</label>
            <select
              value={settingsData.timezone}
              onChange={(e) => setSettingsData(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Date Format</label>
            <select
              value={settingsData.dateFormat}
              onChange={(e) => setSettingsData(prev => ({ ...prev, dateFormat: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MM/dd/yyyy">MM/DD/YYYY</option>
              <option value="dd/MM/yyyy">DD/MM/YYYY</option>
              <option value="yyyy-MM-dd">YYYY-MM-DD</option>
              <option value="MMM dd, yyyy">MMM DD, YYYY</option>
            </select>
          </div>
        </div>

        {/* Interface Preferences */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h5 className="text-md font-medium text-gray-900 mb-4">Interface Preferences</h5>
          <div className="space-y-4">
            {[
              { key: 'compactView', label: 'Compact View', description: 'Use a more condensed layout' },
              { key: 'showAvatars', label: 'Show Avatars', description: 'Display user profile pictures' },
              { key: 'animationsEnabled', label: 'Enable Animations', description: 'Use smooth transitions and animations' },
              { key: 'autoSave', label: 'Auto-save', description: 'Automatically save changes as you type' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsData[key as keyof typeof settingsData] as boolean}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Bell className="w-5 h-5 text-orange-600" />
          <span>Notifications</span>
        </h4>

        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
            { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
            { key: 'weeklyReports', label: 'Weekly Reports', description: 'Get weekly progress summaries' },
            { key: 'taskReminders', label: 'Task Reminders', description: 'Reminders for upcoming deadlines' },
            { key: 'leaveAlerts', label: 'Leave Alerts', description: 'Notifications for leave requests and approvals' },
            { key: 'projectUpdates', label: 'Project Updates', description: 'Updates on project progress and changes' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsData[key as keyof typeof settingsData] as boolean}
                  onChange={(e) => setSettingsData(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={handleSettingsSave}
          disabled={isSaving}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
            isSaving
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-8">
      {/* Password Change */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Key className="w-5 h-5 text-red-600" />
          <span>Change Password</span>
        </h4>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={securityData.currentPassword}
              onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={securityData.newPassword}
              onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={securityData.confirmPassword}
              onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
            />
          </div>

          <button
            onClick={handleSecuritySave}
            disabled={isSaving || !securityData.currentPassword || !securityData.newPassword}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              isSaving || !securityData.currentPassword || !securityData.newPassword
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-green-600" />
          <span>Security Settings</span>
        </h4>

        <div className="space-y-6">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securityData.twoFactorEnabled}
                onChange={(e) => setSecurityData(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Session Timeout */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout</label>
            <select
              value={securityData.sessionTimeout}
              onChange={(e) => setSecurityData(prev => ({ ...prev, sessionTimeout: e.target.value }))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="480">8 hours</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">Automatically log out after period of inactivity</p>
          </div>

          {/* Security Alerts */}
          <div className="space-y-4">
            {[
              { key: 'loginAlerts', label: 'Login Alerts', description: 'Get notified of new login attempts' },
              { key: 'deviceManagement', label: 'Device Management', description: 'Manage trusted devices and sessions' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securityData[key as keyof typeof securityData] as boolean}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Export Account Data</p>
              <p className="text-sm text-red-700">Download a copy of your account data</p>
            </div>
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
              Export Data
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Deactivate Account</p>
              <p className="text-sm text-red-700">Temporarily disable your account</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PreferencesTab = () => (
    <div className="space-y-8">
      {/* Dashboard Preferences */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Monitor className="w-5 h-5 text-blue-600" />
          <span>Dashboard Preferences</span>
        </h4>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Default Dashboard View</label>
            <select className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="overview">Overview</option>
              <option value="tasks">Tasks</option>
              <option value="calendar">Calendar</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Items per Page</label>
            <select className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="10">10 items</option>
              <option value="25">25 items</option>
              <option value="50">50 items</option>
              <option value="100">100 items</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Quick Actions</label>
            <div className="space-y-2">
              {[
                'Create Task',
                'Submit Progress',
                'Request Leave',
                'View Calendar',
                'Generate Report'
              ].map((action) => (
                <label key={action} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-900">{action}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span>Privacy Settings</span>
        </h4>

        <div className="space-y-4">
          {[
            { label: 'Show Online Status', description: 'Let others see when you\'re online' },
            { label: 'Show Profile to Team', description: 'Allow team members to view your profile' },
            { label: 'Show Activity Status', description: 'Display your current activity status' },
            { label: 'Allow Direct Messages', description: 'Receive direct messages from colleagues' }
          ].map(({ label, description }) => (
            <div key={label} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Profile & Settings</h2>
              <p className="text-blue-100 mt-1">Manage your account and preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'settings', label: 'Settings', icon: Monitor },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'preferences', label: 'Preferences', icon: Palette }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;