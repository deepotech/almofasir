import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import User from '@/models/User';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                } catch (e) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 2. Fetch Order
        const { id } = await params;
        const order = await DreamRequest.findById(id);

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 3. Security Check: Order Owner must match Requester
        if (order.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            request: order // Keeping structure consistent with frontend "request" expectation
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
