import { NextRequest, NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';

// Initialize Firebase Admin
initFirebaseAdmin();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verify authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            // Development fallback - matching the pattern in main dreams route
            if (process.env.NODE_ENV === 'development') {
                console.warn('[API /api/dreams/[id] GET] Auth verification failed, falling back to insecure decoding for development.');
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    if (!userId) throw new Error('No user_id in token');
                } catch (decodeError) {
                    console.error('[API /api/dreams/[id] GET] Fallback decode failed:', decodeError);
                    return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
                }
            } else {
                console.error('Auth verification failed:', authError);
                return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
            }
        }

        await dbConnect();

        const dream = await Dream.findOne({
            _id: id,
            userId: userId
        });

        if (!dream) {
            return NextResponse.json({ error: 'الحلم غير موجود' }, { status: 404 });
        }

        return NextResponse.json({
            dream: {
                _id: dream._id,
                title: dream.title,
                content: dream.content,
                interpretation: dream.interpretation,
                interpreter: dream.interpreter,
                mood: dream.mood,
                tags: dream.tags || [],
                userFeedback: dream.userFeedback,
                rating: dream.rating,
                ratingFeedback: dream.ratingFeedback,
                createdAt: dream.createdAt || dream.date
            }
        });

    } catch (error) {
        console.error('Error fetching dream:', error);
        return NextResponse.json(
            { error: 'فشل في جلب بيانات الحلم' },
            { status: 500 }
        );
    }
}
