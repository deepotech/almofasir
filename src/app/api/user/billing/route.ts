import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import User from '@/models/User';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            // Dev fallback if needed, or strict fail
            console.error('Auth verification failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch User Details (Plan, Credits)
        const user = await User.findOne({ firebaseUid: userId }).select('plan credits subscriptionStatus');

        // 3. Fetch Transaction History (Paid Dream Requests)
        // We consider any request with price > 0 as a transaction context, 
        // ideally filtering by paymentStatus='paid' if strict, but 'completed' or 'new' with price work too.
        // Let's get all requests that are NOT free (price > 0)
        const transactions = await DreamRequest.find({
            userId,
            price: { $gt: 0 }
        })
            .sort({ createdAt: -1 })
            .select('createdAt interpreterName price currency status paymentStatus')
            .limit(20);

        return NextResponse.json({
            plan: user?.plan || 'free',
            credits: user?.credits || 0,
            subscriptionStatus: user?.subscriptionStatus || 'inactive',
            transactions: transactions.map(t => ({
                id: t._id,
                date: t.createdAt,
                description: `تفسير حلم مع ${t.interpreterName}`,
                amount: t.price,
                currency: t.currency || 'USD',
                status: t.paymentStatus || 'paid', // Default to paid if missing for legacy
                serviceStatus: t.status
            }))
        });

    } catch (error) {
        console.error('Error fetching billing data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
