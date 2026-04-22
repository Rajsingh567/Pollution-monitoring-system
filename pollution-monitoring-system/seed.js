// ============================================================
// seed.js — Run ONCE to create default admin & user accounts
// Usage: node seed.js
// ============================================================

const bcrypt = require('bcryptjs');
const db = require('./backend/config/db');

async function seed() {
    console.log('\n🌱 Seeding database with default users...\n');

    try {
        // Hash passwords
        const adminHash = await bcrypt.hash('admin123', 10);
        const userHash  = await bcrypt.hash('user123', 10);

        // Clear existing demo accounts (by email)
        await db.execute("DELETE FROM users WHERE email IN ('admin@pollution.com', 'user@pollution.com')");

        // Insert admin
        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Super Admin', 'admin@pollution.com', adminHash, 'admin']
        );
        console.log('✅ Admin created: admin@pollution.com / admin123');

        // Insert demo user
        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Demo User', 'user@pollution.com', userHash, 'user']
        );
        console.log('✅ User created:  user@pollution.com / user123');

        // Insert sample pollution data (skip if already exists)
        const samples = [
            ['Mumbai',    'High',      178, 'Air quality is unhealthy. Avoid outdoor activities.'],
            ['Delhi',     'Hazardous', 312, 'SEVERE ALERT: Stay indoors. Use N95 masks.'],
            ['Pune',      'Medium',     95, 'Moderate air quality. Sensitive groups take care.'],
            ['Nagpur',    'Low',        42, 'Air quality is good. Enjoy outdoor activities.'],
            ['Bangalore', 'Medium',     88, 'Moderate pollution. Limit prolonged outdoor exposure.'],
        ];

        for (const [area, level, aqi, alert] of samples) {
            await db.execute(
                'INSERT OR IGNORE INTO pollution_data (area_name, pollution_level, aqi, alert_message) VALUES (?,?,?,?)',
                [area, level, aqi, alert]
            );
        }
        console.log('✅ Sample pollution data inserted.\n');

        console.log('🎉 Seeding complete! You can now log in.\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
}

seed();
