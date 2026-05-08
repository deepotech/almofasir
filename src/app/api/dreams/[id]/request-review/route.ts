import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await req.json();
        const dreamId = (await params).id;

        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check user plan
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('role, plan')
            .eq('firebase_uid', userId)
            .single();

        if (!user || !['pro', 'premium'].includes(user.plan)) {
            return NextResponse.json({ error: 'Requires Premium Subscription' }, { status: 403 });
        }

        const { data: dream, error } = await supabaseAdmin
            .from('dreams')
            .update({
                request_human_review: true,
                human_review_status: 'pending',
                updated_at: new Date().toISOString(),
            })
            .eq('id', dreamId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error || !dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Review requested successfully', dream });
    } catch (error) {
        console.error('Review request error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
