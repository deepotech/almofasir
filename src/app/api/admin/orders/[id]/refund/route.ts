
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import DreamRequest from '@/models/DreamRequest';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/mongodb';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();
        const { id } = params;
        const { reason, restoreCredits } = await req.json();

        const order = await DreamRequest.findById(id);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.paymentStatus === 'refunded') {
            return NextResponse.json({ error: 'Order already refunded' }, { status: 400 });
        }

        // 1. Update Order Status
        const oldStatus = order.status;
        const oldPaymentStatus = order.paymentStatus;

        order.status = 'cancelled';
        order.paymentStatus = 'refunded';
        order.cancelledAt = new Date();
        await order.save();

        // 2. Restore Credits (if applicable)
        if (restoreCredits) {
            const user = await User.findOne({ firebaseUid: order.userId });
            if (user) {
                // Determine credit amount to refund based on plan/type
                // Simplified: If it was credit based, +1
                // For now, assuming direct credit increment if requested
                user.credits = (user.credits || 0) + 1;
                await user.save();
            }
        }

        // 3. Audit Log
        await AuditLog.create({
            adminUserId: auth.admin._id,
            adminEmail: auth.admin.email,
            action: 'refund_order',
            targetType: 'order',
            targetId: order._id,
            details: {
                reason,
                oldStatus,
                oldPaymentStatus,
                creditsRestored: !!restoreCredits
            },
            ipAddress: req.headers.get('x-forwarded-for')
        });

        return NextResponse.json({ success: true, message: 'Order refunded successfully' });

    } catch (error) {
        console.error('Refund order error:', error);
        return NextResponse.json({ error: 'Failed to refund order' }, { status: 500 });
    }
}
