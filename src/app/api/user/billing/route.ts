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

        const { data: user } = await supabaseAdmin
            .from('users')
            .select('plan, credits, subscription_status')
            .eq('firebase_uid', userId)
            .single();

        const { data: transactions } = await supabaseAdmin
            .from('dream_requests')
            .select('id, created_at, interpreter_name, price, currency, status, payment_status')
            .eq('user_id', userId)
            .gt('price', 0)
            .order('created_at', { ascending: false })
            .limit(20);

        return NextResponse.json({
            plan: user?.plan || 'free',
            credits: user?.credits || 0,
            subscriptionStatus: user?.subscription_status || 'inactive',
            transactions: (transactions ?? []).map(t => ({
                id: t.id,
                date: t.created_at,
                description: `تفسير حلم مع ${t.interpreter_name}`,
                amount: t.price,
                currency: t.currency || 'USD',
                status: t.payment_status || 'paid',
                serviceStatus: t.status
            }))
        });
    } catch (error) {
        console.error('Error fetching billing data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
