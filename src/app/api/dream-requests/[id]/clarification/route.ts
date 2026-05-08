import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { canRequestClarification, validateStatusTransition } from '@/lib/permissions';

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
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { question } = body;

        if (!question || question.trim().length < 10) {
            return NextResponse.json(
                { error: 'يجب أن يكون السؤال 10 أحرف على الأقل' },
                { status: 400 }
            );
        }

        const { data: dreamRequest } = await supabaseAdmin
            .from('dream_requests')
            .select('id, status, user_id, clarification_question')
            .eq('id', id)
            .maybeSingle();

        if (!dreamRequest) {
            return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
        }

        if (dreamRequest.user_id !== userId) {
            return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 });
        }

        const clarificationCheck = canRequestClarification(
            dreamRequest.status,
            dreamRequest.clarification_question
        );

        if (!clarificationCheck.allowed) {
            return NextResponse.json({ error: clarificationCheck.error }, { status: 400 });
        }

        const transitionCheck = validateStatusTransition(
            dreamRequest.status,
            'clarification_requested',
            'user'
        );

        if (!transitionCheck.valid) {
            return NextResponse.json({ error: transitionCheck.error }, { status: 400 });
        }

        const { data: updated, error } = await supabaseAdmin
            .from('dream_requests')
            .update({
                clarification_question: question.trim(),
                clarification_requested_at: new Date().toISOString(),
                status: 'clarification_requested',
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            request: {
                id: updated.id,
                status: updated.status,
                clarificationQuestion: updated.clarification_question,
            },
            message: 'تم إرسال سؤال الاستيضاح بنجاح',
        });

    } catch (error) {
        console.error('Error submitting clarification:', error);
        return NextResponse.json({ error: 'حدث خطأ في إرسال السؤال' }, { status: 500 });
    }
}
