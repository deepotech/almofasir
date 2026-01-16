
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import DreamRequest from '@/models/DreamRequest';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        // Extract filters
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const interpreterId = searchParams.get('interpreterId');
        const search = searchParams.get('search'); // Search by order ID or User Email
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (type && type !== 'all') filter.type = type;
        if (status && status !== 'all') filter.status = status;

        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        if (interpreterId) filter.interpreterId = interpreterId;

        // Advanced Search (this is tricky with loose regex on ID, but fine for basic search)
        if (search) {
            // Check if search looks like an ObjectId
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                filter._id = search;
            } else {
                // Determine if searching by user email
                // We might need to look up users first if we don't duplicate email on DreamRequest
                // DreamRequest HAS userEmail field! (checked model in Step 180)
                filter.userEmail = { $regex: search, $options: 'i' };
            }
        }

        const orders = await DreamRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // .populate('userId', 'email displayName') // userEmail is already in model
        // .populate('interpreter', 'displayName'); // interpreterName already in model

        const total = await DreamRequest.countDocuments(filter);

        return NextResponse.json({
            orders,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Fetch orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
