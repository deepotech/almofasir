import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import User from '@/models/User';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // params is a Promise in Next.js 15+
) {
    try {
        await dbConnect();
        const { userId } = await req.json(); // Authenticated user ID passed from client
        const dreamId = (await params).id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ firebaseUid: userId });
        if (!user || user.role !== 'premium' && !user.isPremium) {
            return NextResponse.json({ error: 'Requires Premium Subscription' }, { status: 403 });
        }

        const dream = await Dream.findById(dreamId);
        if (!dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        if (dream.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized access to this dream' }, { status: 403 });
        }

        // Update status
        dream.requestHumanReview = true;
        dream.humanReviewStatus = 'pending';
        await dream.save();

        return NextResponse.json({ success: true, message: 'Review requested successfully', dream });

    } catch (error) {
        console.error('Review request error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
