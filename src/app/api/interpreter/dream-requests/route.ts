import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is an interpreter
        const interpreter = await Interpreter.findOne({ userId });
        if (!interpreter || interpreter.status === 'suspended') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status');

        // Build query
        const query: Record<string, unknown> = {
            interpreterUserId: userId,
            // STRICT QUERY: Only show Paid or Released requests
            paymentStatus: { $in: ['paid', 'released'] }
        };

        if (statusParam) {
            query.status = statusParam;
        }

        // CRITICAL FIX: Use aggregation with $group to ensure ABSOLUTE uniqueness by _id
        // This prevents ANY possibility of duplicate display, even if data somehow duplicated
        const requests = await DreamRequest.aggregate([
            // Step 1: Match the query
            { $match: query },
            // Step 2: Group by _id to ensure uniqueness (eliminates any duplicates)
            {
                $group: {
                    _id: '$_id',
                    dreamText: { $first: '$dreamText' },
                    status: { $first: '$status' },
                    lockedPrice: { $first: '$lockedPrice' },
                    currency: { $first: '$currency' },
                    createdAt: { $first: '$createdAt' },
                    paymentStatus: { $first: '$paymentStatus' }
                }
            },
            // Step 3: Sort by creation date (most recent first)
            { $sort: { createdAt: -1 } }
        ]);

        // Map to response (already unique by design)
        const dreams = requests.map((r: any) => ({
            _id: r._id.toString(), // Ensure string _id
            dreamText: r.dreamText,
            status: r.status,
            price: r.lockedPrice,
            currency: r.currency || 'USD',
            createdAt: r.createdAt,
            paymentStatus: r.paymentStatus
        }));

        return NextResponse.json({
            requests: dreams
        });

    } catch (error) {
        console.error('Error fetching interpreter requests:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
