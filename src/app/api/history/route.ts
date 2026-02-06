import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Fetch User Data
        const userRes = await query('SELECT * FROM patients WHERE id = $1', [session.id]);
        const user = userRes.rows[0];

        // 2. Fetch Baseline Average
        const baselineRes = await query(
            `SELECT avg(heart_rate) as heart_rate, avg(spo2) as spo2, avg(temperature) as temperature, 
              avg(steps) as steps, avg(minutes_moved) as minutes_moved, avg(pain) as pain, avg(sleep_hours) as sleep_hours
       FROM readings WHERE patient_id = $1 AND type = 'BASELINE'`,
            [session.id]
        );
        const baseline = baselineRes.rows[0];

        // 3. Fetch History (Daily Readings with Analysis)
        const historyRes = await query(
            `SELECT * FROM readings 
       WHERE patient_id = $1 AND type = 'DAILY' 
       ORDER BY created_at ASC`, // Ascending for charts
            [session.id]
        );

        return NextResponse.json({
            user,
            baseline: {
                heart_rate: Math.round(Number(baseline.heart_rate) || 0),
                spo2: Math.round(Number(baseline.spo2) || 98),
                temperature: parseFloat((Number(baseline.temperature) || 37).toFixed(1)),
                steps: Math.round(Number(baseline.steps) || 0),
                minutes_moved: Math.round(Number(baseline.minutes_moved) || 0),
                pain: parseFloat((Number(baseline.pain) || 0).toFixed(1)),
                sleep_hours: parseFloat((Number(baseline.sleep_hours) || 0).toFixed(1)),
            },
            history: historyRes.rows
        });

    } catch (error) {
        console.error('History API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
