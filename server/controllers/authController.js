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


module.exports = {
  signupDirector,
  login,
  getCurrentUser,
  getAllUsers,
};
