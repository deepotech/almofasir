import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

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
                console.warn('[API /api/user/requests GET] Auth verification failed, falling back to insecure decoding for development.');
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    if (!userId) throw new Error('No user_id in token');
                } catch (decodeError) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '5');

        const requests = await DreamRequest.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);

        return NextResponse.json({ requests });

    } catch (error) {
        console.error('Error fetching user requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
