import { Patient, RecoveryEntry, BaselineProfile, WindowSummary } from './types';
import { SURGERY_WEIGHT_TREE, SYMPTOM_MULTIPLIERS, DEFAULT_BASELINE } from './constants';

export function calculateBaseline(entries: RecoveryEntry[]): BaselineProfile {
    const baselineEntries = entries.filter(e => e.endHour <= 6);

    if (baselineEntries.length === 0) return DEFAULT_BASELINE;

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;

    return {
        hrBaseline: avg(baselineEntries.map(e => e.heartRate)),
        spo2Baseline: avg(baselineEntries.map(e => e.spo2)),
        tempBaseline: avg(baselineEntries.map(e => e.temperature)),
        activityBaseline: avg(baselineEntries.map(e => e.steps + e.minutesMoved)),
        painBaseline: avg(baselineEntries.map(e => e.painScore)),
        sleepBaseline: avg(baselineEntries.map(e => e.sleepDuration))
    };
}

export function calculateRiskScore(entry: RecoveryEntry, baseline: BaselineProfile, patient: Patient): number {
    const weights = SURGERY_WEIGHT_TREE[patient.surgeryType] || SURGERY_WEIGHT_TREE['General'];

    // 1. Calculate Deviations
    const hrDev = Math.abs(((entry.heartRate - baseline.hrBaseline) / baseline.hrBaseline) * 100);

    // SpO2: Only negative deviation is bad
    const spo2Dev = Math.max(0, ((baseline.spo2Baseline - entry.spo2) / baseline.spo2Baseline) * 100);

    const tempDev = Math.abs(((entry.temperature - baseline.tempBaseline) / baseline.tempBaseline) * 100);

    // Activity: Only negative deviation is bad
    const currentActivity = entry.steps + entry.minutesMoved;
    const activityDev = Math.max(0, ((baseline.activityBaseline - currentActivity) / baseline.activityBaseline) * 100);

    // Pain: Only positive deviation is bad (Logic in Prompt: Math.max(0, ((entry.painScore - baseline.painBaseline) / baseline.painBaseline) * 100))
    // Handling division by zero if painBaseline is 0
    let painDev = 0;
    if (baseline.painBaseline > 0) {
        painDev = Math.max(0, ((entry.painScore - baseline.painBaseline) / baseline.painBaseline) * 100);
    } else if (entry.painScore > 0) {
        painDev = entry.painScore * 10; // Fallback: 1 point = 10% deviation equivalent
    }

    // 2. Weighted Sum
    let score = (hrDev * weights.heartRate) +
        (spo2Dev * weights.spo2) +
        (tempDev * weights.temperature) +
        (activityDev * weights.activity) +
        (painDev * weights.pain);

    // 3. Symptom Multipliers
    let totalMultiplier = 0;
    if (entry.tags.nauseous) totalMultiplier += SYMPTOM_MULTIPLIERS.nauseous;
    if (entry.tags.dizzy) totalMultiplier += SYMPTOM_MULTIPLIERS.dizzy;
    if (entry.tags.vomiting) totalMultiplier += SYMPTOM_MULTIPLIERS.vomiting;

    score = score * (1 + totalMultiplier);

    // 4. Cap at 100
    return Math.min(Math.round(score), 100);
}

export function generateWindowSummaries(entries: RecoveryEntry[], baseline: BaselineProfile, patient: Patient): WindowSummary[] {
    // filter out baseline
    const activeEntries = entries.filter(e => e.endHour > 6).sort((a, b) => a.startHour - b.startHour);

    // Group by 6h windows
    const windows: Record<string, RecoveryEntry[]> = {};
    activeEntries.forEach(entry => {
        const windowIndex = Math.ceil(entry.startHour / 6);
        const label = `W${windowIndex}`;
        if (!windows[label]) windows[label] = [];
        windows[label].push(entry);
    });

    const summaries: WindowSummary[] = [];

    Object.keys(windows).forEach(label => {
        const windowEntries = windows[label];
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

        const avgHeartRate = Math.round(avg(windowEntries.map(e => e.heartRate)));
        const avgSpo2 = Math.round(avg(windowEntries.map(e => e.spo2)));
        const avgTemperature = parseFloat(avg(windowEntries.map(e => e.temperature)).toFixed(1));
        const avgPainScore = parseFloat(avg(windowEntries.map(e => e.painScore)).toFixed(1));
        const totalActivity = windowEntries.reduce((sum, e) => sum + e.steps + e.minutesMoved, 0);

        // Re-construct a "Representative Entry" for scoring
        const representativeEntry: RecoveryEntry = {
            timestamp: windowEntries[windowEntries.length - 1].timestamp,
            postOpDay: windowEntries[0].postOpDay,
            startHour: windowEntries[0].startHour,
            endHour: windowEntries[windowEntries.length - 1].endHour,
            heartRate: avgHeartRate,
            spo2: avgSpo2,
            temperature: avgTemperature,
            steps: avg(windowEntries.map(e => e.steps)), // Use avg for rate consistency
            minutesMoved: avg(windowEntries.map(e => e.minutesMoved)),
            sleepDuration: avg(windowEntries.map(e => e.sleepDuration)),
            painScore: avgPainScore,
            tags: windowEntries[windowEntries.length - 1].tags // Take latest tags
        };

        const riskScore = calculateRiskScore(representativeEntry, baseline, patient);

        summaries.push({
            windowLabel: label,
            startTime: windowEntries[0].timestamp,
            endTime: windowEntries[windowEntries.length - 1].timestamp,
            avgHeartRate,
            avgSpo2,
            avgTemperature,
            avgPainScore,
            totalActivity,
            totalSleep: windowEntries.reduce((sum, e) => sum + e.sleepDuration, 0),
            riskScore,
            trend: 'Plateau' // Placeholder
        });
    });

    // Determine Trends
    for (let i = 0; i < summaries.length; i++) {
        if (i === 0) {
            if (summaries[i].riskScore > 20) summaries[i].trend = 'Worsening';
        } else {
            const prev = summaries[i - 1].riskScore;
            const curr = summaries[i].riskScore;
            if (curr > prev + 5) summaries[i].trend = 'Worsening';
            else if (curr < prev - 5) summaries[i].trend = 'Improving';
            else summaries[i].trend = 'Plateau';
        }
    }

    return summaries;
}
