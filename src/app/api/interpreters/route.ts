import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCachedOrFallback, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const sortBy = searchParams.get('sort') || 'rating';
    const includeAll = searchParams.get('includeAll') === 'true';

    const cacheKey = `interpreters_t${type}_s${sortBy}_i${includeAll}`;

    try {
        let query = supabaseAdmin
            .from('interpreters')
            .select('*')
            .neq('status', 'suspended');

        if (!includeAll) {
            query = query.eq('is_active', true);
            query = query.not('display_name', 'in', '("HICHAM EL MORSLI", "مفسر تجريبي", "Test Interpreter")');
        }

        if (type !== 'all' && ['religious', 'psychological', 'symbolic', 'mixed'].includes(type)) {
            query = query.eq('interpretation_type', type);
        }

        if (sortBy === 'price') {
            query = query.order('price', { ascending: true });
        } else if (sortBy === 'responseTime') {
            query = query.order('response_time', { ascending: true });
        } else if (sortBy === 'dreams') {
            query = query.order('completed_dreams', { ascending: false });
        } else {
            query = query.order('rating', { ascending: false });
        }

        const { data: interpreters, error } = await query;
        if (error) throw error;

        const formatted = (interpreters || []).map((interpreter: any) => ({
            id: interpreter.id,
            displayName: interpreter.display_name,
            avatar: interpreter.avatar,
            bio: interpreter.bio,
            interpretationType: interpreter.interpretation_type,
            interpretationTypeAr: getTypeArabic(interpreter.interpretation_type),
            price: interpreter.price,
            responseTime: interpreter.response_time,
            responseTimeText: getResponseTimeText(interpreter.response_time),
            rating: interpreter.rating || 0,
            totalRatings: interpreter.total_ratings || 0,
            completedDreams: interpreter.completed_dreams || 0,
            isActive: interpreter.is_active,
            status: interpreter.status
        }));

        const responseData = { count: formatted.length, interpreters: formatted, total: formatted.length };
        await setCache(cacheKey, responseData, 3600);

        return NextResponse.json({ success: true, ...responseData });

    } catch (error: any) {
        console.error(`[DB ERROR] ❌ /api/interpreters — Failed completely:`, error?.message);
        const fallbackResponse = await getCachedOrFallback(cacheKey, 'interpreters');
        return NextResponse.json({ success: true, ...fallbackResponse });
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
    if (hours <= 6) return 'خلال 6 ساعات';
    if (hours <= 24) return 'خلال 24 ساعة';
    if (hours <= 48) return 'خلال 48 ساعة';
    if (hours <= 72) return 'خلال 3 أيام';
    return `خلال ${Math.ceil(hours / 24)} أيام`;
}
