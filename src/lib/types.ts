export interface Patient {
    id: string;
    surgeryType: string;
}

export interface RecoveryEntry {
    id?: string; // Optional for new entries
    timestamp: Date | string;
    postOpDay: number;
    startHour: number; // Relative to discharge/surgery
    endHour: number;

    // Vitals
    heartRate: number;
    spo2: number;
    temperature: number;

    // Function
    steps: number;
    minutesMoved: number;
    sleepDuration: number;

    // Symptoms
    painScore: number;
    tags: {
        nauseous: boolean;
        dizzy: boolean;
        vomiting: boolean;
        [key: string]: boolean;
    };
}

export interface BaselineProfile {
    hrBaseline: number;
    spo2Baseline: number;
    tempBaseline: number;
    activityBaseline: number; // steps + minutesMoved
    painBaseline: number;
    sleepBaseline: number;
}

export interface WindowSummary {
    windowLabel: string; // e.g., "W1"
    startTime: Date | string;
    endTime: Date | string;

    // Aggregates
    avgHeartRate: number;
    avgSpo2: number;
    avgTemperature: number;
    avgPainScore: number;
    totalActivity: number;
    totalSleep: number;

    // Analysis
    riskScore: number;
    trend: 'Improving' | 'Worsening' | 'Plateau';
}
