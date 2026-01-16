
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
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
        const { newInterpreterId } = await req.json();

        if (!newInterpreterId) {
            return NextResponse.json({ error: 'New interpreter ID is required' }, { status: 400 });
        }

        const order = await DreamRequest.findById(id);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const newInterpreter = await Interpreter.findById(newInterpreterId);
        if (!newInterpreter) {
            return NextResponse.json({ error: 'Target interpreter not found' }, { status: 404 });
        }

        const oldInterpreterId = order.interpreterId;

        // Update Order
        order.interpreterId = newInterpreterId; // ID from Interpreter model
        order.interpreterUserId = newInterpreter.userId;
        order.interpreterName = newInterpreter.displayName;
        order.status = 'assigned'; // Reset status to assigned
        order.assignedAt = new Date();

        await order.save();

        // Audit Log
        await AuditLog.create({
            adminUserId: auth.admin._id,
            adminEmail: auth.admin.email,
            action: 'reassign_order',
            targetType: 'order',
            targetId: order._id,
            details: {
                oldInterpreter: oldInterpreterId,
                newInterpreter: newInterpreterId,
                reason: 'Admin reassignment'
            },
            ipAddress: req.headers.get('x-forwarded-for')
        });

        return NextResponse.json({ success: true, order });

    } catch (error) {
        console.error('Reassign order error:', error);
        return NextResponse.json({ error: 'Failed to reassign order' }, { status: 500 });
    }
}
