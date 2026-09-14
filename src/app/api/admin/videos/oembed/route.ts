import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { fetchTikTokOEmbed } from '@/lib/tiktok';

export const dynamic = 'force-dynamic';

/**
 * Fetch official TikTok oEmbed data for preview & auto-fill in Admin Dashboard
 */
export async function POST(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const url = body?.url;

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'يرجى تزويد رابط فيديو TikTok صحيح.' }, { status: 400 });
        }

        const { data, error } = await fetchTikTokOEmbed(url);

        if (error || !data) {
            return NextResponse.json({ error: error || 'فشل جلب بيانات TikTok.' }, { status: 422 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('[Admin TikTok oEmbed] Error:', err);
        return NextResponse.json({ error: err?.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب.' }, { status: 500 });
    }
}
