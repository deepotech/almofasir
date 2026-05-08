import { NextRequest, NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { supabaseAdmin } from '@/lib/supabase';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ canUseFreeToday: true, isGuest: true });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(token);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('credits, plan, last_free_dream_at')
            .eq('firebase_uid', decodedToken.uid)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // STRICT: 24-hour rolling window
        const now = new Date();
        const lastFree = user.last_free_dream_at ? new Date(user.last_free_dream_at) : null;

        let canUseFreeToday = true;
        let hoursUntilReset = 0;
        let minutesUntilReset = 0;
        let nextResetTime: Date | null = null;

        if (lastFree) {
            const diffMs = now.getTime() - lastFree.getTime();
            const hoursDiff = diffMs / (1000 * 60 * 60);

            if (hoursDiff < 24) {
                canUseFreeToday = false;
                nextResetTime = new Date(lastFree.getTime() + 24 * 60 * 60 * 1000);
                const remainingMs = nextResetTime.getTime() - now.getTime();
                hoursUntilReset = Math.floor(remainingMs / (1000 * 60 * 60));
                minutesUntilReset = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            }
        }

        return NextResponse.json({
            canUseFreeToday,
            credits: user.credits || 0,
            hoursUntilReset,
            minutesUntilReset,
            nextResetTime: nextResetTime?.toISOString() || null,
            lastFreeDreamAt: user.last_free_dream_at,
            plan: user.plan,
        });
    } catch (error) {
        console.error('[user/usage] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
