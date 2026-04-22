// ============================================================
// backend/models/pollutionModel.js
// Database queries for pollution_data table
// ============================================================

const db = require('../config/db');

// Get all pollution records
const getAll = async () => {
    const rows = await db.query(
        'SELECT * FROM pollution_data ORDER BY last_updated DESC'
    );
    return rows;
};

// Get single record by area name (case-insensitive search)
const findByArea = async (areaName) => {
    const rows = await db.query(
        'SELECT * FROM pollution_data WHERE LOWER(area_name) LIKE ?',
        [`%${areaName.toLowerCase()}%`]
    );
    return rows;
};

// Get record by id
const findById = async (id) => {
    const rows = await db.query('SELECT * FROM pollution_data WHERE id = ?', [id]);
    return rows[0];
};

// Create new pollution record (admin)
const create = async (area_name, pollution_level, aqi, alert_message) => {
    const result = await db.execute(
        'INSERT INTO pollution_data (area_name, pollution_level, aqi, alert_message) VALUES (?, ?, ?, ?)',
        [area_name, pollution_level, aqi, alert_message]
    );
    return result.insertId;
};

// Update pollution record (admin)
const update = async (id, area_name, pollution_level, aqi, alert_message) => {
    const result = await db.execute(
        'UPDATE pollution_data SET area_name=?, pollution_level=?, aqi=?, alert_message=? WHERE id=?',
        [area_name, pollution_level, aqi, alert_message, id]
    );
    return result.changes;
};

// Delete pollution record (admin)
const remove = async (id) => {
    const result = await db.execute('DELETE FROM pollution_data WHERE id = ?', [id]);
    return result.changes;
};

// Get analytics summary
const getSummary = async () => {
    const rows = await db.query(`
        SELECT 
            COUNT(*) as total_areas,
            AVG(aqi) as avg_aqi,
            MAX(aqi) as max_aqi,
            MIN(aqi) as min_aqi,
            SUM(CASE WHEN pollution_level = 'Low' THEN 1 ELSE 0 END) as low_count,
            SUM(CASE WHEN pollution_level = 'Medium' THEN 1 ELSE 0 END) as medium_count,
            SUM(CASE WHEN pollution_level = 'High' THEN 1 ELSE 0 END) as high_count,
            SUM(CASE WHEN pollution_level = 'Hazardous' THEN 1 ELSE 0 END) as hazardous_count
        FROM pollution_data
    `);
    return rows[0];
};

module.exports = { getAll, findByArea, findById, create, update, remove, getSummary };
