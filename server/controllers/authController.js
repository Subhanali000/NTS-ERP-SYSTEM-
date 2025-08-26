const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// ✅ Normalize raw role from DB into clean frontend/backend role
const normalizeRole = (role) => {
  const r = role.toLowerCase().replace(/\s+/g, '_');
  if (r.includes('director')) return 'director';
  if (r.includes('manager')) return 'manager'; // handles 'talent_acquisition_manager'
  if (r === 'intern') return 'intern';
  if (r.includes('team_lead')) return 'employee';
  return 'employee';
};


// 🔐 Create JWT token with normalized role
const createToken = (id, rawRole, managerId = null) => {
  const normalized = normalizeRole(rawRole);
  const payload = {
    id,
    role: normalized,
  };

  if (normalized === 'manager') payload.managerId = id;
  else if (managerId) payload.managerId = managerId;

  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: '24h',
  });
};

// ✅ Signup for Director only
const signupDirector = async (req, res) => {
  const {
    email, password, name, phone, doj, designation, department,
    director_title, emergency_contact_name, emergency_contact_phone
  } = req.body;

  const requiredFields = {
    email, password, name, doj, designation,
    department, director_title, emergency_contact_name, emergency_contact_phone
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value) return res.status(400).json({ error: `Missing field: ${key}` });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    const { data: existing } = await supabase
      .from('directors')
      .select('email')
      .eq('email', normalizedEmail)
      .single();

    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const { data, error } = await supabase.from('directors').insert([{
      email: normalizedEmail,
      password,
      name,
      phone,
      join_date: doj,
      designation,
      department,
      role: director_title,
      emergency_contact_name,
      emergency_contact_phone,
    }]).select('id').single();

    if (error) return res.status(400).json({ error: error.message });

    const token = createToken(data.id, director_title);
    return res.status(201).json({ token, role: normalizeRole(director_title) });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Login for Director, Manager, Employee
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const normalizedEmail = email.toLowerCase();

  try {
    // 🔍 Try Directors
    const { data: director } = await supabase
      .from('directors')
      .select('id, password, role')
      .eq('email', normalizedEmail)
      .single();

    if (director && director.password === password) {
      const token = createToken(director.id, director.role);
      return res.status(200).json({ token, role: normalizeRole(director.role) });
    }

    // 🔍 Try Managers
    const { data: manager } = await supabase
      .from('managers')
      .select('id, password, role')
      .eq('email', normalizedEmail)
      .single();

    if (manager && manager.password === password) {
      const token = createToken(manager.id, manager.role);
      return res.status(200).json({ token, role: normalizeRole(manager.role) });
    }

    // 🔍 Try Employees
    const { data: employee } = await supabase
      .from('employees')
      .select('id, password, role, manager_id')
      .eq('email', normalizedEmail)
      .single();

    if (employee && employee.password === password) {
      const token = createToken(employee.id, employee.role, employee.manager_id);
      return res.status(200).json({ token, role: normalizeRole(employee.role) });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Get current logged-in user (based on token)
const getCurrentUser = async (req, res) => {
  try {
    const { id, role } = req.user;

    const tableMap = {
      director: 'directors',
      manager: 'manager',
      employee: 'employees',
      intern: 'employees',
    };

    const table = tableMap[role];
    if (!table) return res.status(400).json({ error: 'Invalid user role' });

    const { data: user, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    delete user.password;
    user.role = normalizeRole(user.role);


    return res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [employeesRes, managersRes, directorsRes] = await Promise.all([
      supabase.from('employees').select('*'),
      supabase.from('managers').select('*'),
      supabase.from('directors').select('*'),
    ]);

    const normalizeUser = (user, role) => {
      let managerId = null;
      if (role === 'employee') {
        managerId = user.manager_id ? String(user.manager_id) : null;
      } else if (role === 'manager') {
        managerId = String(user.id); // 🔹 use their own id
      }

      return {
        ...user,
        id: String(user.id),
        role,
        managerId,
        directorId: user.director_id ? String(user.director_id) : null
      };
    };

    const allUsers = [
      ...(employeesRes.data || []).map(u => normalizeUser(u, 'employee')),
      ...(managersRes.data || []).map(u => normalizeUser(u, 'manager')),
      ...(directorsRes.data || []).map(u => normalizeUser(u, 'director'))
    ];

    return res.json(allUsers);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// PUT /api/user/settings
const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;     // from JWT
    const userRole = req.user.role; // employee | manager | director

    // ✅ normalize booleans to avoid "true"/"false" string issue
    const normalize = (val) => (typeof val === "string" ? val === "true" : !!val);

    const {
      theme,
      language,
      timezone,
      date_format,
      compact_view,
      show_avatars,
      enable_animations,
      auto_save,
      email_notifications,
      push_notifications,
      weekly_reports,
      task_reminders,
      leave_alerts,
      project_updates,
    } = req.body;

    const payload = {
      role_id: userId,
      role_type: userRole,
      theme,
      language,
      timezone,
      date_format,
      compact_view: normalize(compact_view),
      show_avatars: normalize(show_avatars),
      enable_animations: normalize(enable_animations),
      auto_save: normalize(auto_save),
      email_notifications: normalize(email_notifications),
      push_notifications: normalize(push_notifications),
      weekly_reports: normalize(weekly_reports),
      task_reminders: normalize(task_reminders),
      leave_alerts: normalize(leave_alerts),
      project_updates: normalize(project_updates),
      ...(req.body.updated_at !== undefined && { updated_at: new Date() }) // ✅ only if column exists
    };

    const { data, error } = await supabase
      .from("settings")
      .upsert(payload, {
        onConflict: ["role_id", "role_type"], // unique per user-role
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ Error updating settings:", error.message);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: "✅ Settings updated successfully",
      settings: data,
    });
  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ error: "Failed to update settings" });
  }
};


/////////password updating
// controllers/employeeController.js
// controllers/securityController.js

const updateSecurity = async (req, res) => {
  try {
    const userId = req.user.id;     // logged-in user UUID
    const userRole = req.user.role; // 'employee' | 'manager' | 'director'

    const {
      currentPassword,
      newPassword,
      two_factor_enabled,
      session_timeout,
      login_alerts,
      trusted_devices,
      account_deactivated,
      export_requested_at
    } = req.body;

    // 1️⃣ Handle password update if included
    if (currentPassword && newPassword) {
      const roleTable = userRole + "s"; // employees | managers | directors

      // fetch the user record
      const { data: user, error: fetchError } = await supabase
        .from(roleTable)
        .select("id, password")
        .eq("id", userId)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({ error: `${userRole} not found` });
      }

      // check plain text password
      if (currentPassword !== user.password) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // update plain text password (❌ removed updated_at)
      const { error: updatePwdError } = await supabase
        .from(roleTable)
        .update({
          password: newPassword
        })
        .eq("id", userId);

      if (updatePwdError) {
        return res.status(400).json({ error: updatePwdError.message });
      }
    }

    // 2️⃣ Update security settings (always tied to userId + userRole)
    const { data: securityData, error: settingsError } = await supabase
      .from("security_settings")
      .upsert(
        {
          role_id: userId,         // ✅ link settings to logged-in user
          role_type: userRole,     // ✅ link to correct role
          two_factor_enabled,
          session_timeout,
          login_alerts,
          trusted_devices,
          account_deactivated,
          export_requested_at,
          updated_at: new Date(),  // ✅ only here
        },
        { onConflict: "role_id,role_type" } // ensures one row per user
      )
      .select("*")
      .single();

    if (settingsError) {
      return res.status(400).json({ error: settingsError.message });
    }

    return res.status(200).json({
      message: "✅ Security settings updated successfully",
      security: securityData,
    });
  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ error: "Failed to update security settings" });
  }
};

