/**
 * dataHelpers.ts
 *
 * Data Safety Layer: Normalizers to convert raw DB records to safe UI objects.
 * - Provides clean fallbacks for every field
 * - Prevents TypeErrors from null/undefined fields
 * - Bridges mismatch between old/new schema structures
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NormalizedInterpreter {
    id: string;
    name: string;
    slug: string;
    title: string;
    bio: string;
    isVerified: boolean;
    isExpert: boolean;
    rating: number;
    reviewsCount: number;
    completedDreams: number;
    responseSpeed: '6h' | '24h' | '48h';
    price: number;
    currency: string;
    avatar: string;
    types: ('religious' | 'psychological' | 'symbolic' | 'mixed')[];
    status: 'available' | 'busy' | 'offline';
}

export interface NormalizedDream {
    id: string;
    slug: string;
    title: string;
    content: string;
    interpretation: string;
    snippetSummary: string;
    mood: string;
    tags: string[];
    date: string;
    primarySymbol?: string;
    sections?: Array<{ heading: string; content?: string; bullets?: string[] }>;
    faqs?: Array<{ question: string; answer: string }>;
}

export interface NormalizedPublicDream {
    id: string;
    slug: string;
    title: string;
    content: string;
    interpretation: string;
    mood: string;
    tags: string[];
    date: string;
}

// ─── Interpreter Normalizer ───────────────────────────────────────────────────

/**
 * Converts a raw API interpreter record to a safe NormalizedInterpreter.
 * All fields have fallbacks — the UI will never crash from null/undefined.
 */
export function normalizeInterpreter(raw: any): NormalizedInterpreter {
    if (!raw) {
        console.warn('[DATA DEBUG] normalizeInterpreter called with null/undefined');
        return getDefaultInterpreter();
    }

    const id = String(raw.id || raw._id || '');
    const responseTime = raw.responseTime ?? 24;
    const responseSpeed = responseTime <= 6 ? '6h' : responseTime <= 24 ? '24h' : '48h';

    // interpretationType → types array
    const rawType = raw.interpretationType || raw.type || 'mixed';
    const validTypes = ['religious', 'psychological', 'symbolic', 'mixed'];
    const types = validTypes.includes(rawType)
        ? [rawType as any]
        : ['mixed' as any];

    // Status mapping: 'active' in DB → 'available' in UI
    const statusMap: Record<string, 'available' | 'busy' | 'offline'> = {
        'active': 'available',
        'available': 'available',
        'busy': 'busy',
        'offline': 'offline',
        'pending': 'available', // Show pending interpreters as available (admin approved them)
        'suspended': 'offline'
    };
    const dbStatus = raw.status || (raw.isActive ? 'active' : 'offline');
    const status = statusMap[dbStatus] || 'available';

    // Build Arabic title from type
    const typeToAr: Record<string, string> = {
        'religious': 'شرعي',
        'psychological': 'نفسي',
        'symbolic': 'رمزي',
        'mixed': 'شامل'
    };
    const typeAr = typeToAr[rawType] || 'شامل';

    return {
        id,
        name: raw.displayName || raw.name || 'مفسر',
        slug: id, // Use id as slug fallback
        title: raw.title || `مفسر ${typeAr}`,
        bio: raw.bio || 'مفسر أحلام معتمد',
        isVerified: raw.isVerified !== undefined ? Boolean(raw.isVerified) : true,
        isExpert: raw.isExpert !== undefined ? Boolean(raw.isExpert) : (raw.completedDreams || 0) > 100,
        rating: Number(raw.rating) || 0,
        reviewsCount: Number(raw.totalRatings) || Number(raw.reviewsCount) || 0,
        completedDreams: Number(raw.completedDreams) || 0,
        responseSpeed,
        price: Number(raw.price) || 0,
        currency: raw.currency || 'USD',
        avatar: raw.avatar || '👤',
        types,
        status
    };
}

