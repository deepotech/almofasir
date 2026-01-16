import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

/**
 * POST /api/orders/[id]/rate
 * Submit a rating and optional feedback for a completed order
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        // Auth check
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
            console.error('[Rate API] Auth failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { rating, feedback } = body;

        // Validate rating
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be a number between 1 and 5' },
                { status: 400 }
            );
        }

        // Find the order
        const order = await DreamRequest.findOne({
            _id: params.id,
            userId: userId
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found or you do not have permission to rate it' },
                { status: 404 }
            );
        }

        // Check if order is completed
        if (order.status !== 'completed') {
            return NextResponse.json(
                { error: 'Can only rate completed orders' },
                { status: 400 }
            );
        }

        // Update rating
        order.rating = rating;
        if (feedback) {
            order.feedback = feedback;
        }
        order.ratedAt = new Date();

        await order.save();

        console.log(`[Rate API] Order ${params.id} rated: ${rating}/5`);

        return NextResponse.json({
            success: true,
            order: {
                _id: order._id,
                rating: order.rating,
                feedback: order.feedback,
                ratedAt: order.ratedAt
            }
        });

    } catch (error) {
        console.error('[Rate API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to submit rating' },
            { status: 500 }
        );
    }
}
