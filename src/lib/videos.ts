/**
 * src/lib/videos.ts
 *
 * Data Access Layer for Video Library.
 * Queries Supabase `videos` table with resilient fallback to seed data.
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Video, VideoRow, rowToVideo } from '@/types/video';
import { fallbackVideos } from '@/lib/videoSeed';

/**
 * Fetch all published videos with optional category filter and pagination limit.
 */
export async function getPublishedVideos(options?: {
    category?: string;
    limit?: number;
    offset?: number;
}): Promise<{ videos: Video[]; total: number }> {
    const { category, limit = 50, offset = 0 } = options || {};

    try {
        let query = supabaseAdmin
            .from('videos')
            .select('*', { count: 'exact' })
            .eq('is_published', true)
            .order('published_at', { ascending: false });

        if (category && category !== 'الكل') {
            query = query.eq('category', category);
        }

        if (limit) {
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error, count } = await query;

        if (error) {
            console.warn('[videos.ts] Supabase query error, falling back to seed data:', error.message);
            return filterFallbackVideos(category, limit, offset);
        }

        if (!data || data.length === 0) {
            // If table exists but is empty, provide seed data
            return filterFallbackVideos(category, limit, offset);
        }

        const videos = data.map((row: VideoRow) => rowToVideo(row));
        return {
            videos,
            total: count ?? videos.length,
        };
    } catch (err: any) {
        console.warn('[videos.ts] Unexpected error fetching videos, using fallback:', err?.message);
        return filterFallbackVideos(category, limit, offset);
    }
}

/**
 * Helper to filter fallback videos safely
 */
function filterFallbackVideos(
    category?: string,
    limit: number = 50,
    offset: number = 0
): { videos: Video[]; total: number } {
    let list = fallbackVideos.filter(v => v.isPublished);
    if (category && category !== 'الكل') {
        list = list.filter(v => v.category === category);
    }
    const total = list.length;
    const paged = list.slice(offset, offset + limit);
    return { videos: paged, total };
}

/**
 * Fetch a single video by its slug
 */
export async function getVideoBySlug(slug: string): Promise<Video | null> {
    if (!slug) return null;

    try {
        const { data, error } = await supabaseAdmin
            .from('videos')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle();

        if (error) {
            console.warn(`[videos.ts] Error fetching video by slug "${slug}", checking seed:`, error.message);
            return fallbackVideos.find(v => v.slug === slug && v.isPublished) || null;
        }

        if (data) {
            return rowToVideo(data as VideoRow);
        }

        // Check fallback
        return fallbackVideos.find(v => v.slug === slug && v.isPublished) || null;
    } catch (err: any) {
        console.warn(`[videos.ts] Exception fetching video "${slug}":`, err?.message);
        return fallbackVideos.find(v => v.slug === slug && v.isPublished) || null;
    }
}

/**
 * Fetch all published video slugs for sitemap generation
 */
export async function getAllPublishedVideoSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('videos')
            .select('slug, updated_at, published_at')
            .eq('is_published', true)
            .order('published_at', { ascending: false });

        if (error || !data || data.length === 0) {
            return fallbackVideos
                .filter(v => v.isPublished)
                .map(v => ({
                    slug: v.slug,
                    updatedAt: v.updatedAt || v.publishedAt || new Date().toISOString(),
                }));
        }

        return data.map((item: any) => ({
            slug: item.slug,
            updatedAt: item.updated_at || item.published_at || new Date().toISOString(),
        }));
    } catch (err: any) {
        return fallbackVideos
            .filter(v => v.isPublished)
            .map(v => ({
                slug: v.slug,
                updatedAt: v.updatedAt || v.publishedAt || new Date().toISOString(),
            }));
    }
}

/**
 * ADMIN: Fetch all videos (including unpublished)
 */
export async function getAllVideosAdmin(): Promise<Video[]> {
    const { data, error } = await supabaseAdmin
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[videos.ts] Admin query error:', error.message);
        throw new Error(`خطأ في قاعدة البيانات (${error.code}): ${error.message}. يرجى التحقق من تطبيق ملف migration لجدول videos.`);
    }

    if (!data) {
        return [];
    }

    return data.map((row: VideoRow) => rowToVideo(row));
}

/**
 * ADMIN: Upsert a video record (idempotent on slug or tiktok_video_id)
 */
export async function upsertVideo(videoData: Partial<Video>): Promise<{ video: Video | null; error: string | null }> {
    try {
        if (!videoData.slug || !videoData.tiktokVideoId || !videoData.title) {
            return { video: null, error: 'العنوان والرابط والمعرّف ومسار الرابط (slug) حقول مطلوبة.' };
        }

        const payload: Record<string, any> = {
            slug: videoData.slug.trim(),
            tiktok_url: videoData.tiktokUrl?.trim() || '',
            tiktok_video_id: videoData.tiktokVideoId.trim(),
            title: videoData.title.trim(),
            description: videoData.description || null,
            thumbnail_url: videoData.thumbnailUrl || null,
            author_name: videoData.authorName || 'المُفسِّر',
            author_username: videoData.authorUsername || 'almofasir_',
            embed_html: videoData.embedHtml || null,
            duration: videoData.duration || null,
            category: videoData.category || 'تفسير الرموز',
            seo_title: videoData.seoTitle || null,
            seo_description: videoData.seoDescription || null,
            article_content: videoData.articleContent || null,
            takeaways: videoData.takeaways || [],
            faq: videoData.faq || [],
            is_published: videoData.isPublished ?? true,
            published_at: videoData.publishedAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        if (videoData.id && !videoData.id.startsWith('seed-')) {
            payload.id = videoData.id;
        }

        // Slug collision check: Ensure no other video uses this slug
        const { data: existingSlug } = await supabaseAdmin
            .from('videos')
            .select('id, tiktok_video_id')
            .eq('slug', payload.slug)
            .neq('tiktok_video_id', payload.tiktok_video_id)
            .maybeSingle();

        if (existingSlug) {
            return {
                video: null,
                error: 'هذا المسار (slug) مستخدم بالفعل لفيديو آخر. يرجى اختيار مسار مختلف.',
            };
        }

        const { data, error } = await supabaseAdmin
            .from('videos')
            .upsert(payload, { onConflict: 'tiktok_video_id' })
            .select()
            .single();

        if (error) {
            return { video: null, error: error.message };
        }

        return { video: rowToVideo(data as VideoRow), error: null };
    } catch (err: any) {
        return { video: null, error: err?.message || 'خطأ غير متوقع أثناء حفظ الفيديو' };
    }
}

/**
 * ADMIN: Delete video
 */
export async function deleteVideo(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
        if (!id || typeof id !== 'string') {
            return { success: false, error: 'معرّف الفيديو غير صالح.' };
        }

        if (id.startsWith('seed-')) {
            return {
                success: false,
                error: 'لا يمكن حذف الفيديوهات الافتراضية؛ يمكنك إخفاؤها من الموقع بتعطيل حالة النشر.',
            };
        }

        // Validate UUID syntax
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return { success: false, error: 'معرّف الفيديو غير صحيح.' };
        }

        const { error } = await supabaseAdmin
            .from('videos')
            .delete()
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err?.message || 'فشل حذف الفيديو' };
    }
}

