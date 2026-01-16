import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import DreamRequest from '@/models/DreamRequest';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();
        const { planId, userId, orderId, type } = body;

        // ============================================================
        // HUMAN DREAM PAYMENT FLOW
        // Updates order status to enable interpreter visibility
        // ============================================================
        if (type === 'human-dream' && orderId) {
            console.log('PAYMENT SUCCESS FOR:', orderId, Date.now());
            const order = await DreamRequest.findById(orderId);

            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            // Update payment status to 'paid' so interpreter can see it
            await DreamRequest.findByIdAndUpdate(orderId, {
                paymentStatus: 'paid',
                status: 'assigned', // Ready for interpreter to work on
                paymentId: `mock_${Date.now()}` // Mock payment ID
            });

            console.log(`[Payment] Human dream order ${orderId} marked as PAID`);

            return NextResponse.json({
                success: true,
                orderId,
                message: 'Payment successful, order visible to interpreter'
            });
        }

        // ============================================================
        // ORIGINAL PLAN-BASED PAYMENT FLOW
        // ============================================================
        // ============================================================
        // ORIGINAL PLAN-BASED PAYMENT FLOW
        // ============================================================

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Use atomic upsert to prevent race conditions and handle user creation robustly
        // This avoids "E11000 duplicate key error" if two requests hit at once
        let user = await User.findOneAndUpdate(
            { firebaseUid: userId },
            {
                $setOnInsert: {
                    email: `user_${userId.substring(0, 8)}@example.com`, // Temporary email until sync
                    credits: 0,
                    plan: 'free'
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Try to sync email from Firebase if possible (best effort), but don't block
        try {
            if (user.email.startsWith('user_')) {
                const firebaseUser = await getAuth().getUser(userId);
                if (firebaseUser.email) {
                    user.email = firebaseUser.email;
                    await user.save();
                }
            }
        } catch (e) {
            // Ignore firebase errors in mock/dev mode
            console.warn('[Payment API] Could not sync email from Firebase:', e);
        }

        // Apply Plan Logic
        switch (planId) {
            case 'ai-single':
                user.credits += 3;
                break;
            case 'ai-monthly':
                user.plan = 'pro';
                user.subscriptionStatus = 'active';
                user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
                user.credits += 15;
                break;
            case 'human-expert':
                // Handled via separate request flow
                break;
        }

        await user.save();

        return NextResponse.json({ success: true, credits: user.credits });

    } catch (error: any) {
        console.error('Payment mock error:', error);
        return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
    }
}
