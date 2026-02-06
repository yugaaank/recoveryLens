import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ user: null });
    }

    try {
        // Fetch User
        const userResult = await query(
            'SELECT id, name, age, gender, surgery, patient_key, patient_code FROM patients WHERE id = $1',
            [session.id]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ user: null });
        }

        const user = userResult.rows[0];

        // Fetch Latest Analysis (Daily only)
        const analysisResult = await query(
            `SELECT risk_score, rsi, status, explanation, created_at 
             FROM readings 
             WHERE patient_id = $1 AND type = 'DAILY'
             ORDER BY created_at DESC 
             LIMIT 1`,
            [session.id]
        );

        const latestAnalysis = analysisResult.rows.length > 0 ? analysisResult.rows[0] : null;

        return NextResponse.json({
            user,
            analysis: latestAnalysis
        });

    } catch (e) {
        console.error('Me API Error:', e);
        return NextResponse.json({ user: session });
    }
}
