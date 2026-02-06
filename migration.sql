-- Migration to add extended columns to readings and patients
-- Run this in your database tool or via connection

-- 1. Add discharge_date to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Add columns to readings
ALTER TABLE readings ADD COLUMN IF NOT EXISTS spo2 INTEGER DEFAULT 98;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS minutes_moved INTEGER DEFAULT 0;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS steps INTEGER DEFAULT 0; -- Ensure explicit steps column
ALTER TABLE readings ADD COLUMN IF NOT EXISTS symptoms JSONB DEFAULT '[]';

-- 3. Add Analysis columns to readings
ALTER TABLE readings ADD COLUMN IF NOT EXISTS risk_score FLOAT DEFAULT 0;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS rsi FLOAT DEFAULT 100;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Stable';
ALTER TABLE readings ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT '';
