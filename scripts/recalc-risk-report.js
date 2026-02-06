const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const DEFAULT_BASELINE = {
  hrBaseline: 75,
  spo2Baseline: 98,
  tempBaseline: 36.8,
  activityBaseline: 1530,
  painBaseline: 3,
  sleepBaseline: 7.5
};

const RISK_THRESHOLDS = {
  moderate: 40,
  critical: 60
};

const SURGERY_WEIGHT_TREE = {
  'Heart Surgery': { heartRate: 2.0, spo2: 2.5, temperature: 1.5, activity: 1.0, pain: 1.0 },
  'Maternity': { heartRate: 1.0, spo2: 1.0, temperature: 1.5, activity: 1.0, pain: 2.0 },
  'Neuro': { heartRate: 1.5, spo2: 1.5, temperature: 1.0, activity: 2.0, pain: 1.5 },
  'General': { heartRate: 1.0, spo2: 1.5, temperature: 1.0, activity: 1.0, pain: 1.0 }
};

const SYMPTOM_MULTIPLIERS = { nauseous: 0.2, dizzy: 0.3, vomiting: 0.5 };

function trend(history, key) {
  const values = history.map(h => Number(h[key])).filter(v => Number.isFinite(v));
  if (values.length < 3) return 0;
  const recent = values[values.length - 1];
  const prevAvg = (values[values.length - 2] + values[values.length - 3]) / 2;
  return (recent - prevAvg) / (prevAvg || 1);
}

function calculateRiskScore(entry, baseline, patient, history = []) {
  const weights = SURGERY_WEIGHT_TREE[patient.surgeryType] || SURGERY_WEIGHT_TREE['General'];

  const isLowWindow = history.length < 3;
  const postOpDay = entry.postOpDay || 1;

  const context = {
    hrTol: postOpDay <= 2 ? 0.22 : postOpDay <= 5 ? 0.18 : 0.15,
    spo2Tol: postOpDay <= 2 ? 0.06 : 0.05,
    tempTol: postOpDay <= 2 ? 0.03 : 0.02,
    activityFactor: postOpDay <= 2 ? 0.35 : postOpDay <= 5 ? 0.5 : 0.65,
    sleepMin: postOpDay <= 2 ? 5.5 : 6.5,
    minutesMin: postOpDay <= 2 ? 10 : 15
  };

  const leniency = isLowWindow ? 0.85 : 1;

  const invalid = {
    heartRate: entry.heartRate < 30 || entry.heartRate > 220,
    spo2: entry.spo2 < 80 || entry.spo2 > 100,
    temperature: entry.temperature < 34 || entry.temperature > 41,
    pain: entry.painScore < 0 || entry.painScore > 10
  };

  const hrDev = invalid.heartRate ? 0 : Math.abs(((entry.heartRate - baseline.hrBaseline) / baseline.hrBaseline) * 100);
  const spo2Dev = invalid.spo2 ? 0 : Math.max(0, ((baseline.spo2Baseline - entry.spo2) / baseline.spo2Baseline) * 100);
  const tempDev = invalid.temperature ? 0 : Math.abs(((entry.temperature - baseline.tempBaseline) / baseline.tempBaseline) * 100);

  const currentActivity = entry.steps + entry.minutesMoved;
  const expectedActivity = baseline.activityBaseline * context.activityFactor;
  const activityDev = Math.max(0, ((expectedActivity - currentActivity) / Math.max(1, expectedActivity)) * 100);

  let painDev = 0;
  if (!invalid.pain) {
    if (baseline.painBaseline > 0) {
      painDev = Math.max(0, ((entry.painScore - baseline.painBaseline) / baseline.painBaseline) * 100);
    } else if (entry.painScore > 0) {
      painDev = entry.painScore * 10;
    }
  }

  const hardAlert =
    (!invalid.spo2 && entry.spo2 < 90) ||
    (!invalid.temperature && entry.temperature > 38.8) ||
    (!invalid.heartRate && (entry.heartRate > 130 || entry.heartRate < 45));

  const trendPenalty =
    (trend(history, 'temperature') > 0.02 ? 3 : 0) +
    (trend(history, 'spo2') < -0.02 ? 3 : 0) +
    (trend(history, 'heartRate') > 0.05 ? 2 : 0) +
    (trend(history, 'painScore') > 0.1 ? 2 : 0);

  const vitalsScore = (hrDev * weights.heartRate) +
    (spo2Dev * weights.spo2) +
    (tempDev * weights.temperature);

  const functionScore = (activityDev * weights.activity) +
    (painDev * weights.pain);

  let score = (vitalsScore * 0.65) + (functionScore * 0.35);

  let totalMultiplier = 0;
  if (entry.tags.nauseous) totalMultiplier += SYMPTOM_MULTIPLIERS.nauseous;
  if (entry.tags.dizzy) totalMultiplier += SYMPTOM_MULTIPLIERS.dizzy;
  if (entry.tags.vomiting) totalMultiplier += SYMPTOM_MULTIPLIERS.vomiting;

  score = score * (1 + totalMultiplier);
  score += isLowWindow ? (trendPenalty * 0.5) : trendPenalty;
  if (hardAlert) score += 15;
  score = score * leniency;

  const clamped = Math.min(Math.max(score, 5), 95);
  return Math.round(clamped);
}

function statusFromRisk(risk) {
  return risk > RISK_THRESHOLDS.critical
    ? 'Critical'
    : risk > RISK_THRESHOLDS.moderate
      ? 'Monitor'
      : 'Stable';
}

function mapTags(symptoms) {
  const tags = { nauseous: false, dizzy: false, vomiting: false };
  if (!symptoms) return tags;
  let arr = symptoms;
  if (typeof symptoms === 'string') {
    try { arr = JSON.parse(symptoms); } catch { arr = []; }
  }
  if (Array.isArray(arr)) {
    arr.forEach((sym) => {
      const s = String(sym).toLowerCase();
      if (s.includes('nause')) tags.nauseous = true;
      if (s.includes('dizzy')) tags.dizzy = true;
      if (s.includes('vomit')) tags.vomiting = true;
    });
  }
  return tags;
}

async function run() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  const patientsRes = await client.query('SELECT id, surgery, created_at FROM patients');
  const patients = patientsRes.rows;

  const summary = {
    total: 0,
    changedRisk: 0,
    changedStatus: 0,
    byStatus: { Stable: 0, Monitor: 0, Critical: 0 },
    byOldStatus: { Stable: 0, Monitor: 0, Critical: 0 }
  };

  const deltas = [];

  for (const p of patients) {
    const readingsRes = await client.query(
      'SELECT * FROM readings WHERE patient_id = $1 ORDER BY created_at ASC',
      [p.id]
    );

    const surgeryDate = new Date(p.created_at);

    const entries = readingsRes.rows.map((row) => {
      const date = new Date(row.created_at);
      const diffMs = date.getTime() - surgeryDate.getTime();
      const hoursSinceSurgery = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      const daysSinceSurgery = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: row.id,
        timestamp: date,
        postOpDay: daysSinceSurgery,
        startHour: hoursSinceSurgery,
        endHour: hoursSinceSurgery,
        heartRate: Number(row.heart_rate) || 0,
        spo2: Number(row.spo2) || 98,
        temperature: Number(row.temperature) || 37,
        steps: Number(row.steps) || 0,
        minutesMoved: Number(row.minutes_moved) || 0,
        sleepDuration: Number(row.sleep_hours) || 0,
        painScore: Number(row.pain) || 0,
        tags: mapTags(row.symptoms)
      };
    });

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const history = entries.slice(0, i + 1);
      const risk = calculateRiskScore(entry, DEFAULT_BASELINE, { id: p.id, surgeryType: p.surgery || 'General' }, history);
      const status = statusFromRisk(risk);

      const row = readingsRes.rows[i];
      const oldRisk = Number(row.risk_score) || 0;
      const oldStatus = row.status || 'Stable';

      summary.total += 1;
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
      summary.byOldStatus[oldStatus] = (summary.byOldStatus[oldStatus] || 0) + 1;

      if (Math.round(oldRisk) !== Math.round(risk)) summary.changedRisk += 1;
      if (oldStatus !== status) summary.changedStatus += 1;

      deltas.push({
        id: row.id,
        patient_id: p.id,
        oldRisk,
        newRisk: risk,
        oldStatus,
        newStatus: status,
        heart_rate: row.heart_rate,
        spo2: row.spo2,
        temperature: row.temperature,
        pain: row.pain
      });
    }
  }

  deltas.sort((a, b) => Math.abs(b.newRisk - b.oldRisk) - Math.abs(a.newRisk - a.oldRisk));

  const report = {
    summary,
    topDeltas: deltas.slice(0, 50)
  };

  const outPath = path.join(process.cwd(), 'risk-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('--- Risk Recalculation Report (no DB changes) ---');
  console.log('Total rows:', summary.total);
  console.log('Changed risk scores:', summary.changedRisk);
  console.log('Changed status:', summary.changedStatus);
  console.log('Old status distribution:', summary.byOldStatus);
  console.log('New status distribution:', summary.byStatus);
  console.log(`Report written to: ${outPath}`);

  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
