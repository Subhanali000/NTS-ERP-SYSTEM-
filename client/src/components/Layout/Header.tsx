import React, { useState, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDate, getRelativeDate } from '../../utils/dateUtils';
import ProfileModal from '../Profile/ProfileModal';
import { getSimpleDesignation } from '../../utils/auth';

interface HeaderProps {
  onLogout: () => void;
}

interface User {
  id: string;
  name: string;
  role: string;
  profile_photo?: string;
}

interface Notification {
  id: string;
  sourceId: string;   // <--- add this
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'leave'; // include 'leave' if your API sends it
  read: boolean;
  createdAt: string;
  actionUrl?: string;
   date?: string;
   createdBy?: string;
}


const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<User>({ id: '', name: '', role: '' });

  const userRoleLabel = localStorage.getItem('userRoleLabel') || 'Employee';

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:8000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUser();
  }, []);
useEffect(() => {
  let intervalId: number; // ✅ use number in the browser

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user.role) return;

    try {
      const response = await axios.get(
        "http://localhost:8000/api/user/notifications",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const notificationsFromServer = response.data.notifications || [];
      setNotifications(notificationsFromServer);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    }
  };

  // Initial fetch
  if (user.role) fetchNotifications();

  // Poll every 5 seconds
  intervalId = window.setInterval(() => {
    if (user.role) fetchNotifications();
  }, 5000);

  // Cleanup on unmount
  return () => clearInterval(intervalId);
}, [user.role]);









// Helper function to get notification title based on type and message
const getNotificationTitle = (type: string, message: string) => {
  switch (type) {
    case 'leave':
      if (message.includes('approved')) return 'Leave Request Approved';
      if (message.includes('rejected')) return 'Leave Request Rejected';
      if (message.includes('pending')) return 'New Leave Request';
      return 'Leave Update';
    case 'task':
      return 'Task Update';
    case 'report':
      if (message.includes('approved')) return 'Report Approved';
      if (message.includes('rejected')) return 'Report Rejected';
      if (message.includes('pending')) return 'New Report Submitted';
      return 'Report Update';
    case 'project':
      if (message.includes('assigned')) return 'New Project Assigned';
      if (message.includes('approved')) return 'Project Approved';
      if (message.includes('pending')) return 'Project Pending Review';
      return 'Project Update';
    default:
      return 'Notification';
  }
};

// Helper function to map notification types to UI types
const mapNotificationType = (type: string) => {
  switch (type) {
    case 'leave':
    case 'task':
    case 'report':
    case 'project':
      return 'info';
    default:
      return 'info';
  }
};

// Helper function to get action URL based on type and sourceId
const getActionUrl = (type: string, sourceId: string) => {
  switch (type) {
    case 'leave':
      return `/leaves/${sourceId}`;
    case 'task':
      return `/tasks/${sourceId}`;
    case 'report':
      return `/reports/${sourceId}`;
    case 'project':
      return `/projects/${sourceId}`;
    default:
      return undefined;
  }
};
// --- Mark notification as read ---
const markNotificationAsRead = async (notification: Notification) => {
  try {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    const notificationDate = notification.date || new Date().toISOString();

    if (!notification.type || !notification.sourceId || !notification.createdBy) {
      console.error("❌ Cannot mark as read, missing required fields:", notification);
      return;
    }

    // --- Role normalization ---
    const directorRoles = [
      "director",
      "director_hr",
      "global_hr_director",
      "global_operations_director",
      "engineering_director",
      "director_tech_team",
      "director_business_development",
    ];

    const managerRoles = [
      "talent_acquisition_manager",
      "manager",
      "project_tech_manager",
      "quality_assurance_manager",
      "software_development_manager",
      "systems_integration_manager",
      "client_relations_manager",
    ];

    let normalizedRole: "employee" | "manager" | "director" = "employee";
    const userRoleLower = user.role.toLowerCase();

    if (directorRoles.includes(userRoleLower)) normalizedRole = "director";
    else if (managerRoles.includes(userRoleLower)) normalizedRole = "manager";

    console.log("🛠 Normalized role for marking read:", normalizedRole);

    // Determine correct action column based on normalized role
    const actionColumn =
      normalizedRole === "employee"
        ? "employee_action"
        : normalizedRole === "manager"
        ? "manager_action"
        : "director_action";

    const payload = {
      sourceId: notification.sourceId,
      type: notification.type,
      message: notification.message,
      createdBy: notification.createdBy, // who originally triggered it
      userId: user.id, // ✅ who is marking as read
      role: normalizedRole, // ✅ normalized role of current user
      actionColumn, // ✅ tells backend where to update
      action: "read",
      date: notificationDate,
    };

    console.log("📤 Marking notification as read (normalized role):", payload);

    await axios.put(
      "http://localhost:8000/api/user/notification/read",
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Update local state immediately
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id
          ? { ...n, read: true, action: "read", date: notificationDate }
          : n
      )
    );
  } catch (error) {
    console.error("❌ Failed to mark as read:", error);
  }
};

