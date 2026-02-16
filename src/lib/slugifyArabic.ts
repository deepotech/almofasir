

// Advanced Arabic Slugification conforming to strict SEO standards

interface SlugOptions {
    maxLength: number;
    maxTokens: number;
}

const DEFAULT_OPTIONS: SlugOptions = {
    maxLength: 60,
    maxTokens: 6,
};

// 1. Normalization Map
const CHAR_MAP: Record<string, string> = {
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا', // Normalize Alef
    'ة': 'ه',                     // Normalize Teh Marbuta
    'ى': 'ي',                     // Normalize Alef Maqsura to Ya
    'ـ': '',                      // Remove Tatweel/Kashida
};

// 2. Junk / Stop Words to Remove
const JUNK_WORDS = new Set([
    'تفسير', 'حلم', 'رؤية', 'معنى', 'دلالات', 'تأويل', 'المنام', 'في', 'من', 'على', 'الي', 'عن',
    'و', 'او', 'ثم', 'عند', 'بين', 'ان', 'أن', 'ال', 'بالتفصيل', 'للعزباء', 'للمتزوجة', 'للحامل',
    'للرجل', 'للمطلقة', 'ابن', 'سيرين', 'النابلسي', 'الظاهري', 'تفسير_حلم', 'تفسير-حلم',
    'ما', 'هل', 'كيف', 'ماذا', 'لماذا', 'اين', 'متى', // Questions
    'ومعنى', 'ودلالات', 'تفسيرها', 'معناها', 'دلالتها', // Variations
    'لابن', 'وسيم', 'يوسف' // Specific names/connectors often used as filler in titles
]);

export function normalizeArabic(text: string): string {
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ـ/g, '') // Remove Tatweel
        // Remove diacritics (Tashkeel)
        .replace(/[\u064B-\u065F]/g, '');
}

export function slugifyArabic(text: string, options: Partial<SlugOptions> = {}): string {
    const maxLength = options.maxLength ?? DEFAULT_OPTIONS.maxLength;
    const maxTokens = options.maxTokens ?? DEFAULT_OPTIONS.maxTokens;

    // 1. Normalize
    let processed = normalizeArabic(text);

    // 2. Remove non-Arabic letters, digits, and spaces (keep basic punctuation for splitting)
    processed = processed.replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, ' ');

    // 3. Tokenize
    let tokens = processed.split(/[\s-]+/).filter(t => t.length > 0);

    // 4. Token Processing
    tokens = tokens.map(t => t.toLowerCase());

    const uniqueTokens: string[] = [];
    const seen = new Set<string>();

    // Helper to check if a token is junk
    const isJunk = (t: string) => {
        // Exact match in JUNK_WORDS NO longer used as blanket ban because "تفسير" and "حلم" are in it but allowed once.

        // Strict Stop Words (ALWAYS remove)
        const STRICT_JUNK = new Set([
            'في', 'من', 'على', 'الي', 'عن', 'بالتفصيل', 'دلالات', 'معنى', 'المنام', 'و', 'او', 'ثم', 'ان', 'أن',
            'ما', 'هل', 'كيف', 'ماذا', 'لماذا', 'اين', 'متى',
            'ومعنى', 'ودلالات', 'تفسيرها', 'معناها', 'دلالتها', 'وهو', 'وهي', 'كان', 'كانت'
        ]);

        if (STRICT_JUNK.has(t)) return true;

        // Handle "Wa" prefix for strict junk words
        if (t.startsWith('و') && t.length > 3) {
            const stem = t.substring(1);
            if (STRICT_JUNK.has(stem)) return true;
            if (stem === 'دلالات' || stem === 'معنى') return true;
        }

        return false;
    };

    for (const t of tokens) {
        let cleanT = t;

        // Remove 'al' (ال) prefix? 
        // "تفسير-حلم-المبنى" -> "المبنى" (Al-Mabna). Kept.
        // "تفسير-حلم-الصلاة" -> "الصلاة" (Al-Salah). Kept.
        // So keep 'al'.

        if (seen.has(cleanT)) continue;

        if (isJunk(cleanT)) continue;

        // Special Case: "تفسير" and "حلم" and "رؤية"
        // Allowed ONCE. If seen, they are skipped by `seen.has(cleanT)`.
        // But we need to make sure they are not treated as JUNK by `isJunk`.
        // My `isJunk` implementation above allows them (they are not in STRICT_JUNK).

        seen.add(cleanT);
        uniqueTokens.push(cleanT);
    }

    tokens = uniqueTokens;

    // 5. Enforce Token Count (2 to 6)
    if (tokens.length > maxTokens) {
        tokens = tokens.slice(0, maxTokens);
    }

    // 6. Join
    let slug = tokens.join('-');

    // 7. Enforce Length
    if (slug.length > maxLength) {
        slug = slug.substring(0, maxLength);
        // Remove incomplete word at the end
        const lastHyphen = slug.lastIndexOf('-');
        if (lastHyphen > 0) {
            slug = slug.substring(0, lastHyphen);
        }
    }

    // Final check: if empty, return generic fallback? 
    // Function should return string, caller handles fallback.
    if (!slug) return '';

    return slug;
}

/**
 * Validate a slug against strict SEO rules.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateSlug(slug: string): { valid: boolean; reason?: string } {
    if (!slug || slug.trim().length === 0) {
        return { valid: false, reason: 'Slug is empty' };
    }

    if (slug.length > 60) {
        return { valid: false, reason: `Slug exceeds 60 chars (${slug.length})` };
    }

    const tokens = slug.split('-').filter(t => t.length > 0);

    if (tokens.length < 2) {
        return { valid: false, reason: `Too few tokens (${tokens.length}), minimum is 2` };
    }

    if (tokens.length > 6) {
        return { valid: false, reason: `Too many tokens (${tokens.length}), maximum is 6` };
    }

    // Check for repetition patterns: "تفسير-حلم-تفسير-حلم"
    const halfLen = Math.floor(tokens.length / 2);
    if (halfLen >= 2) {
        const firstHalf = tokens.slice(0, halfLen).join('-');
        const secondHalf = tokens.slice(halfLen, halfLen * 2).join('-');
        if (firstHalf === secondHalf) {
            return { valid: false, reason: 'Slug contains duplicated phrase pattern' };
        }
    }

    // Check for consecutive duplicate tokens
    for (let i = 1; i < tokens.length; i++) {
        if (tokens[i] === tokens[i - 1]) {
            return { valid: false, reason: `Consecutive duplicate token: "${tokens[i]}"` };
        }
    }

    return { valid: true };
}