/** Default interpreter for edge cases */
function getDefaultInterpreter(): NormalizedInterpreter {
    return {
        id: '',
        name: 'مفسر',
        slug: '',
        title: 'مفسر أحلام',
        bio: '',
        isVerified: false,
        isExpert: false,
        rating: 0,
        reviewsCount: 0,
        completedDreams: 0,
        responseSpeed: '24h',
        price: 0,
        currency: 'USD',
        avatar: '👤',
        types: ['mixed'],
        status: 'available'
    };
}

// ─── Dream Normalizer ─────────────────────────────────────────────────────────

/**
 * Converts a raw DB dream record (with publicVersion) to a safe NormalizedDream.
 * Handles both old schema (publicVersion.interpretation) and new schema
 * (publicVersion.comprehensiveInterpretation.*).
 */
export function normalizeDream(raw: any): NormalizedDream {
    if (!raw) {
        console.warn('[DATA DEBUG] normalizeDream called with null/undefined');
        return getDefaultDream();
    }

    const id = String(raw._id || raw.id || '');
    const pv = raw.publicVersion || {};
    const comprehensive = pv.comprehensiveInterpretation || {};

    // Title: try publicVersion.title → h1 → metaTitle → fallback
    const title = pv.title
        || comprehensive.h1
        || comprehensive.metaTitle
        || 'حلم مفسر';

    // Content: try publicVersion.content → dream_text → seoIntro → fallback
    const content = pv.content
        || comprehensive.dream_text
        || pv.seoIntro
        || '';

    // Interpretation: try publicVersion.interpretation → snippetSummary → fallback
    const interpretation = pv.interpretation
        || comprehensive.snippetSummary
        || pv.seoIntro
        || '';

    // Snippet summary for cards
    const snippetSummary = comprehensive.snippetSummary
        || pv.seoIntro
        || interpretation.substring(0, 200);

    // Slug: seoSlug → id
    const slug = raw.seoSlug || id;

    return {
        id,
        slug,
        title,
        content,
        interpretation,
        snippetSummary,
        mood: raw.mood || 'neutral',
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        date: pv.publishedAt || raw.createdAt || new Date().toISOString(),
        primarySymbol: comprehensive.primarySymbol || undefined,
        sections: Array.isArray(comprehensive.sections) ? comprehensive.sections : undefined,
        faqs: Array.isArray(pv.faqs) ? pv.faqs : (Array.isArray(comprehensive.faqs) ? comprehensive.faqs : undefined)
    };
}

/** Default dream for edge cases */
function getDefaultDream(): NormalizedDream {
    return {
        id: '',
        slug: '',
        title: 'حلم مفسر',
        content: '',
        interpretation: '',
        snippetSummary: '',
        mood: 'neutral',
        tags: [],
        date: new Date().toISOString()
    };
}

// ─── Public Dream Normalizer ──────────────────────────────────────────────────

/**
 * Converts a raw /api/dreams/public response item to NormalizedPublicDream.
 * Lighter version for listing pages.
 */
export function normalizePublicDream(raw: any): NormalizedPublicDream {
    if (!raw) return {
        id: '',
        slug: '',
        title: 'حلم مفسر',
        content: '',
        interpretation: '',
        mood: 'neutral',
        tags: [],
        date: new Date().toISOString()
    };

    return {
        id: String(raw.id || raw._id || ''),
        slug: raw.slug || String(raw.id || raw._id || ''),
        title: raw.title || 'حلم مفسر',
        content: raw.content || '',
        interpretation: raw.interpretation || '',
        mood: raw.mood || 'neutral',
        tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
        date: raw.date || raw.createdAt || new Date().toISOString()
    };
}

// ─── Safe accessor helpers ────────────────────────────────────────────────────

/** Safely get a string field with fallback */
export function safeStr(value: any, fallback = ''): string {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

/** Safely get a number field with fallback */
export function safeNum(value: any, fallback = 0): number {
    const n = Number(value);
    return isNaN(n) ? fallback : n;
}

/** Safely get an array field with fallback */
export function safeArr<T>(value: any, fallback: T[] = []): T[] {
    return Array.isArray(value) ? value : fallback;
}
