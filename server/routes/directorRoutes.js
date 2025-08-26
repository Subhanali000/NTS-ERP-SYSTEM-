const express = require('express');
const router = express.Router();
const directorController = require('../controllers/directorController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.verifyToken);
router.use(authMiddleware.restrictTo(
    'global_hr_director',
  'director',
  'global_operations_director',
  'engineering_director',
  'director_tech_team',
  'director_business_development'));
//////////////////edit buttion error ////////////in project
router.post('/add-employee', directorController.addEmployee);
router.post('/create-project', directorController.createProject);
router.post('/assign-employee', directorController.assignEmployee);
router.post('/approve-project', directorController.approveProject);
// routes/leaveRoutes.js
router.patch('/leaves/:id/director-approve', directorController.approveLeave);
router.get('/leaves', directorController.getAllLeaves)
router.get('/manager-team-leaves', directorController.getLeaves);
router.get('/division-data', directorController.viewDivisionData);
router.get('/total-employees', directorController.getTotalEmployees);
router.get('/active-projects', directorController.getActiveProjects);
router.get('/departments', directorController.getDepartments);
router.get('/avg-performance', directorController.getAvgPerformance);
router.get('/employees', directorController.getAllEmployees);
router.put('/update-project/:projectId', directorController.updateProject);
router.delete('/delete-projects/:projectId',directorController.deleteProject);
router.get('/interns', directorController.getAllInterns);
router.get('/managers', directorController.getAllManagers);
router.delete('/users/:user_id', directorController.deleteUser);
router.patch('/users/:user_id', directorController.updateUser);
router.get('/team-progress', directorController.getTeamProgress);
router.get('/tasks', directorController.getAllTasks); // New route
router.get('/progress-report', directorController.getProgressReports); // New route
router.post(
  "/approve-progress-report/:id",
  directorController.approvedProgressReport
);
router.get('/attendance', directorController.getAttendance); // New route

module.exports = router;
