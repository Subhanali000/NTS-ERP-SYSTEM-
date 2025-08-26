// ✅ Correct import

const { supabase } = require('../config/supabase');
// controller
exports.updateAttendance = async (req, res) => {
  const { punch_out } = req.body;
  const userId = req.user.id;
  const date = req.params.date;

  const { error } = await supabase
    .from('attendance')
    .update({ punch_out })
    .match({ user_id: userId, date });

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ message: 'Attendance updated successfully' });
};


// ✅ Submit Attendance
exports.submitAttendance = async (req, res) => {
  const { date, punch_in, punch_out, status } = req.body;
  const userId = req.user.id;

  const { error } = await supabase.from('attendance').insert({
    user_id: userId,
    date,
    punch_in,
    punch_out,
    status,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'Attendance submitted' });
};

// ✅ Apply for Leave with single notification for manager & director
exports.applyLeave = async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  const userId = req.user.id;

  try {
    // 1️⃣ Insert leave request
    const { data: leaveData, error: leaveError } = await supabase
      .from('leaves')
      .insert({
        user_id: userId,
        leave_type,
        start_date,
        end_date,
        reason,
        manager_approval: 'pending',
        director_approval: 'pending',
      })
      .select()
      .single();

    if (leaveError) return res.status(400).json({ error: leaveError.message });

    // 2️⃣ Fetch employee details (to get manager_id and director_id)
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, manager_id, director_id')
      .eq('id', userId)
      .single();

    if (empError) return res.status(400).json({ error: empError.message });

    // 3️⃣ Create ONE notification including manager and director, store employee_id
    const notification = {
      source_id: leaveData.id,
      type: 'leave',
      message: `Leave request submitted by ${employee.name} 🗓️`,
      created_by: userId,           // who created the leave
      employee_id: userId,          // ✅ store the applicant in employee_id
      manager_id: employee.manager_id || null,
      director_id: employee.director_id || null,
      employee_action: 'unread',   // mark employee notification if needed
      manager_action: employee.manager_id ? 'unread' : null,
      director_action: employee.director_id ? 'unread' : null,
    };

    const { error: notifError } = await supabase
      .from('notifications')
      .insert([notification]);

    if (notifError) console.error('❌ Failed to create notification:', notifError.message);

    res.status(201).json({ message: 'Leave request submitted', leave: leaveData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
};




// ✅ Submit Task Progress with manager notification
exports.submitTaskProgress = async (req, res) => {
  const { task_id, progress } = req.body;
  const userId = req.user.id;

  try {
    // 1️⃣ Update task progress
    const { error: taskError, data: taskData } = await supabase
      .from('tasks')
      .update({
        progress,
        status: progress === 100 ? 'completed' : 'in_progress',
      })
      .eq('id', task_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (taskError) return res.status(400).json({ error: taskError.message });

    // 2️⃣ Fetch the employee to get manager_id
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, manager_id')
      .eq('id', userId)
      .single();

    if (empError) return res.status(400).json({ error: empError.message });

    // 3️⃣ Create notification for manager if exists
    if (employee.manager_id) {
      const notification = {
        source_id: task_id,
        type: 'task',
        message: `Task progress updated by ${employee.name} 📋`,
        created_by: userId,        // employee updated the task
        manager_id: employee.manager_id,
        manager_action: 'unread',
      };

      const { error: notifError } = await supabase
        .from('notifications')
        .insert([notification]);

      if (notifError) console.error('❌ Failed to create task notification:', notifError.message);
    }

    res.status(200).json({ message: 'Task progress updated', task: taskData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task progress' });
  }
};

exports.submitDailyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, date, comment } = req.body;
    const files = req.files;

    // Validate required fields
    if (!comment || !date) {
      return res.status(400).json({ error: 'Comment and date are required' });
    }

    let attachmentUrls = [];

    // 📦 Upload files to Supabase Storage
    if (files && files.length > 0) {
      for (const file of files) {
        const fileName = `${Date.now()}_${file.originalname}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (uploadError) {
          console.error('File upload failed:', uploadError.message);
          return res.status(500).json({ error: 'File upload failed: ' + uploadError.message });
        }

        const { data: publicData } = supabase.storage
          .from('attachments')
          .getPublicUrl(fileName);

        if (publicData?.publicUrl) {
          attachmentUrls.push(publicData.publicUrl);
        }
      }
    }

    // 📝 Insert daily progress record
    const { data: insertedData, error: insertError } = await supabase
      .from('daily_progress')
      .insert({
        user_id: userId,
        content,
        comment,
        date,
        attachments: attachmentUrls,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError.message);
      return res.status(400).json({ error: insertError.message });
    }

    // ✅ Fetch employee to get manager_id
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, manager_id')
      .eq('id', userId)
      .single();

    if (empError) console.error('Failed to fetch employee:', empError.message);

    // ✅ Create notification for manager
    if (employee?.manager_id) {
      const notification = {
        source_id: insertedData.id,
        type: 'daily_progress',
        message: `Daily progress submitted by ${employee.name} 📝`,
        created_by: userId,
        manager_id: employee.manager_id,
        manager_action: 'unread',
      };

      const { error: notifError } = await supabase
        .from('notifications')
        .insert([notification]);

      if (notifError) console.error('Failed to create notification:', notifError.message);
    }

    res.status(201).json(insertedData);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.submitProgressReport = async (req, res) => {
  try {
    const {
      report_date,
      accomplishments,
      challenges,
      tomorrow_plan,
      tasks,
      progress_percent
    } = req.body;

    const user = req.user;

    if (!accomplishments) {
      return res.status(400).json({ error: 'Accomplishments are required' });
    }

    // 1️⃣ Insert progress report
    const { data: reportData, error: insertError } = await supabase.from('progress_reports').insert([
      {
        user_id: user.id,
        role: user.role,
        report_date: report_date || new Date().toISOString().split('T')[0],
        accomplishments,
        challenges: challenges || null,
        tomorrow_plan: tomorrow_plan || null,
        task_completed: tasks ?? [],
        progress_percent: progress_percent ?? 0,
        submitted_at: new Date().toISOString()
      }
    ]).select().single();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    // 2️⃣ Fetch employee to get manager and director
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, manager_id, director_id')
      .eq('id', user.id)
      .single();

    if (empError) console.error('Failed to fetch employee:', empError.message);

    // 3️⃣ Create a single notification for manager, director & employee
if (employee) {
  const notification = {
    source_id: reportData.id,
    type: 'progress_report',
    message: `Progress report submitted by ${employee.name} 📄`,
    created_by: user.id,
    employee_id: employee.id,   // ✅ Employee who submitted
    manager_id: employee.manager_id || null,
    director_id: employee.director_id || null,
    employee_action: 'unread',  // ✅ add tracking for employee too
    manager_action: employee.manager_id ? 'unread' : null,
    director_action: employee.director_id ? 'unread' : null,
  };

  const { error: notifError } = await supabase
    .from('notifications')
    .insert([notification]);

  if (notifError) console.error('Failed to create notification:', notifError.message);
}

    res.status(201).json({ message: 'Progress submitted', report: reportData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit progress report' });
  }
};




// ✅ Get Profile
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

// ✅ Get Attendance
exports.getAttendance = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};
exports.getdailyProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('daily_progress') // ✅ corrected table name
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching progress', error: err.message });
  }
};

// ✅ Get Leaves
exports.getLeaves = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('leaves')
    .select('*')
    .eq('user_id', userId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

// // ✅ Get Tasks
// exports.getTasks = async (req, res) => {
//   const userId = req.user.id;

//   const { data: tasks, error: taskError } = await supabase
//   .from('tasks')
//   .select('*')
//   .eq('user_id', userId);

// if (taskError) return res.status(400).json({ error: taskError.message });

// // Fetch assigner (manager/director) separately
// const { data: users, error: usersError } = await supabase
//   .from('managers') // or 'managers' + 'directors' if using separate tables
//   .select('id, name, role, profile_photo');

// if (usersError) return res.status(400).json({ error: usersError.message });

// // Attach manager info to each task
// const enrichedTasks = tasks.map(task => {
//   const manager = users.find(u => u.id === task.assigned_by);
//   return {
//     ...task,
//     manager: manager || null,
//   };
// });

// res.status(200).json(enrichedTasks);

// };
// ✅ Get Tasks for Employee
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ error: "User ID not found" });

    // 1️⃣ Fetch tasks assigned to this employee
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (taskError) {
      console.error('❌ Error fetching tasks:', taskError.message);
      return res.status(400).json({ error: taskError.message });
    }

    // 2️⃣ Fetch assigners (managers/directors)
    const { data: users, error: usersError } = await supabase
      .from('managers') // include 'directors' if needed
      .select('id, name, role, profile_photo');

    if (usersError) {
      console.error('❌ Error fetching managers/directors:', usersError.message);
      return res.status(400).json({ error: usersError.message });
    }

    // 3️⃣ Attach assigner info to each task
    const enrichedTasks = tasks.map((task) => {
      const assigner = users.find((u) => u.id === task.assigned_by);
      return {
        ...task,
        assigned_by_info: assigner || null,
      };
    });

    // 4️⃣ Return enriched tasks
    res.status(200).json({ tasks: enrichedTasks });
  } catch (err) {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
// controllers/employeeController.js
exports.updateTaskProgress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { task_id, status, progress_percent, comment } = req.body;

    // 🔍 Log incoming data
    console.log('📥 Incoming Task Progress Update Request:', {
      user_id,
      task_id,
      status,
      progress_percent,
      comment
    });

    // ❗ Validate required fields
    if (!task_id || progress_percent == null || !status) {
      console.warn('⚠️ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1️⃣ Upsert progress
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .upsert(
        [
          {
            task_id,
            user_id,
            status,
            progress_percent,
            comment,
            progress_type: 'update'
          }
        ],
        { onConflict: ['task_id', 'user_id'] }
      );

    if (progressError) {
      console.error('❌ Progress upsert failed:', progressError.message);
      return res.status(500).json({ error: progressError.message });
    }

    // 2️⃣ Update task table
    const { data: taskUpdateData, error: taskError } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', task_id)
      .select('*');

    if (taskError || !taskUpdateData || taskUpdateData.length === 0) {
      console.error('❌ Task update failed:', taskError?.message);
      return res.status(500).json({ error: 'Task update failed: ' + taskError?.message });
    }

    const project_id = taskUpdateData[0].project_id;

    // 3️⃣ Conditionally update project status
    if (project_id) {
      const { data: taskStatuses, error: fetchError } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', project_id);

      if (!fetchError) {
        const statuses = taskStatuses.map(t => t.status);
        let projectStatus = 'active';
        if (statuses.every(s => s === 'completed')) projectStatus = 'completed';
        else if (statuses.every(s => s === 'assigned')) projectStatus = 'pending';

        const { error: projectError } = await supabase
          .from('projects')
          .update({ status: projectStatus })
          .eq('id', project_id);

        if (projectError) console.warn('⚠️ Project status update failed:', projectError.message);
      }
    }

    // 4️⃣ Fetch manager_id of the user
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('manager_id, name')
      .eq('id', user_id)
      .single();

    if (empError) console.error('⚠️ Could not fetch employee info:', empError.message);

    // 5️⃣ Create notification for manager
    if (employee && employee.manager_id) {
      const notification = {
        source_id: task_id,
        type: 'task_progress',
        message: `${employee.name} updated task progress 📋`,
        created_by: user_id,
        manager_id: employee.manager_id,
        manager_action: 'unread'
      };

      const { error: notifError } = await supabase
        .from('notifications')
        .insert([notification]);

      if (notifError) console.error('❌ Failed to create notification:', notifError.message);
    }

    // ✅ Final response
    console.log('✅ Progress, task, and project updated successfully');
    return res.status(200).json({
      message: '✅ Progress, task, and project status updated successfully',
      data: progressData
    });

  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getProgressreport = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let employeeIds = [];

    // 1. Role-based employee access logic
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

    if (employeeIds.length === 0) return res.status(200).json([]);

    // 2. Fetch reports
    const { data: reports, error } = await supabase
      .from('progress_reports')
      .select('*')
      .in('user_id', employeeIds);

    if (error) return res.status(400).json({ error: error.message });

    const enrichedReports = [];

    for (const report of reports) {
      let taskIds = [];

      // 3. Parse task_completed IDs
      try {
        if (Array.isArray(report.task_completed)) {
          taskIds = report.task_completed;
        } else if (typeof report.task_completed === 'string') {
          taskIds = JSON.parse(report.task_completed);
        }
      } catch (e) {
        console.warn(`Invalid task_completed JSON in report ${report.id}:`, e.message);
      }

      // 4. Fetch task details by ID
      let taskDetails = [];
      if (taskIds.length > 0) {
        const { data: tasks, error: taskError } = await supabase
          .from('tasks')
          .select('id, title')
          .in('id', taskIds);

        if (taskError) {
          console.warn(`Failed to fetch tasks for report ${report.id}:`, taskError.message);
        } else {
          const taskMap = new Map(tasks.map(t => [t.id, t.title || 'Untitled Task']));
          taskDetails = taskIds.map(id =>
            taskMap.has(id) ? { id, title: taskMap.get(id) } : { id, title: 'Unknown Task' }
          );
        }
      }

      // 5. Enrich report
      enrichedReports.push({
        ...report,
        taskCount: taskIds.length,
        tasks: taskDetails,
      });
    }

    return res.status(200).json(enrichedReports);
  } catch (err) {
    console.error('Fetch Error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
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
///////////////////overviewsidebar////////////
// controllers/employeeController.js
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    // Helper to format date as YYYY-MM-DD
    const formatDate = (d) => {
      const date = new Date(d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const today = formatDate(new Date());

    // 1️⃣ Tasks
    const { data: tasks, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId);
    if (taskError) throw taskError;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;

    // 2️⃣ All leaves (no filtering by user or approval)
    const { data: leaves, error: leaveError } = await supabase
      .from("leaves")
      .select("*"); // fetch everything
    if (leaveError) throw leaveError;

    console.log(`Fetched ${leaves.length} total leaves from DB`);

    // 3️⃣ Daily Progress Status
    const { data: progress, error: progressError } = await supabase
      .from("daily_progress")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1);
    if (progressError) throw progressError;

    let dailyProgressStatus = "No Update";
    if (progress?.length) {
      const lastDate = formatDate(progress[0].date);
      dailyProgressStatus =
        lastDate === today ? "submitted" : `Last submitted on ${lastDate}`;
    }

    // ✅ Response
    res.json({
      totalTasks,
      completedTasks,
      dailyProgressStatus,
      leaves, // send all leaves; frontend filters by user and status
    });

  } catch (err) {
    console.error("Error fetching employee overview:", err.message);
    res.status(500).json({ error: "Server error fetching overview" });
  }
};
///////////profile section
// controllers/userController.js
