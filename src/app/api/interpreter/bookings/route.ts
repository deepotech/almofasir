import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Interpreter from '@/models/Interpreter';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        const userId = decodedToken.uid;
        console.log('Fetching bookings for user:', userId);

        await connectDB();

        // 1. Find the Interpreter profile associated with this User ID
        const interpreter = await Interpreter.findOne({ userId });

        if (!interpreter) {
            console.error('Interpreter profile not found for userId:', userId);
            return NextResponse.json({ error: 'ملف المفسر غير موجود (Interpreter Profile Not Found)' }, { status: 404 });
        }

        console.log('Found Interpreter:', interpreter._id);

        // 2. Find Bookings
        // bookings collection often stores interpreterId as string or ObjectId. Booking model definition says string.
        // Let's try to match both just in case, or simply match string if that's what we saved.
        // We saved: interpreterId: interpreterId (which was passed from query param, likely string)
        const bookings = await Booking.find({
            interpreterId: interpreter._id.toString()
        }).sort({ createdAt: -1 });

        console.log(`Found ${bookings.length} bookings`);

        return NextResponse.json({ bookings });

    } catch (error: any) {
        console.error('Error fetching interpreter bookings:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
