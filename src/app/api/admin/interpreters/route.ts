
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import Interpreter from '@/models/Interpreter';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const filter: any = {};

        // Filter by status if provided
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Search by name or email
        if (search) {
            filter.$or = [
                { displayName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const interpreters = await Interpreter.find(filter)
            .select('userId displayName email interpretationType status price rating totalRatings completedDreams earnings pendingEarnings updatedAt')
            .sort({ createdAt: -1 });

        return NextResponse.json({ interpreters });

    } catch (error) {
        console.error('Fetch interpreters error:', error);
        return NextResponse.json({ error: 'Failed to fetch interpreters' }, { status: 500 });
    }
}
