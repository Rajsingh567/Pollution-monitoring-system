// ============================================================
// backend/controllers/pollutionController.js
// Handles all pollution data CRUD + AQI API fetch
// ============================================================

const pollutionModel = require('../models/pollutionModel');
const fetch = require('node-fetch');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Helper: determine pollution level from AQI value
const getPollutionLevel = (aqi) => {
    if (aqi <= 50)  return 'Low';          // Good
    if (aqi <= 100) return 'Moderate';     // Moderate
    if (aqi <= 150) return 'Medium';       // Unhealthy for sensitive groups
    if (aqi <= 200) return 'High';         // Unhealthy
    if (aqi <= 300) return 'Very High';    // Very Unhealthy
    return 'Hazardous';                    // Hazardous
};

// Helper: get awareness tips based on AQI
const getAwarenessTips = (aqi) => {
    if (aqi <= 50) return [
        '✅ Air quality is excellent! Great day for outdoor activities.',
        '🌳 Open windows for natural ventilation.',
        '🚴 Perfect conditions for cycling or jogging.'
    ];
    if (aqi <= 100) return [
        '⚠️ Acceptable air quality for most people.',
        '👴 Sensitive groups (elderly, children) should limit outdoor time.',
        '💧 Stay hydrated when outdoors.'
    ];
    if (aqi <= 150) return [
        '🟡 Unhealthy for sensitive groups.',
        '😷 People with asthma or heart disease should wear masks.',
        '🏠 Keep windows closed during peak hours.',
        '🌿 Use indoor air purifiers if available.'
    ];
    if (aqi <= 200) return [
        '🔴 Unhealthy air! Limit outdoor exposure.',
        '😷 Wear N95 masks if you must go outside.',
        '🏃 Avoid strenuous outdoor activities.',
        '🏥 Keep emergency inhalers/medications ready.',
        '🚗 Avoid idling vehicles to reduce pollution.'
    ];
    return [
        '🚨 HAZARDOUS AIR QUALITY! Stay indoors!',
        '🚪 Keep all windows and doors sealed.',
        '😷 N95 mask is mandatory if going out.',
        '🏥 Seek medical help if experiencing breathing issues.',
        '📵 Avoid all outdoor exercise.',
        '🌬️ Run air purifiers at maximum setting.'
    ];
};

// ── GET ALL POLLUTION RECORDS ────────────────────────────────
const getAllPollution = async (req, res) => {
    try {
        const data = await pollutionModel.getAll();
        res.json({ success: true, data });
    } catch (err) {
        console.error('Get all pollution error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch pollution data.' });
    }
};

// ── SEARCH AREA (from DB) ────────────────────────────────────
const searchArea = async (req, res) => {
    try {
        const { area } = req.query;
        if (!area) return res.status(400).json({ success: false, message: 'Area name is required.' });

        const data = await pollutionModel.findByArea(area);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Search area error:', err);
        res.status(500).json({ success: false, message: 'Failed to search area.' });
    }
};

// ── FETCH REAL-TIME AQI FROM WAQI API ───────────────────────
const fetchRealTimeAQI = async (req, res) => {
    try {
        const { city } = req.params;
        const apiKey = process.env.WAQI_API_KEY || 'demo';

        // Call WAQI API
        const response = await fetch(
            `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${apiKey}`
        );
        const result = await response.json();

        if (result.status !== 'ok') {
            // Try a fallback search
            const searchRes = await fetch(
                `https://api.waqi.info/search/?token=${apiKey}&keyword=${encodeURIComponent(city)}`
            );
            const searchData = await searchRes.json();

            if (searchData.status === 'ok' && searchData.data.length > 0) {
                const station = searchData.data[0];
                const aqi = parseInt(station.aqi) || 0;
                return res.json({
                    success: true,
                    source: 'waqi_search',
                    data: {
                        city: station.station.name,
                        aqi: aqi,
                        pollution_level: getPollutionLevel(aqi),
                        tips: getAwarenessTips(aqi),
                        lat: station.station.geo[0],
                        lon: station.station.geo[1],
                        time: new Date().toISOString()
                    }
                });
            }

            return res.status(404).json({
                success: false,
                message: `No AQI data found for "${city}". Try a different city name.`
            });
        }

        const aqi = parseInt(result.data.aqi) || 0;
        const cityData = result.data;

        res.json({
            success: true,
            source: 'waqi',
            data: {
                city: cityData.city?.name || city,
                aqi: aqi,
                pollution_level: getPollutionLevel(aqi),
                tips: getAwarenessTips(aqi),
                lat: cityData.city?.geo?.[0] || null,
                lon: cityData.city?.geo?.[1] || null,
                dominentpol: cityData.dominentpol || 'pm25',
                iaqi: cityData.iaqi || {},
                time: cityData.time?.s || new Date().toISOString()
            }
        });

    } catch (err) {
        console.error('AQI fetch error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch real-time AQI data.' });
    }
};

// ── CREATE POLLUTION RECORD (Admin) ─────────────────────────
const createPollution = async (req, res) => {
    try {
        const { area_name, pollution_level, aqi, alert_message } = req.body;

        if (!area_name || !aqi) {
            return res.status(400).json({ success: false, message: 'Area name and AQI are required.' });
        }

        const level = pollution_level || getPollutionLevel(parseInt(aqi));
        const id = await pollutionModel.create(area_name, level, parseInt(aqi), alert_message || '');

        res.status(201).json({ success: true, message: 'Pollution record created.', id });
    } catch (err) {
        console.error('Create pollution error:', err);
        res.status(500).json({ success: false, message: 'Failed to create record.' });
    }
};

// ── UPDATE POLLUTION RECORD (Admin) ─────────────────────────
const updatePollution = async (req, res) => {
    try {
        const { id } = req.params;
        const { area_name, pollution_level, aqi, alert_message } = req.body;

        if (!area_name || !aqi) {
            return res.status(400).json({ success: false, message: 'Area name and AQI are required.' });
        }

        const level = pollution_level || getPollutionLevel(parseInt(aqi));
        const affected = await pollutionModel.update(id, area_name, level, parseInt(aqi), alert_message || '');

        if (!affected) return res.status(404).json({ success: false, message: 'Record not found.' });
        res.json({ success: true, message: 'Record updated successfully.' });
    } catch (err) {
        console.error('Update pollution error:', err);
        res.status(500).json({ success: false, message: 'Failed to update record.' });
    }
};

// ── DELETE POLLUTION RECORD (Admin) ─────────────────────────
const deletePollution = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await pollutionModel.remove(id);

        if (!affected) return res.status(404).json({ success: false, message: 'Record not found.' });
        res.json({ success: true, message: 'Record deleted successfully.' });
    } catch (err) {
        console.error('Delete pollution error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete record.' });
    }
};

// ── GET ANALYTICS SUMMARY ────────────────────────────────────
const getSummary = async (req, res) => {
    try {
        const summary = await pollutionModel.getSummary();
        res.json({ success: true, data: summary });
    } catch (err) {
        console.error('Summary error:', err);
        res.status(500).json({ success: false, message: 'Failed to get summary.' });
    }
};

// ── GET ALL USERS (Admin) ────────────────────────────────────
const userModel = require('../models/userModel');
const getUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
};

module.exports = {
    getAllPollution, searchArea, fetchRealTimeAQI,
    createPollution, updatePollution, deletePollution,
    getSummary, getUsers
};
