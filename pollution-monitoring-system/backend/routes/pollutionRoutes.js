// ============================================================
// backend/routes/pollutionRoutes.js
// Routes for pollution data management and AQI lookup
// ============================================================

const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
    getAllPollution, searchArea, fetchRealTimeAQI,
    createPollution, updatePollution, deletePollution,
    getSummary, getUsers
} = require('../controllers/pollutionController');

// ── PUBLIC (but requires login) ──────────────────────────────

// GET /api/pollution            - Get all pollution records
router.get('/', verifyToken, getAllPollution);

// GET /api/pollution/search?area=Mumbai  - Search by area name
router.get('/search', verifyToken, searchArea);

// GET /api/pollution/aqi/:city  - Fetch real-time AQI from WAQI
router.get('/aqi/:city', verifyToken, fetchRealTimeAQI);

// GET /api/pollution/summary    - Get analytics summary
router.get('/summary', verifyToken, getSummary);

// ── ADMIN ONLY ───────────────────────────────────────────────

// GET /api/pollution/users      - Get all registered users
router.get('/users', verifyToken, requireAdmin, getUsers);

// POST /api/pollution           - Create new pollution record
router.post('/', verifyToken, requireAdmin, createPollution);

// PUT /api/pollution/:id        - Update pollution record
router.put('/:id', verifyToken, requireAdmin, updatePollution);

// DELETE /api/pollution/:id     - Delete pollution record
router.delete('/:id', verifyToken, requireAdmin, deletePollution);

module.exports = router;
