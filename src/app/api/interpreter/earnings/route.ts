import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            userId = (await verifyIdToken(token)).uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: transactions } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfLastMonth = lastMonthStart.toISOString();
        
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        const endOfLastMonth = lastMonthEnd.toISOString();

        const { data: currentMonthEarningsData } = await supabaseAdmin
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'earning')
            .eq('status', 'completed')
            .gte('created_at', startOfMonth);

        const { data: lastMonthEarningsData } = await supabaseAdmin
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'earning')
            .eq('status', 'completed')
            .gte('created_at', startOfLastMonth)
            .lte('created_at', endOfLastMonth);

        let thisMonthTotal = 0;
        (currentMonthEarningsData || []).forEach(t => thisMonthTotal += t.amount);

        let lastMonthTotal = 0;
        (lastMonthEarningsData || []).forEach(t => lastMonthTotal += t.amount);

        let percentageChange = 0;
        if (lastMonthTotal > 0) {
            percentageChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        } else if (thisMonthTotal > 0) {
            percentageChange = 100;
        }

        // Map transactions to standard camelCase
        const mappedTx = (transactions || []).map(t => ({
            _id: t.id,
            userId: t.user_id,
            type: t.type,
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            description: t.description,
            relatedEntityId: t.related_entity_id,
            relatedEntityType: t.related_entity_type,
            createdAt: t.created_at
        }));

        return NextResponse.json({
            transactions: mappedTx,
            thisMonthTotal,
            lastMonthTotal,
            percentageChange
        });

    } catch (error) {
        console.error('Error fetching interpreter earnings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
