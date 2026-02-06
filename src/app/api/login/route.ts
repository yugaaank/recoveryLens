import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { patient_key, patient_code } = body;

        if (!patient_key || !patient_code) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const result = await query(
            `SELECT * FROM patients WHERE patient_key = $1 AND patient_code = $2`,
            [patient_key, patient_code]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const patient = result.rows[0];

        // Create session
        await createSession({ id: patient.id, key: patient.patient_key, code: patient.patient_code });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
