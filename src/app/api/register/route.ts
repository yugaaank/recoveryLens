import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/lib/auth';

function generatePatientKey() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function generatePatientCode() {
    return 'P' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, age, gender, surgery } = body;

        if (!name || !age || !gender || !surgery) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate credentials
        // Note: In a real app, ensure uniqueness for patient_key loop
        let patientKey = generatePatientKey();
        const patientCode = generatePatientCode();

        // Simple check loop (not robust for high concurrency but okay for demo)
        // Actually relying on unique constraint to fail and retry is better but for now let's just insert
        // If it fails on key collision, we should retry.

        // Attempt insert
        try {
            const result = await query(
                `INSERT INTO patients (name, age, gender, surgery, patient_key, patient_code) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
                [name, age, gender, surgery, patientKey, patientCode]
            );

            const patient = result.rows[0];

            // Create session
            await createSession({ id: patient.id, key: patient.patient_key, code: patient.patient_code });

            return NextResponse.json({
                success: true,
                credentials: {
                    patient_key: patient.patient_key,
                    patient_code: patient.patient_code
                }
            });

        } catch (dbError: any) {
            // Handle unique constraint violation for patient_key if strictly enforced
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'System busy (key collision), please try again' }, { status: 409 });
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
