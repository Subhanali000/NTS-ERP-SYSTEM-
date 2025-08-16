const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware'); // ✅ FIXED

// Routes
const { signupDirector, login, getCurrentUser, getAllUsers } = require('../controllers/authController');

router.post('/signup/directors', signupDirector);
router.post('/auth/login', login);
router.get('/auth/user', verifyToken, getCurrentUser);
router.get('/users', verifyToken, getAllUsers);



module.exports = router;
