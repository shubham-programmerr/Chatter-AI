const express = require('express');
const router = express.Router();
const { register, login, googleLogin } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google (Google OAuth login)
router.post('/google', googleLogin);

module.exports = router;