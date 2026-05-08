import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { validateStatusTransition } from '@/lib/permissions';

initFirebaseAdmin();

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        let userId: string;
        try { userId = (await verifyIdToken(token)).uid; } 
        catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

        const { data: interpreter } = await supabaseAdmin.from('interpreters').select('status').eq('user_id', userId).single();
        if (!interpreter || interpreter.status === 'suspended') return NextResponse.json({ error: 'ليس لديك صلاحية المفسر' }, { status: 403 });

        const { data: dreamRequest } = await supabaseAdmin.from('dream_requests').select('status, interpreter_user_id').eq('id', id).single();
        if (!dreamRequest) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
        if (dreamRequest.interpreter_user_id !== userId) return NextResponse.json({ error: 'هذا الطلب غير مخصص لك' }, { status: 403 });

        const transitionCheck = validateStatusTransition(dreamRequest.status, 'in_progress', 'interpreter');
        if (!transitionCheck.valid) return NextResponse.json({ error: transitionCheck.error }, { status: 400 });

        const { data: updatedRequest, error } = await supabaseAdmin
            .from('dream_requests')
            .update({ status: 'in_progress', accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            request: { id: updatedRequest.id, status: updatedRequest.status, acceptedAt: updatedRequest.accepted_at },
            message: 'تم قبول الطلب بنجاح'
        });

    } catch (error) {
        console.error('Error accepting request:', error);
        return NextResponse.json({ error: 'حدث خطأ في قبول الطلب' }, { status: 500 });
    }
}
