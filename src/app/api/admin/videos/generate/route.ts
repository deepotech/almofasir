import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { generateVideoContentWithAI } from '@/lib/videoAI';
import { upsertVideo } from '@/lib/videos';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

/**
 * POST /api/admin/videos/generate
 * Body: { title: string, description?: string, category?: string, tiktokUrl?: string, autoSaveId?: string }
 */
export async function POST(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { title, description, category, tiktokUrl, autoSaveId } = body;

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json({ error: 'عنوان المقطع مطلوب لتوليد المحتوى.' }, { status: 400 });
        }

        const generated = await generateVideoContentWithAI({
            title: title.trim(),
            description: description?.trim(),
            category: category?.trim(),
            tiktokUrl: tiktokUrl?.trim(),
        });

        // If autoSaveId is provided, save it directly to the video in DB
        if (autoSaveId) {
            const { video: updatedVideo, error: saveErr } = await upsertVideo({
                id: autoSaveId,
                title: generated.cleanTitle,
                slug: generated.slug,
                category: generated.category,
                seoTitle: generated.seoTitle,
                seoDescription: generated.seoDescription,
                description: generated.description,
                articleContent: generated.articleContent,
                takeaways: generated.takeaways,
                faq: generated.faq,
            });

            if (saveErr) {
                console.warn('[Generate Route] Failed to auto-save to DB:', saveErr);
            } else {
                return NextResponse.json({
                    success: true,
                    generated,
                    savedVideo: updatedVideo,
                });
            }
        }

        return NextResponse.json({ success: true, generated });
    } catch (err: any) {
        console.error('[Admin Videos Generate API] Error:', err);
        return NextResponse.json({ error: err?.message || 'فشل توليد محتوى الفيديو.' }, { status: 500 });
    }
}
