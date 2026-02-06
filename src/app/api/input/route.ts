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
            spo2,
            start_hour,
            end_hour,
            overwrite,
            overwrite_key
        } = body;

        // 1. Validate Ranges (Keep existing validation)
        if (pain < 0 || pain > 10) return NextResponse.json({ error: 'Pain must be 0-10' }, { status: 400 });
        if (heart_rate < 30 || heart_rate > 220) return NextResponse.json({ error: 'Invalid Heart Rate' }, { status: 400 });
        if (spo2 < 80 || spo2 > 100) return NextResponse.json({ error: 'Invalid SpO2' }, { status: 400 });
        if (temperature < 34 || temperature > 41) return NextResponse.json({ error: 'Invalid Temperature' }, { status: 400 });

        // 2. Fetch User Context
        const userRes = await query('SELECT * FROM patients WHERE id = $1', [session.id]);
        const user = userRes.rows[0];

        const patient: Patient = {
            id: user.id,
            surgeryType: user.surgery || 'General'
        };

        // 3. Optional time range override
        let overrideDate: Date | null = null;
        let rangeStart: Date | null = null;
        let rangeEnd: Date | null = null;
        const startHourNum = start_hour !== null && start_hour !== undefined && start_hour !== '' ? Number(start_hour) : null;
        const endHourNum = end_hour !== null && end_hour !== undefined && end_hour !== '' ? Number(end_hour) : null;
        if (startHourNum !== null && endHourNum !== null && Number.isFinite(startHourNum) && Number.isFinite(endHourNum)) {
            const startHour = startHourNum;
            const endHour = endHourNum;
            if (startHour < 0 || endHour < 0 || endHour <= startHour) {
                return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
            }
            const surgeryDate = new Date(user.created_at);
            rangeStart = new Date(surgeryDate.getTime() + startHour * 60 * 60 * 1000);
            rangeEnd = new Date(surgeryDate.getTime() + endHour * 60 * 60 * 1000);
            overrideDate = rangeEnd;
        }

        if (overwrite && !overwrite_key) {
            return NextResponse.json({ error: 'Patient key required for overwrite' }, { status: 400 });
        }

        if (overwrite && overwrite_key && String(overwrite_key) !== String(user.patient_key)) {
            return NextResponse.json({ error: 'Invalid patient key for overwrite' }, { status: 403 });
        }

        // 4. Fetch Full History for Deterministic Baseline & Trend Analysis
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

        let historyEntries = historyRes.rows.map(row => mapToEntry(row));

        // If time range provided, remove any existing entries in range from analysis
        if (rangeStart && rangeEnd) {
            historyEntries = historyEntries.filter((entry) => {
                const t = new Date(entry.timestamp).getTime();
                return !(t >= rangeStart!.getTime() && t <= rangeEnd!.getTime());
            });
        }

        // Construct Current Entry
        const currentEntry = mapToEntry({
            created_at: overrideDate || new Date(),
            heart_rate, spo2, temperature, steps, minutes_moved, sleep_hours, pain,
            symptoms: symptoms || []
        }, true);

        // Add current to history for full context analysis
        const allEntries = [...historyEntries, currentEntry];

        // 4. Execute The "Brain" (4-Step Process)

        // Step 1: Calculate Personal Baseline
        const baseline = calculateBaseline(allEntries);

        // Step 2: Calculate Risk Score (for current entry)
        const riskScore = calculateRiskScore(currentEntry, baseline, patient, allEntries);

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

        // 6. Save Reading (insert or overwrite)
        // Mapping new engine outputs to DB columns
        const rsi = 100 - riskScore; // Inverse relationship
        const status = riskScore > RISK_THRESHOLDS.critical ? 'Critical' :
            riskScore > RISK_THRESHOLDS.moderate ? 'Monitor' : 'Stable';

        let overwritten = false;
        if (rangeStart && rangeEnd) {
            const existingRes = await query(
                `SELECT id FROM readings WHERE patient_id = $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at DESC LIMIT 1`,
                [session.id, rangeStart, rangeEnd]
            );
            const existing = existingRes.rows[0];

            if (existing && !overwrite) {
                return NextResponse.json({ error: 'Entry exists in this time range. Enable overwrite with patient key.' }, { status: 409 });
            }

            if (existing && overwrite) {
                await query(
                    `UPDATE readings SET pain = $1, activity = $2, temperature = $3, heart_rate = $4, sleep_hours = $5, spo2 = $6, steps = $7, minutes_moved = $8, symptoms = $9, risk_score = $10, rsi = $11, status = $12, explanation = $13, created_at = $14 WHERE id = $15`,
                    [
                        pain, (steps + minutes_moved), temperature, heart_rate, sleep_hours,
                        spo2, steps, minutes_moved, JSON.stringify(symptoms || []),
                        riskScore, rsi, status, alertResult.reason, overrideDate || new Date(), existing.id
                    ]
                );
                overwritten = true;
            }
        }

        if (!overwritten) {
            await query(
                `INSERT INTO readings (patient_id, type, pain, activity, temperature, heart_rate, sleep_hours, spo2, steps, minutes_moved, symptoms, risk_score, rsi, status, explanation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                [
                    session.id, type, pain, (steps + minutes_moved), temperature, heart_rate, sleep_hours,
                    spo2, steps, minutes_moved, JSON.stringify(symptoms || []),
                    riskScore, rsi, status, alertResult.reason, overrideDate || new Date()
                ]
            );
        }

        return NextResponse.json({
            success: true,
            type,
            analysis: {
                riskScore,
                rsi,
                status,
                explanation: alertResult.reason,
                confidence: 100 // Deterministic = 100% confidence
            },
            overwritten
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