// GET /api/user/settings
const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("role_id", userId)
      .eq("role_type", userRole)
      .single();

    if (error) {
      return res.status(404).json({ error: "Settings not found" });
    }
 console.log("✅ Settings fetched:", data);
    return res.status(200).json(data);
  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
};
// GET /api/user/security
// GET /api/user/security
const getSecurity = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Try to fetch existing settings
    let { data, error } = await supabase
      .from("security_settings")
      .select("*")
      .eq("role_id", userId)
      .eq("role_type", userRole)
      .single();

    if (error || !data) {
      console.warn("⚠️ Security settings not found, generating defaults...");

      // ✅ match table columns
      const defaultSettings = {
        role_id: userId,
        role_type: userRole,
        two_factor_enabled: false,
        session_timeout: 30,
        login_alerts: true,
        trusted_devices: [],
        account_deactivated: false,
        export_requested_at: null,
        updated_at: new Date(),
      };

      // Insert into DB
      const { data: insertedData, error: insertError } = await supabase
        .from("security_settings")
        .insert([defaultSettings])
        .select()
        .single();

      if (insertError) {
        console.error("💥 Error inserting default security settings:", insertError);
        return res.status(500).json({ error: "Failed to create security settings" });
      }

      console.log("✅ Default security settings created:", insertedData);
      return res.status(200).json(insertedData);
    }

    console.log("✅ Security settings fetched:", data);
    return res.status(200).json(data);

  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ error: "Failed to fetch security settings" });
  }
};


