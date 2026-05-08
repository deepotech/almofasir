import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

// ── Auth helper ─────────────────────────────────────────────
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
                const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                return decoded.user_id || decoded.sub || null;
            } catch { return null; }
        }
        return null;
    }
}

// ── GET /api/dreams ─────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const page  = parseInt(searchParams.get('page')  || '1');
        const from  = (page - 1) * limit;

        // Fetch from dream_requests (unified orders table)
        const { data: requests, error, count } = await supabaseAdmin
            .from('dream_requests')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);

        if (error) throw error;

        const mappedDreams = (requests ?? []).map((r: any) => ({
            _id:     r.id,
            userId:  r.user_id,
            title:   (r.dream_text as string).split(' ').slice(0, 5).join(' ') + '...',
            content: r.dream_text,
            date:    r.created_at,
            status:  r.status === 'completed' ? 'completed' : 'pending',
            interpretation: r.status === 'completed' ? {
                summary:       (r.interpretation_text as string)?.substring(0, 100) + '...',
                humanResponse: r.interpretation_text,
                aiGenerated:   r.type === 'AI',
            } : undefined,
            type: r.type || 'HUMAN',
            tags: [],
        }));

        return NextResponse.json({
            dreams: mappedDreams,
            pagination: {
                total: count ?? 0,
                page,
                limit,
                pages: Math.ceil((count ?? 0) / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching dreams:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ── POST /api/dreams ─────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { title, content, mood, date, interpreter, interpretation, tags, status, context } = body;

        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

        const { data: dream, error } = await supabaseAdmin
            .from('dreams')
            .insert({
                user_id:         userId,
                title:           title || 'بدون عنوان',
                content,
                mood:            mood || 'neutral',
                date:            date || new Date().toISOString(),
                interpreter,
                status:          status || 'pending',
                interpretation,
                tags,
                social_status:   context?.socialStatus,
                dominant_feeling: context?.dominantFeeling,
                gender:          context?.gender,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ dream }, { status: 201 });
    } catch (error) {
        console.error('Error creating dream:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
