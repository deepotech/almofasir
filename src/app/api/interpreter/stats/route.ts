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
            const decoded = await verifyIdToken(token);
            userId = decoded.uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Aggregate interpreter stats from dream_requests table
        const { data: allRequests, error } = await supabaseAdmin
            .from('dream_requests')
            .select('status, interpreter_earning, payment_status')
            .eq('interpreter_user_id', userId);

        if (error) throw error;

        const requests = allRequests ?? [];
        const terminalStatuses = ['completed', 'closed'];

        const totalEarnings = requests
            .filter(r => terminalStatuses.includes(r.status))
            .reduce((sum, r) => sum + (r.interpreter_earning || 0), 0);

        const completedRequests = requests.filter(r => terminalStatuses.includes(r.status)).length;
        const pendingRequests = requests.filter(r => ['new', 'assigned', 'in_progress'].includes(r.status)).length;
        const totalRequests = requests.length;

        return NextResponse.json({
            balance: totalEarnings,
            totalEarnings,
            totalRequests,
            completedRequests,
            pendingRequests,
        });
    } catch (error) {
        console.error('[interpreter/stats] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
