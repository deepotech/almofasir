import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            userId = (await getAuth().verifyIdToken(token)).uid;
        } catch {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const d = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
                    userId = d.user_id || d.sub;
                } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '5');

        const { data: requests } = await supabaseAdmin
            .from('dream_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        const mappedRequests = (requests ?? []).map(r => ({
            _id: r.id,
            userId: r.user_id,
            type: r.type,
            dreamText: r.dream_text,
            context: r.context,
            status: r.status,
            createdAt: r.created_at,
            interpreterName: r.interpreter_name,
            lockedPrice: r.locked_price,
            interpretationText: r.interpretation_text
        }));

        return NextResponse.json({ requests: mappedRequests });

    } catch (error) {
        console.error('Error fetching user requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
