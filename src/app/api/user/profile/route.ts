import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string | undefined;
        let email: string | undefined;

        try {
            const decoded = await verifyIdToken(token);
            userId = decoded.uid;
            email = decoded.email;
        } catch (authError) {
            console.error('[API Profile GET] Token verification failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Determine role
        let role = 'user';
        if (email) {
            const { data: approvedRequest } = await supabaseAdmin
                .from('interpreter_requests')
                .select('id')
                .eq('email', email.toLowerCase())
                .eq('status', 'approved')
                .maybeSingle();
            if (approvedRequest) role = 'interpreter';
            if (email === 'dev23hecoplus93mor@gmail.com') role = 'admin';
        }

        // Try to find existing user
        let { data: user } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('firebase_uid', userId)
            .maybeSingle();

        if (!user && email) {
            // Create user
            const { data: newUser } = await supabaseAdmin
                .from('users')
                .insert({
                    firebase_uid: userId,
                    email,
                    display_name: email.split('@')[0],
                    role,
                    credits: 0,
                    plan: 'free',
                    status: 'active',
                    subscription_status: 'inactive',
                })
                .select()
                .single();
            user = newUser;
        } else if (user && email) {
            // Upgrade role if needed
            const updates: Record<string, string> = {};
            if (role === 'interpreter' && user.role !== 'interpreter' && user.role !== 'admin') {
                updates.role = 'interpreter';
            }
            if (role === 'admin' && user.role !== 'admin') {
                updates.role = 'admin';
            }
            if (!user.status) updates.status = 'active';

            if (Object.keys(updates).length > 0) {
                const { data: updated } = await supabaseAdmin
                    .from('users')
                    .update(updates)
                    .eq('firebase_uid', userId)
                    .select()
                    .single();
                user = updated ?? user;
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch Interpreter profile if applicable
        let interpreterProfile = null;
        if (user.role === 'interpreter' || user.role === 'admin') {
            const { data: existing } = await supabaseAdmin
                .from('interpreters')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (!existing) {
                const { data: created } = await supabaseAdmin
                    .from('interpreters')
                    .insert({
                        user_id: userId,
                        email: user.email,
                        display_name: user.display_name || user.email?.split('@')[0] || 'مفسر',
                        bio: 'مفسر أحلام',
                        price: 30,
                        currency: 'USD',
                        response_time: 24,
                        interpretation_type: 'mixed',
                        status: 'active',
                        is_active: true,
                    })
                    .select()
                    .single();
                interpreterProfile = created;
            } else {
                interpreterProfile = existing;
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
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

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
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body = await req.json();
        const { displayName, bio, price, avatar } = body;

        const { data: updatedUser } = await supabaseAdmin
            .from('users')
            .update({ display_name: displayName })
            .eq('firebase_uid', userId)
            .select()
            .single();

        // Update interpreter profile if fields provided
        if (bio !== undefined || displayName || price !== undefined || avatar !== undefined) {
            const updateFields: Record<string, unknown> = {};
            if (displayName) updateFields.display_name = displayName;
            if (bio !== undefined) updateFields.bio = bio;
            if (price !== undefined) updateFields.price = price;
            if (avatar !== undefined) updateFields.avatar = avatar;

            await supabaseAdmin
                .from('interpreters')
                .update(updateFields)
                .eq('user_id', userId);
        }

        return NextResponse.json({ user: updatedUser });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
