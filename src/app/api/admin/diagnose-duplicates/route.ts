import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Fetch all requests, sorted by creation
        const requests = await DreamRequest.find({})
            .select('dreamText userId interpreterId status createdAt dreamHash lockedPrice')
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({
            count: requests.length,
            requests
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
