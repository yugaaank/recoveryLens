// Analytical Intelligence System (The "Brain")
// Component-Based RSI Architecture

export interface Reading {
    created_at?: Date | string;
    heart_rate: number;
    spo2: number;
    temperature: number;
    steps: number;
    minutes_moved: number;
    pain: number;
    sleep_hours: number;
    symptoms: string[];
    rsi?: number;
}

export interface AnalysisResult {
    riskScore: number;
    rsi: number;
    status: 'Stable' | 'Monitor' | 'Critical';
    explanation: string;
    confidence: number;
    components?: {
        vitalIntegrity: number;
        symptomLoad: number;
        functionalCapacity: number;
    };
}

// --- Configuration ---

const MAX_SCORES = {
    VITAL: 50,
    SYMPTOM: 30,
    FUNCTION: 20
};

// --- Helper Functions ---

const getTrendDescription = (values: number[]) => {
    if (values.length < 3) return 'stable';
    let inc = 0, dec = 0;
    for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i - 1]) inc++;
        if (values[i] < values[i - 1]) dec++;
    }
    if (inc === values.length - 1) return 'rising';
    if (dec === values.length - 1) return 'falling';
    return 'stable';
};

// --- Component Calculators ---

function calculateVitalIntegrity(current: Reading, baseline: Reading): { score: number, reasons: string[] } {
    let score = MAX_SCORES.VITAL;
    let reasons: string[] = [];

    // Heart Rate (Max deduction: 25)
    // Small deviation (up to 10%) is fine. Large deviation (>30%) is bad.
    const hrDev = ((current.heart_rate - baseline.heart_rate) / baseline.heart_rate) * 100;
    if (hrDev > 30) { score -= 25; reasons.push(`HR Critical (+${Math.round(hrDev)}%)`); }
    else if (hrDev > 15) { score -= 10; reasons.push(`HR Elevated (+${Math.round(hrDev)}%)`); }

    // SpO2 (Max deduction: 25)
    // Any drop below 95 is concerning, below 92 is critical.
    if (current.spo2 < 92) { score -= 25; reasons.push(`SpO₂ Critical (${current.spo2}%)`); }
    else if (current.spo2 < 95) { score -= 10; reasons.push(`SpO₂ Low (${current.spo2}%)`); }
    else if (current.spo2 < (baseline.spo2 - 2)) { score -= 5; reasons.push('SpO₂ dipping'); }

    // Temperature (Max deduction: 15)
    if (current.temperature > 38.0) { score -= 15; reasons.push(`Fever (${current.temperature}°C)`); }
    else if (current.temperature > 37.5) { score -= 5; reasons.push('Low grade fever'); }

    return { score: Math.max(0, score), reasons };
}

function calculateSymptomLoad(current: Reading, baseline: Reading): { score: number, reasons: string[] } {
    let score = MAX_SCORES.SYMPTOM;
    let reasons: string[] = [];

    // Pain (Max deduction: 20)
    // Pain 0-3: Great (No deduction)
    // Pain 4-6: Moderate (-10)
    // Pain 7-10: Severe (-20)
    if (current.pain >= 7) { score -= 20; reasons.push(`Severe Pain (${current.pain}/10)`); }
    else if (current.pain >= 4) { score -= 10; reasons.push(`Moderate Pain (${current.pain}/10)`); }

    // Symptoms (Max deduction: 10)
    // Each symptom -3 points
    if (current.symptoms.length > 0) {
        const deduction = current.symptoms.length * 3;
        score -= deduction;
        reasons.push(`Symptoms: ${current.symptoms.join(', ')}`);
    }

    return { score: Math.max(0, score), reasons };
}

function calculateFunctionalCapacity(current: Reading, baseline: Reading, postOpDay: number): { score: number, reasons: string[] } {
    let score = MAX_SCORES.FUNCTION;
    let reasons: string[] = [];

    // Day 0-2: Rest is good. Low activity is NOT penalized.
    // Day 3+: Expect movement.
    if (postOpDay >= 3) {
        const targetSteps = baseline.steps * 0.5; // Expect at least 50% of baseline by day 3
        if (current.steps < targetSteps) {
            score -= 10;
            reasons.push('Mobility low for Day 3+');
        }
    }

    // Sleep (Always important)
    if (current.sleep_hours < 4) { score -= 5; reasons.push('Poor sleep'); }

    return { score: Math.max(0, score), reasons };
}

// --- Main Engine ---

export function analyzeReadingWithHistory(
    current: Reading,
    baseline: Reading,
    history: Reading[],
    surgeryType: string,
    postOpDay: number
): AnalysisResult {
    const vitals = calculateVitalIntegrity(current, baseline);
    const symptoms = calculateSymptomLoad(current, baseline);
    const functionScore = calculateFunctionalCapacity(current, baseline, postOpDay);

    let rsi = vitals.score + symptoms.score + functionScore.score;
    let reasons = [...vitals.reasons, ...symptoms.reasons, ...functionScore.reasons];

    // --- Trend Modifier (Context Layer) ---
    // Bonus/Malus based on trajectory, capped at +/- 10 points
    // This adds "Context" without overwhelming the score
    if (history.length >= 2) {
        const lastRsi = history[history.length - 1].rsi || 0;

        // If improving significantly (>5 pts), add Momentum Bonus
        if (rsi > lastRsi + 5) {
            rsi += 5;
            reasons.push('Recovery momentum detected');
        }

        // If deteriorating, add Stability Penalty
        if (rsi < lastRsi - 5) {
            rsi -= 5;
            reasons.push('Rapid deterioration');
        }
    }

    // Cap RSI 0-100
    rsi = Math.min(Math.max(Math.round(rsi), 0), 100);

    // Derived Risk Score (Backwards compatibility)
    // Risk = 100 - RSI
    const riskScore = 100 - rsi;

    // Status Determination
    let status: 'Stable' | 'Monitor' | 'Critical' = 'Stable';
    if (rsi < 50) status = 'Critical';
    else if (rsi < 80) status = 'Monitor';

    const explanation = reasons.length > 0
        ? reasons.join(', ') + '.'
        : 'All systems performing optimally.';

    // Confidence determination
    let confidence = 95;
    if (history.length < 3) confidence -= 10;

    return {
        riskScore,
        rsi,
        status,
        explanation,
        confidence,
        components: {
            vitalIntegrity: vitals.score,
            symptomLoad: symptoms.score,
            functionalCapacity: functionScore.score
        }
    };
}
