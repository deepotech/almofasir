import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { validateStatusTransition } from '@/lib/permissions';

initFirebaseAdmin();

/**
 * POST /api/interpreter/dream-requests/[id]/accept - Accept a request
 * 
 * Transition: new → in_progress
 * 
 * Interpreter Rules:
 * - Can only accept requests assigned to them
 * - Request must be in 'new' status
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

        // Validate status transition
        const transitionCheck = validateStatusTransition(
            dreamRequest.status,
            'in_progress',
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
                status: 'in_progress',
                acceptedAt: new Date()
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            request: {
                id: updatedRequest!._id,
                status: updatedRequest!.status,
                acceptedAt: updatedRequest!.acceptedAt
            },
            message: 'تم قبول الطلب بنجاح'
        });

    } catch (error) {
        console.error('Error accepting request:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في قبول الطلب' },
            { status: 500 }
        );
    }
}
