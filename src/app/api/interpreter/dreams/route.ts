import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decoded.user_id || decoded.sub;
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Verify user is an interpreter
        const { data: interpreter } = await supabaseAdmin
            .from('interpreters')
            .select('id, user_id, status')
            .eq('user_id', userId)
            .maybeSingle();

        if (!interpreter) {
            return NextResponse.json({ error: 'Not an interpreter' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status');

        // Map frontend status to DB status
        const statusMap: Record<string, string[]> = {
            'pending_interpretation': ['assigned', 'new'],
            'in_progress': ['in_progress'],
            'completed': ['completed'],
        };

        let query = supabaseAdmin
            .from('dream_requests')
            .select('*')
            .eq('interpreter_user_id', userId)
            .eq('type', 'HUMAN')
            .in('payment_status', ['paid', 'released'])
            .order('created_at', { ascending: false });

        if (statusParam && statusMap[statusParam]) {
            query = query.in('status', statusMap[statusParam]);
        } else if (statusParam) {
            query = query.eq('status', statusParam);
        }

        const { data: dreams, error } = await query;
        if (error) throw error;

        const mappedDreams = (dreams ?? []).map((dream: any) => ({
            _id: dream.id,
            content: dream.dream_text,
            context: dream.context || {},
            price: dream.locked_price || dream.price || 0,
            interpreterEarning: (dream.locked_price || dream.price || 0) * 0.8,
            status: mapStatusToFrontend(dream.status),
            deadline: calculateDeadline(dream.created_at),
            createdAt: dream.created_at,
        }));

        // Counts
        const [pendingRes, inProgressRes, completedRes] = await Promise.all([
            supabaseAdmin
                .from('dream_requests')
                .select('*', { count: 'exact', head: true })
                .eq('interpreter_user_id', userId)
                .eq('type', 'HUMAN')
                .in('status', ['assigned', 'new'])
                .in('payment_status', ['paid', 'released']),
            supabaseAdmin
                .from('dream_requests')
                .select('*', { count: 'exact', head: true })
                .eq('interpreter_user_id', userId)
                .eq('type', 'HUMAN')
                .eq('status', 'in_progress')
                .in('payment_status', ['paid', 'released']),
            supabaseAdmin
                .from('dream_requests')
                .select('*', { count: 'exact', head: true })
                .eq('interpreter_user_id', userId)
                .eq('type', 'HUMAN')
                .eq('status', 'completed'),
        ]);

        const stats = {
            pending: pendingRes.count ?? 0,
            inProgress: inProgressRes.count ?? 0,
            completed: completedRes.count ?? 0,
        };

        return NextResponse.json({ dreams: mappedDreams, stats });

    } catch (error) {
        console.error('Error fetching interpreter dreams:', error);
        return NextResponse.json({ error: 'Failed to fetch dreams' }, { status: 500 });
    }
}

function mapStatusToFrontend(status: string): string {
    const map: Record<string, string> = {
        'new': 'pending_interpretation',
        'assigned': 'pending_interpretation',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'expired',
    };
    return map[status] || 'pending_interpretation';
}

function calculateDeadline(createdAt: string): Date {
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + 24);
    return deadline;
}
