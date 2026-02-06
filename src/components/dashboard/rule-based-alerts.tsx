import { WindowSummary, RecoveryEntry } from '@/lib/types';
import { RISK_THRESHOLDS } from '@/lib/constants';

interface AlertResult {
    shouldAlert: boolean;
    reason: string;
}

export function runAlertAnalysis(latestSummary: WindowSummary, latestEntry: RecoveryEntry): AlertResult {
    // Rule 1: Critical Risk
    if (latestSummary.riskScore > RISK_THRESHOLDS.critical) {
        return { shouldAlert: true, reason: `Critical Risk Score: ${latestSummary.riskScore}` };
    }

    // Rule 2: Worsening Trend
    if (latestSummary.trend === 'Worsening') {
        return { shouldAlert: true, reason: 'Worsening Trend Detected' };
    }

    // Rule 3: Moderate Risk + Symptoms
    const hasSymptoms = latestEntry.tags.nauseous || latestEntry.tags.dizzy || latestEntry.tags.vomiting;
    if (latestSummary.riskScore > RISK_THRESHOLDS.moderate && hasSymptoms) {
        return { shouldAlert: true, reason: 'Elevated Risk with Symptoms' };
    }

    // Rule 4: Alert Fatigue Suppression
    if (latestSummary.riskScore > RISK_THRESHOLDS.moderate) {
        return { shouldAlert: false, reason: 'Risk elevated but stable; monitoring.' };
    }

    // Rule 5: All Clear
    return { shouldAlert: false, reason: 'Patient stable.' };
}
