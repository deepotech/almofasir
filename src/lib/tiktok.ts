/**
 * src/lib/tiktok.ts
 *
 * Official TikTok oEmbed & Video Integration Service.
 * Complies 100% with official TikTok developer policies (no scraping).
 */

export interface TikTokOEmbedResponse {
    version: string;
    type: string;
    title: string;
    author_url: string;
    author_name: string;
    author_unique_id?: string;
    thumbnail_url: string;
    thumbnail_width?: number;
    thumbnail_height?: number;
    html: string;
    provider_url: string;
    provider_name: string;
}

export interface TikTokVideoData {
    title: string;
    authorName: string;
    authorUsername: string;
    thumbnailUrl: string;
    embedHtml: string;
    videoId: string;
    videoUrl: string;
    suggestedSlug: string;
}

/**
 * Validate that a given string is a plausible TikTok video URL.
 */
export function validateTikTokUrl(inputUrl: string): { isValid: boolean; cleanedUrl: string; error?: string } {
    if (!inputUrl || typeof inputUrl !== 'string') {
        return { isValid: false, cleanedUrl: '', error: 'يرجى إدخال رابط TikTok صالح.' };
    }

    const trimmed = inputUrl.trim();

    try {
        const parsed = new URL(trimmed);

        // Security: Enforce HTTPS strictly (reject http, file, gopher, ftp)
        if (parsed.protocol !== 'https:') {
            return {
                isValid: false,
                cleanedUrl: '',
                error: 'يجب أن يبدأ الرابط ببروتوكول آمن https://',
            };
        }

        // Security: Reject credentials in URL
        if (parsed.username || parsed.password) {
            return {
                isValid: false,
                cleanedUrl: '',
                error: 'الرابط يحتوي على بيانات اعتماد غير مسموح بها.',
            };
        }

        // Security: Reject non-standard ports
        if (parsed.port && parsed.port !== '443') {
            return {
                isValid: false,
                cleanedUrl: '',
                error: 'الرابط يحتوي على منفذ مخصص غير مسموح به.',
            };
        }

        const host = parsed.hostname.toLowerCase();
        const ALLOWED_HOSTS = new Set([
            'tiktok.com',
            'www.tiktok.com',
            'm.tiktok.com',
            'vm.tiktok.com',
            'vt.tiktok.com',
        ]);

        if (!ALLOWED_HOSTS.has(host)) {
            return {
                isValid: false,
                cleanedUrl: trimmed,
                error: 'الرابط المدخل ليس نطاقاً رسمياً معتمداً لـ TikTok.',
            };
        }

        // Clean tracking query params and hashes to avoid pollution
        parsed.search = '';
        parsed.hash = '';

        return { isValid: true, cleanedUrl: parsed.toString() };
    } catch {
        return { isValid: false, cleanedUrl: '', error: 'صيغة الرابط غير صحيحة.' };
    }
}


/**
 * Extract numeric video ID from URL or embed HTML
 */
export function extractTikTokVideoId(url: string, embedHtml?: string): string {
    // 1. Try URL regex: /(video|photo)/(\d+)
    const urlMatch = url.match(/\/(video|photo)\/(\d+)/i);
    if (urlMatch && urlMatch[2]) {
        return urlMatch[2];
    }

    // 2. Try embed HTML: data-video-id="(\d+)"
    if (embedHtml) {
        const htmlMatch = embedHtml.match(/data-video-id=["'](\d+)["']/i);
        if (htmlMatch && htmlMatch[1]) {
            return htmlMatch[1];
        }
    }

    // 3. Try generic query/path trailing numbers
    const trailingNumberMatch = url.match(/\/(\d{10,25})/);
    if (trailingNumberMatch && trailingNumberMatch[1]) {
        return trailingNumberMatch[1];
    }

    return '';
}

/**
 * Generate a clean URL slug from title and video ID
 */
export function generateVideoSlug(title: string, videoId: string): string {
    // Clean title
    let slug = title
        .toLowerCase()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60);

    // Remove leading/trailing dashes
    slug = slug.replace(/^-+|-+$/g, '');

    if (!slug || slug.length < 3) {
        return `video-${videoId || Date.now()}`;
    }

    return slug;
}

/**
 * Fetch official TikTok oEmbed data
 */
export async function fetchTikTokOEmbed(rawUrl: string): Promise<{ data: TikTokVideoData | null; error: string | null }> {
    const { isValid, cleanedUrl, error: valError } = validateTikTokUrl(rawUrl);
    if (!isValid) {
        return { data: null, error: valError || 'رابط TikTok غير صحيح' };
    }

    // TikTok oEmbed only recognizes /video/ endpoints for carousels/photos
    const oembedUrl = cleanedUrl.replace(/\/photo\//i, '/video/');
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(oembedUrl)}`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const res = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
            },

            next: { revalidate: 3600 },
        });

        clearTimeout(timeout);

        if (!res.ok) {
            if (res.status === 404) {
                return { data: null, error: 'لم يتم العثور على الفيديو، تأكد أن الفيديو عام وغير محذوف.' };
            }
            if (res.status === 429) {
                return { data: null, error: 'تم تجاوز حد الطلبات لـ TikTok مؤقتاً، يرجى المحاولة بعد دقيقة.' };
            }
            return { data: null, error: `استجاب TikTok بالرمز ${res.status}. تعذر جلب البيانات.` };
        }

        const json: TikTokOEmbedResponse = await res.json();

        if (!json || (!json.title && !json.html)) {
            return { data: null, error: 'استجابة TikTok غير متوافقة أو فارغة.' };
        }

        const videoId = extractTikTokVideoId(cleanedUrl, json.html) || extractTikTokVideoId(json.author_url || '', json.html);

        // Extract author unique id (@username)
        let authorUsername = json.author_unique_id || '';
        if (!authorUsername && json.author_url) {
            const authorMatch = json.author_url.match(/@([a-zA-Z0-9_.-]+)/);
            if (authorMatch) authorUsername = authorMatch[1];
        }

        const title = json.title?.trim() || 'فيديو من تيك توك';
        const suggestedSlug = generateVideoSlug(title, videoId);

        const data: TikTokVideoData = {
            title,
            authorName: json.author_name || 'المُفسِّر',
            authorUsername: authorUsername || 'almofasir_',
            thumbnailUrl: json.thumbnail_url || '',
            embedHtml: json.html || '',
            videoId: videoId || `${Date.now()}`,
            videoUrl: cleanedUrl,
            suggestedSlug,
        };

        return { data, error: null };
    } catch (err: any) {
        if (err.name === 'AbortError') {
            return { data: null, error: 'استغرق الاتصال بـ TikTok وقتاً أطول من المتوقع (انتهت مهلة الطلب).' };
        }
        return { data: null, error: `فشل جلب بيانات TikTok: ${err.message || 'خطأ غير معروف'}` };
    }
}
