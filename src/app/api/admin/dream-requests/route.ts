import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import User from '@/models/User';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

/**
 * GET /api/admin/dream-requests - View ALL dream requests
 * 
 * Admin Rules:
 * - Can view ALL requests
 * - Can filter by status, interpreter, user
 * - Read-only access to content (cannot modify)
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const authHeader = req.headers.get('Authorization');
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
        const user = await User.findOne({ firebaseUid: userId });
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const interpreterId = searchParams.get('interpreterId');
        const requestUserId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query
        const query: Record<string, unknown> = {};
        if (status) query.status = status;
        if (interpreterId) query.interpreterId = interpreterId;
        if (requestUserId) query.userId = requestUserId;

        // Get total count
        const total = await DreamRequest.countDocuments(query);

        // Get paginated results
        const requests = await DreamRequest.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Calculate stats
        const stats = {
            total: await DreamRequest.countDocuments({}),
            new: await DreamRequest.countDocuments({ status: 'new' }),
            inProgress: await DreamRequest.countDocuments({ status: 'in_progress' }),
            completed: await DreamRequest.countDocuments({ status: 'completed' }),
            clarificationRequested: await DreamRequest.countDocuments({ status: 'clarification_requested' }),
            closed: await DreamRequest.countDocuments({ status: 'closed' }),
            totalRevenue: await DreamRequest.aggregate([
                { $match: { status: { $in: ['completed', 'clarification_requested', 'closed'] } } },
                { $group: { _id: null, total: { $sum: '$platformCommission' } } }
            ]).then(result => result[0]?.total || 0)
        };

        return NextResponse.json({
            requests,
            stats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching admin dream requests:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في جلب الطلبات' },
            { status: 500 }
        );
    }
}
