// ============================================================
// backend/models/userModel.js
// Database queries for users table
// ============================================================

const db = require('../config/db');

// Find user by email (used during login)
const findByEmail = async (email) => {
    const rows = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0]; // return first match or undefined
};

// Create new user (registration)
const createUser = async (name, email, hashedPassword, role = 'user') => {
    const result = await db.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
    );
    return result.insertId;
};

// Get all users (admin only)
const getAllUsers = async () => {
    const rows = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    return rows;
};

// Delete user by id (admin only)
const deleteUser = async (id) => {
    const result = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.changes;
};

module.exports = { findByEmail, createUser, getAllUsers, deleteUser };
