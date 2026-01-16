import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();

        // 1. Auth Headers
        const authHeader = request.headers.get('Authorization');
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

        // 2. Validate Interpreter
        const interpreter = await Interpreter.findOne({ userId });
        if (!interpreter) {
            return NextResponse.json({ error: 'Not an interpreter' }, { status: 403 });
        }

        // 3. Find & Validate Request
        const dreamRequest = await DreamRequest.findById(id);
        if (!dreamRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (dreamRequest.interpreterUserId !== userId) {
            return NextResponse.json({ error: 'Not authorized for this request' }, { status: 403 });
        }

        // 4. Strict Transition: Only allowed from 'new'
        if (dreamRequest.status !== 'new') {
            // If already in progress, just return success (idempotent-ish) or error
            if (dreamRequest.status === 'in_progress') {
                return NextResponse.json({ message: 'Already in progress', status: 'in_progress' });
            }
            return NextResponse.json({ error: `Cannot start request in status: ${dreamRequest.status}` }, { status: 400 });
        }

        // 5. Update Status
        dreamRequest.status = 'in_progress';
        dreamRequest.acceptedAt = new Date();
        await dreamRequest.save();

        // TODO: Notification to user "In Progress"

        return NextResponse.json({
            success: true,
            status: 'in_progress',
            message: 'Interpretation started'
        });

    } catch (error) {
        console.error('Error starting interpretation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
