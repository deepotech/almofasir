import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        const [dreamsRes, interpretersRes] = await Promise.all([
            supabaseAdmin.from('dreams').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('interpreters').select('*', { count: 'exact', head: true }),
        ]);

        return NextResponse.json({
            success: true,
            database: 'supabase',
            dreams: dreamsRes.count ?? 0,
            interpreters: interpretersRes.count ?? 0,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