const getNotifications = async (req, res) => {
  try {
    const loginUserId = req.user.id;
    const userRoleRaw = (req.user.role || "").toLowerCase();
    console.log("👤 Current User:", { loginUserId, userRoleRaw });

    // --- Role normalization ---
    const directorRoles = [
      'director',
      'director_hr',
      'global_hr_director',
      'global_operations_director',
      'engineering_director',
      'director_tech_team',
      'director_business_development',
    ];

    const managerRoles = [
      'talent_acquisition_manager',
      'manager',
      'project_tech_manager',
      'quality_assurance_manager',
      'software_development_manager',
      'systems_integration_manager',
      'client_relations_manager',
      'human resources',
    ];

    // Initialize userRole
    let userRole = 'employee';

    if (directorRoles.includes(userRoleRaw)) userRole = 'director';
    else if (managerRoles.includes(userRoleRaw)) userRole = 'manager';
    else if (userRoleRaw === 'team_lead') userRole = 'team_lead';
    else if (userRoleRaw === 'intern') userRole = 'intern';
    // otherwise stays 'employee'

    console.log("🛠 Normalized role:", userRole);

    const roleMap = {
      employee: { userColumn: "employee_id", actionColumn: "employee_action", readAtColumn: "employee_read_at" },
      intern: { userColumn: "employee_id", actionColumn: "employee_action", readAtColumn: "employee_read_at" },
      team_lead: { userColumn: "employee_id", actionColumn: "employee_action", readAtColumn: "employee_read_at" },
      manager: { userColumn: "manager_id", actionColumn: "manager_action", readAtColumn: "manager_read_at" },
      director: { userColumn: "director_id", actionColumn: "director_action", readAtColumn: "director_read_at" },
    };


    const roleConfig = roleMap[userRole];
    if (!roleConfig) return res.status(400).json({ error: "Invalid role" });

    // 1️⃣ Fetch notifications
    const { data: notificationsData, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq(roleConfig.userColumn, loginUserId)
      .not(roleConfig.actionColumn, "eq", "deleted")
      .order("created_at", { ascending: false });

    if (notifError) throw notifError;

    // 2️⃣ Leaves
    const leaveIds = notificationsData.filter(n => n.type === "leave").map(n => n.source_id);
    let leavesMap = {};
    if (leaveIds.length > 0) {
      const { data: leavesData } = await supabase
        .from("leaves")
        .select("id, status")
        .in("id", leaveIds);
      leavesData.forEach(l => (leavesMap[l.id] = l.status));
    }

    // 3️⃣ Tasks
    const taskIds = notificationsData.filter(n => ["task", "progress_update"].includes(n.type)).map(n => n.source_id);
    let tasksMap = {};
    if (taskIds.length > 0) {
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, status, progress")
        .in("id", taskIds);
      tasksData.forEach(t => (tasksMap[t.id] = t));
    }

    // 4️⃣ Progress reports
    const reportIds = notificationsData.filter(n => n.type === "progress_report").map(n => n.source_id);
    let reportsMap = {};
    if (reportIds.length > 0) {
      const { data: reportsData } = await supabase
        .from("progress_reports")
        .select("id, status, user_id")
        .in("id", reportIds);
      reportsData.forEach(r => (reportsMap[r.id] = r));
    }

    // 5️⃣ Projects
    const projectIds = notificationsData.filter(n => n.type === "project").map(n => n.source_id);
    let projectsMap = {};
    if (projectIds.length > 0) {
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, status, manager_id")
        .in("id", projectIds);
      projectsData.forEach(p => (projectsMap[p.id] = p));
    }

    // 6️⃣ Map notifications
    const notifications = (notificationsData || [])
      .map(n => {
        const action = n[roleConfig.actionColumn] || "unread";
        const readAt = n[roleConfig.readAtColumn] || null;
        const isRead = action === "read" || !!readAt;
        let message = n.message;

        // 🟢 Leaves
        if (userRole === "employee" && n.type === "leave" && n.created_by === loginUserId) {
          const leaveStatus = leavesMap[n.source_id];
          if (leaveStatus === "approved") message = "Your leave request approved ✅";
          else if (leaveStatus === "rejected") message = "Your leave request rejected ❌";
          else return null;
        }

        // 🟢 Tasks
        if (n.type === "task" && userRole === "employee") {
          const task = tasksMap[n.source_id];
          if (task) message = `New task assigned: ${n.message} 📌`;
        }

        // 🟢 Task progress updates
        if (n.type === "progress_update" && (userRole === "manager" || userRole === "director")) {
          const task = tasksMap[n.source_id];
          if (task) message = `Task progress updated: ${task.status} (${task.progress}%)`;
        }

       // 🟢 Project notifications - FIXED VERSION
if (n.type === "project") {
  const project = projectsMap[n.source_id];
  if (!project) return null;

  // ✅ Check if current user should receive this notification
  if (userRole === "manager" && n.manager_id === loginUserId) {
    if (project.status === "approved") {
      message = "Your project has been approved ✅";
    } else if (project.status === "rejected") {
      message = "Your project has been rejected ❌";
    } else {
      message = n.message || "Project status updated 📢";
    }
  } else if (userRole === "director" && n.director_id === loginUserId) {
    // Directors can see project notifications they created
    message = n.message || "Project notification 📢";
  } else {
    // ✅ Instead of returning null, skip this notification
    return null;
  }
}


        // 🟢 Progress reports
        if (n.type === "progress_report") {
          const report = reportsMap[n.source_id];
          if (!report) return null;

          if (userRole === "employee" && n.created_by === loginUserId) {
            if (report.status === "approved") message = "Your progress report has been approved ✅";
            else if (report.status === "rejected") message = "Your progress report has been rejected ❌";
            else return null;
          } else if (userRole === "manager" || userRole === "director") {
            message = n.message || "New progress report submitted 📄";
          }
        }

        return {
          id: `${n.source_id}-${n.type}-${n[roleConfig.userColumn]}`,
          sourceId: n.source_id,
          userId: n[roleConfig.userColumn],
          createdBy: n.created_by,
          message,
          type: n.type,
          action,
          read: isRead,
          readAt,
          createdAt: n.created_at,
          actionUrl: n.action_url || null,
        };
      })
      .filter(Boolean);

    console.log("📤 Final notifications list:", notifications);
    return res.json({ notifications });
  } catch (err) {
    console.error("💥 Notification error:", err);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};




const markAsRead = async (req, res) => {
  try {
    const { type, message, sourceId, date } = req.body;

    if (!type || !sourceId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const loginUserId = req.user.id;
    const userRole = (req.user.role || "").toLowerCase(); // normalize role

    // Role → column mappings
    const roleMap = {
      employee: {
        userColumn: "employee_id",
        actionColumn: "employee_action",
        readAtColumn: "employee_read_at",
      },
      manager: {
        userColumn: "manager_id",
        actionColumn: "manager_action",
        readAtColumn: "manager_read_at",
      },
      director: {
        userColumn: "director_id",
        actionColumn: "director_action",
        readAtColumn: "director_read_at",
      },
    };

    const roleConfig = roleMap[userRole];
    if (!roleConfig) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if this notification already exists for this role
    const { data: existing, error: fetchErr } = await supabase
      .from("notifications")
      .select("*")
      .eq(roleConfig.userColumn, loginUserId)
      .eq("type", type)
      .eq("source_id", sourceId)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") {
      console.error("❌ Error fetching notification:", fetchErr);
      throw fetchErr;
    }

    let result;
    if (existing) {
      // ✅ Update only the correct role’s action + timestamp
      const updatePayload = {
        [roleConfig.actionColumn]: "read",
        [roleConfig.readAtColumn]: date || new Date().toISOString(),
        created_by: loginUserId,
      };

      const { data, error } = await supabase
        .from("notifications")
        .update(updatePayload)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // ✅ Insert a fresh record for this role
      const insertPayload = {
        type,
        message,
        source_id: sourceId,
        created_by: loginUserId,
        [roleConfig.userColumn]: loginUserId,
        [roleConfig.actionColumn]: "read",
        [roleConfig.readAtColumn]: date || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("notifications")
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      message: "✅ Notification marked as read & stored",
      notification: result,
    });
  } catch (err) {
    console.error("❌ Error marking as read:", err);
    res.status(500).json({ error: "Server error" });
  }
};



// Delete notification
const deleteNotification = async (req, res) => {
  try {
    console.log("📩 Incoming deleteNotification request body:", req.body);

    const notification = req.body; // { type, message, sourceId, date }
    if (!notification || !notification.type || !notification.sourceId) {
      console.warn("⚠️ Missing required fields in deleteNotification");
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let userColumn = "";
    if (req.user.role === "employee") userColumn = "employee_id";
    else if (req.user.role === "manager") userColumn = "manager_id";
    else if (req.user.role === "director") userColumn = "director_id";

    // Check if notification already exists
    const { data: existing, error: fetchErr } = await supabase
      .from("notifications")
      .select("*")
      .eq(userColumn, req.user.id)
      .eq("type", notification.type)
      .eq("source_id", notification.sourceId)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr; // ignore not found

    let result;
    if (existing) {
      // Update existing notification to deleted
      const { data, error } = await supabase
        .from("notifications")
        .update({ action: "deleted" })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert new notification with deleted status
      const payload = {
        type: notification.type,
        message: notification.message,
        source_id: notification.sourceId,
        action: "deleted",
        [userColumn]: req.user.id,
      };
      const { data, error } = await supabase
        .from("notifications")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    console.log("🗑️ Notification marked as deleted:", result);

    res.json({ message: 'Notification deleted', notification: result });
  } catch (err) {
    console.error("❌ Error in deleteNotification:", err);
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports = {
  signupDirector,
  updateSecurity,
  getNotifications,
  deleteNotification,
  updateSettings,
  login,
  markAsRead,
  getSecurity,
  getSettings,
  getCurrentUser,
  getAllUsers,
};
