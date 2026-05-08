import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        let query = supabaseAdmin
            .from('interpreters')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: interpreters, error } = await query;
        if (error) throw error;

        const mapped = (interpreters || []).map(i => ({
            _id: i.id,
            userId: i.user_id,
            displayName: i.display_name,
            email: i.email,
            interpretationType: i.interpretation_type,
            status: i.status,
            price: i.price,
            rating: i.rating,
            totalRatings: i.total_ratings,
            completedDreams: i.completed_dreams,
            earnings: i.earnings,
            pendingEarnings: i.pending_earnings,
            updatedAt: i.updated_at
        }));

        return NextResponse.json({ interpreters: mapped });

    } catch (error) {
        console.error('Fetch interpreters error:', error);
        return NextResponse.json({ error: 'Failed to fetch interpreters' }, { status: 500 });
    }
}
