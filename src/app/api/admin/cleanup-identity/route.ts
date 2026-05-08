import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Migrated to Supabase. Use the Supabase Dashboard for data integrity checks.',
        migrated: true,
    });
}

export async function POST() {
    return NextResponse.json({
        success: true,
        message: 'Migrated to Supabase. Use the Supabase Dashboard for data integrity checks.',
        migrated: true,
    });
}
