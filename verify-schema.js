const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const isLocal = process.env.POSTGRES_URL && (process.env.POSTGRES_URL.includes('localhost') || process.env.POSTGRES_URL.includes('127.0.0.1'));

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

async function verify() {
    try {
        console.log('Verifying readings table columns...');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'readings'
        `);

        const expectedColumns = [
            'id', 'patient_id', 'type', 'pain', 'activity',
            'temperature', 'heart_rate', 'sleep_hours',
            'created_at', 'spo2', 'steps', 'minutes_moved',
            'risk_score', 'rsi', 'status', 'explanation', 'symptoms'
        ];

        const foundColumns = res.rows.map(r => r.column_name);
        const missing = expectedColumns.filter(c => !foundColumns.includes(c));

        if (missing.length > 0) {
            console.error('❌ Missing columns:', missing.join(', '));
        } else {
            console.log('✅ All columns present.');
        }

        console.log('Found columns:', foundColumns.join(', '));

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await pool.end();
    }
}

verify();
