import { slugifyArabic } from './slugifyArabic';

/**
 * Generate SEO-friendly slug from dream content
 * 
 * @param title - Dream title or content preview
 * @param tags - Existing tags from dream
 * @param id - MongoDB ObjectId
 * @returns SEO-friendly slug
 */
export function generateSlug(
    title: string,
    tags: string[] | undefined,
    id: string
): string {
    // Combine title and tags for better context
    let sourceText = title;
    if (tags && tags.length > 0) {
        // Only append tags if title is short? Or always?
        // User wants "core keyword phrase". Tags are keywords.
        sourceText += ' ' + tags.join(' ');
    }

    // Use robust slugify
    let slug = slugifyArabic(sourceText);

    // If result empty or too short, fallback to ID based slug
    if (!slug || slug.length < 4) {
        const shortId = id.toString().slice(-6);
        return `تفسير-حلم-${shortId}`;
    }

    // Note: This does not guarantee global uniqueness. 
    // The caller (e.g. migration script) handles collision resolution.
    // For runtime generation (lazy fix), this is "good enough" or might cause collision if multiple dreams have identical keywords.
    // To be safe for runtime, we append short ID if slug is very common?
    // User requested "ZERO SEO loss" and "clean" slugs.
    // Clean slugs = NO ID.
    // So we return clean slug.

    return slug;
}

/**
 * Extract short ID from slug (last 6 characters before any trailing content)
 */
export function extractIdFromSlug(slug: string): string | null {
    // Match the last segment that looks like a MongoDB ID fragment (6 hex chars)
    // Old slugs: ...-hexid
    // New slugs: NO hexid.
    // This function is for BACKWARD COMPATIBILITY to find old slugs.
    const match = slug.match(/-([a-f0-9]{6})$/i);
    return match ? match[1] : null;
}

/**
 * Check if a string is a valid MongoDB ObjectId
 */
export function isMongoId(str: string): boolean {
    return /^[a-f\d]{24}$/i.test(str);
}


/**
 * Generate a title for SEO from dream content (Curiosity Hooks & CTR focus)
 */
export function generateSeoTitle(
    dreamTitle: string | undefined,
    tags: string[] | undefined,
    content: string
): string {
    // If title exists and is good, we enhance it slightly if possible, or use as is
    if (dreamTitle && dreamTitle.length > 10) {
        return dreamTitle;
    }

    // Generate from tags using Curiosity Hooks
    if (tags && tags.length > 0) {
        const mainSymbol = tags[0];
        const hooks = [
            `تفسير حلم ${mainSymbol}: هل هي بشارة أم تحذير؟ 🚨`,
            `رؤية ${mainSymbol} في المنام: رسالة خفية يجب أن تعرفها!`,
            `ماذا يعني تكرار حلم ${mainSymbol}؟ المعنى النفسي والشرعي`,
            `تفسير حلم ${mainSymbol}: التفاصيل الشاملة لابن سيرين`
        ];
        // Pick a pseudo-random hook based on the symbol's length to ensure consistency
        const index = mainSymbol.length % hooks.length;
        return hooks[index].slice(0, 60); // Keep under 60 chars
    }

    // Generate from content preview
    const preview = content.slice(0, 30).trim();
    return `حلمت بـ "${preview}": اكتشف التفسير الغامض الآن`.slice(0, 60);
}

/**
 * Generate meta description (≤155 chars) with emotional triggers
 */
export function generateMetaDescription(
    interpretation: string,
    tags: string[] | undefined
): string {
    const mainSymbol = tags && tags.length > 0 ? tags[0] : 'هذا الحلم';
    
    // The Emotional/Mystery Hook (Approx 50 chars)
    const hook = `هل رأيت ${mainSymbol} في المنام وتطاردك الحيرة؟ اكتشف السر: `;

    // Clean interpretation text
    const cleanInterpretation = interpretation
        .replace(/\*\*/g, '')  // Remove markdown bold
        .replace(/\n+/g, ' ')  // Replace newlines with spaces
        .replace(/\s+/g, ' ')  // Normalize spaces
        .trim();

    const maxLength = 153 - hook.length;
    let snippet = cleanInterpretation.slice(0, maxLength);
    
    // Avoid cutting words in half
    const lastSpace = snippet.lastIndexOf(' ');
    if (lastSpace > 0 && cleanInterpretation.length > maxLength) {
        snippet = snippet.substring(0, lastSpace) + '...';
    }

    return hook + snippet;
}
