import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from './firebase-admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Higher-order function to protect Admin API routes.
 * Verifies: Firebase Token → User exists in Supabase → role = 'admin' → status = 'active'
 */
export async function verifyAdmin(
    req: NextRequest
): Promise<{ authorized: boolean; admin?: any; response?: NextResponse }> {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return {
                authorized: false,
                response: NextResponse.json({ error: 'Missing token' }, { status: 401 }),
            };
        }

        const token = authHeader.split('Bearer ')[1];
        const decoded = await verifyIdToken(token);

        if (!decoded?.uid) {
            return {
                authorized: false,
                response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
            };
        }

        const { data: adminUser, error } = await supabaseAdmin
            .from('users')
            .select('id, firebase_uid, email, role, status')
            .eq('firebase_uid', decoded.uid)
            .single();

        if (error || !adminUser) {
            return {
                authorized: false,
                response: NextResponse.json({ error: 'Admin user not found' }, { status: 403 }),
            };
        }

        if (adminUser.role !== 'admin') {
            return {
                authorized: false,
                response: NextResponse.json(
                    { error: 'Unauthorized: Admin access required' },
                    { status: 403 }
                ),
            };
        }

        // Treat missing status as 'active' for legacy users
        if (adminUser.status && adminUser.status !== 'active') {
            return {
                authorized: false,
                response: NextResponse.json({ error: 'Account suspended' }, { status: 403 }),
            };
        }

        return { authorized: true, admin: adminUser };
    } catch (error) {
        console.error('[adminAuth] Verification failed:', error);
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
        };
    }
}
