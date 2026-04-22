// ============================================================
// init.js — Initialize SQLite database with tables
// Run once: node init.js
// ============================================================

const db = require('./backend/config/db');

async function init() {
    console.log('\n🌱 Initializing SQLite database...\n');

    try {
        // Create users table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created.');

        // Create pollution_data table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS pollution_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                area_name TEXT NOT NULL,
                pollution_level TEXT NOT NULL,
                aqi INTEGER NOT NULL,
                alert_message TEXT,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Pollution data table created.\n');

    } catch (err) {
        console.error('Init error:', err);
    }
}

init();