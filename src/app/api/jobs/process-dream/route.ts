import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import { interpreters, InterpreterId } from '@/lib/interpreters';
import { logger } from '@/lib/logger';

export const maxDuration = 60; // Allow 60s for Vercel
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, dreamText, contextString, interpreterKey } = body;

        logger.info('QStash Job Received', { event: 'JOB_START', orderId });

        if (!orderId || !dreamText) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        await dbConnect();

        const order = await DreamRequest.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check idempotency (if already completed, skip)
        if (order.status === 'completed' && order.interpretationText && !order.interpretationText.startsWith('جاري تحليل')) {
            logger.info('Job skipped, already completed', { event: 'JOB_SKIPPED', orderId });
            return NextResponse.json({ success: true, message: 'Already completed' });
        }

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'Missing OpenRouter API Key' }, { status: 500 });
        }

        const selectedInterpreter = interpreters[interpreterKey as InterpreterId] || interpreters['ibn-sirin'];
        const structuredInstructions = `
 يجب أن يكون تفسيرك مقسمًا بدقة إلى الأقسام التالية (استخدم العناوين بخط عريض):
 1. **خلاصة سريعة**: (سطرين كحد أقصى يعطي المعنى المباشر)
 2. **تفسير تفصيلي**: (شرح الرموز وترابطها)
 3. **نصيحة أو تنبيه**: (توجيه عملي للرائي بناءً على الحلم)
 
 خاطب الرائي بصيغة: ${contextString.includes('أنثى') ? 'أنثى' : 'ذكر'}.
 ديانة: إسلامي.
 `;

        // AI Fetch logic natively imported into the background worker
        let interpretationText = '';
        let aiSuccess = false;
        let retries = 0;

        while (retries <= 2 && !aiSuccess) {
            const aiController = new AbortController();
            const aiTimeoutId = setTimeout(() => aiController.abort(), 20000); // 20s in background
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    signal: aiController.signal,
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                        "X-Title": "Almofasser Background",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "openai/gpt-4o-mini",
                        messages: [
                            { role: "system", content: selectedInterpreter.systemPrompt + contextString + structuredInstructions },
                            { role: "user", content: `حلمي: ${dreamText}` }
                        ]
                    })
                });
                clearTimeout(aiTimeoutId);
                if (response.ok) {
                    const aiData = await response.json();
                    interpretationText = aiData.choices[0]?.message?.content || "No response";
                    aiSuccess = true;
                } else {
                    logger.warn(`OpenRouter returned ${response.status}`, { event: 'AI_HTTP_ERROR' });
                    retries++;
                }
            } catch (fetchErr: any) {
                clearTimeout(aiTimeoutId);
                logger.error('Fetch error during background AI process', { event: 'AI_FETCH_ERROR' }, fetchErr);
                retries++;
            }
        }

        if (!aiSuccess) {
            interpretationText = "عذراً، استغرق التفسير وقتاً طويلاً أو حدث خطأ في خدمة الذكاء الاصطناعي. يرجى المحاولة مجدداً.";
            logger.error('Job failed after retries', { event: 'JOB_FAIL', orderId });
            // Let QStash retry if it's completely broken (by throwing), or accept gracefully.
            // Since cost has been deducted, we accept gracefully and insert the error text so user knows.
        }

        // Save cleanly
        order.interpretationText = interpretationText;
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();

        logger.info('QStash Job completed successfully', { event: 'JOB_SUCCESS', orderId });
        return NextResponse.json({ success: true });

    } catch (error: any) {
        logger.error('Unexpected error in Job Process', { event: 'JOB_EXCEPTION' }, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
