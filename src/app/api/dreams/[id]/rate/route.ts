import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;
        try {
            const decoded = await verifyIdToken(token);
            userId = decoded.uid;
        } catch {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const body = await req.json();
        const { rating, feedback, answers } = body;

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'التقييم يجب أن يكون بين 1 و 5 نجوم' }, { status: 400 });
        }
        if (feedback && typeof feedback === 'string' && feedback.length > 200) {
            return NextResponse.json({ error: 'التعليق يجب ألا يتجاوز 200 حرف' }, { status: 400 });
        }

        // Check if already rated
        const { data: existing } = await supabaseAdmin
            .from('dreams')
            .select('rating')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'الحلم غير موجود' }, { status: 404 });
        }
        if (existing.rating) {
            return NextResponse.json({ error: 'تم تقييم هذا الحلم مسبقاً' }, { status: 400 });
        }

        // Build full feedback
        let fullFeedback = feedback?.trim() || '';
        if (answers && typeof answers === 'object') {
            const lines = Object.entries(answers)
                .filter(([, v]) => v)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n');
            if (lines) fullFeedback = lines + (fullFeedback ? '\n---\n' + fullFeedback : '');
        }

        const { data: updated, error } = await supabaseAdmin
            .from('dreams')
            .update({
                rating,
                rating_feedback: fullFeedback.substring(0, 500),
                rated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select('id, rating, rating_feedback, rated_at')
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'شكراً لتقييمك! رأيك يساعدنا على التحسين',
            dream: { _id: updated.id, rating: updated.rating, ratingFeedback: updated.rating_feedback, ratedAt: updated.rated_at },
        });
    } catch (error) {
        console.error('[Dream Rate API] Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء حفظ التقييم' }, { status: 500 });
    }
}
