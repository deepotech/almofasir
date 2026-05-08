import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

initFirebaseAdmin();

async function resolveUserId(req: NextRequest): Promise<string | null> {
    const h = req.headers.get('Authorization');
    if (!h?.startsWith('Bearer ')) return null;
    const token = h.split('Bearer ')[1];
    try { return (await getAuth().verifyIdToken(token)).uid; }
    catch {
        if (process.env.NODE_ENV !== 'development') return null;
        try {
            const d = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
            return d.user_id || d.sub || null;
        } catch { return null; }
    }
}

// POST /api/dreams/[id]/feedback
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = await resolveUserId(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { liked, cameTrue } = await req.json();

        const { data: dream, error } = await supabaseAdmin
            .from('dreams')
            .update({
                user_feedback: { liked, cameTrue, feedbackDate: new Date().toISOString() },
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select('user_feedback')
            .single();

        if (error || !dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, feedback: dream.user_feedback });
    } catch (error) {
        console.error('Error saving feedback:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
