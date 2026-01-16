import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { validateStatusTransition } from '@/lib/permissions';

initFirebaseAdmin();

/**
 * POST /api/interpreter/dream-requests/[id]/clarification-answer - Answer clarification
 * 
 * Transition: clarification_requested → closed
 * 
 * Interpreter Rules:
 * - Can only answer clarification for assigned requests
 * - Request must be in 'clarification_requested' status
 * - Only ONE answer allowed
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
        const { answer } = body;

        if (!answer || answer.trim().length < 20) {
            return NextResponse.json(
                { error: 'يجب أن تكون الإجابة 20 حرفاً على الأقل' },
                { status: 400 }
            );
        }

        // Verify user is an interpreter
        const interpreter = await Interpreter.findOne({ userId });
        if (!interpreter) {
            return NextResponse.json({ error: 'ليس لديك صلاحية المفسر' }, { status: 403 });
        }

        if (interpreter.status === 'suspended') {
            return NextResponse.json({ error: 'حسابك معلق' }, { status: 403 });
        }

        // Get dream request
        const dreamRequest = await DreamRequest.findById(id);
        if (!dreamRequest) {
            return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
        }

        // Verify this request is assigned to this interpreter
        if (dreamRequest.interpreterUserId !== userId) {
            return NextResponse.json({ error: 'هذا الطلب غير مخصص لك' }, { status: 403 });
        }

        // Check clarification exists
        if (!dreamRequest.clarificationQuestion) {
            return NextResponse.json(
                { error: 'لا يوجد سؤال استيضاح للإجابة عليه' },
                { status: 400 }
            );
        }

        // Check not already answered
        if (dreamRequest.clarificationAnswer) {
            return NextResponse.json(
                { error: 'تم الإجابة على السؤال مسبقاً' },
                { status: 400 }
            );
        }

        // Validate status transition
        const transitionCheck = validateStatusTransition(
            dreamRequest.status,
            'closed',
            'interpreter'
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
                clarificationAnswer: answer.trim(),
                clarificationAnsweredAt: new Date(),
                status: 'closed',
                closedAt: new Date()
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            request: {
                id: updatedRequest!._id,
                status: updatedRequest!.status,
                clarificationAnswer: updatedRequest!.clarificationAnswer,
                closedAt: updatedRequest!.closedAt
            },
            message: 'تم إرسال الإجابة بنجاح'
        });

    } catch (error) {
        console.error('Error answering clarification:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في إرسال الإجابة' },
            { status: 500 }
        );
    }
}
