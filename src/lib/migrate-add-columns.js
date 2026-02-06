const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const isLocal = process.env.POSTGRES_URL && (process.env.POSTGRES_URL.includes('localhost') || process.env.POSTGRES_URL.includes('127.0.0.1'));

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

async function migrate() {
    try {
        console.log('Running migration: Adding missing columns to readings table...');

        // Check and add spo2
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'spo2') THEN
                    ALTER TABLE readings ADD COLUMN spo2 INTEGER DEFAULT 98;
                END IF;
            END $$;
        `);
        console.log('Added spo2 column.');

        // Check and add steps
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'steps') THEN
                    ALTER TABLE readings ADD COLUMN steps INTEGER DEFAULT 0;
                END IF;
            END $$;
        `);
        console.log('Added steps column.');

        // Check and add minutes_moved
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'minutes_moved') THEN
                    ALTER TABLE readings ADD COLUMN minutes_moved INTEGER DEFAULT 0;
                END IF;
            END $$;
        `);
        console.log('Added minutes_moved column.');

        // Add missing Risk Score column if needed for RSI calculation storage
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'risk_score') THEN
                    ALTER TABLE readings ADD COLUMN risk_score FLOAT DEFAULT 0;
                END IF;
            END $$;
        `);
        console.log('Added risk_score column.');


        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
