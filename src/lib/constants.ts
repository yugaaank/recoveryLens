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
    moderate: 20,
    critical: 35
};

export const DEFAULT_BASELINE = {
    hrBaseline: 70,
    spo2Baseline: 98,
    tempBaseline: 37,
    activityBaseline: 500,
    painBaseline: 0,
    sleepBaseline: 8
};
