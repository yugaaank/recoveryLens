import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { calculateBaseline, calculateRiskScore, generateWindowSummaries } from '@/lib/analytics';
import { runAlertAnalysis } from '@/components/dashboard/rule-based-alerts';
import { Patient, RecoveryEntry } from '@/lib/types';
import { RISK_THRESHOLDS } from '@/lib/constants';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            pain,
            steps,
            minutes_moved,
            temperature,
            heart_rate,
            sleep_hours,
            symptoms,
            spo2
        } = body;

        // 1. Validate Ranges (Keep existing validation)
        if (pain < 0 || pain > 10) return NextResponse.json({ error: 'Pain must be 0-10' }, { status: 400 });
        if (heart_rate < 30 || heart_rate > 250) return NextResponse.json({ error: 'Invalid Heart Rate' }, { status: 400 });

        // 2. Fetch User Context
        const userRes = await query('SELECT * FROM patients WHERE id = $1', [session.id]);
        const user = userRes.rows[0];

        const patient: Patient = {
            id: user.id,
            surgeryType: user.surgery || 'General'
        };

        // 3. Fetch Full History for Deterministic Baseline & Trend Analysis
        const historyRes = await query(
            `SELECT * FROM readings WHERE patient_id = $1 ORDER BY created_at ASC`,
            [session.id]
        );

        // Map DB rows to RecoveryEntry model
        const surgeryDate = new Date(user.created_at);

        const mapToEntry = (row: any, isCurrent = false): RecoveryEntry => {
            const date = isCurrent ? new Date() : new Date(row.created_at);
            const diffMs = date.getTime() - surgeryDate.getTime();
            const hoursSinceSurgery = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
            const daysSinceSurgery = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            let tags = { nauseous: false, dizzy: false, vomiting: false };
            if (row.symptoms) {
                const s = Array.isArray(row.symptoms) ? row.symptoms : JSON.parse(row.symptoms);
                if (Array.isArray(s)) {
                    s.forEach((sym: string) => {
                        if (sym.toLowerCase().includes('nause')) tags.nauseous = true;
                        if (sym.toLowerCase().includes('dizzy')) tags.dizzy = true;
                        if (sym.toLowerCase().includes('vomit')) tags.vomiting = true;
                    });
                }
            }

            return {
                id: row.id,
                timestamp: date,
                postOpDay: daysSinceSurgery,
                startHour: hoursSinceSurgery,
                endHour: hoursSinceSurgery,
                heartRate: Number(row.heart_rate) || 0, // Handle potentially null/0 in legacy data
                spo2: Number(row.spo2) || 98,
                temperature: Number(row.temperature) || 37,
                steps: Number(row.steps) || 0,
                minutesMoved: Number(row.minutes_moved) || 0,
                sleepDuration: Number(row.sleep_hours) || 0,
                painScore: Number(row.pain) || 0,
                tags
            };
        };

        const historyEntries = historyRes.rows.map(row => mapToEntry(row));

        // Construct Current Entry
        const currentEntry = mapToEntry({
            created_at: new Date(),
            heart_rate, spo2, temperature, steps, minutes_moved, sleep_hours, pain,
            symptoms: symptoms || []
        }, true);

        // Add current to history for full context analysis
        const allEntries = [...historyEntries, currentEntry];

        // 4. Execute The "Brain" (4-Step Process)

        // Step 1: Calculate Personal Baseline
        const baseline = calculateBaseline(allEntries);

        // Step 2: Calculate Risk Score (for current entry)
        const riskScore = calculateRiskScore(currentEntry, baseline, patient);

        // Step 3: Generate Window Summaries & Trends
        const summaries = generateWindowSummaries(allEntries, baseline, patient);
        const latestSummary = summaries[summaries.length - 1];

        // Step 4: Run Alert Analysis
        const alertResult = runAlertAnalysis(latestSummary, currentEntry);


        // 5. Determine Entry Type (Baseline vs Daily)
        // If startHour <= 6, it counts as Baseline, otherwise Daily.
        // But for UI consistency, we rely on the implementation's "count" check or the time.
        // The Replication guide says baseline is <= 6 hours.
        // We stick to the existing "Type" column logic for database consistency, 
        // but the *Engine* uses the hours.
        const baselineCheck = await query(
            `SELECT count(*) as count FROM readings WHERE patient_id = $1 AND type = 'BASELINE'`,
            [session.id]
        );
        let type = 'DAILY';
        if (parseInt(baselineCheck.rows[0].count) < 2) {
            type = 'BASELINE';
        }

        // 6. Save Reading
        // Mapping new engine outputs to DB columns
        const rsi = 100 - riskScore; // Inverse relationship
        const status = riskScore > RISK_THRESHOLDS.critical ? 'Critical' :
            riskScore > RISK_THRESHOLDS.moderate ? 'Monitor' : 'Stable';

        await query(
            `INSERT INTO readings (patient_id, type, pain, activity, temperature, heart_rate, sleep_hours, spo2, steps, minutes_moved, symptoms, risk_score, rsi, status, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                session.id, type, pain, (steps + minutes_moved), temperature, heart_rate, sleep_hours,
                spo2, steps, minutes_moved, JSON.stringify(symptoms || []),
                riskScore, rsi, status, alertResult.reason
            ]
        );

        return NextResponse.json({
            success: true,
            type,
            analysis: {
                riskScore,
                rsi,
                status,
                explanation: alertResult.reason,
                confidence: 100 // Deterministic = 100% confidence
            }
        });

    } catch (error) {
        console.error('Input error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const baselineCheck = await query(
            `SELECT count(*) as count FROM readings WHERE patient_id = $1 AND type = 'BASELINE'`,
            [session.id]
        );
        const baselineCount = parseInt(baselineCheck.rows[0].count);

        return NextResponse.json({
            needsBaseline: baselineCount < 2,
            baselineCount,
            hasSubmittedToday: false
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
