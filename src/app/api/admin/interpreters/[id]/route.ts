
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import Interpreter from '@/models/Interpreter';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/mongodb';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();
        const { id } = params;
        const body = await req.json();

        const { status, price } = body;

        const interpreter = await Interpreter.findById(id);
        if (!interpreter) {
            return NextResponse.json({ error: 'Interpreter not found' }, { status: 404 });
        }

        const updateData: any = {};
        const auditDetails: any = { prevStatus: interpreter.status, prevPrice: interpreter.price };
        let action: 'suspend_interpreter' | 'reactivate_interpreter' | 'approve_interpreter' | 'edit_price' | 'update_settings' = 'update_settings';

        // Update Status
        if (status && ['active', 'suspended', 'pending'].includes(status)) {
            updateData.status = status;
            auditDetails.newStatus = status;

            if (status === 'suspended') action = 'suspend_interpreter';
            else if (status === 'active' && interpreter.status === 'pending') action = 'approve_interpreter';
            else if (status === 'active' && interpreter.status === 'suspended') action = 'reactivate_interpreter';
        }

        // Update Price (Admin Override)
        if (price !== undefined && typeof price === 'number') {
            updateData.price = price;
            auditDetails.newPrice = price;
            // Only set action to edit_price if status didn't change (or prioritize status change log)
            if (!status) action = 'edit_price';
        }

        // Apply Updates
        if (Object.keys(updateData).length > 0) {
            Object.assign(interpreter, updateData);
            await interpreter.save();

            // Create Audit Log
            await AuditLog.create({
                adminUserId: auth.admin._id, // Mongo ID
                adminEmail: auth.admin.email,
                action: action,
                targetType: 'interpreter',
                targetId: interpreter._id, // Interpreter ID
                details: auditDetails,
                ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
            });
        }

        return NextResponse.json({ interpreter });

    } catch (error) {
        console.error('Update interpreter error:', error);
        return NextResponse.json({ error: 'Failed to update interpreter' }, { status: 500 });
    }
}
