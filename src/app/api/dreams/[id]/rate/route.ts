import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

/**
 * POST /api/dreams/[id]/rate
 * Submit a star rating for an AI-interpreted dream
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();

        // Auth check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            console.error('[Dream Rate API] Auth failed:', authError);
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const body = await req.json();
        const { rating, feedback, answers } = body;

        // Validate rating
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'التقييم يجب أن يكون بين 1 و 5 نجوم' },
                { status: 400 }
            );
        }

        // Validate feedback length  
        if (feedback && typeof feedback === 'string' && feedback.length > 200) {
            return NextResponse.json(
                { error: 'التعليق يجب ألا يتجاوز 200 حرف' },
                { status: 400 }
            );
        }

        // Find the dream
        const dream = await Dream.findOne({
            _id: id,
            userId: userId
        });

        if (!dream) {
            return NextResponse.json(
                { error: 'الحلم غير موجود أو ليس لديك صلاحية تقييمه' },
                { status: 404 }
            );
        }

        // Check if already rated
        if (dream.rating) {
            return NextResponse.json(
                { error: 'تم تقييم هذا الحلم مسبقاً' },
                { status: 400 }
            );
        }

        // Build feedback string with optional answers
        let fullFeedback = feedback?.trim() || '';
        if (answers && typeof answers === 'object') {
            const answerLines = Object.entries(answers)
                .filter(([_, v]) => v)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n');
            if (answerLines) {
                fullFeedback = answerLines + (fullFeedback ? '\n---\n' + fullFeedback : '');
            }
        }

        // Save rating
        dream.rating = rating;
        dream.ratingFeedback = fullFeedback.substring(0, 500);
        dream.ratedAt = new Date();
        await dream.save();

        console.log(`[Dream Rate API] Dream ${id} rated: ${rating}/5`);

        return NextResponse.json({
            success: true,
            message: 'شكراً لتقييمك! رأيك يساعدنا على التحسين',
            dream: {
                _id: dream._id,
                rating: dream.rating,
                ratingFeedback: dream.ratingFeedback,
                ratedAt: dream.ratedAt
            }
        });

    } catch (error) {
        console.error('[Dream Rate API] Error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء حفظ التقييم' },
            { status: 500 }
        );
    }
}
