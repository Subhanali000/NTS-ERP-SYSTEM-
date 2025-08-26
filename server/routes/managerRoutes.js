const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const normalizeRole = (role) => {
  const r = role.toLowerCase().replace(/\s+/g, '_');
  if (r.includes('director')) return 'director';
  if (r.includes('manager')) return 'manager'; // ✅ this covers 'talent_acquisition_manager'
  if (r === 'team_lead') return 'employee';
  if (r === 'intern') return 'intern';
  return 'employee'; // default
};

// ✅ Routes for Managers Only
// router.get('/team-performance', verifyToken, restrictTo('manager'), managerController.viewTeamPerformance);
router.post('/task', verifyToken, restrictTo('manager'), managerController.CreateTask);
router.post('/leave/approve', verifyToken, restrictTo('manager'), managerController.approveLeave);
router.post('/leave', verifyToken, restrictTo('manager'), managerController.applyLeave);
router.get('/leaves', verifyToken, restrictTo('manager'), managerController.getLeaves);
router.get('/progress-reports', verifyToken, restrictTo('manager'), managerController.getProgressreports);
// Route
router.post('/progress-reports', verifyToken, restrictTo('manager'), managerController.submitProgressReport);
// router.post('/team-details', verifyToken, restrictTo('manager'), managerController.getTeamDetails);
router.post(  '/progress-reports/:id/review',  verifyToken,restrictTo('manager'),  managerController.approvestatusProgressReport);



  
router.get('/overview/:id', verifyToken, restrictTo('manager'), managerController.getOverview);
//sidebard overview of the managers
router.post('/report/approve', verifyToken, restrictTo('manager'), managerController.approveProgressReport);
router.get('/employees', verifyToken, restrictTo('manager'), managerController.getEmployees);
router.get('/active-projects', verifyToken, restrictTo('manager'), managerController.getActiveProjects);
router.get('/team-progress', verifyToken, restrictTo('manager'), managerController.getTeamProgress);
// routes/managerRoutes.js or similar
router.delete('/tasks/:id', verifyToken, restrictTo('manager'), managerController.deleteTask);


router.post(  '/add-employee',verifyToken,  restrictTo('manager'),  upload.single('profile_photo'),managerController.addEmployee);

  


  


router.get('/users/team', verifyToken, restrictTo('manager'), managerController.getTeam);
router.post('/create-project', verifyToken, restrictTo('manager'), managerController.createProject);
router.get('/tasks', verifyToken, restrictTo('manager'), managerController.getTasks);
router.post('/update-task-progress', verifyToken, restrictTo('manager'), managerController.updateTaskProgress);
///employe assigne task by project selectiona nd selection of employee
router.post('/assigne-task-employee', verifyToken, restrictTo('manager'), managerController.assignTaskEmployee);


router.get('/progress', verifyToken, restrictTo('manager'), managerController.getProgress);///task progress only manger can get it

router.post('/approve-leaves', verifyToken, restrictTo('manager'), managerController.approveLeaves);

module.exports = router;



/// unused routes 
// router.delete('/delete-projects/:projectId', verifyToken, restrictTo('manager'), managerController.deleteProject);
  // router.get('/interns', verifyToken, restrictTo('manager'), managerController.getInterns);
