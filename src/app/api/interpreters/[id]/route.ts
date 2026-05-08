import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: interpreter, error } = await supabaseAdmin
            .from('interpreters')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !interpreter) {
            return NextResponse.json({ error: 'Interpreter not found' }, { status: 404 });
        }

        const formatted = {
            id: interpreter.id,
            displayName: interpreter.display_name,
            avatar: interpreter.avatar,
            bio: interpreter.bio,
            interpretationType: interpreter.interpretation_type,
            interpretationTypeAr: getTypeArabic(interpreter.interpretation_type),
            price: interpreter.price,
            responseTime: interpreter.response_time,
            responseTimeText: getResponseTimeText(interpreter.response_time),
            rating: interpreter.rating,
            totalRatings: interpreter.total_ratings,
            completedDreams: interpreter.completed_dreams,
            isActive: interpreter.is_active,
            status: interpreter.status
        };

        return NextResponse.json({ interpreter: formatted });

    } catch (error) {
        console.error('Error fetching interpreter:', error);
        return NextResponse.json({ error: 'Failed to fetch interpreter' }, { status: 500 });
    }
}

function getTypeArabic(type: string): string {
    const types: Record<string, string> = {
        'religious': 'شرعي',
        'psychological': 'نفسي',
        'symbolic': 'رمزي',
        'mixed': 'شامل'
    };
    return types[type] || 'شامل';
}

function getResponseTimeText(hours: number): string {
    if (hours <= 24) return 'خلال 24 ساعة';
    if (hours <= 48) return 'خلال 48 ساعة';
    if (hours <= 72) return 'خلال 3 أيام';
    return `خلال ${Math.ceil(hours / 24)} أيام`;
}
