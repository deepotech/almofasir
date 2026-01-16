import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';

initFirebaseAdmin();

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
            // Dev fallback
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decoded.user_id || decoded.sub;
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { id } = await params;
        const { liked, cameTrue } = await req.json();

        // Find and update the dream
        const dream = await Dream.findOneAndUpdate(
            { _id: id, userId },
            {
                $set: {
                    'userFeedback.liked': liked,
                    'userFeedback.cameTrue': cameTrue,
                    'userFeedback.feedbackDate': new Date()
                }
            },
            { new: true }
        );

        if (!dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            feedback: dream.userFeedback
        });

    } catch (error) {
        console.error('Error saving feedback:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
