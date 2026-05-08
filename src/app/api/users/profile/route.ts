import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 });
        }

        const { data: user } = await supabaseAdmin
            .from('users')
            .select('role, plan, display_name')
            .eq('email', email)
            .single();

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            role: user.role,
            plan: user.plan,
            displayName: user.display_name
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
