
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from './firebase-admin';
import User from '@/models/User';
import dbConnect from './mongodb';

/**
 * Higher-order function to protect Admin API routes
 * Verifies:
 * 1. Valid Firebase Token
 * 2. User exists in MongoDB
 * 3. User role is 'admin'
 * 4. User status is 'active'
 */
export async function verifyAdmin(req: NextRequest): Promise<{ authorized: boolean; admin?: any; response?: NextResponse }> {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return { authorized: false, response: NextResponse.json({ error: 'Missing token' }, { status: 401 }) };
        }

        const token = authHeader.split('Bearer ')[1];
        const decoded = await verifyIdToken(token);

        if (!decoded || !decoded.uid) {
            return { authorized: false, response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
        }

        await dbConnect();

        // Find user in Mongo
        const adminUser = await User.findOne({ firebaseUid: decoded.uid });

        if (!adminUser) {
            return { authorized: false, response: NextResponse.json({ error: 'Admin user not found' }, { status: 403 }) };
        }

        if (adminUser.role !== 'admin') {
            return { authorized: false, response: NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 }) };
        }

        if (adminUser.status !== 'active') {
            return { authorized: false, response: NextResponse.json({ error: 'Account suspended' }, { status: 403 }) };
        }

        return { authorized: true, admin: adminUser };

    } catch (error) {
        console.error('Admin verification failed:', error);
        return { authorized: false, response: NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) };
    }
}
