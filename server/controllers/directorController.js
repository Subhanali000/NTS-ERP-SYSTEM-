const { supabase } = require('../config/supabase');




const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const path = require('path');

exports.addEmployee = [
  upload.single('profile_photo'),
  async (req, res) => {
    try {
      const {
        email, name, phone, address, emergency_contact_name, emergency_contact_phone,
        employee_id, position, role, department, manager_id, join_date, annual_salary,
        leave_balance, college, internship_start_date, internship_end_date,
        bio, github_profile_link, linkedin_profile_link, dob
      } = req.body;

      let profile_photo = null;

      // 🔹 Upload to Supabase storage bucket
      if (req.file) {
        const fileExt = path.extname(req.file.originalname);
        const fileName = `profile_photos/${Date.now()}_${employee_id}${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('employee-media')
          .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

        if (uploadError) {
          console.error('❌ File upload error:', uploadError);
          return res.status(500).json({ error: 'Profile photo upload failed', details: uploadError.message });
        }

        const { data: publicUrlData } = supabase
          .storage
          .from('employee-media')
          .getPublicUrl(fileName);

        profile_photo = publicUrlData.publicUrl;
      }

      const employeeRoles = ['employee','intern','team_lead'];
      const managerRoles = [
        'talent_acquisition_manager','project_tech_manager','quality_assurance_manager',
        'software_development_manager','systems_integration_manager','client_relations_manager'
      ];

      // Validate required fields
      const requiredFields = { email, name, role, department, join_date, position };
      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) return res.status(400).json({ error: `${key} is required` });
      }

      const validRoles = [...employeeRoles, ...managerRoles];
      if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

      const defaultLeaveBalance = 20;

      // Generate password
      let generatedPassword = 'temppass';
      if (name && dob) {
        const firstFour = name.trim().substring(0, 4).toLowerCase();
        const dobFormatted = new Date(dob).toISOString().split('T')[0].replace(/-/g,'');
        generatedPassword = firstFour + dobFormatted;
      }

      let dataToInsert = {
        email,
        password: generatedPassword,
        name,
        phone,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        position,
        role,
        department,
        join_date,
        dob: dob || null,
        profile_photo, // ✅ store the public URL
        bio: bio || null,
        github_profile_link: github_profile_link || null,
        linkedin_profile_link: linkedin_profile_link || null,
        annual_salary,
        leave_balance: leave_balance != null ? leave_balance : defaultLeaveBalance
      };

      let tableName = '';

      if (employeeRoles.includes(role)) {
        dataToInsert.employee_id = employee_id;
        dataToInsert.manager_id = manager_id || null;
        dataToInsert.director_id = req.user.id;
        if (role === 'intern') {
          dataToInsert.college = college || null;
          dataToInsert.internship_start_date = internship_start_date || null;
          dataToInsert.internship_end_date = internship_end_date || null;
        }
        tableName = 'employees';
      } else if (managerRoles.includes(role)) {
        dataToInsert.manager_id = employee_id;
        dataToInsert.director_id = req.user.id;
        tableName = 'managers';
      }

      // Insert into table
      const { data, error } = await supabase
        .from(tableName)
        .insert([dataToInsert])
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });

      // Log action
      await supabase.from('employee_logs').insert([{
        action: 'ADD_EMPLOYEE',
        performed_by: req.user.id,
        target_employee_id: data.id,
        details: JSON.stringify(dataToInsert),
        created_at: new Date().toISOString()
      }]);

      // Send notifications
      try {
        let notificationData = {
          type: 'welcome',
          message: `Your account has been created. Your temporary password is ${generatedPassword}. Please update your profile.`,
          created_by: req.user.id,
          source_id: req.user.id,
          created_at: new Date().toISOString()
        };

        if (employeeRoles.includes(role)) {
          notificationData.employee_id = data.id;
          notificationData.employee_action = 'unread';
        } else if (managerRoles.includes(role)) {
          notificationData.manager_id = data.id;
          notificationData.manager_action = 'unread';
        } else {
          notificationData.director_id = data.id;
          notificationData.director_action = 'unread';
        }

        await supabase.from('notifications').insert([notificationData]);
      } catch (notifErr) {
        console.error('💥 Notification insertion failed:', notifErr);
      }

      res.status(201).json({ message: `${role} registered successfully`, employee: data });

    } catch (err) {
      console.error('❌ Error adding employee:', err);
      res.status(500).json({ error: 'Failed to add employee' });
    }
  }
];








exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      priority,         // ✅ Will log and store priority
      manager_id,       // Primary manager
      assigned_managers // Array of additional managers
    } = req.body;

    // 1. Validate required fields
    if (!title || !start_date || !manager_id || !priority) {
      return res.status(400).json({
        error: 'Title, start date, project manager, and priority are required.',
      });
    }

    // 2. Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        title,
        description,
        start_date,
        end_date,
        manager_id,
        director_id: req.user.id,
        status: 'approved',
        priority // ✅ Taken from frontend
      }])
      .select()
      .single();

    if (projectError) {
      console.error('❌ Project creation failed:', projectError.message);
      return res.status(500).json({ error: projectError.message });
    }

    // 3. Handle project assignees
    let allManagers = [manager_id];

    if (Array.isArray(assigned_managers) && assigned_managers.length > 0) {
      const assignments = assigned_managers.map(mid => ({
        project_id: project.id,
        manager_id: mid,
      }));

      const { error: assignError } = await supabase
        .from('project_assignees')
        .insert(assignments);

      if (assignError) {
        console.error('❌ Assignment insert failed:', assignError.message);
        return res.status(500).json({ error: assignError.message });
      }

      allManagers = [...new Set([...allManagers, ...assigned_managers])];
    }

    // 4. Validate that all managers exist
    const { data: validManagers, error: managerCheckError } = await supabase
      .from('managers')
      .select('id, name')
      .in('id', allManagers);

    if (managerCheckError) {
      console.error('❌ Manager validation failed:', managerCheckError.message);
      return res.status(500).json({ error: managerCheckError.message });
    }

    const validManagerIds = validManagers.map(m => m.id);
    if (validManagerIds.length !== allManagers.length) {
      const invalidIds = allManagers.filter(mid => !validManagerIds.includes(mid));
      return res.status(400).json({
        error: `Some assigned manager IDs are invalid: ${invalidIds.join(', ')}`,
      });
    }

    // 5. Create tasks for each manager (use project priority)
    const taskInserts = validManagerIds.map(mid => ({
      project_id: project.id,
      manager_id: mid,
      title: title,
      description: description || title,
      priority: priority, // ✅ Taken from frontend
      status: 'assigned',
      due_date: project.end_date,
      created_by_director: req.user.id,
    }));

    const { data: insertedTasks, error: taskError } = await supabase
      .from('tasks')
      .insert(taskInserts)
      .select();

    if (taskError) {
      console.error('❌ Task creation failed:', taskError.message);
      return res.status(500).json({ error: taskError.message });
    }

    // 6. Create progress entries
    const progressInserts = insertedTasks.map(task => ({
      task_id: task.id,
      user_id: null,
      manager_id: task.manager_id,
      progress_percent: 0,
      status: 'in progress',
    }));

    const { error: progressError } = await supabase
      .from('progress')
      .insert(progressInserts);

    if (progressError) {
      console.error('❌ Progress creation failed:', progressError.message);
      return res.status(500).json({ error: progressError.message });
    }

    // 7. 🔔 Create notifications for all managers
    const notificationPayloads = validManagerIds.map(mid => ({
      type: "project_assigned",
      source_id: project.id,
      message: `📢 New project "${title}" has been assigned to you.`,
      created_by: req.user.id,    // director who created
      manager_id: mid,            // manager who receives it
      manager_action: "unread",
      created_at: new Date().toISOString(),
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notificationPayloads);

    if (notifError) {
      console.error("❌ Notification creation failed:", notifError.message);
      // Don’t block response — project is already created
    } else {
      console.log(`✅ Notifications created for ${validManagerIds.length} managers`);
    }

    // ✅ Final response
    res.json({
      message: 'Project, tasks, progress, and notifications created successfully.',
      project,
      tasks_created: insertedTasks.length,
      assigned_managers: validManagerIds.length,
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};




exports.assignEmployee = async (req, res) => {


  const { employee_id, project_id } = req.body;

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, director_id, role')
    .eq('id', employee_id)
    .single();
  if (employeeError || !employee || employee.director_id !== req.user.id || !['employee', 'intern', 'senior_employee', 'team_lead'].includes(employee.role)) {
    return res.status(400).json({ error: 'Invalid employee ID or employee not under this director' });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('director_id')
    .eq('id', project_id)
    .single();
  if (projectError || !project || project.director_id !== req.user.id) {
    return res.status(400).json({ error: 'Invalid project ID or project not managed by this director' });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ project_id, user_id: employee_id, title: `Assigned to ${employee.name}`, description: 'Automatic assignment by director' }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Employee assigned to project successfully', task: data });
};

exports.approveLeave = async (req, res) => {
  try {
    const { id } = req.params; // leave ID
    const { approvalStatus, comments } = req.body;
    const directorId = req.user.id;
    const role = req.user.role?.toLowerCase();

    if (role !== 'director') {
      return res.status(403).json({ error: 'Only directors can approve leaves' });
    }

    // 1️⃣ Get the leave record with all required fields
    const { data: leave, error: leaveError } = await supabase
      .from('leaves')
      .select('id, user_id, employee_id, manager_id, leave_type, start_date, end_date')
      .eq('id', id)
      .single();

    if (leaveError || !leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // 2️⃣ Check if the requester is a manager
    const { data: managerRecord } = await supabase
      .from('managers')
      .select('id, director_id')
      .eq('id', leave.user_id)
      .maybeSingle();

    let allowed = false;

    if (managerRecord) {
      allowed = managerRecord.director_id === directorId;
    } else {
      const { data: empRecord } = await supabase
        .from('employees')
        .select('manager_id')
        .eq('id', leave.user_id)
        .single();

      if (empRecord?.manager_id) {
        const { data: empManager } = await supabase
          .from('managers')
          .select('director_id')
          .eq('id', empRecord.manager_id)
          .single();

        allowed = empManager?.director_id === directorId;
      }
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // 3️⃣ Update approval
    const { data: updatedLeave, error: updateError } = await supabase
      .from('leaves')
      .update({
        director_approval: approvalStatus,
        status: approvalStatus,
        comments: comments || null
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4️⃣ Send notification to the requester
    const statusText = approvalStatus.toLowerCase() === 'approved' ? 'approved ✅' : 'rejected ❌';

    // Determine who gets the notification
    const notificationPayload = managerRecord
      ? {
          manager_id: leave.user_id, // manager sees their leave
          type: 'leave_approval',
          message: `Your ${leave.leave_type} leave request from ${leave.start_date} to ${leave.end_date} has been ${statusText} by the director.`,
        }
      : {
          employee_id: leave.user_id, // employee sees their leave
          type: 'leave_approval',
          message: `Your ${leave.leave_type} leave request from ${leave.start_date} to ${leave.end_date} has been ${statusText} by the director.`,
        };

    // ❌ Remove director_id, only store created_by
    await supabase.from('notifications').insert([
      {
        ...notificationPayload,
        source_id: updatedLeave.id,
        created_by: directorId, // store the director here
        created_at: new Date().toISOString(),
      }
    ]);

    return res.json({
      message: `Leave ${approvalStatus} successfully`,
      leave: updatedLeave
    });

  } catch (err) {
    console.error('❌ approveLeave error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};




exports.viewDivisionData = async (req, res) => {


  const { data, error } = await supabase
    .from('employees')
    .select('id, email, name, role, department, employee_id')
    .eq('director_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Fetch all employees with their manager IDs and profile photo
exports.getTotalEmployees = async (req, res) => {
  try {
    const { data: employees, error } = await supabase
      .from('employees')          
      .select('id, name, role, department, manager_id, profile_photo') // use actual column name
      .eq('director_id', req.user.id); 

    if (error) throw error;

    res.json(employees);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};


// controllers/projectsController.js


exports.getActiveProjects = async (req, res) => {
  try {
    const directorId = req.user.id;

    // Step 1: Get all projects for this director (exclude pending/on_hold)
    const excludedStatus = new Set(['pending_approval', 'on_hold']);
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, description, start_date, end_date, status, priority, manager_id, created_at')
      .eq('director_id', directorId);

    if (projectsError) {
      return res.status(400).json({ error: projectsError.message });
    }

    // Filter out excluded projects
    const activeProjects = projects.filter(p => !excludedStatus.has(p.status));
    const activeProjectIds = activeProjects.map(p => p.id);

    if (activeProjects.length === 0) {
      return res.json({ projects: [] });
    }

    // Step 2: Get tasks for these projects
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, project_id, manager_id')
      .in('project_id', activeProjectIds);

    if (tasksError) {
      return res.status(400).json({ error: tasksError.message });
    }

    if (!tasks || tasks.length === 0) {
      return res.json({ projects: [] });
    }

    // Step 3: Map project progress
    const taskIds = tasks.map(t => t.id);
    const { data: progressEntries, error: progressError } = await supabase
      .from('progress')
      .select('task_id, progress_percent')
      .in('task_id', taskIds);

    if (progressError) {
      return res.status(400).json({ error: progressError.message });
    }

    const taskIdToProjectId = {};
    tasks.forEach(t => { taskIdToProjectId[t.id] = t.project_id });

    const projectProgressAcc = {};
    activeProjectIds.forEach(pid => { projectProgressAcc[pid] = { total: 0, sum: 0 } });

    for (const entry of progressEntries) {
      const pid = taskIdToProjectId[entry.task_id];
      if (!pid) continue;
      projectProgressAcc[pid].total++;
      projectProgressAcc[pid].sum += entry.progress_percent;
    }

    const projectProgressPercent = {};
    activeProjectIds.forEach(pid => {
      const { total, sum } = projectProgressAcc[pid];
      projectProgressPercent[pid] = total > 0 ? Math.round(sum / total) : 0;
    });

    // Step 4: Count managers (just from tasks)
    const managerCounts = {};
    for (const task of tasks) {
      const pid = task.project_id;
      if (!managerCounts[pid]) managerCounts[pid] = new Set();
      if (task.manager_id) managerCounts[pid].add(task.manager_id);
    }

    // Step 5: Build response (only projects that really have tasks)
    const validProjectIds = new Set(tasks.map(t => t.project_id));

    const enriched = activeProjects
      .filter(p => validProjectIds.has(p.id)) // ✅ only projects with tasks
      .map(p => ({
        ...p,
        progress: projectProgressPercent[p.id] ?? 0,
        assigned_manager_count: managerCounts[p.id]?.size || 0,
        is_active: true
      }));

    res.json({ active_projects: enriched });

  } catch (err) {
    console.error('❌ Error fetching active projects:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};




exports.getDepartments = async (req, res) => {


  const { data, error } = await supabase
    .from('employees')
    .select('department')
    .eq('director_id', req.user.id)
    .distinct();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ departments: data.map(row => row.department) });
};

exports.getAvgPerformance = async (req, res) => {


  const { data, error } = await supabase
    .from('tasks')
    .select('progress')
    .eq('user_id', supabase.from('employees').select('id').eq('director_id', req.user.id));

  if (error) return res.status(400).json({ error: error.message });

  const totalProgress = data.reduce((sum, task) => sum + task.progress, 0);
  const avgPerformance = data.length > 0 ? totalProgress / data.length : 0;
  res.json({ avg_performance: avgPerformance });
};

exports.getAllEmployees = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        email,
        name,
        role,
        profile_photo,
        department,
        employee_id,
        manager_id,
        manager:managers(id, name)   -- join managers table
      `)
      .eq('director_id', req.user.id)
      .in('role', ['employee', 'senior_employee', 'team_lead']);

    if (error) return res.status(400).json({ error: error.message });

    // Flatten response so you get manager_name directly
    const formatted = data.map(emp => ({
      ...emp,
      manager_name: emp.manager?.name || 'N/A',
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};


exports.getAllInterns = async (req, res) => {


  const { data, error } = await supabase
    .from('employees')
    .select('id, email, name, role, department, employee_id')
    .eq('director_id', req.user.id)
    .eq('role', 'intern');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

exports.getAllManagers = async (req, res) => {
  try {
    console.log('User role in getAllManagers:', req.user?.role);

    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({ error: 'Authentication required or invalid user data' });
    }

    const isDirector = [
      'global_hr_director',
      'director',
      'global_operations_director',
      'engineering_director',
      'director_tech_team',
      'director_business_development'
    ].includes(req.user.role);

    if (!isDirector) {
      return res.status(403).json({ error: 'Only directors can view managers' });
    }

    const managerRoles = [
      'talent_acquisition_manager',
      'project_tech_manager',
      'quality_assurance_manager',
      'software_development_manager',
      'systems_integration_manager',
      'client_relations_manager'
    ];

    const { data, error } = await supabase
      .from('managers') // ✅ Correct table
      .select('id, name, role, department, profile_photo') // Include any required fields
      .eq('director_id', req.user.id) // ✅ Correct filtering by assigned director
      .in('role', managerRoles)
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error in getAllManagers:', error.message);
      throw new Error('Failed to fetch managers from database');
    }

    if (!data || data.length === 0) {
      console.log('No managers found for director:', req.user.id);
      return res.status(200).json([]); // ✅ Return empty array gracefully
    }

    res.status(200).json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in getAllManagers:', errorMessage);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.deleteUser = async (req, res) => {


  const { user_id } = req.params;
  const { data: user, error: userError } = await supabase
    .from('employees')
    .select('director_id')
    .eq('id', user_id)
    .single();

  if (userError || !user || user.director_id !== req.user.id) {
    return res.status(403).json({ error: 'User not found or not under your division' });
  }

  const { data: director, error: directorError } = await supabase
    .from('directors')
    .select('total_employees, total_managers, employee_ids')
    .eq('id', req.user.id)
    .single();
  if (directorError || !director) return res.status(400).json({ error: 'Director not found' });

  const newEmployeeIds = director.employee_ids.filter(id => id !== user_id);
  const newTotalEmployees = director.total_employees - 1;
  const newTotalManagers = director.total_managers - (['manager', 'talent_acquisition_manager', 'project_tech_manager', 'quality_assurance_manager', 'software_development_manager', 'systems_integration_manager', 'client_relations_manager'].includes(user.role) ? 1 : 0);

  await supabase
    .from('directors')
    .update({ total_employees: newTotalEmployees, total_managers: newTotalManagers, employee_ids: newEmployeeIds })
    .eq('id', req.user.id);

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', user_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'User deleted successfully' });
};

exports.updateUser = async (req, res) => {


  const { user_id } = req.params;
  const {
    email, name, phone, address, emergency_contact_name, emergency_contact_phone,
    employee_id, position, role, department, manager_id, join_date, annual_salary,
    leave_balance, college, internship_start_date, internship_end_date, manager_title
  } = req.body;

  const { data: user, error: userError } = await supabase
    .from('employees')
    .select('director_id, role')
    .eq('id', user_id)
    .single();

  if (userError || !user || user.director_id !== req.user.id) {
    return res.status(403).json({ error: 'User not found or not under your division' });
  }

  const updateData = { email, name, phone, address, emergency_contact_name, emergency_contact_phone, employee_id, position, role, department, join_date, annual_salary, leave_balance };
  if (['employee', 'senior_employee', 'team_lead'].includes(role) && manager_id) {
    updateData.manager_id = manager_id;
  }
  if (role === 'intern') {
    updateData.college = college;
    updateData.internship_start_date = internship_start_date;
    updateData.internship_end_date = internship_end_date;
    updateData.manager_id = manager_id;
  }
  if (role.includes('manager')) {
    updateData.manager_title = manager_title;
    updateData.manager_id = null;
  }

  const { error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', user_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'User updated successfully' });
};

exports.generateDocument = async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ error: 'Only directors can generate documents' });

  const { user_id, type, content } = req.body;
  if (!['offer_letter', 'experience_certificate', 'lor', 'internship_certificate'].includes(type)) {
    return res.status(400).json({ error: 'Invalid document type' });
  }

  const { data: user, error: userError } = await supabase
    .from('employees')
    .select('director_id')
    .eq('id', user_id)
    .single();

  if (userError || user.director_id !== req.user.id) return res.status(403).json({ error: 'Invalid user or permission' });

  const { data, error } = await supabase
    .from('documents')
    .insert([{ user_id, director_id: req.user.id, type, content }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Document generated', document: data });
};

exports.getTeamProgress = async (req, res) => {


  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', supabase.from('employees').select('id').eq('director_id', req.user.id));

  if (error) return res.status(400).json({ error: error.message });

  res.status(200).json(data);
};
// exports.getAllTasks = async (req, res) => {
//   try {
//     const directorId = req.user?.id;
//     if (!directorId) {
//       return res.status(400).json({ error: "Director ID is required" });
//     }

//     // 1️⃣ Get all employees under this director
//     const { data: employees, error: employeeError } = await supabase
//       .from('employees')
//       .select('*')
//       .eq('director_id', directorId);

//     if (employeeError) {
//       console.error('❌ Error fetching employees:', employeeError.message);
//       return res.status(500).json({ error: "Failed to fetch employees" });
//     }

//     // 2️⃣ Get all managers under this director
//     const { data: managers, error: managerError } = await supabase
//       .from('managers')
//       .select('*')
//       .eq('director_id', directorId);

//     if (managerError) {
//       console.error('❌ Error fetching managers:', managerError.message);
//       return res.status(500).json({ error: "Failed to fetch managers" });
//     }

//     const employeeIds = employees.map(emp => emp.id);
// const managerIds = managers.map(m => m.id);

// let tasks = [];

// if (employeeIds.length || managerIds.length) {
//   let filterConditions = [];
//   if (employeeIds.length) filterConditions.push(`user_id.in.(${employeeIds.join(',')})`);
//   if (managerIds.length) filterConditions.push(`manager_id.in.(${managerIds.join(',')})`);

//   const { data: allTasks, error: taskError } = await supabase
//     .from('tasks')
//     .select('*')
//     .or(filterConditions.join(','));

//   if (taskError) {
//     console.error('❌ Error fetching tasks:', taskError.message);
//     return res.status(500).json({ error: "Failed to fetch tasks" });
//   }

//   // Remove duplicates
//   tasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values());
//   console.log('📌 Fetched Tasks:', tasks);
// }


//     // 4️⃣ Get latest progress
//     const { data: progresses, error: progressError } = await supabase
//       .from('progress')
//       .select('task_id, progress_percent, created_at')
//       .order('created_at', { ascending: false });

//     if (progressError) {
//       console.error('❌ Error fetching progress:', progressError.message);
//       return res.status(500).json({ error: "Failed to fetch progress" });
//     }

//     const latestProgressMap = new Map();
//     for (const row of progresses) {
//       if (!latestProgressMap.has(row.task_id)) {
//         latestProgressMap.set(row.task_id, row.progress_percent);
//       }
//     }

//     const enrichedTasks = tasks.map(task => ({
//       ...task,
//       progress_percent: latestProgressMap.get(task.id) ?? 0,
//     }));

//     console.log(`📊 Director ${directorId} fetched total ${enrichedTasks.length} tasks`);

//     res.json({ employees, managers, tasks: enrichedTasks });

//   } catch (err) {
//     console.error('❌ Server error:', err.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

exports.getAllTasks = async (req, res) => {
  try {
    const directorId = req.user?.id;
    if (!directorId) {
      return res.status(400).json({ error: "Director ID is required" });
    }

    // 1️⃣ Get all employees under this director
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('director_id', directorId);

    if (employeeError) {
      console.error('❌ Error fetching employees:', employeeError.message);
      return res.status(500).json({ error: "Failed to fetch employees" });
    }

    // 2️⃣ Get all managers under this director
    const { data: managers, error: managerError } = await supabase
      .from('managers')
      .select('*')
      .eq('director_id', directorId);

    if (managerError) {
      console.error('❌ Error fetching managers:', managerError.message);
      return res.status(500).json({ error: "Failed to fetch managers" });
    }

    const employeeIds = employees.map(emp => emp.id);
    const managerIds = managers.map(m => m.id);

    // 3️⃣ Fetch all tasks assigned to employees or managers
    let allTasks = [];

    if (employeeIds.length || managerIds.length) {
      const filterConditions = [];
      if (employeeIds.length) filterConditions.push(`user_id.in.(${employeeIds.join(',')})`);
      if (managerIds.length) filterConditions.push(`manager_id.in.(${managerIds.join(',')})`);

      const { data: tasksData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .or(filterConditions.join(','));

      if (taskError) {
        console.error('❌ Error fetching tasks:', taskError.message);
        return res.status(500).json({ error: "Failed to fetch tasks" });
      }

      // Remove duplicates if any
      allTasks = Array.from(new Map(tasksData.map(t => [t.id, t])).values());
    }

    // 4️⃣ Get latest progress for tasks
    const { data: progresses, error: progressError } = await supabase
      .from('progress')
      .select('task_id, progress_percent, created_at')
      .order('created_at', { ascending: false });

    if (progressError) {
      console.error('❌ Error fetching progress:', progressError.message);
      return res.status(500).json({ error: "Failed to fetch progress" });
    }

    const latestProgressMap = new Map();
    for (const row of progresses) {
      if (!latestProgressMap.has(row.task_id)) {
        latestProgressMap.set(row.task_id, row.progress_percent);
      }
    }

    // 5️⃣ Enrich tasks with latest progress
    const enrichedTasks = allTasks.map(task => ({
      ...task,
      progress_percent: latestProgressMap.get(task.id) ?? 0,
    }));

    console.log(`📊 Director ${directorId} fetched total ${enrichedTasks.length} tasks`);

    res.json({ employees, managers, tasks: enrichedTasks });

  } catch (err) {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


// controllers/progressReports.js
exports.getProgressReports = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const requestedRole = req.params.role;

  try {
    let employeeIds = [];
    let managerIds = [];

    if (userRole === 'employee') {
      employeeIds = [userId];
    } else if (userRole === 'manager') {
      // Managers get their employees + own report
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id')
        .eq('manager_id', userId);
      if (error) throw error;

      employeeIds = employees.map(e => e.id);
      managerIds = [userId]; // include self
    } else if (userRole === 'director') {
      // Directors get all managers + employees under them + own report
      const { data: managers, error: mgrError } = await supabase
        .from('managers')
        .select('id')
        .eq('director_id', userId);
      if (mgrError) throw mgrError;

      managerIds = managers.map(m => m.id);

      if (managerIds.length > 0) {
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('id')
          .in('manager_id', managerIds);
        if (empError) throw empError;

        employeeIds = employees.map(e => e.id);
      }

      managerIds.push(userId); // include director's own report
    } else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    const allUserIds = [...employeeIds, ...managerIds];

    if (allUserIds.length === 0) return res.status(200).json([]);

    // Fetch reports
    const { data: reports, error: reportError } = await supabase
      .from('progress_reports')
      .select('*')
      .in('user_id', allUserIds);

    if (reportError) {
      console.error('Error fetching reports:', reportError.message);
      return res.status(400).json({ error: reportError.message });
    }

    // Enrich reports
    const enrichedReports = await Promise.all(
      reports.map(async report => {
        let taskIds = [];

        try {
          if (Array.isArray(report.task_completed)) {
            taskIds = report.task_completed;
          } else if (typeof report.task_completed === 'string') {
            taskIds = JSON.parse(report.task_completed);
          }
        } catch (e) {
          console.warn(`[ProgressReports] Invalid task_completed JSON in report ${report.id}:`, e.message);
        }

        let taskDetails = [];
        if (taskIds.length > 0) {
          const { data: tasks, error: taskError } = await supabase
            .from('tasks')
            .select('id, title')
            .in('id', taskIds);

          if (!taskError && Array.isArray(tasks)) {
            const taskMap = new Map(tasks.map(t => [t.id, t.title || 'Untitled Task']));
            taskDetails = taskIds.map(id =>
              taskMap.has(id) ? { id, title: taskMap.get(id) } : { id, title: 'Unknown Task' }
            );
          }
        }

        return {
          ...report,
          tasks: taskDetails,                  // always array
          taskCount: taskDetails.length,
          submittedAt: report.submitted_at || report.created_at || null,
          date: report.submitted_at || report.created_at || null,
        };
      })
    );

    return res.status(200).json(enrichedReports);
  } catch (err) {
    console.error('Internal Error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.approvedProgressReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { feedback, status } = req.body;
    const user = req.user;

    if (!user || !user.id || user.role !== "director") {
      return res.status(403).json({ error: "Only directors can approve/reject reports." });
    }

    if (!reportId || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Valid report ID and status are required." });
    }

    // Fetch the progress report
    const { data: report, error: fetchError } = await supabase
      .from("progress_reports")
      .select("id, user_id, role, approved_at")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return res.status(404).json({ error: "Progress report not found." });
    }

    // Prevent self-approval
    if (report.user_id === user.id) {
      return res.status(403).json({ error: "You cannot review your own report." });
    }

    // Prevent re-review
    if (report.approved_at) {
      return res.status(400).json({ error: "This report has already been reviewed." });
    }

    // Update report
    const { error: updateError } = await supabase
      .from("progress_reports")
      .update({
        status,
        approved_by: user.id,
        approved_by_role: "director",
        approved_at: new Date().toISOString(),
        manager_feedback: feedback || null,
      })
      .eq("id", reportId);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Determine status icon
    const statusIcon = status === "approved" ? "✅" : "❌";

    // Prepare notification message with icon
    const notificationMessage = `${statusIcon} Your progress report has been ${status}${feedback ? `. Feedback: ${feedback}` : ""}.`;

    const notificationPayload = {
      type: "progress_report_review",
      source_id: report.id,
      message: notificationMessage,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    // Determine whether report belongs to employee or manager
    const { data: empCheck } = await supabase
      .from("employees")
      .select("id")
      .eq("id", report.user_id)
      .single();

    if (empCheck) {
      notificationPayload.employee_id = report.user_id;
      notificationPayload.employee_action = "unread";
    } else {
      const { data: mgrCheck } = await supabase
        .from("managers")
        .select("id")
        .eq("id", report.user_id)
        .single();

      if (mgrCheck) {
        notificationPayload.manager_id = report.user_id;
        notificationPayload.manager_action = "unread";
      }
    }

    // Insert notification
    const { error: notifError } = await supabase
      .from("notifications")
      .insert([notificationPayload]);

    if (notifError) {
      console.error("❌ Failed to create notification:", notifError.message);
    }

    return res.status(200).json({ message: `Report ${status} successfully.` });
  } catch (err) {
    console.error("❗ Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};


exports.getAttendance = async (req, res) => {


  const { data, error } = await supabase
    .from('attendance')
    .select('*')


  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};
exports.getAllLeaves = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .select('*');

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    console.error('Error fetching leaves:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.approveProject = async (req, res) => {
  try {
    const { project_id, approval_comments, priority, status } = req.body;
    const directorId = req.user?.id;

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required." });
    }

    const allowedStatuses = ["approved", "rejected"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(", ")}` });
    }

    // Fetch project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("director_id", directorId)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ error: "Project not found or access denied." });
    }

    // Default comments
    const defaultApprovalComment = status === "approved" ? "Approved by Director" : "Rejected by Director";

    if (status === "approved" && !priority) {
      return res.status(400).json({ error: "Priority is required when approving." });
    }

    // Update project
    const updateFields = {
      approval_comments: approval_comments?.trim() || defaultApprovalComment,
      status,
    };
    if (status === "approved") {
      updateFields.priority = priority;
    }

    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateFields)
      .eq("id", project_id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // === 🟢 Notify project creator manager(s) ===
    const notifMessage =
      status === "approved" ? "Your project has been approved ✅" : "Your project has been rejected ❌";

    // Collect all managers (assigned + primary manager_id)
    const { data: assignees, error: assigneeError } = await supabase
      .from("project_assignees")
      .select("manager_id")
      .eq("project_id", project_id);

    if (assigneeError) {
      console.error("❌ Manager fetch error:", assigneeError.message);
    }

    const assignedManagerIds = [
      ...(assignees?.map(a => a.manager_id) || []),
      project.manager_id,
    ].filter(Boolean);

    const uniqueManagerIds = [...new Set(assignedManagerIds)];

  if (uniqueManagerIds.length > 0) {
  const notifPayload = uniqueManagerIds.map(managerId => ({
    type: "project",
    source_id: updatedProject.id,
    manager_id: managerId,
    message: notifMessage,
    manager_action: "unread",  // <- COMMA IS REQUIRED
    created_by: directorId      // <- must match table column
  }));

  const { error: notifError } = await supabase
    .from("notifications")
    .insert(notifPayload);

  if (notifError) {
    console.error("❌ Notification insert error:", notifError.message);
  } else {
    console.log("📢 Notifications sent to managers:", uniqueManagerIds);
  }
}

    // === If rejected, stop here (no tasks/progress needed) ===
    if (status === "rejected") {
      return res.json({
        message: "🚫 Project rejected and manager notified.",
        updated_project: updatedProject,
      });
    }

    // === If approved, continue with tasks ===
    const { error: taskUpdateError } = await supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("project_id", project_id)
      .eq("status", "pending");

    if (taskUpdateError) {
      console.error("❌ Task update error:", taskUpdateError.message);
    }

    if (project.status !== "pending_approval") {
      return res.json({
        message: "✅ Project updated, managers notified. Tasks already existed.",
        updated_project: updatedProject,
      });
    }

    // Create new tasks for managers
    const taskPayload = uniqueManagerIds.map(manager_id => ({
      project_id: project.id,
      manager_id,
      title: project.title,
      description: project.description || "",
      priority,
      status: "in_progress",
      due_date: project.end_date,
      created_by_director: directorId,
    }));

    const { data: createdTasks, error: taskError } = await supabase
      .from("tasks")
      .insert(taskPayload)
      .select();

    if (taskError) {
      return res.status(500).json({ error: taskError.message });
    }

    // Progress entries
    const progressPayload = createdTasks.map(task => ({
      task_id: task.id,
      user_id: null,
      progress_type: "update",
      status: "in progress",
      progress_percent: 0,
      comment: approval_comments?.trim() || "Task assigned after project approval",
      manager_id: task.manager_id,
    }));

    const { error: progressError } = await supabase.from("progress").insert(progressPayload);
    if (progressError) {
      return res.status(500).json({ error: progressError.message });
    }

    return res.json({
      message: "✅ Project approved, managers notified, tasks created, and progress added.",
      tasks_created: createdTasks.length,
      updated_project: updatedProject,
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

///////////////////////////project delete////////////////////
// directorController.js
exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const directorId = req.user?.id;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    // Verify project exists and belongs to the director
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('director_id', directorId)
      .single();

    if (fetchError || !project) {
      console.error('❌ Project not found or access denied:', fetchError?.message);
      return res.status(404).json({ error: 'Project not found or access denied.' });
    }

    // Fetch all task IDs for this project
    const { data: tasks, error: tasksFetchError } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId);

    if (tasksFetchError) {
      console.error('❌ Error fetching tasks:', tasksFetchError.message);
      return res.status(500).json({ error: 'Failed to fetch tasks.' });
    }

    const taskIds = tasks?.map(task => task.id) || [];

    // Delete progress entries for these tasks (if any)
    if (taskIds.length > 0) {
      const { error: progressDeleteError } = await supabase
        .from('progress')
        .delete()
        .in('task_id', taskIds);

      if (progressDeleteError) {
        console.error('❌ Error deleting progress entries:', progressDeleteError.message);
        return res.status(500).json({ error: 'Failed to delete related progress entries.' });
      }
    }

    // Delete tasks
    const { error: tasksDeleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId);

    if (tasksDeleteError) {
      console.error('❌ Error deleting tasks:', tasksDeleteError.message);
      return res.status(500).json({ error: 'Failed to delete related tasks.' });
    }

    // Delete project assignees linked to this project
    const { error: assigneesDeleteError } = await supabase
      .from('project_assignees')
      .delete()
      .eq('project_id', projectId);

    if (assigneesDeleteError) {
      console.error('❌ Error deleting project assignees:', assigneesDeleteError.message);
      return res.status(500).json({ error: 'Failed to delete related project assignees.' });
    }

    // Now delete the project itself
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      console.error('❌ Project deletion error:', deleteError.message);
      return res.status(500).json({ error: 'Failed to delete project.' });
    }

    return res.json({ message: '✅ Project and related data deleted successfully.' });

  } catch (err) {
    console.error('❌ Unexpected error deleting project:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
//////////////////////updateProjects//////////////////////////
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      priority,
      status,
      tasks,
    } = req.body;

    // Update project info first
    const { error: projectError } = await supabase
      .from('projects')
      .update({ title, description, priority, status })
      .eq('id', projectId);

    if (projectError) {
      console.error('Error updating project:', projectError);
      return res.status(500).json({ error: 'Failed to update project' });
    }

    console.log(`Project updated: ID=${projectId}, title="${title}", description="${description}", priority="${priority}", status="${status}"`);

    // Determine task status based on project status
    const taskStatusToSet = (status === 'pending_approval' || status === 'on_hold') ? 'pending' : 'in_progress';

    if (Array.isArray(tasks) && tasks.length > 0) {
      // Fetch existing tasks IDs for this project
      const { data: existingTasks, error: fetchTasksError } = await supabase
        .from('tasks')
        .select('id, title, description, priority, due_date')
        .eq('project_id', projectId);

      if (fetchTasksError) {
        console.error('Error fetching existing tasks:', fetchTasksError);
        return res.status(500).json({ error: 'Failed to fetch existing tasks' });
      }

      // Match incoming tasks with existing tasks by index or some key
      for (let i = 0; i < tasks.length; i++) {
        const incomingTask = tasks[i];

        // If incoming task does NOT have an ID, assign it from existing tasks list (by index)
        if (!incomingTask.id) {
          if (existingTasks[i]) {
            incomingTask.id = existingTasks[i].id;
          } else {
            console.warn(`No matching existing task found for incoming task at index ${i}, skipping update.`);
            continue;  // Skip if no existing task to match
          }
        }

        const { id, title, description, priority } = incomingTask;

        // Double check task belongs to this project
        const { data: existingTaskCheck, error: checkError } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('id', id)
          .single();

        if (checkError || !existingTaskCheck) {
          console.error(`Task with ID ${id} not found. Error:`, checkError);
          continue;
        }
        if (existingTaskCheck.project_id !== projectId) {
          console.warn(`Task ID ${id} does not belong to project ID ${projectId}, skipping update.`);
          continue;
        }

        // Update the task with conditional status
        const { data: updatedTask, error: taskError } = await supabase
          .from('tasks')
          .update({ title, description, priority, status: taskStatusToSet })
          .eq('id', id)
          .eq('project_id', projectId);

        if (taskError) {
          console.error(`Error updating task ID ${id}:`, taskError);
          continue;
        }
        console.log(`Task updated: ID=${id}, title="${title}", description="${description}", priority="${priority}", status="${taskStatusToSet}"`);
      }
    }

    // Fetch updated project and tasks to respond
    const { data: updatedProject, error: fetchProjectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchProjectError) {
      console.error('Error fetching updated project:', fetchProjectError);
      return res.status(500).json({ error: 'Failed to fetch updated project' });
    }

    const { data: updatedTasks, error: fetchTasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);

    if (fetchTasksError) {
      console.error('Error fetching updated tasks:', fetchTasksError);
      return res.status(500).json({ error: 'Failed to fetch updated tasks' });
    }

    return res.json({
      message: 'Project and tasks updated successfully',
      project: updatedProject,
      tasks: updatedTasks,
    });

  } catch (error) {
    console.error('Internal server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
/////////////////////fetching all leave fetching////////
exports.getLeaves = async (req, res) => {
  try {
    const directorId = req.user?.id;
    if (!directorId) {
      return res.status(400).json({ error: 'Director ID missing in token' });
    }

    // 1️⃣ Get managers for this director, include department & profile_photo
    const { data: managers, error: managersError } = await supabase
      .from('managers')
      .select('id, name, email, role, department, profile_photo')
      .eq('director_id', directorId);

    if (managersError) throw managersError;

    const managerIds = managers.map(m => m.id);

    // 2️⃣ Get employees for these managers, include department & profile_photo
    let employees = [];
    if (managerIds.length > 0) {
      const { data: empData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, email, role, manager_id, department, profile_photo')
        .in('manager_id', managerIds);

      if (employeesError) throw employeesError;
      employees = empData;
    }

    // 3️⃣ Combine all relevant user IDs
    const allRelevantUserIds = [...managerIds, ...employees.map(e => e.id)];
    if (allRelevantUserIds.length === 0) {
      return res.status(200).json([]);
    }

    // 4️⃣ Fetch leaves for all relevant users
    const { data: leaves, error: leavesError } = await supabase
      .from('leaves')
      .select('*')
      .in('user_id', allRelevantUserIds);

    if (leavesError) throw leavesError;

    // 5️⃣ Merge user info + approval logic
    const allUsers = [...managers, ...employees];
    const leavesWithUserInfo = leaves.map(leave => {
      const user = allUsers.find(u => u.id === leave.user_id) || {};

      let finalStatus = 'pending';
      if (
        leave.manager_approval?.toLowerCase() === 'rejected' ||
        leave.director_approval?.toLowerCase() === 'rejected'
      ) {
        finalStatus = 'rejected';
      } else if (
        leave.manager_approval?.toLowerCase() === 'approved' ||
        leave.director_approval?.toLowerCase() === 'approved'
      ) {
        finalStatus = 'approved';
      }

      return {
        id: leave.id,
        userId: leave.user_id,
        type: leave.leave_type || 'unknown',
        startDate: leave.start_date,
        endDate: leave.end_date,
        reason: leave.reason || 'No reason provided',
        status: finalStatus,
        directorApproval: leave.director_approval ?? 'pending',
        managerApproval: leave.manager_approval ?? 'pending',
        createdAt: leave.created_at,
        approverComments: leave.comments || null,
        requester: {
          id: user.id || null,
          name: user.name || 'Unknown',
          email: user.email || '',
          role: user.role || '',
          department: user.department || 'Unknown',
          avatar: user.profile_photo || null, // ✅ Use profile_photo here
        }
      };
    });

    return res.status(200).json(leavesWithUserInfo);

  } catch (err) {
    console.error('❌ getLeaves error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
