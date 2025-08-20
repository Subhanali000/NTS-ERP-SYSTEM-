const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer(); // In-memory storage for attachments

// 🛡️ Auth middlewares
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.restrictTo('employee', 'intern'));

// 📌 Routes
router.post('/attendance', employeeController.submitAttendance);
router.put('/attendance/:date', employeeController.updateAttendance);
router.post('/leave', employeeController.applyLeave);
router.post('/task-progress', employeeController.submitTaskProgress);
router.post('/progress-report', employeeController.submitProgressReport);
router.post('/update-task-progress', employeeController.updateTaskProgress);
router.get('/profile', employeeController.getProfile);
router.post('/daily-progress', upload.array('attachments'), employeeController.submitDailyProgress);
router.get('/daily-progress', employeeController.getdailyProgress);
router.get('/attendance', employeeController.getAttendance);
router.get('/leaves', employeeController.getLeaves);
router.get('/tasks', employeeController.getTasks);
router.get('/progress-report', employeeController.getProgressreport);
router.get('/progress', employeeController.getProgress);
router.get('/overview', employeeController.getOverview);
module.exports = router;
