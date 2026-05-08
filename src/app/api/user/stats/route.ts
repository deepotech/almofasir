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
            .select('plan, credits, last_free_dream_at')
            .eq('firebase_uid', userId)
            .single();

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const now = new Date();
        const lastFree = user.last_free_dream_at ? new Date(user.last_free_dream_at) : null;
        let isDailyFreeAvailable = true;
        let nextFreeAt: Date | null = null;

        if (lastFree) {
            const isSameDay = lastFree.getUTCFullYear() === now.getUTCFullYear() &&
                lastFree.getUTCMonth() === now.getUTCMonth() &&
                lastFree.getUTCDate() === now.getUTCDate();

            if (isSameDay) {
                isDailyFreeAvailable = false;
                const tomorrow = new Date();
                tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
                tomorrow.setUTCHours(0, 0, 0, 0);
                nextFreeAt = tomorrow;
            }
        }

        // Get requests stats
        const { data: reqs } = await supabaseAdmin
            .from('dream_requests')
            .select('status, price')
            .eq('user_id', userId);

        let totalRequests = 0;
        let pendingRequests = 0;
        let completedRequests = 0;
        let totalSpent = 0;

        (reqs ?? []).forEach(r => {
            totalRequests++;
            if (['new', 'pending', 'in_progress', 'assigned'].includes(r.status)) pendingRequests++;
            if (['completed', 'answered', 'closed'].includes(r.status)) completedRequests++;
            totalSpent += Number(r.price) || 0;
        });

        return NextResponse.json({
            plan: user.plan || 'free',
            credits: user.credits || 0,
            isDailyFreeAvailable,
            nextFreeAt,
            totalRequests,
            pendingRequests,
            completedRequests,
            totalSpent
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
