
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Check last 24 hours
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const requests = await DreamRequest.find({ createdAt: { $gt: since } }).sort({ createdAt: -1 }).lean();

        const map: Record<string, any[]> = {};
        let duplicateGroups = [];

        requests.forEach((r: any) => {
            const txt = r.dreamText ? r.dreamText.trim().substring(0, 50) : 'NO_TEXT';
            if (txt === 'NO_TEXT') return;

            const key = `${r.userId}_${txt}`;
            if (!map[key]) map[key] = [];
            map[key].push(r);
        });

        for (const [k, v] of Object.entries(map)) {
            if (v.length > 1) {
                duplicateGroups.push({
                    key: k,
                    count: v.length,
                    ids: v.map(i => i._id)
                });
            }
        }

        return NextResponse.json({
            count: requests.length,
            duplicateGroups
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
