// ============================================================
// backend/controllers/authController.js
// Handles user registration and login
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// ── REGISTER ─────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        // Check if email already exists
        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }

        // Hash the password (salt rounds = 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Only allow 'user' role on public registration (admin must be set in DB)
        const userRole = 'user';

        // Create the user
        const userId = await userModel.createUser(name, email, hashedPassword, userRole);

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please login.',
            userId
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// ── LOGIN ─────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        // Find user by email
        const user = await userModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Compare password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Generate JWT token (expires in 24 hours)
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

module.exports = { register, login };
