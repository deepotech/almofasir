import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InterpreterRequest from '@/models/InterpreterRequest';

export async function GET() {
    try {
        await connectDB();

        // Fetch all requests, sorted by newest first
        const requests = await InterpreterRequest.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json(
            { message: 'Error fetching requests' },
            { status: 500 }
        );
    }
}
