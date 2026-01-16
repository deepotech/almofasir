
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import { STUCK_ORDER_THRESHOLD_HOURS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();

        // Urgent Conditions:
        // 1. Status 'new' AND created > Threshold (user waiting for assignment)
        // 2. Status 'assigned' AND updated > 24h (interpreter inactive on dream)
        // 3. Status 'in_progress' AND updated > 48h (interpreter stuck)
        // 4. Any dispute (if field exists, checked logically) - Currently we don't have explicit 'disputed' status in Enum, assuming metadata or flag if added.
        //    For now, we focus on TIMING urgency.

        const urgentThresholdDate = new Date(Date.now() - STUCK_ORDER_THRESHOLD_HOURS * 60 * 60 * 1000);
        const warningThresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const urgentOrders = await DreamRequest.find({
            $or: [
                {
                    status: 'new',
                    createdAt: { $lt: urgentThresholdDate },
                    paymentStatus: 'paid' // Priority to paid users
                },
                {
                    status: 'assigned',
                    updatedAt: { $lt: warningThresholdDate },
                    paymentStatus: 'paid'
                }
            ]
        })
            .sort({ createdAt: 1 }) // Oldest first
            .limit(20)
            .select('userId interpreterName status type createdAt updatedAt paymentStatus price');

        const serialized = urgentOrders.map(order => ({
            id: order._id,
            type: order.type,
            status: order.status,
            customer: order.userId.substring(0, 6) + '...', // Masked for list view or lookup user
            interpreter: order.interpreterName || 'Unassigned',
            waitingTimeHours: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)),
            lastUpdateHours: Math.floor((Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60)),
            amount: order.price
        }));

        return NextResponse.json({ orders: serialized });

    } catch (error) {
        console.error('Urgent orders fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch urgent orders' }, { status: 500 });
    }
}
