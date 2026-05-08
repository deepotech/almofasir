import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            userId = (await verifyIdToken(token)).uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin
        const { data: admin } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('firebase_uid', userId)
            .maybeSingle();

        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { suspend } = body;

        // Find interpreter by id
        const { data: interpreter } = await supabaseAdmin
            .from('interpreters')
            .select('id, user_id, display_name, status')
            .eq('id', id)
            .maybeSingle();

        if (!interpreter) {
            return NextResponse.json({ error: 'Interpreter not found' }, { status: 404 });
        }

        const newStatus = suspend ? 'suspended' : 'active';

        await supabaseAdmin
            .from('interpreters')
            .update({ status: newStatus, is_active: !suspend })
            .eq('id', id);

        // Also update user status
        await supabaseAdmin
            .from('users')
            .update({ status: suspend ? 'suspended' : 'active' })
            .eq('firebase_uid', interpreter.user_id);

        return NextResponse.json({
            success: true,
            interpreter: {
                id: interpreter.id,
                name: interpreter.display_name,
                status: newStatus,
                isActive: !suspend,
            },
            message: suspend ? 'تم تعليق المفسر بنجاح' : 'تم إلغاء تعليق المفسر بنجاح',
        });

    } catch (error) {
        console.error('Error suspending interpreter:', error);
        return NextResponse.json({ error: 'حدث خطأ في تعليق المفسر' }, { status: 500 });
    }
}
