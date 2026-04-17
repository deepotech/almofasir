import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PageMetrics from '@/models/PageMetrics';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { slug, action } = body; // action: 'view' | 'like' | 'dislike'

        if (!slug || !action) {
            return NextResponse.json({ error: 'Missing slug or action' }, { status: 400 });
        }

        const update: any = {};
        if (action === 'view') update.$inc = { views: 1 };
        if (action === 'like') update.$inc = { likes: 1 };
        if (action === 'dislike') update.$inc = { dislikes: 1 };

        // Atomic update ensure concurrency safety
        const metrics = await PageMetrics.findOneAndUpdate(
            { slug },
            update,
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, metrics });
    } catch (e) {
        console.error('Metrics Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
        }

        const metrics = await PageMetrics.findOne({ slug }).lean();
        if (!metrics) {
            return NextResponse.json({ views: 0, likes: 0, dislikes: 0 });
        }

        return NextResponse.json(metrics);
    } catch (e) {
        console.error('Metrics Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
