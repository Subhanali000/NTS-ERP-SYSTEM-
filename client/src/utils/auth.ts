// userUtils.ts
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

export const normalizeRole = (role: string = ''): UserRole =>
  role.toLowerCase().replace(/\s+/g, '_') as UserRole;

// --- Role Definitions ---
export const directorRoles: UserRole[] = [
  'global_hr_director',
  
  'global_operations_director',
  'engineering_director',
  'director_tech_team',
  'director_business_development',
];

export const managerRoles: UserRole[] = [
  'talent_acquisition_manager',
  'project_tech_manager',
  'quality_assurance_manager',
  'software_development_manager',
  'systems_integration_manager',
  'client_relations_manager',
];

// --- Role Flags ---
export const isDirector = (role: string): boolean =>
  directorRoles.includes(normalizeRole(role));

export const isManager = (role: string): boolean =>
  managerRoles.includes(normalizeRole(role));

export const isTeamLead = (role: string): boolean =>
  normalizeRole(role) === 'team_lead';

export const isEmployee = (role: string): boolean =>
  normalizeRole(role) === 'employee';

export const isIntern = (role: string): boolean =>
  normalizeRole(role) === 'intern';

// --- Access Level ---
export const getUserAccessLevel = (
  role: string
): 'director' | 'manager' | 'employee' => {
  const r = normalizeRole(role);
  if (isDirector(r)) return 'director';
  if (isManager(r) || isTeamLead(r)) return 'manager';
  return 'employee';
};

// --- Auth Helpers ---
export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('currentUser');
  if (!user) return null;
  const parsed = JSON.parse(user);
  return {
    ...parsed,
    role: normalizeRole(parsed.role),
  };
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('userUpdated', { detail: user }));
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem('currentUser');
};

export const authenticateUserByEmail = (
  email: string,
  password: string
): User | null => {
  const user = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (user && password === 'password123') {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const authenticateUser = (
  email: string,
  role: UserRole
): User | null => {
  const user = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      normalizeRole(u.role) === normalizeRole(role)
  );
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
};

// --- Approval Logic ---
export const canApproveLeave = (user: User, requesterId: string): boolean => {
  const requester = mockUsers.find((u) => u.id === requesterId);
  if (!requester) return false;
  return (
    requester.managerId === user.id &&
    (isDirector(user.role) || isManager(user.role) || isTeamLead(user.role))
  );
};

export const getApprovalChain = (userId: string): string[] => {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return [];
  const chain: string[] = [];
  if (user.managerId) {
    chain.push(user.managerId);
    const manager = mockUsers.find((u) => u.id === user.managerId);
    if (manager?.managerId) chain.push(manager.managerId);
  }
  return chain;
};

// --- Role Display ---
export const getRoleDisplayName = (role: string): string => {
  const r = normalizeRole(role);
  if (directorRoles.includes(r)) return 'Director';
  if (managerRoles.includes(r)) return 'Manager';
  if (r === 'team_lead') return 'Team Lead';
  if (r === 'intern') return 'Intern';
  return 'Employee';
};

export const getSimpleDesignation = (role: string): string => {
  const r = normalizeRole(role);
  if (managerRoles.includes(r)) return 'manager';
  if (directorRoles.includes(r)) return 'director';
  if (r === 'team_lead') return 'team_lead';
  if (r === 'intern') return 'intern';
  return 'employee';
};

// --- Display/UI Helpers ---
export const getDepartmentColor = (department: string): string => {
  const colorMap: Record<string, string> = {
    hr: 'bg-blue-500',
    operations: 'bg-green-500',
    engineering: 'bg-purple-500',
    tech: 'bg-orange-500',
    business_development: 'bg-pink-500',
    quality_assurance: 'bg-yellow-500',
    systems_integration: 'bg-indigo-500',
    client_relations: 'bg-red-500',
  };
  return colorMap[department] || 'bg-gray-500';
};

// --- Storage ---
export const saveAuthData = (
  token: string,
  role: string,
  email: string,
  id?: string | null
) => {
  const normalizedRole = normalizeRole(role);
  const displayRole = getRoleDisplayName(normalizedRole);
  localStorage.setItem('token', token);
  localStorage.setItem('role', normalizedRole);
  localStorage.setItem(
    'currentUser',
    JSON.stringify({ email, role: normalizedRole, id: id || null, displayRole })
  );
  localStorage.setItem('isAuthenticated', 'true');
};

export const isAuthenticated = (): boolean =>
  localStorage.getItem('isAuthenticated') === 'true';

export const getCurrentUserRoleDisplayName = (): string => {
  const user = getCurrentUser();
  return user ? getRoleDisplayName(user.role) : '';
};

// --- Preferences ---
export const getUserPreferences = () => {
  const preferences = localStorage.getItem('userPreferences');
  return preferences
    ? JSON.parse(preferences)
    : {
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
        animationsEnabled: true,
      };
};

export const setUserPreferences = (preferences: any) => {
  localStorage.setItem('userPreferences', JSON.stringify(preferences));
  if (preferences.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  window.dispatchEvent(
    new CustomEvent('preferencesUpdated', { detail: preferences })
  );
};

// --- Security ---
export const getSecuritySettings = () => {
  const settings = localStorage.getItem('securitySettings');
  return settings
    ? JSON.parse(settings)
    : {
        twoFactorEnabled: false,
        sessionTimeout: '30',
        loginAlerts: true,
        deviceManagement: true,
      };
};

export const setSecuritySettings = (settings: any) => {
  localStorage.setItem('securitySettings', JSON.stringify(settings));
};

// --- Samples ---
export const getSampleUsersByRole = () => {
  const directors = mockUsers.filter((u) => isDirector(u.role));
  const managers = mockUsers.filter((u) => isManager(u.role));
  const teamLeads = mockUsers.filter((u) => isTeamLead(u.role));
  const employees = mockUsers.filter(
    (u) => isEmployee(u.role) || isIntern(u.role)
  );

  return {
    director: directors[0] || null,
    manager: managers[0] || null,
    teamLead: teamLeads[0] || null,
    employee: employees[0] || null,
  };
};
