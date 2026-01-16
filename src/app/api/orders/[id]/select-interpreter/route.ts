import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

/**
 * POST /api/orders/[id]/select-interpreter
 * 
 * UPDATE ONLY - Does NOT create a new order.
 * Assigns an interpreter to an existing order.
 * 
 * Required: interpreterId
 * Updates: interpreterId, interpreterUserId, interpreterName, price, lockedPrice, status
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('INTERPRETER SELECTED FOR:', 'API /orders/[id]/select-interpreter', Date.now());
    console.log('[API] POST /api/orders/[id]/select-interpreter (UPDATE ONLY)');

    try {
        await dbConnect();
        const { id: orderId } = await params;

        // 1. Authenticate User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            // Dev fallback
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    if (!userId) throw new Error('No user_id in token');
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 2. Parse Body
        const body = await req.json();
        const { interpreterId } = body;

        if (!interpreterId) {
            return NextResponse.json({ error: 'interpreterId is required' }, { status: 400 });
        }

        // 3. Verify Order Exists and Belongs to User
        const order = await DreamRequest.findById(orderId);

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden: Not your order' }, { status: 403 });
        }

        // 4. Verify Order is in valid state for interpreter assignment
        if (order.interpreterId) {
            return NextResponse.json({ error: 'Dream already assigned to an interpreter' }, { status: 409 });
        }

        if (!['new', 'pending'].includes(order.status)) {
            return NextResponse.json({
                error: 'Order cannot be modified. Current status: ' + order.status
            }, { status: 400 });
        }

        // 5. Fetch Interpreter Details
        const interpreter = await Interpreter.findById(interpreterId);

        if (!interpreter || interpreter.status !== 'active') {
            return NextResponse.json({ error: 'Interpreter not found or inactive' }, { status: 404 });
        }

        // 6. UPDATE Order (NOT CREATE)
        const updatedOrder = await DreamRequest.findByIdAndUpdate(
            orderId,
            {
                interpreterId: interpreter._id.toString(),
                interpreterUserId: interpreter.userId,
                interpreterName: interpreter.displayName || '',
                price: interpreter.price || 0,
                lockedPrice: interpreter.price || 0,
                status: 'assigned',
                paymentStatus: 'pending', // Ready for payment
                assignedAt: new Date()
            },
            { new: true }
        );

        console.log(`[API] Order ${orderId} updated with interpreter ${interpreterId}`);

        return NextResponse.json({
            success: true,
            orderId: updatedOrder?._id,
            order: updatedOrder,
            message: 'Interpreter assigned. Proceed to payment.'
        });

    } catch (error: any) {
        console.error('[API] select-interpreter failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
