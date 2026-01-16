import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            role: user.role,
            plan: user.plan,
            displayName: user.displayName
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
