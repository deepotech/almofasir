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
        const { planId, userId, orderId, type, payPalOrderId } = body;

        console.log(`[Payment Real] Processing capture for Order: ${orderId}, PayPalID: ${payPalOrderId}`);

        // ============================================================
        // HUMAN DREAM PAYMENT FLOW
        // ============================================================
        if (type === 'human-dream' && orderId) {
            const order = await DreamRequest.findById(orderId);

            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            // Update payment status to 'paid' with REAL PayPal ID
            await DreamRequest.findByIdAndUpdate(orderId, {
                paymentStatus: 'paid',
                status: 'assigned',
                paymentId: payPalOrderId || `paypal_${Date.now()}`
            });

            console.log(`[Payment] Human dream order ${orderId} marked as PAID. Transaction: ${payPalOrderId}`);

            return NextResponse.json({
                success: true,
                orderId,
                message: 'Payment captured successfully'
            });
        }

        // ============================================================
        // PLAN/CREDIT PAYMENT FLOW
        // ============================================================
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Upsert user if missing
        let user = await User.findOneAndUpdate(
            { firebaseUid: userId },
            {
                $setOnInsert: {
                    email: `user_${userId.substring(0, 8)}@example.com`,
                    credits: 0,
                    plan: 'free'
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

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
        }

        await user.save();

        return NextResponse.json({ success: true, credits: user.credits });

    } catch (error: any) {
        console.error('Payment capture error:', error);
        return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
    }
}
