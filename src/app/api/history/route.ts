import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { DEFAULT_BASELINE_VITALS } from '@/lib/constants';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Fetch User Data
        const userRes = await query('SELECT * FROM patients WHERE id = $1', [session.id]);
        const user = userRes.rows[0];

        // 2. Fetch History (Daily Readings with Analysis)
        const historyRes = await query(
            `SELECT * FROM readings 
       WHERE patient_id = $1 AND type = 'DAILY' 
       ORDER BY created_at ASC`, // Ascending for charts
            [session.id]
        );

        return NextResponse.json({
            user,
            baseline: {
                heart_rate: DEFAULT_BASELINE_VITALS.heart_rate,
                spo2: DEFAULT_BASELINE_VITALS.spo2,
                temperature: parseFloat(DEFAULT_BASELINE_VITALS.temperature.toFixed(1)),
                steps: DEFAULT_BASELINE_VITALS.steps,
                minutes_moved: DEFAULT_BASELINE_VITALS.minutes_moved,
                pain: parseFloat(DEFAULT_BASELINE_VITALS.pain.toFixed(1)),
                sleep_hours: parseFloat(DEFAULT_BASELINE_VITALS.sleep_hours.toFixed(1)),
            },
            history: historyRes.rows
        });

    } catch (error) {
        console.error('History API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
