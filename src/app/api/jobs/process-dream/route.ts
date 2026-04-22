import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
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

        await dbConnect();

        const order = await DreamRequest.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Idempotency guard: skip if already completed with real content
        if (
            order.status === 'completed' &&
            order.interpretationText &&
            !order.interpretationText.startsWith('جاري تحليل')
        ) {
            logger.info('Job skipped (already completed)', { event: 'JOB_SKIPPED', orderId });
            return NextResponse.json({ success: true, message: 'Already completed' });
        }

        // ── Run AI Interpretation ──────────────────────────────────────────────
        logger.info('Starting AI interpretation', { event: 'AI_START', orderId });

        const result = await interpretDream(
            dreamText,
            context || order.context, // prefer fresh payload, fallback to DB
            2 // allow 2 retries in background job
        );

        // ── Persist Result ─────────────────────────────────────────────────────
        await DreamRequest.findByIdAndUpdate(orderId, {
            interpretationText: result.text,
            status: 'completed',
            completedAt: new Date(),
        });

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