// Helper function to get original type from title
const getOriginalType = (title: string) => {
  if (title.includes('Leave')) return 'leave';
  if (title.includes('Task')) return 'task';
  if (title.includes('Report')) return 'report';
  if (title.includes('Project')) return 'project';
  return 'info';
};


const deleteNotification = async (notificationId: string) => {
  try {
    // Find the notification to get its details
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) {
      console.error("❌ Notification not found");
      return;
    }

    const payload = {
      type: notification.type === 'info' ? getOriginalType(notification.title) : notification.type,
      message: notification.message,
      sourceId: notification.sourceId,
      date: notification.createdAt
    };

    console.log("📤 Delete request:", payload);

    const response = await axios.put(
      `http://localhost:8000/api/user/notification/delete`,
      payload,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );

    console.log("✅ Delete response:", response.data);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  } catch (error) {
    console.error('❌ Failed to delete notification:', error);
  }
};


  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    setShowProfileModal(true);
  };

  const markAllAsRead = () => {
    // Mark all unread notifications as read
    const unreadNotifications = notifications.filter(n => !n.read);
    
    unreadNotifications.forEach(notification => {
      markNotificationAsRead(notification);
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 h-16 fixed top-0 right-0 left-64 z-20">
        <div className="flex items-center justify-end h-full px-6">
          <div className="flex items-center space-x-4">
            {/* Enhanced Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                  {/* Notification Header */}
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                          <Bell className="w-5 h-5 text-blue-600" />
                          <span>Notifications</span>
                        </h3>
                        {unreadCount > 0 && (
                          <p className="text-sm text-gray-600 mt-1">{unreadCount} unread notifications</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No notifications yet</p>
                        <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                            !notification.read ? getNotificationColor(notification.type) : 'border-l-gray-300 bg-white'
                          }`}
                         onClick={() => {
          if (!notification.read) markNotificationAsRead(notification); // mark read
          if (notification.actionUrl) {
            navigate(notification.actionUrl);
            setShowNotifications(false);
          }
        }}
      >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {getNotificationIcon(notification.type)}
                                <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed mb-2">{notification.message}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                  {getRelativeDate(notification.createdAt)}
                                </p>
                                {notification.actionUrl && (
                                  <span className="text-xs text-blue-600 font-medium">Click to view →</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Notification Footer */}
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Showing {notifications.length} notifications
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            

            {/* Profile Menu */}
<div className="relative">
  <button
    onClick={() => setShowProfileMenu(!showProfileMenu)}
    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
  >
    <img
      src={user?.profile_photo || 'https://via.placeholder.com/32'}
      alt={user?.name || 'User'}
      className="w-8 h-8 rounded-full object-cover"
    />
    <div className="text-left">
      <p className="text-sm font-medium text-gray-900">{user?.name || "N/A"}</p>
      <p className="text-xs text-gray-500">{user?.role || "N/A"}</p>
    </div>
    <ChevronDown className="w-4 h-4 text-gray-400" />
  </button>


              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
};

export default Header;
