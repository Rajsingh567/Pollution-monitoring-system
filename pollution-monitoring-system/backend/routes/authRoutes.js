// ============================================================
// backend/routes/authRoutes.js
// Routes for user registration and login
// ============================================================

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register - Create a new user account
router.post('/register', register);

// POST /api/auth/login - Login and get JWT token
router.post('/login', login);

module.exports = router;
