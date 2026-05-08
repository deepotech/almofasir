import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            userId = (await verifyIdToken(token)).uid;
        } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

        const { data: interpreter } = await supabaseAdmin.from('interpreters').select('status').eq('user_id', userId).single();
        if (!interpreter || interpreter.status === 'suspended') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status');

        let query = supabaseAdmin
            .from('dream_requests')
            .select('id, dream_text, status, locked_price, currency, created_at, payment_status')
            .eq('interpreter_user_id', userId)
            .in('payment_status', ['paid', 'released'])
            .order('created_at', { ascending: false });

        if (statusParam) query = query.eq('status', statusParam);

        const { data: requests, error } = await query;
        if (error) throw error;

        // Ensure uniqueness (equivalent to the Mongoose aggregation $group step)
        const uniqueRequests = [];
        const seen = new Set();
        for (const req of (requests || [])) {
            if (!seen.has(req.id)) {
                seen.add(req.id);
                uniqueRequests.push(req);
            }
        }

        const mappedRequests = uniqueRequests.map(r => ({
            _id: r.id,
            dreamText: r.dream_text,
            status: r.status,
            price: r.locked_price,
            currency: r.currency || 'USD',
            createdAt: r.created_at,
            paymentStatus: r.payment_status
        }));

        return NextResponse.json({ requests: mappedRequests });

    } catch (error) {
        console.error('Error fetching interpreter requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
