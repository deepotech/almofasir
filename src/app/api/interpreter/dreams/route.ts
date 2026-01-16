import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

// GET /api/interpreter/dreams - Get dreams assigned to interpreter (UNIFIED: Uses DreamRequest model)
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
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decoded.user_id || decoded.sub;
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Verify user is an interpreter
        const interpreter = await Interpreter.findOne({ userId });
        if (!interpreter) {
            return NextResponse.json({ error: 'Not an interpreter' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status');

        // Build query for UNIFIED DreamRequest model (HUMAN type only for this view)
        const query: Record<string, unknown> = {
            interpreterUserId: userId,
            type: 'HUMAN',
            // Only show paid orders
            paymentStatus: { $in: ['paid', 'released'] }
        };

        // Map frontend status to DreamRequest status
        if (statusParam) {
            const statusMap: Record<string, string> = {
                'pending_interpretation': 'assigned',
                'in_progress': 'in_progress',
                'completed': 'completed'
            };
            query.status = statusMap[statusParam] || statusParam;
        }

        const dreams = await DreamRequest.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Map DreamRequest fields to the frontend expected format
        const mappedDreams = dreams.map(dream => ({
            _id: dream._id,
            content: dream.dreamText,
            context: dream.context || {},
            price: dream.lockedPrice || dream.price || 0,
            interpreterEarning: (dream.lockedPrice || dream.price || 0) * 0.8, // 80% to interpreter
            status: mapStatusToFrontend(dream.status),
            deadline: calculateDeadline(dream.createdAt),
            createdAt: dream.createdAt
        }));

        // Calculate stats using DreamRequest model
        const stats = {
            pending: await DreamRequest.countDocuments({
                interpreterUserId: userId,
                type: 'HUMAN',
                status: { $in: ['assigned', 'new'] },
                paymentStatus: { $in: ['paid', 'released'] }
            }),
            inProgress: await DreamRequest.countDocuments({
                interpreterUserId: userId,
                type: 'HUMAN',
                status: 'in_progress',
                paymentStatus: { $in: ['paid', 'released'] }
            }),
            completed: await DreamRequest.countDocuments({
                interpreterUserId: userId,
                type: 'HUMAN',
                status: 'completed'
            })
        };

        return NextResponse.json({ dreams: mappedDreams, stats });

    } catch (error) {
        console.error('Error fetching interpreter dreams:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dreams' },
            { status: 500 }
        );
    }
}

// Helper function to map DreamRequest status to frontend status
function mapStatusToFrontend(status: string): string {
    const map: Record<string, string> = {
        'new': 'pending_interpretation',
        'assigned': 'pending_interpretation',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'expired'
    };
    return map[status] || 'pending_interpretation';
}

// Helper function to calculate deadline (24 hours from creation)
function calculateDeadline(createdAt: Date): Date {
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + 24);
    return deadline;
}
