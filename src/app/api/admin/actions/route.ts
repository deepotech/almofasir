
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Interpreter from '@/models/Interpreter';
import PlatformSettings from '@/models/PlatformSettings';
import AuditLog from '@/models/AuditLog'; // Assuming existence or will create if not found

export async function POST(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();
        const { action, payload } = await req.json();

        // 1. Log the attempt
        // We'll trust the admin name/id from auth if available, or just generic 'ADMIN'
        // This log is crucial for "Log admin action" requirement

        /* 
           Action Types:
           - APPROVE_INTERPRETER
           - SUSPEND_INTERPRETER
           - UPDATE_COMMISSION
           - PAUSE_AI
        */

        let result;

        switch (action) {
            case 'APPROVE_INTERPRETER':
                if (!payload.userId) throw new Error('Missing userId');
                result = await Interpreter.findOneAndUpdate(
                    { userId: payload.userId },
                    { status: 'active', isActive: true },
                    { new: true }
                );
                break;

            case 'SUSPEND_INTERPRETER':
                if (!payload.userId) throw new Error('Missing userId');
                result = await Interpreter.findOneAndUpdate(
                    { userId: payload.userId },
                    { status: 'suspended', isActive: false },
                    { new: true }
                );
                break;

            case 'UPDATE_COMMISSION':
                if (typeof payload.rate !== 'number') throw new Error('Invalid rate');
                result = await PlatformSettings.findOneAndUpdate(
                    {}, // singleton
                    { commissionRate: payload.rate },
                    { upsert: true, new: true }
                );
                break;

            case 'PAUSE_AI':
                const current = await PlatformSettings.findOne();
                const newStatus = !current?.isAiEnabled; // Toggle
                result = await PlatformSettings.findOneAndUpdate(
                    {},
                    { isAiEnabled: newStatus },
                    { upsert: true, new: true }
                );
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 2. Audit Log (Mocking if model doesn't exist, but based on dir list it does)
        try {
            await AuditLog.create({
                action: action,
                adminId: auth.user.uid,
                details: payload,
                createdAt: new Date()
            });
        } catch (logError) {
            console.warn('Audit log failed', logError);
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error('Admin action error:', error);
        return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
    }
}
