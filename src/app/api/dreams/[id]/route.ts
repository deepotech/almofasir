import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

initFirebaseAdmin();

async function resolveUserId(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = await getAuth().verifyIdToken(token);
        return decoded.uid;
    } catch {
        if (process.env.NODE_ENV === 'development') {
            try {
                const payload = token.split('.')[1];
                const d = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                return d.user_id || d.sub || null;
            } catch { return null; }
        }
        return null;
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = await resolveUserId(req);
        if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const { data: dream, error } = await supabaseAdmin
            .from('dreams')
            .select('id, title, content, interpretation, interpreter, mood, tags, user_feedback, rating, rating_feedback, created_at')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !dream) {
            return NextResponse.json({ error: 'الحلم غير موجود' }, { status: 404 });
        }

        return NextResponse.json({
            dream: {
                _id:            dream.id,
                title:          dream.title,
                content:        dream.content,
                interpretation: dream.interpretation,
                interpreter:    dream.interpreter,
                mood:           dream.mood,
                tags:           dream.tags || [],
                userFeedback:   dream.user_feedback,
                rating:         dream.rating,
                ratingFeedback: dream.rating_feedback,
                createdAt:      dream.created_at,
            },
        });
    } catch (error) {
        console.error('Error fetching dream:', error);
        return NextResponse.json({ error: 'فشل في جلب بيانات الحلم' }, { status: 500 });
    }
}
