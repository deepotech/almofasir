import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Interpreter from '@/models/Interpreter';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import InterpreterRequest from '@/models/InterpreterRequest';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId;
        let email: string | undefined;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
            email = decodedToken.email;
        } catch (authError) {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    email = decodedValue.email || `${userId}@example.com`;
                } catch (decodeError) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Upsert user to ensure they exist in DB
        let user = await User.findOne({ firebaseUid: userId }).select('-__v');

        let role = 'user';
        if (email) {
            const approvedRequest = await InterpreterRequest.findOne({
                email: email.toLowerCase(),
                status: 'approved'
            });
            if (approvedRequest) role = 'interpreter';
            if (email === 'dev23hecoplus93mor@gmail.com') role = 'admin';
        }

        if (!user && email) {
            user = await User.create({
                firebaseUid: userId,
                email: email,
                displayName: email.split('@')[0],
                role: role,
                credits: 0,
                dreamCount: 0,
                isPremium: false
            });
        } else if (user && email) {
            // Check if we need to upgrade existing user
            let needsSave = false;
            if (role === 'interpreter' && user.role !== 'interpreter' && user.role !== 'admin') {
                user.role = 'interpreter';
                needsSave = true;
            }
            if (role === 'admin' && user.role !== 'admin') {
                user.role = 'admin';
                needsSave = true;
            }
            if (needsSave) await user.save();
        }

        if (!user) {
            console.log('[API Profile GET] User not found even after upsert attempt');
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch Interpreter Profile if applicable
        let interpreterProfile = null;
        console.log(`[API Profile GET] User Role: ${user.role}, UID: ${userId}`);

        if (user.role === 'interpreter' || user.role === 'admin') {
            interpreterProfile = await Interpreter.findOne({ userId: user.firebaseUid });
            console.log(`[API Profile GET] Interpreter Profile found: ${!!interpreterProfile}`);

            if (!interpreterProfile) {
                console.log('[API Profile GET] Creating default Interpreter profile...');
                interpreterProfile = await Interpreter.create({
                    userId: user.firebaseUid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0],
                    bio: 'مفسر أحلام',
                    price: 30, // Default price
                    currency: 'USD',
                    responseTime: 24,
                    interpretationType: 'mixed',
                    status: 'active',
                    isActive: true
                });
                console.log('[API Profile GET] Created default profile');
            }
        }

        return NextResponse.json({ user, interpreterProfile });

    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        console.log('[API Profile PUT] Started');

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    if (!userId) throw new Error('No user_id in token');
                } catch (decodeError) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body = await req.json();
        const { displayName, bio, price, avatar } = body;
        console.log('[API Profile PUT] Request Body:', { displayName, bio, price, avatar: avatar ? 'Base64 Data' : 'undefined', userId });

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: userId },
            { displayName },
            { new: true }
        ).select('-__v');

        console.log('[API Profile PUT] User updated:', updatedUser ? 'yes' : 'no');

        // Update Interpreter if exists
        if (bio !== undefined || displayName || price !== undefined || avatar !== undefined) {
            const updateFields: any = {};
            if (displayName) updateFields.displayName = displayName;
            if (bio !== undefined) updateFields.bio = bio;
            if (price !== undefined) updateFields.price = price;
            if (avatar !== undefined) updateFields.avatar = avatar;

            const updatedInterpreter = await Interpreter.findOneAndUpdate(
                { userId: userId },
                updateFields,
                { new: true }
            );
            console.log('[API Profile PUT] Interpreter updated:', updatedInterpreter ? 'success' : 'not found');
        }

        return NextResponse.json({ user: updatedUser });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
