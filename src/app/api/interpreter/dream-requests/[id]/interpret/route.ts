import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { getSettings } from '@/models/PlatformSettings';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

// Dummy Notification Function - Replace with real implementation later
async function sendNotification(userId: string, title: string, message: string) {
    console.log(`[Notification] To User ${userId}: ${title} - ${message}`);
    // Check if Notification model exists and save it
    try {
        const { default: Notification } = await import('@/models/Notification');
        if (Notification) {
            await Notification.create({
                userId,
                title,
                message,
                type: 'interpretation_completed',
                read: false,
                createdAt: new Date()
            });
        }
    } catch (e) {
        console.warn('Notification model not found or error:', e);
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { interpretationText } = body;

        if (!interpretationText || interpretationText.trim().length < 50) {
            return NextResponse.json({ error: 'يجب أن يكون التفسير 50 حرفاً على الأقل' }, { status: 400 });
        }

        // Verify Interpreter
        const interpreter = await Interpreter.findOne({ userId });
        if (!interpreter || interpreter.status === 'suspended') {
            return NextResponse.json({ error: 'Interpreter not active' }, { status: 403 });
        }

        // Find Request
        const dreamRequest = await DreamRequest.findById(id);
        if (!dreamRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (dreamRequest.interpreterUserId !== userId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // STRICT STATUS CHECK: Must be 'in_progress' to complete
        // Transition: in_progress -> completed
        if (dreamRequest.status !== 'in_progress') {
            // Allow retry if already completed (network issues), but don't re-process money
            if (dreamRequest.status === 'completed') {
                return NextResponse.json({ message: 'Already completed', status: 'completed' });
            }
            return NextResponse.json({ error: 'Request must be In Progress before completion. Please start it first.' }, { status: 400 });
        }

        // Financial Logic
        const settings = await getSettings();
        const lockedPrice = dreamRequest.lockedPrice; // BINDING: Use locked price
        const platformCommission = lockedPrice * settings.commissionRate;
        const interpreterEarning = lockedPrice - platformCommission;

        // 1. Create Transaction (The Truth)
        const { default: Transaction } = await import('@/models/Transaction');
        await Transaction.create({
            userId: userId,
            amount: interpreterEarning,
            currency: dreamRequest.currency || 'USD',
            type: 'earning',
            status: 'completed',
            description: `Interpretation for request #${dreamRequest._id}`,
            referenceId: dreamRequest._id.toString(),
            metadata: {
                dreamId: dreamRequest._id,
                originalPrice: lockedPrice,
                commission: platformCommission
            }
        });

        // 2. Update Request
        const updatedRequest = await DreamRequest.findByIdAndUpdate(
            id,
            {
                interpretationText: interpretationText.trim(),
                status: 'completed',
                completedAt: new Date(),
                platformCommission,
                interpreterEarning,
                paymentStatus: 'released' // Mark funds as released to interpreter
            },
            { new: true }
        );

        // 3. Send Notification to User
        await sendNotification(
            dreamRequest.userId,
            'تم تفسير حلمك! ✨',
            `قام المفسر ${interpreter.displayName} بالرد على حلمك.`
        );

        return NextResponse.json({
            success: true,
            status: 'completed',
            message: 'Interpretation submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting interpretation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
