// ============================================================
// backend/config/db.js
// SQLite database connection using sqlite3
// ============================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the project root
const dbPath = path.join(__dirname, '../../pollution_monitoring.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ SQLite Database connected successfully!');
    }
});

// Promisify for async/await
const promiseDb = {
    execute: (query, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve({ insertId: this.lastID, changes: this.changes });
            });
        });
    },
    query: (query, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = promiseDb;
