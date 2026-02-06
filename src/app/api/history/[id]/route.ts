import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership and delete
        const result = await query(
            `DELETE FROM readings WHERE id = $1::uuid AND patient_id = $2 RETURNING id`,
            [id.trim(), session.id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Entry not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true, deletedId: id });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
