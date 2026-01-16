import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { canRequestClarification, validateStatusTransition } from '@/lib/permissions';

initFirebaseAdmin();

/**
 * POST /api/dream-requests/[id]/clarification - Ask ONE clarification question
 * 
 * User Rules:
 * - Only allowed when status = 'completed'
 * - Only ONE question allowed (if clarification_question exists, reject)
 * - Sets status = 'clarification_requested'
 */
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        await dbConnect();

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            console.error('Auth failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { question } = body;

        if (!question || question.trim().length < 10) {
            return NextResponse.json(
                { error: 'يجب أن يكون السؤال 10 أحرف على الأقل' },
                { status: 400 }
            );
        }

        // Get dream request
        const dreamRequest = await DreamRequest.findById(id);
        if (!dreamRequest) {
            return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
        }

        // Verify ownership
        if (dreamRequest.userId !== userId) {
            return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 });
        }

        // Check if clarification is allowed
        const clarificationCheck = canRequestClarification(
            dreamRequest.status,
            dreamRequest.clarificationQuestion
        );

        if (!clarificationCheck.allowed) {
            return NextResponse.json(
                { error: clarificationCheck.error },
                { status: 400 }
            );
        }

        // Validate status transition
        const transitionCheck = validateStatusTransition(
            dreamRequest.status,
            'clarification_requested',
            'user'
        );

        if (!transitionCheck.valid) {
            return NextResponse.json(
                { error: transitionCheck.error },
                { status: 400 }
            );
        }

        // Update request
        const updatedRequest = await DreamRequest.findByIdAndUpdate(
            id,
            {
                clarificationQuestion: question.trim(),
                clarificationRequestedAt: new Date(),
                status: 'clarification_requested'
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            request: {
                id: updatedRequest!._id,
                status: updatedRequest!.status,
                clarificationQuestion: updatedRequest!.clarificationQuestion
            },
            message: 'تم إرسال سؤال الاستيضاح بنجاح'
        });

    } catch (error) {
        console.error('Error submitting clarification:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في إرسال السؤال' },
            { status: 500 }
        );
    }
}
