import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Interpreter from '@/models/Interpreter';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

/**
 * POST /api/admin/interpreters/[id]/suspend - Suspend an interpreter
 * 
 * Admin Rules:
 * - Only admins can suspend/unsuspend
 * - Suspended interpreters cannot accept new requests
 * - Existing in-progress requests remain active
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

        // Verify admin role
        const admin = await User.findOne({ firebaseUid: userId });
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { suspend, reason } = body;

        // Find interpreter
        const interpreter = await Interpreter.findById(id);
        if (!interpreter) {
            return NextResponse.json({ error: 'Interpreter not found' }, { status: 404 });
        }

        // Update interpreter status
        const newStatus = suspend ? 'suspended' : 'active';

        await Interpreter.findByIdAndUpdate(id, {
            status: newStatus,
            isActive: !suspend
        });

        // Also update user status
        await User.findOneAndUpdate(
            { firebaseUid: interpreter.userId },
            { status: suspend ? 'suspended' : 'active' }
        );

        return NextResponse.json({
            success: true,
            interpreter: {
                id: interpreter._id,
                name: interpreter.displayName,
                status: newStatus,
                isActive: !suspend
            },
            message: suspend
                ? 'تم تعليق المفسر بنجاح'
                : 'تم إلغاء تعليق المفسر بنجاح'
        });

    } catch (error) {
        console.error('Error suspending interpreter:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في تعليق المفسر' },
            { status: 500 }
        );
    }
}
