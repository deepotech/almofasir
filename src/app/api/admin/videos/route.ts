import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { getAllVideosAdmin, upsertVideo, deleteVideo } from '@/lib/videos';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/videos - List all videos for admin
 */
export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const videos = await getAllVideosAdmin();
        return NextResponse.json({ success: true, videos });
    } catch (err: any) {
        console.error('[Admin Videos GET] Error:', err);
        return NextResponse.json({ error: err?.message || 'فشل استرجاع الفيديوهات.' }, { status: 500 });
    }
}

/**
 * POST /api/admin/videos - Upsert video
 */
export async function POST(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();

        // Validation
        if (!body.title || typeof body.title !== 'string') {
            return NextResponse.json({ error: 'عنوان الفيديو مطلوب.' }, { status: 400 });
        }
        if (!body.slug || typeof body.slug !== 'string') {
            return NextResponse.json({ error: 'المسار (slug) مطلوب.' }, { status: 400 });
        }
        if (!body.tiktokVideoId || typeof body.tiktokVideoId !== 'string') {
            return NextResponse.json({ error: 'معرف فيديو TikTok مطلوب.' }, { status: 400 });
        }
        if (!body.tiktokUrl || typeof body.tiktokUrl !== 'string') {
            return NextResponse.json({ error: 'رابط TikTok مطلوب.' }, { status: 400 });
        }

        const { video, error } = await upsertVideo(body);

        if (error || !video) {
            return NextResponse.json({ error: error || 'فشل حفظ الفيديو في قاعدة البيانات.' }, { status: 422 });
        }

        return NextResponse.json({ success: true, video });
    } catch (err: any) {
        console.error('[Admin Videos POST] Error:', err);
        return NextResponse.json({ error: err?.message || 'حدث خطأ أثناء حفظ الفيديو.' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/videos?id=... - Delete video
 */
export async function DELETE(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'معرف الفيديو مطلوب للحذف.' }, { status: 400 });
        }

        const { success, error } = await deleteVideo(id);

        if (error || !success) {
            return NextResponse.json({ error: error || 'فشل حذف الفيديو.' }, { status: 422 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Admin Videos DELETE] Error:', err);
        return NextResponse.json({ error: err?.message || 'حدث خطأ أثناء حذف الفيديو.' }, { status: 500 });
    }
}
