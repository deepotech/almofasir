/**
 * SEO Slug Generation for Arabic Dream Content
 * 
 * Generates SEO-friendly slugs from Arabic dream text and tags.
 * Format: تفسير-حلم-[keyword1]-[keyword2]-[shortId]
 */

// Common Arabic stop words to filter out
const ARABIC_STOP_WORDS = new Set([
    'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
    'الذي', 'التي', 'الذين', 'اللذين', 'اللتين', 'ان', 'أن', 'إن',
    'كان', 'كانت', 'يكون', 'تكون', 'هو', 'هي', 'هم', 'هن', 'أنا', 'نحن',
    'أنت', 'أنتم', 'أنتن', 'لقد', 'قد', 'ثم', 'حتى', 'لكن', 'لكنه',
    'بعد', 'قبل', 'بين', 'فوق', 'تحت', 'أمام', 'خلف', 'حول', 'عند',
    'منذ', 'خلال', 'ضد', 'نحو', 'لدى', 'كل', 'بعض', 'غير', 'كما',
    'أيضا', 'أيضاً', 'و', 'أو', 'لا', 'نعم', 'لم', 'لن', 'ما', 'ماذا',
    'كيف', 'أين', 'متى', 'لماذا', 'هل', 'أي', 'أية', 'رأيت', 'حلمت',
    'كنت', 'رأى', 'يرى', 'ترى', 'ورأيت', 'فرأيت', 'المنام', 'منام',
    'الحلم', 'حلم'
]);

// Common dream symbols for keyword extraction
const DREAM_SYMBOLS = [
    'أسد', 'ثعبان', 'ماء', 'بحر', 'نار', 'سماء', 'شمس', 'قمر', 'نجم',
    'طائر', 'سمك', 'حصان', 'جمل', 'قط', 'كلب', 'فأر', 'عقرب', 'نمل',
    'شجرة', 'زهرة', 'جبل', 'نهر', 'صحراء', 'غابة', 'بيت', 'قصر', 'مسجد',
    'ذهب', 'فضة', 'مال', 'خاتم', 'سيف', 'سيارة', 'طائرة', 'قطار',
    'موت', 'زواج', 'ولادة', 'سفر', 'طيران', 'سقوط', 'صعود', 'هروب',
    'أب', 'أم', 'أخ', 'أخت', 'ابن', 'ابنة', 'جد', 'جدة', 'ميت', 'طفل',
    'ملك', 'أمير', 'شيخ', 'نبي', 'رسول', 'عالم', 'طبيب', 'معلم',
    'ملابس', 'طعام', 'لحم', 'خبز', 'فاكهة', 'تمر', 'عسل', 'لبن',
    'دم', 'دموع', 'ضحك', 'بكاء', 'صراخ', 'كلام', 'صمت',
    'كعبة', 'مكة', 'مدينة', 'قبر', 'جنة', 'نار', 'صلاة', 'قرآن'
];

/**
 * Extract meaningful keywords from Arabic text
 */
export function extractKeywords(text: string, existingTags?: string[]): string[] {
    const keywords: string[] = [];

    // Priority 1: Use existing tags if available
    if (existingTags && existingTags.length > 0) {
        keywords.push(...existingTags.slice(0, 3));
    }

    // Priority 2: Find dream symbols in text
    if (keywords.length < 3) {
        const normalizedText = text.toLowerCase();
        for (const symbol of DREAM_SYMBOLS) {
            if (normalizedText.includes(symbol) && !keywords.includes(symbol)) {
                keywords.push(symbol);
                if (keywords.length >= 3) break;
            }
        }
    }

    // Priority 3: Extract nouns from text (simplified approach)
    if (keywords.length < 2) {
        const words = text.split(/[\s،,؛.!؟\-\(\)\[\]]+/)
            .filter(word => word.length > 2)
            .filter(word => !ARABIC_STOP_WORDS.has(word))
            .slice(0, 5);

        for (const word of words) {
            if (!keywords.includes(word)) {
                keywords.push(word);
                if (keywords.length >= 3) break;
            }
        }
    }

    return keywords.slice(0, 3);
}

/**
 * Clean text for URL usage (Arabic-safe)
 */
function cleanForUrl(text: string): string {
    return text
        .trim()
        .replace(/[\s]+/g, '-')           // Replace spaces with hyphens
        .replace(/[^\u0600-\u06FF\w-]/g, '') // Keep Arabic, alphanumeric, hyphens
        .replace(/-+/g, '-')               // Remove duplicate hyphens
        .replace(/^-|-$/g, '');            // Remove leading/trailing hyphens
}

/**
 * Generate SEO-friendly slug from dream content
 * 
 * @param title - Dream title or content preview
 * @param tags - Existing tags from dream
 * @param id - MongoDB ObjectId (will use first 6 chars)
 * @returns SEO-friendly slug
 * 
 * @example
 * generateSlug("رأيت أسداً في الصحراء", ["أسد", "صحراء"], "507f1f77bcf86cd799439011")
 * // Returns: "تفسير-حلم-اسد-صحراء-507f1f"
 */
export function generateSlug(
    title: string,
    tags: string[] | undefined,
    id: string
): string {
    const shortId = id.toString().slice(-6); // Last 6 chars of MongoDB ID
    const keywords = extractKeywords(title, tags);

    if (keywords.length === 0) {
        const shortId = id.toString().slice(-6);
        return `تفسير-حلم-${shortId}`;
    }

    const keywordsPart = keywords
        .map(k => cleanForUrl(k))
        .filter(k => k.length > 0)
        .join('-');

    return `تفسير-حلم-${keywordsPart}`;
}

/**
 * Extract short ID from slug (last 6 characters before any trailing content)
 */
export function extractIdFromSlug(slug: string): string | null {
    // Match the last segment that looks like a MongoDB ID fragment (6 hex chars)
    const match = slug.match(/([a-f0-9]{6})$/i);
    return match ? match[1] : null;
}

/**
 * Check if a string is a valid MongoDB ObjectId
 */
export function isMongoId(str: string): boolean {
    return /^[a-f\d]{24}$/i.test(str);
}

/**
 * Generate a title for SEO from dream content
 */
export function generateSeoTitle(
    dreamTitle: string | undefined,
    tags: string[] | undefined,
    content: string
): string {
    // If title exists, use it
    if (dreamTitle && dreamTitle.length > 10) {
        return dreamTitle;
    }

    // Generate from tags
    if (tags && tags.length > 0) {
        const mainSymbol = tags[0];
        return `ما تفسير حلم ${mainSymbol} في المنام؟`;
    }

    // Generate from content preview
    const preview = content.slice(0, 50).trim();
    return `تفسير حلم: ${preview}...`;
}

/**
 * Generate meta description (≤160 chars)
 */
export function generateMetaDescription(
    interpretation: string,
    tags: string[] | undefined
): string {
    const tagsText = tags && tags.length > 0
        ? ` الرموز: ${tags.slice(0, 3).join('، ')}.`
        : '';

    // Clean interpretation text
    const cleanInterpretation = interpretation
        .replace(/\*\*/g, '')  // Remove markdown bold
        .replace(/\n+/g, ' ')  // Replace newlines with spaces
        .replace(/\s+/g, ' ')  // Normalize spaces
        .trim();

    const maxLength = 155 - tagsText.length;
    const truncated = cleanInterpretation.length > maxLength
        ? cleanInterpretation.slice(0, maxLength - 3) + '...'
        : cleanInterpretation;

    return truncated + tagsText;
}
