import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { slug, action } = body; // action: 'view' | 'like' | 'dislike'

        if (!slug || !action) {
            return NextResponse.json({ error: 'Missing slug or action' }, { status: 400 });
        }

        if (!['view', 'like', 'dislike'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Upsert row, then increment the target column atomically via RPC
        // First ensure the row exists
        await supabaseAdmin
            .from('page_metrics')
            .upsert({ slug, views: 0, likes: 0, dislikes: 0 }, { onConflict: 'slug', ignoreDuplicates: true });

        // Now increment the correct counter
        const column = action === 'view' ? 'views' : action === 'like' ? 'likes' : 'dislikes';

        const { data: metrics, error } = await supabaseAdmin.rpc('increment_page_metric', {
            p_slug:   slug,
            p_column: column,
        });

        if (error) {
            // Fallback: manual read → update if RPC not found
            const { data: current } = await supabaseAdmin
                .from('page_metrics')
                .select('views, likes, dislikes')
                .eq('slug', slug)
                .single();

            const update: Record<string, number> = {
                views:    current?.views    ?? 0,
                likes:    current?.likes    ?? 0,
                dislikes: current?.dislikes ?? 0,
            };
            update[column] = (update[column] ?? 0) + 1;

            await supabaseAdmin
                .from('page_metrics')
                .update({ ...update, updated_at: new Date().toISOString() })
                .eq('slug', slug);
        }

        // Return updated metrics
        const { data: updated } = await supabaseAdmin
            .from('page_metrics')
            .select('views, likes, dislikes')
            .eq('slug', slug)
            .single();

        return NextResponse.json({ success: true, metrics: updated });
    } catch (e) {
        console.error('Metrics Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');

        if (!slug) return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });

        const { data: metrics, error } = await supabaseAdmin
            .from('page_metrics')
            .select('views, likes, dislikes')
            .eq('slug', slug)
            .single();

        if (error || !metrics) {
            return NextResponse.json({ views: 0, likes: 0, dislikes: 0 });
        }

        return NextResponse.json(metrics);
    } catch (e) {
        console.error('Metrics Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
