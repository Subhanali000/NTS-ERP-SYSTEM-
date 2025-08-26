const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Import all controller methods
const { 
  signupDirector, 
  login, 
  getCurrentUser, 
  getAllUsers,
  updateSettings,
  updateSecurity,
  getSettings,
  getSecurity,
  getNotifications,
  markAsRead,
  deleteNotification
} = require('../controllers/authController');

// Auth routes
router.post('/signup/directors', signupDirector);
router.post('/auth/login', login);
router.get('/auth/user', verifyToken, getCurrentUser);

// User routes
router.get('/users', verifyToken, getAllUsers);
router.put('/user/security', verifyToken, updateSecurity);
router.put('/user/settings', verifyToken, updateSettings);
router.get('/user/security', verifyToken, getSecurity);
router.get('/user/settings', verifyToken, getSettings);

// Notifications routes
router.get('/user/notifications', verifyToken, getNotifications);
router.put('/user/notification/read', verifyToken, markAsRead);      // ✅ fixed
router.put('/user/notification/delete', verifyToken, deleteNotification); // ✅ fixed

module.exports = router;
