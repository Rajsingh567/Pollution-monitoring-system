// ============================================================
// backend/server.js
// Main Express server entry point
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors());                            // Allow cross-origin requests
app.use(express.json());                    // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '../public')));

// ── ROUTES ──────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const pollutionRoutes = require('./routes/pollutionRoutes');

app.use('/api/auth', authRoutes);           // Authentication routes
app.use('/api/pollution', pollutionRoutes); // Pollution data routes

// ── SERVE FRONTEND PAGES ─────────────────────────────────────
// Root → login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: '🌍 Pollution Monitor API is running!', timestamp: new Date() });
});

// ── 404 HANDLER ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🔑 Login: http://localhost:${PORT}/login.html`);
    console.log(`🌍 API Health: http://localhost:${PORT}/api/health\n`);
});
