const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const isLocal = process.env.POSTGRES_URL && (process.env.POSTGRES_URL.includes('localhost') || process.env.POSTGRES_URL.includes('127.0.0.1'));

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

async function main() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema...');
        await pool.query(schemaSql);
        console.log('Schema executed successfully.');
    } catch (err) {
        console.error('Error executing schema:', err);
    } finally {
        await pool.end();
    }
}

main();
