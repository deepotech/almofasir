import { NextRequest, NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import User from '@/models/User';

// Initialize Firebase Admin
initFirebaseAdmin();

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userEmail: string | undefined;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userEmail = decodedToken.email;
        } catch (authError) {
            // Development fallback
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userEmail = decodedValue.email;
                } catch (e) {
                    console.error('Token decode failed');
                }
            }
        }

        if (!userEmail) {
            return NextResponse.json({ error: 'البريد الإلكتروني غير متوفر في التوكن' }, { status: 400 });
        }

        await connectDB();

        // Find bookings by email (handling both guest bookings linked by email and authenticated bookings)
        const bookings = await Booking.find({ userEmail: userEmail }).sort({ createdAt: -1 });

        return NextResponse.json({ bookings });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { error: 'فشل في جلب الحجوزات' },
            { status: 500 }
        );
    }
}
