require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const managerRoutes = require('./routes/managerRoutes');
const directorRoutes = require('./routes/directorRoutes');
const { supabase } = require('./config/supabase');

const app = express();

// Logging Middleware
app.use((req, res, next) => {
  console.log(`➡️ [${req.method}] ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length) {
    console.log('🟡 Body:', JSON.stringify(req.body, null, 2));
  }

  const oldJson = res.json;
  res.json = function (data) {
    console.log(`⬅️ [${res.statusCode}] ${req.method} ${req.originalUrl}`);
    console.log('🟢 Response Body:', data);
    res.json = oldJson;
    return res.json(data);
  };

  next();
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};



app.use('/api', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/director', directorRoutes);
// Define roles at the top of your index.js (or import from a separate file)
const managerRoles = [
  'talent_acquisition_manager',
  'manager',
  'project_tech_manager',
  'quality_assurance_manager',
  'software_development_manager',
  'systems_integration_manager',
  'client_relations_manager',
];

const directorRoles = [
  'director',
  'director_hr',
  'global_hr_director',
  'global_operations_director',
  'engineering_director',
  'director_tech_team',
  'director_business_development',
];

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  const { id: userId, role: userRole } = req.user;

  const allowedFields = [
    'name',
    'email',
    'phone',
    'address',
    'bio',
    'emergency_contact_name',
    'emergency_contact_phone',
    'linkedin_profile_link',
    'github_profile_link',
    'profile_photo'
  ];

  const updates = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  let table;
  if (userRole === 'employee' || userRole === 'intern') table = 'employees';
  else if (managerRoles.includes(userRole)) table = 'managers';
  else if (directorRoles.includes(userRole)) table = 'directors';
  else return res.status(400).json({ error: 'Invalid user role' });

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', userId)
    .select();

  if (error || !data || data.length === 0) {
    return res.status(400).json({ error: error?.message || 'No row updated' });
  }

  res.json({ message: 'Profile updated successfully', data: data[0] });
});


app.get('/api/user/profile', authenticateToken, async (req, res) => {
  const { id: userId, role: userRole } = req.user;

  let table = null;
  if (['employee', 'intern', 'team_lead'].includes(userRole)) table = 'employees';
  else if (managerRoles.includes(userRole)) table = 'managers';
  else if (directorRoles.includes(userRole)) table = 'directors';

  if (!table) return res.status(400).json({ error: 'Invalid user role' });

  try {
    const { data: userData, error } = await supabase
      .from(table)
      .select('*') // fetch all columns
      .eq('id', userId)
      .single();

    if (error || !userData) return res.status(404).json({ error: 'User not found' });

    res.json(userData);
  } catch (err) {
    console.error('❌ Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


// Generate Document Route
app.post('/api/documents/generate', authenticateToken, async (req, res) => {
  const { id: userId, role: userRole } = req.user;

  let table = userRole === 'employee' ? 'employees'
            : userRole === 'manager' ? 'managers'
            : userRole === 'director' ? 'directors'
            : null;

  if (!table) return res.status(400).json({ error: 'Invalid user role' });

  const { data: userData, error } = await supabase
    .from(table)
    .select('id, name, email, role, department, join_date')
    .eq('id', userId)
    .single();

  if (error || !userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: userData });
});
// Get All Documents (without exposing URLs)
app.get('/api/documents', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch documents.' });
  }

  res.json(documents); // No download URL included
});

app.post('/api/documents/download', authenticateToken, async (req, res) => {
  const { documentId } = req.body; // ✅ Expecting from POST body
  const userId = req.user.id;

  if (!documentId) {
    return res.status(400).json({ message: 'Missing document ID.' });
  }

  try {
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error || !document) {
      return res.status(404).json({ message: 'Document not found or access denied.' });
    }

    const filePath = path.join(__dirname, 'documents', document.name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ message: 'Failed to download document.' });
  }
});



const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
