import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { validateStatusTransition } from '@/lib/permissions';

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
        const { answer } = body;

        if (!answer || answer.trim().length < 20) {
            return NextResponse.json(
                { error: 'يجب أن تكون الإجابة 20 حرفاً على الأقل' },
                { status: 400 }
            );
        }

        // Verify interpreter
        const { data: interpreter } = await supabaseAdmin
            .from('interpreters')
            .select('id, status')
            .eq('user_id', userId)
            .maybeSingle();

        if (!interpreter) {
            return NextResponse.json({ error: 'ليس لديك صلاحية المفسر' }, { status: 403 });
        }

        if (interpreter.status === 'suspended') {
            return NextResponse.json({ error: 'حسابك معلق' }, { status: 403 });
        }

        // Get dream request
        const { data: dreamRequest } = await supabaseAdmin
            .from('dream_requests')
            .select('id, status, interpreter_user_id, clarification_question, clarification_answer')
            .eq('id', id)
            .maybeSingle();

        if (!dreamRequest) {
            return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
        }

        if (dreamRequest.interpreter_user_id !== userId) {
            return NextResponse.json({ error: 'هذا الطلب غير مخصص لك' }, { status: 403 });
        }

        if (!dreamRequest.clarification_question) {
            return NextResponse.json({ error: 'لا يوجد سؤال استيضاح للإجابة عليه' }, { status: 400 });
        }

        if (dreamRequest.clarification_answer) {
            return NextResponse.json({ error: 'تم الإجابة على السؤال مسبقاً' }, { status: 400 });
        }

        const transitionCheck = validateStatusTransition(dreamRequest.status, 'closed', 'interpreter');
        if (!transitionCheck.valid) {
            return NextResponse.json({ error: transitionCheck.error }, { status: 400 });
        }

        const { data: updatedRequest, error } = await supabaseAdmin
            .from('dream_requests')
            .update({
                clarification_answer: answer.trim(),
                clarification_answered_at: new Date().toISOString(),
                status: 'closed',
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            request: {
                id: updatedRequest.id,
                status: updatedRequest.status,
                clarificationAnswer: updatedRequest.clarification_answer,
                closedAt: updatedRequest.updated_at,
            },
            message: 'تم إرسال الإجابة بنجاح',
        });

    } catch (error) {
        console.error('Error answering clarification:', error);
        return NextResponse.json({ error: 'حدث خطأ في إرسال الإجابة' }, { status: 500 });
    }
}
