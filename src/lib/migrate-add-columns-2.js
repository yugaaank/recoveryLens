const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const isLocal = process.env.POSTGRES_URL && (process.env.POSTGRES_URL.includes('localhost') || process.env.POSTGRES_URL.includes('127.0.0.1'));

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

async function migrate() {
    try {
        console.log('Running migration: Adding missing columns (rsi, status, explanation, symptoms) to readings table...');

        // rsi
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'rsi') THEN
                    ALTER TABLE readings ADD COLUMN rsi INTEGER DEFAULT 100;
                END IF;
            END $$;
        `);
        console.log('Added rsi column.');

        // status
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'status') THEN
                    ALTER TABLE readings ADD COLUMN status TEXT DEFAULT 'Stable';
                END IF;
            END $$;
        `);
        console.log('Added status column.');

        // explanation
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'explanation') THEN
                    ALTER TABLE readings ADD COLUMN explanation TEXT;
                END IF;
            END $$;
        `);
        console.log('Added explanation column.');

        // symptoms
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'readings' AND column_name = 'symptoms') THEN
                    ALTER TABLE readings ADD COLUMN symptoms TEXT; -- Storing JSON as text
                END IF;
            END $$;
        `);
        console.log('Added symptoms column.');

        console.log('Migration phase 2 completed successfully.');
    } catch (err) {
        console.error('Migration phase 2 failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
