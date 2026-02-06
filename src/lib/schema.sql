CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  surgery TEXT NOT NULL CHECK (surgery IN ('Heart Surgery', 'Maternity', 'Neuro')),
  patient_key VARCHAR(4) NOT NULL UNIQUE,
  patient_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  type TEXT NOT NULL CHECK (type IN ('BASELINE', 'DAILY')),
  pain INTEGER NOT NULL CHECK (pain >= 0 AND pain <= 10),
  activity INTEGER NOT NULL DEFAULT 0,
  steps INTEGER DEFAULT 0,
  minutes_moved INTEGER DEFAULT 0,
  temperature FLOAT NOT NULL,
  heart_rate INTEGER NOT NULL,
  spo2 INTEGER DEFAULT 98,
  sleep_hours FLOAT NOT NULL,
  risk_score FLOAT DEFAULT 0,
  rsi INTEGER DEFAULT 100,
  status TEXT DEFAULT 'Stable',
  explanation TEXT,
  symptoms TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
