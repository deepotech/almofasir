import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { interpretDream } from '@/lib/dreamInterpreter';

export const maxDuration = 60; // Allow 60s for Vercel
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, dreamText, context, contextString, interpreterKey } = body;

        logger.info('QStash Job Received', { event: 'JOB_START', orderId });

        if (!orderId || !dreamText) {
            return NextResponse.json({ error: 'Missing required parameters: orderId, dreamText' }, { status: 400 });
        }

        const { data: order, error } = await supabaseAdmin
            .from('dream_requests')
            .select('status, interpretation_text, context')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Idempotency guard: skip if already completed with real content
        if (
            order.status === 'completed' &&
            order.interpretation_text &&
            !order.interpretation_text.startsWith('جاري تحليل')
        ) {
            logger.info('Job skipped (already completed)', { event: 'JOB_SKIPPED', orderId });
            return NextResponse.json({ success: true, message: 'Already completed' });
        }

        // Run AI Interpretation
        logger.info('Starting AI interpretation', { event: 'AI_START', orderId });

        const result = await interpretDream(
            dreamText,
            context || order.context,
            2 // allow 2 retries
        );

        // Persist Result
        await supabaseAdmin
            .from('dream_requests')
            .update({
                interpretation_text: result.text,
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

        logger.info('QStash Job completed', {
            event: 'JOB_SUCCESS',
            orderId,
            skipped: result.skipped,
            confidence: result.confidenceScore,
            symbolCount: result.symbols.length,
            dreamType: result.type,
        });

        return NextResponse.json({
            success: true,
            skipped: result.skipped,
            skipReason: result.skipReason,
            symbols: result.symbols,
            type: result.type,
            confidenceScore: result.confidenceScore,
        });

    } catch (error: any) {
        logger.error('Unexpected error in Job Process', { event: 'JOB_EXCEPTION' }, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
