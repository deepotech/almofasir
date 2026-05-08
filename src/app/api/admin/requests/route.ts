import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { data: requests, error } = await supabaseAdmin
            .from('interpreter_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (requests || []).map(r => ({
            _id: r.id,
            fullName: r.full_name,
            email: r.email,
            phone: r.phone,
            country: r.country,
            experienceYears: r.experience_years,
            interpretationType: r.interpretation_type,
            bio: r.bio,
            sampleInterpretation: r.sample_interpretation,
            status: r.status,
            createdAt: r.created_at
        }));

        return NextResponse.json({ requests: mapped });
    } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ message: 'Error fetching requests' }, { status: 500 });
    }
}
