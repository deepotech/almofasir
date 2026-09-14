/**
 * src/types/video.ts
 *
 * Types for Video Library & TikTok Integration
 */

export interface VideoFAQ {
    question: string;
    answer: string;
}

export interface Video {
    id: string;
    slug: string;
    tiktokUrl: string;
    tiktokVideoId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    authorName?: string;
    authorUsername?: string;
    embedHtml?: string;
    duration?: string;
    publishedAt: string;
    isPublished: boolean;
    category: string;
    seoTitle?: string;
    seoDescription?: string;
    articleContent?: string;
    takeaways?: string[];
    faq?: VideoFAQ[];
    createdAt?: string;
    updatedAt?: string;
}

export interface VideoRow {
    id: string;
    slug: string;
    tiktok_url: string;
    tiktok_video_id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    author_name: string | null;
    author_username: string | null;
    embed_html: string | null;
    duration: string | null;
    published_at: string | null;
    is_published: boolean;
    category: string;
    seo_title: string | null;
    seo_description: string | null;
    article_content: string | null;
    takeaways: string[] | null;
    faq: VideoFAQ[] | null;
    created_at: string;
    updated_at: string;
}

export function rowToVideo(row: Partial<VideoRow>): Video {
    return {
        id: row.id || '',
        slug: row.slug || '',
        tiktokUrl: row.tiktok_url || '',
        tiktokVideoId: row.tiktok_video_id || '',
        title: row.title || '',
        description: row.description || '',
        thumbnailUrl: row.thumbnail_url || '',
        authorName: row.author_name || undefined,
        authorUsername: row.author_username || undefined,
        embedHtml: row.embed_html || undefined,
        duration: row.duration || undefined,
        publishedAt: row.published_at || new Date().toISOString(),
        isPublished: row.is_published ?? true,
        category: row.category || 'تفسير الرموز',
        seoTitle: row.seo_title || undefined,
        seoDescription: row.seo_description || undefined,
        articleContent: row.article_content || undefined,
        takeaways: row.takeaways || [],
        faq: Array.isArray(row.faq) ? row.faq : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
