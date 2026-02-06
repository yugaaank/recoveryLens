import { Patient, RecoveryEntry, BaselineProfile, WindowSummary } from './types';
import { SURGERY_WEIGHT_TREE, SYMPTOM_MULTIPLIERS, DEFAULT_BASELINE } from './constants';

export function calculateBaseline(entries: RecoveryEntry[]): BaselineProfile {
    const baselineEntries = entries.filter(e => e.endHour <= 6);

    if (baselineEntries.length === 0) return DEFAULT_BASELINE;

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;

    const calculated: BaselineProfile = {
        hrBaseline: avg(baselineEntries.map(e => e.heartRate)),
        spo2Baseline: avg(baselineEntries.map(e => e.spo2)),
        tempBaseline: avg(baselineEntries.map(e => e.temperature)),
        activityBaseline: avg(baselineEntries.map(e => e.steps + e.minutesMoved)),
        painBaseline: avg(baselineEntries.map(e => e.painScore)),
        sleepBaseline: avg(baselineEntries.map(e => e.sleepDuration))
    };
    
    // Use calculated values when available, fall back to defaults.
    return {
        ...DEFAULT_BASELINE,
        ...calculated
    };
}

export function calculateRiskScore(
    entry: RecoveryEntry,
    baseline: BaselineProfile,
    patient: Patient,
    history: RecoveryEntry[] = []
): number {
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

    const within = (value: number, base: number, tol: number) => {
        if (!Number.isFinite(value) || !Number.isFinite(base) || base === 0) return true;
        return Math.abs(value - base) <= Math.abs(base * tol);
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

    const hrWithin = within(entry.heartRate, baseline.hrBaseline, context.hrTol);
    const spo2Within = within(entry.spo2, baseline.spo2Baseline, context.spo2Tol);
    const tempWithin = within(entry.temperature, baseline.tempBaseline, context.tempTol);

    const hardAlert =
        (!invalid.spo2 && entry.spo2 < 90) ||
        (!invalid.temperature && entry.temperature > 38.8) ||
        (!invalid.heartRate && (entry.heartRate > 130 || entry.heartRate < 45));

    const trend = (key: keyof RecoveryEntry) => {
        const values = history.map(h => Number(h[key])).filter(v => Number.isFinite(v));
        if (values.length < 3) return 0;
        const recent = values[values.length - 1];
        const prevAvg = (values[values.length - 2] + values[values.length - 3]) / 2;
        return (recent - prevAvg) / (prevAvg || 1);
    };

    const trendPenalty =
        (trend('temperature') > 0.02 ? 3 : 0) +
        (trend('spo2') < -0.02 ? 3 : 0) +
        (trend('heartRate') > 0.05 ? 2 : 0) +
        (trend('painScore') > 0.1 ? 2 : 0);

    const vitalsScore = (hrDev * weights.heartRate) +
        (spo2Dev * weights.spo2) +
        (tempDev * weights.temperature);

    const functionScore = (activityDev * weights.activity) +
        (painDev * weights.pain);

    let score = (vitalsScore * 0.65) + (functionScore * 0.35);

    // Symptom multipliers
    let totalMultiplier = 0;
    if (entry.tags.nauseous) totalMultiplier += SYMPTOM_MULTIPLIERS.nauseous;
    if (entry.tags.dizzy) totalMultiplier += SYMPTOM_MULTIPLIERS.dizzy;
    if (entry.tags.vomiting) totalMultiplier += SYMPTOM_MULTIPLIERS.vomiting;

    score = score * (1 + totalMultiplier);

    // Apply trends and hard alerts
    score += isLowWindow ? (trendPenalty * 0.5) : trendPenalty;
    if (hardAlert) score += 15;

    // Low-window leniency
    score = score * leniency;

    // Clamp away from extremes for stability
    const clamped = Math.min(Math.max(score, 5), 95);
    return Math.round(clamped);
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

        const historyToHere = activeEntries.filter(e => e.endHour <= windowEntries[windowEntries.length - 1].endHour);
        const riskScore = calculateRiskScore(representativeEntry, baseline, patient, historyToHere);

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
