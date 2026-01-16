import { NextRequest, NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({
                canUseFreeToday: true, // Guests allow 1 free (handled by client storage usually, but here checking auth user)
                isGuest: true
            });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(token);
        } catch (e) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // STRICT: 24-hour rolling window (matching accessControl.ts)
        const now = new Date();
        const lastFree = user.lastFreeDreamAt ? new Date(user.lastFreeDreamAt) : null;

        let canUseFreeToday = true;
        let hoursUntilReset = 0;
        let minutesUntilReset = 0;
        let nextResetTime: Date | null = null;

        if (lastFree) {
            const diffMs = now.getTime() - lastFree.getTime();
            const hoursDiff = diffMs / (1000 * 60 * 60);

            if (hoursDiff < 24) {
                canUseFreeToday = false;

                // Calculate exact time until reset
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
            lastFreeDreamAt: user.lastFreeDreamAt,
            plan: user.plan
        });

    } catch (error) {
        console.error('Usage check error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
