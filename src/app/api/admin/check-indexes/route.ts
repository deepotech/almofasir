import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Migrated to Supabase. Indexes are managed in the Supabase Dashboard.',
        migrated: true,
    });
}
