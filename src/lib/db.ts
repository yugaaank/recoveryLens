import { Pool } from 'pg';

const isLocal = process.env.POSTGRES_URL?.includes('localhost') || process.env.POSTGRES_URL?.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
