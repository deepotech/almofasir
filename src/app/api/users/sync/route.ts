import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import InterpreterRequest from '@/models/InterpreterRequest';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { uid, email, displayName, photoURL } = await req.json();

        if (!uid || !email) {
            return NextResponse.json({ message: 'Missing Data' }, { status: 400 });
        }

        let user = await User.findOne({ email });
        let role = 'user';

        // Check if this email has an APPROVED interpreter request
        const approvedRequest = await InterpreterRequest.findOne({
            email: email.toLowerCase(),
            status: 'approved'
        });

        if (approvedRequest) {
            role = 'interpreter';
        }

        // Admin Override (Hardcoded for safety/MVP)
        if (email === 'dev23hecoplus93mor@gmail.com') {
            role = 'admin';
        }

        if (!user) {
            // Create new user
            user = await User.create({
                firebaseUid: uid,
                email,
                displayName: displayName || email.split('@')[0],
                role,
                plan: 'free',
                credits: 0 // STRICT: Free users get 0 credits, only 1 daily free
            });
        } else {
            // Update existing user
            // If we found an approved request now, upgrade them if they aren't already
            if (approvedRequest && user.role !== 'interpreter' && user.role !== 'admin') {
                user.role = 'interpreter';
            }
            // If they are admin, ensure they stay admin
            if (email === 'dev23hecoplus93mor@gmail.com') {
                user.role = 'admin';
            }

            user.displayName = displayName || user.displayName;
            await user.save();
        }

        return NextResponse.json({ success: true, user });

    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}
