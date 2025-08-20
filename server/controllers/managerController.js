const { supabase } = require('../config/supabase'); // ✅ correct

const express = require('express');
const router = express.Router();

const path = require("path");
exports.addEmployee = async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      employee_id,
      position,
      role,
      department,
      join_date,
      annual_salary,
      annual_leave_balance,
      college,
      internship_start_date,
      internship_end_date,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      email,
      name,
      emergency_contact_name,
      emergency_contact_phone,
      employee_id,
      position,
      role,
      department,
      join_date,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({ error: `${key} is required` });
      }
    }

    const validRoles = [
      "employee",
      "intern",
      "senior_employee",
      "team_lead",
    ];
    const validDepartments = [
      "hr",
      "operations",
      "engineering",
      "tech",
      "business_development",
      "quality_assurance",
      "systems_integration",
      "client_relations",
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (!validDepartments.includes(department)) {
      return res.status(400).json({ error: "Invalid department" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

   // 🔹 Handle profile photo upload
let profilePhotoUrl = null;

if (req.file) {
  const fileExt = path.extname(req.file.originalname);
  const fileName = `profile_photos/${Date.now()}_${employee_id}${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("employee-media")
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
    });

  if (uploadError) {
    return res.status(500).json({ error: "Image upload failed", details: uploadError.message });
  }

  const { data: publicUrlData } = supabase
    .storage
    .from("employee-media")
    .getPublicUrl(fileName);

  profilePhotoUrl = publicUrlData?.publicUrl || null;
}
console.log("supabase defined:", typeof supabase); // should be "object"


    // 🔹 Get manager’s director_id
    const { data: manager, error: managerError } = await supabase
      .from("employees")
      .select("director_id")
      .eq("id", req.user.id)
      .single();

    if (managerError || !manager) {
      return res.status(400).json({ error: "Manager not found or invalid" });
    }

    const directorId = manager.director_id;
    if (!directorId) {
      return res.status(400).json({ error: "Director not assigned to manager" });
    }

    // 🔹 Construct employee object
    const employeeData = {
      email,
      password: "temppass",
      name,
      phone,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      employee_id,
      position,
      role,
      department,
      manager_id: req.user.id,
      director_id: directorId,
      join_date,
      annual_salary,
      annual_leave_balance,
      profile_photo_url: profilePhotoUrl,
      college: role === "intern" ? college : null,
      internship_start_date: role === "intern" ? internship_start_date : null,
      internship_end_date: role === "intern" ? internship_end_date : null,
    };

    // 🔹 Insert employee into Supabase
    const { data: employee, error: insertError } = await supabase
      .from("employees")
      .insert([employeeData])
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    // 🔹 Update director's employee stats
    const { data: director, error: directorError } = await supabase
      .from("directors")
      .select("total_employees, employee_ids")
      .eq("id", directorId)
      .single();

    if (!directorError && director) {
      const newEmployeeIds = [...(director.employee_ids || []), employee.id];
      const newTotalEmployees = (director.total_employees || 0) + 1;

      await supabase
        .from("directors")
        .update({
          total_employees: newTotalEmployees,
          employee_ids: newEmployeeIds,
        })
        .eq("id", directorId);
    }

    return res.status(201).json({
      message: `${role} registered successfully`,
      employee,
    });
  } catch (error) {
    console.error("Add employee error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.viewTeamPerformance = async (req, res) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*, tasks(*), attendance(*), leaves(*), progress(*)')
    .eq('manager_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

exports.CreateTask = async (req, res) => {
  const { project_id, title, description, assignee, priority, due_date } = req.body;

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, manager_id')
    .eq('id', assignee)
    .single();

  if (employeeError || !employee || employee.manager_id !== req.user.id) {
    return res.status(403).json({ error: 'Invalid assignee or not under this manager' });
  }

  const { error } = await supabase.from('tasks').insert({
    project_id,
    user_id: assignee,
    title,
    description,
    priority,
    due_date,
    assigned_by: req.user.id,
    status: 'assigned',
  });

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({ message: 'Task assigned successfully' });
};


  exports.approveLeave = async (req, res) => {
 const { leave_id, status } = req.body;
  const role = req.user.role;
  const approverId = req.user.id;

  // Step 1: Fetch leave details
  const { data: leaveData, error: leaveError } = await supabase
    .from('leaves')
    .select('id, user_id, manager_approval, director_approval')
    .eq('id', leave_id)
    .single();

  if (leaveError || !leaveData) {
    return res.status(400).json({ error: leaveError?.message || 'Leave not found' });
  }

  // Step 2: Block COA if already approved
  const isApproved = leaveData.manager_approval === 'approved' || leaveData.director_approval === 'approved';
  if (role === 'coa' && isApproved) {
    return res.status(403).json({ error: 'Leave already approved by manager or director' });
  }

  // Step 3: Role-specific approval
  let updateFields = {};
  if (role === 'manager') {
    // Optional: Check manager owns this employee
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('manager_id')
      .eq('id', leaveData.user_id)
      .single();

    if (empError || empData.manager_id !== approverId) {
      return res.status(403).json({ error: 'Not authorized as manager' });
    }

    updateFields.manager_approval = status;
  } else if (role === 'director') {
    updateFields.director_approval = status;
  } else if (role === 'coa') {
    updateFields.coa_approval = status; // Optional
  } else {
    return res.status(403).json({ error: 'Invalid role' });
  }

  // Step 4: Update the record
  const { data: updatedLeave, error: updateError } = await supabase
    .from('leaves')
    .update(updateFields)
    .eq('id', leave_id)
    .select()
    .single();

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  res.status(200).json(updatedLeave);
};

exports.getOverview = async (req, res) => {
  try {
    const managerId = req.params.id;  
    console.log("📌 Fetching overview for managerId:", managerId);

    // -------------------- Employees --------------------
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name, role")
      .eq("manager_id", managerId);

    if (empError) throw empError;
    const totalMembers = employees?.length || 0;
    const employeeIds = employees.map(e => e.id);

    // -------------------- Projects --------------------
    const { data: projects, error: projError } = await supabase
      .from("projects")
      .select("id, title, status, start_date, end_date, priority, approval_comments")
      .eq("manager_id", managerId);

    if (projError) throw projError;

    const activeCount = projects.filter(p => p.status === "approved").length;
    const completedCount = projects.filter(p => p.status === "completed").length;
    const pendingCount = projects.filter(p => p.status === "pending").length;

    // ✅ On-time projects (completed & has end_date)
    const onTimeProjects = projects.filter(
      p => p.status === "completed" && p.end_date
    ).length;

    // -------------------- Tasks --------------------
    const { data: tasks, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, status, due_date, user_id")
      .eq("manager_id", managerId);

    if (taskError) throw taskError;

    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const onTimeTasks = tasks.filter(
      t => t.status === "completed" && t.due_date
    ).length;

    // -------------------- Progress Reports --------------------
    const { data: reports, error: repError } = await supabase
      .from("progress_reports")
      .select("id, submitted_at, report_date, user_id")
      .in("user_id", employeeIds);

    if (repError) throw repError;

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    // Count submitted reports this month
    const submittedReports = reports.filter(
      r => new Date(r.report_date) >= firstDay && new Date(r.report_date) <= today
    ).length;

    // Expected daily reports (working days till today)
    const totalDays = Math.floor((today - firstDay) / (1000 * 60 * 60 * 24)) + 1;
    const missingReports = totalDays - submittedReports;

    // -------------------- Performance Calculations --------------------
    const projectScore = completedCount ? Math.round((onTimeProjects / completedCount) * 100) : 0;
    const taskScore = completedTasks ? Math.round((onTimeTasks / completedTasks) * 100) : 0;
    const reportScore = totalDays ? Math.round((submittedReports / totalDays) * 100) : 0;

    const avgProgress = Math.round((projectScore + taskScore + reportScore) / 3);

    // -------------------- Response --------------------
    return res.json({
      managerId,
      teamSize: totalMembers,
      completedTasks,
      activeProjects: activeCount,
      pendingProjects: pendingCount,
      missingReports,
      avgProgress,
      metrics: {
        projectScore,
        taskScore,
        reportScore,
        onTimeProjects,
        onTimeTasks,
        submittedReports,
        missingReports,
      },
      employees: employees || [],
      projects: projects || [],
      tasks: tasks || [],
      reports: reports || [],
    });
  } catch (err) {
    console.error("Error fetching manager overview:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.applyLeave = async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;

  const { data, error } = await supabase.from("leaves").insert([
    {
      user_id: req.user.id,
      leave_type,
      start_date,
      end_date,
      reason,
      manager_approval: "pending",
      director_approval: "pending",
    },
  ]).select("*"); // 🧠 Get the inserted leave (optional)

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]); // ✅ Return the created leave
};

exports.getTeam = async (req, res) => {
  try {
    const managerId = req.query.manager_id || req.user.managerId || req.user.id;
    console.log("📌 Manager ID:", managerId);

    // Fetch employees under this manager
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("manager_id", managerId);

    if (empError) {
      console.error("❌ Error fetching employees:", empError.message);
      return res.status(400).json({ error: empError.message });
    }

    // Log team member count
    console.log(`👥 Team Member Count: ${employees.length}`);
    if (employees.length > 0) {
      console.log("👤 Team Members:", employees.map(emp => emp.name || emp.id));
    }

    if (!employees.length) {
      console.warn("⚠️ No employees found for manager");
      return res.status(200).json([]);
    }

    const employeeIds = employees.map(emp => emp.id);

    // Fetch tasks assigned to these employees
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .in("user_id", employeeIds);

    console.log(`📝 Found ${tasks?.length || 0} tasks`);

    // Fetch projects for this manager
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("manager_id", managerId);

    console.log(`📂 Found ${projects?.length || 0} projects`);

    // Fetch progress records for the tasks
    const taskIds = tasks?.map(t => t.id) || [];
    let progressRecords = [];
    if (taskIds.length > 0) {
      const { data: progress } = await supabase
        .from("progress")
        .select("*")
        .in("task_id", taskIds);
      progressRecords = progress || [];
    }

    console.log(`📊 Found ${progressRecords.length} progress records`);

    // Calculate average progress
    let avgProgress = 0;
    if (progressRecords.length > 0) {
      avgProgress = Math.round(
        progressRecords.reduce((sum, p) => sum + (p.progress_percent || 0), 0) /
          progressRecords.length
      );
    }

    console.log("📈 Team Average Progress:", avgProgress);

    // Enrich employee data
    const enrichedEmployees = employees.map(emp => {
      const empTasks = tasks?.filter(t => t.user_id === emp.id) || [];
      const empProjects = projects || [];

      console.log(`👤 Employee ${emp.id} (${emp.name || "No name"}):`);
      console.log(`   📝 Tasks: ${empTasks.length}`);
      console.log(`   📂 Projects: ${empProjects.length}`);

      return {
        ...emp,
        tasks: empTasks,
        projects: empProjects,
        avgProgress
      };
    });
console.log(`👥 Team Member Count: ${employees.length}`);
console.log(`👤 Team Members: [ ${employees.map(emp => emp.name || emp.id).join(', ')} ]`);

    console.log("🚀 Sending Enriched Employees Data:", JSON.stringify(enrichedEmployees, null, 2));

    return res.status(200).json(enrichedEmployees);
  } catch (err) {
    console.error("💥 Error fetching team data:", err);
    return res.status(500).json({ error: "Server error fetching team data" });
  }
};


// exports.getTeamDetails = async (req, res) => {
//   try {
//     const managerId = req.user.id;
//     console.log("🔐 Manager ID:", managerId);

//     // 1. Table check (already working)
//     const { data: schemaTables, error: schemaErr } = await supabase
//       .from('information_schema.tables')
//       .select('table_name')
//       .eq('table_schema', 'public');

//     if (schemaErr) {
//       console.error("⚠️ Schema fetch error:", schemaErr);
//       return res.status(500).json({ error: 'Failed to fetch schema info' });
//     }

//     const tableNames = schemaTables.map(t => t.table_name);
//     const requiredTables = ['teams', 'employees', 'tasks'];
//     const missingTables = requiredTables.filter(t => !tableNames.includes(t));

//     if (missingTables.length > 0) {
//       console.warn("❌ Missing tables:", missingTables);
//       return res.status(500).json({ error: `Missing required table(s): ${missingTables.join(', ')}` });
//     }

//     // 2. Fetch teams
//     const { data: teams, error: teamError } = await supabase
//       .from('teams')
//       .select('id, name, icon, color')
//       .eq('manager_id', managerId);

//     if (teamError) {
//       console.error("❌ Team fetch error:", teamError.message);
//       return res.status(400).json({ error: teamError.message });
//     }

//     const formattedTeams = [];

//     for (const team of teams) {
//       console.log(`👥 Processing team: ${team.name} (${team.id})`);

//       // 3. Get team members
//       const { data: members, error: empError } = await supabase
//         .from('employees')
//         .select('id')
//         .eq('team_id', team.id);

//       if (empError) {
//         console.error(`❌ Error fetching members for team ${team.id}:`, empError.message);
//         return res.status(400).json({ error: empError.message });
//       }

//       const memberIds = members.map((m) => m.id);

//       // 4. Get their tasks
//       if (memberIds.length === 0) {
//         console.log(`ℹ️ No members in team ${team.id}, skipping task query.`);
//         formattedTeams.push({
//           id: team.id,
//           name: team.name,
//           icon: team.icon || '👥',
//           color: team.color || 'from-indigo-500 to-purple-600',
//           members: 0,
//           activeTasks: 0,
//           completedTasks: 0,
//           progress: 0
//         });
//         continue;
//       }

//       const { data: tasks, error: taskError } = await supabase
//         .from('tasks')
//         .select('status')
//         .in('user_id', memberIds);

//       if (taskError) {
//         console.error(`❌ Error fetching tasks for team ${team.id}:`, taskError.message);
//         return res.status(400).json({ error: taskError.message });
//       }

//       const activeTasks = tasks.filter((t) => t.status === 'in_progress').length;
//       const completedTasks = tasks.filter((t) => t.status === 'completed').length;
//       const totalTasks = activeTasks + completedTasks;

//       const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

//       formattedTeams.push({
//         id: team.id,
//         name: team.name,
//         icon: team.icon || '👥',
//         color: team.color || 'from-indigo-500 to-purple-600',
//         members: memberIds.length,
//         activeTasks,
//         completedTasks,
//         progress,
//       });
//     }

//     console.log("✅ Final formatted team data:", formattedTeams);
//     res.status(200).json(formattedTeams);
//   } catch (err) {
//     console.error('🔥 Unexpected error in getTeamDetails:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


exports.getEmployees = async (req, res) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('manager_id', req.user.id)
    .eq('role', 'employee');

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

exports.getInterns = async (req, res) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('manager_id', req.user.id)
    .eq('role', 'intern');

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

// exports.createProject = async (req, res) => {
//   const { title, description, start_date, end_date } = req.body;
//   if (!title || !start_date) return res.status(400).json({ error: 'Title and start date are required' });

//   const directorId = (await supabase.from('employees').select('director_id').eq('id', req.user.id).single()).data.director_id;

//   const { data, error } = await supabase
//     .from('projects')
//     .insert([{
//       title,
//       description,
//       director_id: directorId,
//       manager_id: req.user.id,
//       start_date,
//       end_date,
//       status: 'planning',
//     }])
//     .select()
//     .single();

//   if (error) return res.status(400).json({ error: error.message });
//   res.json({ message: 'Project created', project: data });
// };

exports.getTeamProgress = async (req, res) => {
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id')
    .eq('manager_id', req.user.id);

  if (empError) return res.status(400).json({ error: empError.message });

  const employeeIds = employees.map(e => e.id);
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .in('user_id', employeeIds);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};
exports.getActiveProjects = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks (
          id,
          user_id,
          title,
          status,
          due_date,
          employee:employees!tasks_user_id_fkey (
            id,
            name
          )
        )
      `);

    if (error) return res.status(400).json({ error: error.message });

    // Console log employee details inside tasks for debug
    data.forEach(project => {
      console.log(`Project: ${project.title} (ID: ${project.id})`);
      project.tasks?.forEach(task => {
        const emp = task.employee;  // single object, not array
        console.log(`  Task: ${task.title} (ID: ${task.id})`);
        console.log(`    Assigned to employee: ${emp ? `${emp.name} (ID: ${emp.id})` : 'No employee info'}`);
      });
    });

    res.status(200).json(data);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to fetch active projects' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      priority // ✅ New field from frontend
    } = req.body;

    const managerId = req.user?.id;

    console.log('🛠️ Incoming project creation request');
    console.log('📥 Request Body:', req.body);
    console.log('👤 Authenticated Manager ID:', managerId);

    // Step 0: Validate required fields
    if (!title || !start_date) {
      console.warn('⚠️ Validation failed: Missing required fields');
      return res.status(400).json({
        error: 'Title and start date are required.',
      });
    }

    // Step 1: Fetch director_id from the managers table
    const { data: managerData, error: managerError } = await supabase
      .from('managers')
      .select('id, director_id')
      .eq('id', managerId)
      .single();

    if (managerError || !managerData?.director_id) {
      console.error('❌ Failed to fetch director_id for manager:', managerError?.message);
      return res.status(400).json({ error: 'Manager must be assigned to a director.' });
    }

    const directorId = managerData.director_id;
    console.log('✅ Director ID found:', directorId);

    // Step 2: Create the project only
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        title,
        description,
        start_date,
        end_date,
        priority: priority || 'low', // ✅ Default to 'low' if not provided
        manager_id: managerId,
        director_id: directorId,
        status: 'pending_approval',
      }])
      .select()
      .single();

    if (projectError) {
      console.error('❌ Project creation failed:', projectError.message);
      return res.status(500).json({ error: projectError.message });
    }

    console.log('✅ Project created:', project);

    // ✅ Final response
    res.json({
      message: 'Project created successfully.',
      project,
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err.message, err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Delete all related progress entries
    const { error: progressError } = await supabase
      .from('progress')
      .delete()
      .eq('task_id', id);

    if (progressError) {
      console.error('❌ Failed to delete progress entries:', progressError);
      return res.status(500).json({ error: 'Failed to delete related progress entries.', details: progressError.message });
    }

    // 2️⃣ Optionally: clear task from project (only if needed — do NOT delete full project unless explicitly required)
    // If your `tasks` table has `project_id`, and projects track task count/status, you could update project accordingly.
    // Skip this if projects shouldn't be modified directly.

    // 3️⃣ Delete the task itself
    const { error: taskError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (taskError) {
      console.error('❌ Failed to delete task:', taskError);
      return res.status(500).json({ error: 'Failed to delete task.', details: taskError.message });
    }

    return res.status(200).json({ message: 'Task and related data deleted successfully.' });

  } catch (err) {
    console.error('❌ Server error during deletion:', err);
    return res.status(500).json({ error: 'Internal server error during deletion.' });
  }
};

// controllers/tasksController.js
exports.updateTaskProgress = async (req, res) => {
  try {
    console.log('🟡 Incoming updateTaskProgress request');
    console.log('📥 Request body:', req.body);

    const {
      task_id,
      progress_percent,
      status,
      comment,
      manager_id,
      progress_type,
      project_status,
      project_id,
    } = req.body;

    // 🔒 Validation
    if (!task_id || progress_percent === undefined || !status || !manager_id) {
      console.warn('⚠️ Missing required fields:', {
        task_id,
        progress_percent,
        status,
        manager_id,
      });
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // 1️⃣ Update the task's status
    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        status,
        
      })
      .eq('id', task_id);

    if (taskError) {
      console.error('❌ Error updating task status:', taskError);
      return res.status(500).json({
        error: 'Failed to update task status.',
        details: taskError.message,
      });
    }

    console.log('✅ Task status updated');

    // 2️⃣ Add progress entry
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .insert([
        {
          task_id,
          progress_percent,
          comment,
          manager_id,
          progress_type: progress_type || 'update',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (progressError) {
      console.error('❌ Error inserting progress:', progressError);
      return res.status(500).json({
        error: 'Failed to record progress.',
        details: progressError.message,
      });
    }

    console.log('✅ Progress entry created:', progressData);

    // 3️⃣ Optionally update project status if provided
    if (project_id && project_status) {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .update({
          status: project_status,
          
        })
        .eq('id', project_id)
        .select();

      if (projectError) {
        console.error('❌ Error updating project status:', projectError);
        // Optional: You can still continue even if this fails
      } else {
        console.log('✅ Project status updated:', projectData);
      }
    } else {
      console.log('ℹ️ Skipped project status update – missing project_id or project_status.');
    }

    return res.status(200).json({
      message: 'Task progress updated successfully.',
      task_status: status,
      progress: progressData[0],
    });
  } catch (err) {
    console.error('❌ Uncaught server error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(400).json({ error: "Manager ID is required" });
    }

    // Step 1: Fetch tasks managed by or assigned by this manager
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .or(`manager_id.eq.${managerId},assigned_by.eq.${managerId}`);

    if (taskError) {
      console.error('❌ Error fetching tasks:', taskError.message);
      return res.status(500).json({ error: "Failed to fetch tasks" });
    }

    // Step 2: Fetch latest progress
    const { data: progresses, error: progressError } = await supabase
      .from('progress')
      .select('task_id, progress_percent, created_at')
      .order('created_at', { ascending: false });

    if (progressError) {
      console.error('❌ Error fetching progress:', progressError.message);
      return res.status(500).json({ error: "Failed to fetch progress" });
    }

    // Step 3: Build latest progress map
    const latestProgressMap = new Map();
    for (const row of progresses) {
      if (!latestProgressMap.has(row.task_id)) {
        latestProgressMap.set(row.task_id, row.progress_percent);
      }
    }

    // Step 4: Enrich tasks
    const enrichedTasks = tasks.map(task => ({
      ...task,
      progress_percent: latestProgressMap.get(task.id) ?? 0,
    }));

    // Step 5: Filter
    const ownTasks = enrichedTasks.filter(
      task =>
        task.manager_id === managerId &&
        task.created_by_director !== null
    );

    const teamTasks = enrichedTasks.filter(
      task =>
        task.assigned_by === managerId &&
        task.user_id !== managerId
    );

    // 🪵 Debug Logging
    console.group(`🧾 Task Debug Log for Manager ID: ${managerId}`);
    console.log('✅ All fetched tasks:', tasks.length);
    console.log('🟢 My Tasks:', ownTasks.map(t => ({
      id: t.id,
      title: t.title,
      user_id: t.user_id,
      manager_id: t.manager_id,
      created_by_director: t.created_by_director
    })));
    console.log('🔵 Team Tasks:', teamTasks.map(t => ({
      id: t.id,
      title: t.title,
      user_id: t.user_id,
      assigned_by: t.assigned_by
    })));
    console.groupEnd();

    // Step 6: Return combined
    return res.status(200).json([...ownTasks, ...teamTasks]);

  } catch (err) {
    console.error('❌ Server error:', err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};





exports.approveLeaves = async (req, res) => {
  try {
    console.log("📥 Received leave approval request:", req.body);

    const { leaveId, status, comments, role } = req.body;

    if (!leaveId || !status || !role) {
      return res.status(400).json({ error: "leaveId, status, and role are required" });
    }

    const updateData = { comments };

    // Update appropriate field based on role
    if (role === "manager") {
      updateData.manager_approval = status;
    } else if (role === "director") {
      updateData.director_approval = status;
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    console.log("🛠 Updating leave record with:", updateData);

    const { data, error } = await supabase
      .from("leaves")
      .update(updateData)
      .eq("id", leaveId)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Leave approval updated successfully:", data);

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error in approveLeaves:", err.message);
    res.status(500).json({ error: err.message || "Server error" });
  }
};




exports.getLeaves = async (req, res) => {
  try {
    const managerId = req.user.id; // this is the logged-in user
    if (!managerId) {
      return res.status(400).json({ error: 'Manager ID is missing in token' });
    }

    // 1. Fetch employees reporting to this manager
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('manager_id', managerId);

    if (empError) {
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }

    const employeeIds = employees.map(emp => emp.id);

    // Also include manager's own ID
    const allUserIds = [...employeeIds, managerId];

    // 2. Fetch leave requests for both employees + manager
    const { data: leaves, error } = await supabase
      .from('leaves')
      .select(`
  id,
  user_id,
  leave_type,
  start_date,
  end_date,
  reason,
  status,
  manager_approval,
  director_approval,
  comments,
  
  created_at,
  employee:employees(name, department)
`)

      .in('user_id', allUserIds);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(leaves);
  } catch (err) {
    console.error('❌ getLeaves error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getProgressreports = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let employeeIds = [];

    // 1. Determine employees based on role
    if (userRole === 'employee') {
      employeeIds = [userId];
    } else if (userRole === 'manager') {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id')
        .eq('manager_id', userId);
      if (error) throw error;
      employeeIds = employees.map(e => e.id);
    } else if (userRole === 'director') {
      const { data: managers, error: mgrError } = await supabase
        .from('managers')
        .select('id')
        .eq('director_id', userId);
      if (mgrError) throw mgrError;

      const managerIds = managers.map(m => m.id);

      if (managerIds.length > 0) {
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('id')
          .in('manager_id', managerIds);
        if (empError) throw empError;

        employeeIds = employees.map(e => e.id);
      }
    } else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    // ✅ Always include the logged-in user's own ID
    const allUserIds = [...employeeIds, userId];

    console.log('[ProgressReports] User:', userId, '| Role:', userRole);
    console.log('[ProgressReports] Fetched employeeIds (including self):', allUserIds);

    if (allUserIds.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Fetch reports for all relevant users
    const { data: reports, error: reportError } = await supabase
      .from('progress_reports')
      .select('*')
      .in('user_id', allUserIds);

    if (reportError) {
      console.error('[ProgressReports] Error fetching reports:', reportError.message);
      return res.status(400).json({ error: reportError.message });
    }

    console.log(`[ProgressReports] Found ${reports.length} report(s).`);

    const enrichedReports = [];

    for (const report of reports) {
      let taskIds = [];

      // 3. Parse task_completed (stringified or array)
      try {
        if (Array.isArray(report.task_completed)) {
          taskIds = report.task_completed;
        } else if (typeof report.task_completed === 'string') {
          taskIds = JSON.parse(report.task_completed);
        }
      } catch (e) {
        console.warn(`[ProgressReports] Invalid task_completed JSON in report ${report.id}:`, e.message);
      }

      // 4. Fetch tasks
      let taskDetails = [];
      if (taskIds.length > 0) {
        const { data: tasks, error: taskError } = await supabase
          .from('tasks')
          .select('id, title')
          .in('id', taskIds);

        if (taskError) {
          console.warn(`[ProgressReports] Failed to fetch tasks for report ${report.id}:`, taskError.message);
        } else {
          const taskMap = new Map(tasks.map(t => [t.id, t.title || 'Untitled Task']));
          taskDetails = taskIds.map(id =>
            taskMap.has(id) ? { id, title: taskMap.get(id) } : { id, title: 'Unknown Task' }
          );
        }
      }

      // 5. Enrich and return
      enrichedReports.push({
        ...report,
        taskCount: taskIds.length,
        date: report.submitted_at || report.created_at || null, // <-- Add this
        tasks: taskDetails,
        submittedAt: report.submitted_at || report.created_at || null,
      });
    }

    console.log(`[ProgressReports] Returning ${enrichedReports.length} enriched report(s).`);
    return res.status(200).json(enrichedReports);
  } catch (err) {
    console.error('[ProgressReports] Internal Error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};




exports.approvestatusProgressReport = async (req, res) => {
  const reportId = req.params.id;
  const { managerFeedback, approved } = req.body;

  const user = req.user;

  if (!user || !user.id || !user.role) {
    return res.status(401).json({ error: 'Unauthorized. User info missing.' });
  }

  if (!reportId || typeof approved !== 'boolean') {
    return res.status(400).json({ error: 'Valid report ID and approval status are required.' });
  }

  // Fetch the report
  const { data: report, error: fetchError } = await supabase
    .from('progress_reports')
    .select('id, user_id, approved_at')
    .eq('id', reportId)
    .single();

  if (fetchError || !report) {
    return res.status(404).json({ error: 'Progress report not found.' });
  }

  // ❌ Prevent self-approval
  if (report.user_id === user.id) {
    return res.status(403).json({ error: 'You cannot review your own report.' });
  }

  // ❌ Prevent re-review
  if (report.approved_at) {
    return res.status(400).json({ error: 'This report has already been reviewed.' });
  }

  // ✅ Role-based Access Control
  if (user.role === 'manager') {
    const { data: employee, error: userFetchError } = await supabase
      .from('employees')
      .select('id, manager_id')
      .eq('id', report.user_id)
      .single();

    if (userFetchError || !employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (employee.manager_id !== user.id) {
      return res.status(403).json({ error: 'You can only review reports from your direct reports.' });
    }
  } else if (user.role !== 'director') {
    return res.status(403).json({ error: 'Only managers or directors can approve/reject reports.' });
  }

  // ✅ Update only `status` and review fields
  const { error: updateError } = await supabase
    .from('progress_reports')
    .update({
      status: approved ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_by_role: user.role,
      approved_at: new Date().toISOString(),
      manager_feedback: managerFeedback || null,
    })
    .eq('id', reportId);

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  return res.status(200).json({ message: 'Report reviewed successfully.' });
};



exports.approveProgressReport = async (req, res) => {
  try {
    const { reportId, status, manager_feedback } = req.body;

    if (!reportId || !status) {
      return res.status(400).json({ error: 'reportId and status are required' });
    }

    // ✅ Get the approver's ID and role from the authenticated request
    const approverId = req.user?.id;
    const approverRole = req.user?.role;

    if (!approverId || !approverRole) {
      return res.status(403).json({ error: 'Unauthorized: missing user info' });
    }

    console.log("[approveProgressReport] Incoming:", req.body);

    const { data, error } = await supabase
      .from('progress_reports')
      .update({
        status, // "approved" or "rejected"
        manager_feedback: manager_feedback || null,
        approved_by: approverId,
        approved_by_role: approverRole,
        approved_at: new Date()
      })
      .eq('id', reportId)
      .select(); // return updated row

    if (error) {
      console.error("[approveProgressReport] Supabase error:", error);
      return res.status(400).json({ error: error.message || 'Unknown database error' });
    }

    if (!data || data.length === 0) {
      console.warn("[approveProgressReport] No report found for id:", reportId);
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json({ message: 'Report approval status updated', report: data[0] });

  } catch (err) {
    console.error("[approveProgressReport] Internal server error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getProgress = async (req, res) => {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });

  res.status(200).json(data);
};
// In controllers/managerController.js or .ts

exports.submitProgressReport = async (req, res) => {
  try {
    const {
  report_date,
  accomplishments,
  challenges,
  tomorrow_plan,
  task_completed,
  progress_percent,
} = req.body;


    const user = req.user;

    // Required field check
    if (!accomplishments) {
      return res.status(400).json({ error: 'Accomplishments are required' });
    }

    const { data, error } = await supabase.from('progress_reports').insert([
      {
        user_id: user.id,
        role: user.role || 'manager',
        report_date: report_date || new Date().toISOString().split('T')[0],
        accomplishments,
        challenges: challenges || null,
        tomorrow_plan: tomorrow_plan || null,
        task_completed: task_completed ?? [],
        progress_percent: progress_percent ?? 0,
        submitted_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('❌ Supabase insert error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to submit report' });
    }

    res.status(201).json({ success: true, message: 'Progress submitted', report: data?.[0] });
  } catch (err) {
    console.error('❗ Unexpected server error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
};
////////////////////////////////////////////////////////////////
// controllers/managerController.js

exports.assignTaskEmployee = async (req, res) => {
  try {
    const managerId = req.user?.id;
    const { project_id, employee_ids, title, description, due_date } = req.body;

    console.log('📥 Incoming Assign Task Request:', {
      managerId,
      project_id,
      employee_ids,
      title,
      description,
      due_date,
    });

    // 🔍 Validate minimal input
    if (!project_id || !employee_ids?.length) {
      console.warn('⚠️ Missing required project_id or employee_ids');
      return res.status(400).json({ error: 'Project ID and employee IDs are required.' });
    }

    // 🧠 Fetch project details (including priority)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('title, description, start_date, end_date, priority')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      console.error('❌ Failed to fetch project:', projectError?.message || 'Not found');
      return res.status(404).json({ error: 'Project not found' });
    }

    // ⛑ Fill in missing data
    const finalTitle = title || project.title;
    const finalDescription = description || project.description || project.title;
    const finalDueDate = due_date || project.end_date;
    const finalPriority = project.priority || 'medium'; // ✅ use project priority

    // ✅ Validate employees
    const { data: validEmployees, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .in('id', employee_ids);

    if (employeeError) {
      return res.status(500).json({ error: 'Failed to validate employees.' });
    }

    const validEmployeeIds = validEmployees.map(e => e.id);

    if (validEmployeeIds.length !== employee_ids.length) {
      return res.status(400).json({ error: 'One or more employee IDs are invalid.' });
    }

    // 🛠️ Create tasks (priority from project, status 'in progress')
    const taskPayload = validEmployeeIds.map(empId => ({
      project_id,
      user_id: empId,
      manager_id: managerId,
      assigned_by: managerId,
      title: finalTitle,
      description: finalDescription,
      priority: finalPriority, // ✅ match project priority
      due_date: finalDueDate,
      status: 'in_progress', // ✅ directly in progress
    }));

    console.log('🛠️ Task Payload:', taskPayload);

    const { data: createdTasks, error: taskError } = await supabase
      .from('tasks')
      .insert(taskPayload)
      .select();

    if (taskError) {
      console.error('❌ Failed to insert tasks:', taskError.message);
      return res.status(500).json({ error: taskError.message });
    }

    console.log(`✅ ${createdTasks.length} tasks created`);

    // 📈 Create progress records
    const progressPayload = createdTasks.map(task => ({
      task_id: task.id,
      user_id: task.user_id,
      progress_percent: 0,
      status: 'in progress',
      manager_id: task.manager_id,
      comment: 'Task assigned by manager',
      progress_type: 'assignment',
    }));

    const { error: progressError } = await supabase
      .from('progress')
      .insert(progressPayload);

    if (progressError) {
      console.error('❌ Failed to insert progress records:', progressError.message);
      return res.status(500).json({ error: progressError.message });
    }

    console.log('✅ Progress records created');

    return res.json({
      message: 'Tasks assigned successfully with project priority applied.',
      tasks_created: createdTasks.length,
    });
  } catch (err) {
    console.error('❌ Unexpected error in assignTaskEmployee:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
//////////////////////delete project///////////////
// exports.deleteProject = async (req, res) => {
//   try {
//     const projectId = req.params.projectId;
//     const managerId = req.user?.id;

//     if (!projectId) {
//       return res.status(400).json({ error: 'Project ID is required.' });
//     }

//     // Verify project exists and belongs to the director
//     const { data: project, error: fetchError } = await supabase
//       .from('projects')
//       .select('*')
//       .eq('id', projectId)
//       .eq('manager_id', managerId) 
//       .single();

//     if (fetchError || !project) {
//       console.error('❌ Project not found or access denied:', fetchError?.message);
//       return res.status(404).json({ error: 'Project not found or access denied.' });
//     }

//     // Fetch all task IDs for this project
//     const { data: tasks, error: tasksFetchError } = await supabase
//       .from('tasks')
//       .select('id')
//       .eq('project_id', projectId);

//     if (tasksFetchError) {
//       console.error('❌ Error fetching tasks:', tasksFetchError.message);
//       return res.status(500).json({ error: 'Failed to fetch tasks.' });
//     }

//     const taskIds = tasks?.map(task => task.id) || [];

//     // Delete progress entries for these tasks (if any)
//     if (taskIds.length > 0) {
//       const { error: progressDeleteError } = await supabase
//         .from('progress')
//         .delete()
//         .in('task_id', taskIds);

//       if (progressDeleteError) {
//         console.error('❌ Error deleting progress entries:', progressDeleteError.message);
//         return res.status(500).json({ error: 'Failed to delete related progress entries.' });
//       }
//     }

//     // Delete tasks
//     const { error: tasksDeleteError } = await supabase
//       .from('tasks')
//       .delete()
//       .eq('project_id', projectId);

//     if (tasksDeleteError) {
//       console.error('❌ Error deleting tasks:', tasksDeleteError.message);
//       return res.status(500).json({ error: 'Failed to delete related tasks.' });
//     }

//     // Delete project
//     const { error: deleteError } = await supabase
//       .from('projects')
//       .delete()
//       .eq('id', projectId);

//     if (deleteError) {
//       console.error('❌ Project deletion error:', deleteError.message);
//       return res.status(500).json({ error: 'Failed to delete project.' });
//     }

//     return res.json({ message: '✅ Project and related data deleted successfully.' });

//   } catch (err) {
//     console.error('❌ Unexpected error deleting project:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };
