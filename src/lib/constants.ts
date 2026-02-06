export const SURGERY_WEIGHT_TREE: Record<string, { heartRate: number; spo2: number; temperature: number; activity: number; pain: number }> = {
    'Heart Surgery': { heartRate: 2.0, spo2: 2.5, temperature: 1.5, activity: 1.0, pain: 1.0 },
    'Maternity': { heartRate: 1.0, spo2: 1.0, temperature: 1.5, activity: 1.0, pain: 2.0 },
    'Neuro': { heartRate: 1.5, spo2: 1.5, temperature: 1.0, activity: 2.0, pain: 1.5 },
    // Default fallback
    'General': { heartRate: 1.0, spo2: 1.5, temperature: 1.0, activity: 1.0, pain: 1.0 }
};

export const SYMPTOM_MULTIPLIERS = {
    nauseous: 0.2, // +20% risk
    dizzy: 0.3,    // +30% risk
    vomiting: 0.5  // +50% risk
};

export const RISK_THRESHOLDS = {
    moderate: 40,
    critical: 60
};

export const DEFAULT_BASELINE = {
    hrBaseline: 75,
    spo2Baseline: 98,
    tempBaseline: 36.8,
    activityBaseline: 1530, // steps (1500) + minutes moved (30)
    painBaseline: 3,
    sleepBaseline: 7.5
};

export const DEFAULT_BASELINE_VITALS = {
    heart_rate: 75,
    spo2: 98,
    temperature: 36.8,
    steps: 1500,
    minutes_moved: 30,
    pain: 3,
    sleep_hours: 7.5
};
