import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { uid, email, displayName, photoURL } = await req.json();

        if (!uid || !email) {
            return NextResponse.json({ message: 'Missing Data' }, { status: 400 });
        }

        let role = 'user';

        // Check if this email has an APPROVED interpreter request
        const { data: approvedRequest } = await supabaseAdmin
            .from('interpreter_requests')
            .select('id')
            .eq('email', email.toLowerCase())
            .eq('status', 'approved')
            .limit(1)
            .maybeSingle();

        if (approvedRequest) role = 'interpreter';

        // Admin Override
        if (email === 'dev23hecoplus93mor@gmail.com') role = 'admin';

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        let returnedUser;

        if (!user || error) {
            // Create new user
            const { data: newUser } = await supabaseAdmin
                .from('users')
                .insert({
                    firebase_uid: uid,
                    email,
                    display_name: displayName || email.split('@')[0],
                    role,
                    plan: 'free',
                    credits: 0
                })
                .select()
                .single();
            returnedUser = newUser;
        } else {
            // Update existing user
            let finalRole = user.role;
            if (approvedRequest && user.role !== 'interpreter' && user.role !== 'admin') {
                finalRole = 'interpreter';
            }
            if (email === 'dev23hecoplus93mor@gmail.com') {
                finalRole = 'admin';
            }

            const { data: updatedUser } = await supabaseAdmin
                .from('users')
                .update({
                    display_name: displayName || user.display_name,
                    role: finalRole,
                    firebase_uid: uid,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select()
                .single();

            returnedUser = updatedUser;
        }

        return NextResponse.json({ success: true, user: returnedUser });

    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}
