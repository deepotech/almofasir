import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
const CACHE_KEY = 'global_stats';
const CACHE_TTL = 30 * 60; // 30 minutes

const FALLBACK_STATS = {
    totalRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    dreamsCount: 0,
    usersCount: 0,
    interpretersCount: 0,
    isFromFallback: true,
};

export async function GET() {
    const cached = await getCache(CACHE_KEY);
    if (cached) return NextResponse.json({ ...cached, isFromCache: true });

    try {
        const p1 = supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true });
        const p2 = supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true }).in('status', ['completed', 'clarification_requested', 'closed']);
        
        // Sum total amount (Supabase aggregate)
        // RPC is better, but since it's just price, we can fetch prices or write an rpc.
        // Actually, let's use the RPC we can create or just fetch the data. 
        // For now, since global stats run in background, we can just select price.
        const p3 = supabaseAdmin.from('dream_requests').select('price').in('status', ['completed', 'clarification_requested', 'closed']);
        
        const p4 = supabaseAdmin.from('dreams').select('*', { count: 'exact', head: true });
        const p5 = supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');
        const p6 = supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'interpreter');

        const [r1, r2, r3, r4, r5, r6] = await Promise.all([p1, p2, p3, p4, p5, p6]);

        let totalRevenue = 0;
        (r3.data || []).forEach((row: any) => totalRevenue += (row.price || 0));

        const stats = {
            totalRequests: r1.count || 0,
            completedRequests: r2.count || 0,
            totalRevenue,
            dreamsCount: r4.count || 0,
            usersCount: r5.count || 0,
            interpretersCount: r6.count || 0,
        };

        setCache(CACHE_KEY, stats, CACHE_TTL);
        return NextResponse.json(stats);

    } catch (error: any) {
        console.error('[STATS] ❌ DB failed — returning fallback stats:', error?.message);
        return NextResponse.json(FALLBACK_STATS);
    }
}
