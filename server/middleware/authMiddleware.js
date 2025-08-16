const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// ✅ Normalize role: Convert any complex role into a clean string
const normalizeRole = (role) => {
  const key = role.toLowerCase().replace(/\s+/g, '_');
  if (key.includes('director')) return 'director';
  if (key.includes('manager')) return 'manager';
  if (key === 'intern') return 'intern';
  return 'employee'; // fallback
};

// ✅ Middleware to verify JWT token and attach normalized user info
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret);

    const { id, role, managerId } = decoded;
    const normalizedRole = normalizeRole(role); // ✅ Normalize role from token (safe)

    
    const table = roleToTable[normalizedRole];
    if (!table) {
      return res.status(403).json({ error: 'Invalid user role' });
    }

    const { data: user, error } = await supabase
  .from(table)
  .select('id, role, manager_id')
  .eq('id', id)
  .single();

if (error) {
  console.error('Supabase error:', error);
}

if (!user) {
  console.warn(`User with id ${id} not found in ${table}`);
  return res.status(401).json({ error: 'User not found or unauthorized' });
}


    // ✅ Attach cleaned user info
    req.user = {
      id: user.id,
      role: normalizedRole,
      managerId: managerId || user.manager_id || null,
    };

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ✅ Restrict access based on one or more allowed roles
const restrictTo = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map(normalizeRole);
  return (req, res, next) => {
    if (!normalizedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

const roleToTable = {
  director: 'directors',
  manager: 'managers', // ✅ fixed
  employee: 'employees',
  intern: 'employees',
};



module.exports = {
  verifyToken,
  restrictTo,
};
