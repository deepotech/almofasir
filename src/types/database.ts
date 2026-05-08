/**
 * src/types/database.ts
 *
 * Centralized Supabase PostgreSQL row types.
 * All fields use snake_case matching the actual DB schema.
 * Eliminates `any` in API routes, lib helpers, and components.
 *
 * JSONB columns (public_version, interpretation, context) are typed
 * with both camelCase and snake_case keys to handle both the current
 * AI-generated payload and any legacy data still in the DB.
 */

// ─── Sub-types inside JSONB columns ──────────────────────────────────────────

export interface FAQ {
    question: string;
    answer: string;
}

export interface InterpretationSection {
    heading: string;
    content?: string;
    bullets?: string[];
    subsections?: Array<{ heading: string; content: string }>;
}

/**
 * The comprehensive interpretation object stored inside public_version.
 * The AI generates camelCase keys; older rows may use snake_case.
 * All fields are optional so partial data never crashes the renderer.
 */
export interface ComprehensiveInterpretation {
    // camelCase (current AI output)
    primarySymbol?: string;
    secondarySymbols?: string[];
    snippetSummary?: string;
    metaTitle?: string;
    metaDescription?: string;
    sections?: InterpretationSection[];
    internalLinkAnchors?: string[];
    safetyNote?: string;
    faqs?: FAQ[];

    // snake_case (legacy rows / type definition in types/index.ts)
    primary_symbol?: string;
    secondary_symbols?: string[];
    snippet_summary?: string;
    meta_title?: string;
    meta_description?: string;
    internal_link_anchors?: string[];
    safety_note?: string;
}

/**
 * The public_version JSONB column on the dreams table.
 * Supports both camelCase (AI output) and snake_case (schema definition).
 */
export interface PublicVersion {
    title?: string;
    content?: string;
    // Both spellings coexist in the DB
    seoIntro?: string;
    seo_intro?: string;
    interpretation?: string;
    comprehensiveInterpretation?: ComprehensiveInterpretation;
    comprehensive_interpretation?: ComprehensiveInterpretation;
    structuredInterpretation?: {
        summary?: string;
        symbols?: Array<{ name: string; meaning: string }>;
        variations?: Array<{ status: string; meaning: string }>;
        psychological?: string;
        conclusion?: string;
        faqs?: FAQ[];
    };
    structured_interpretation?: {
        summary?: string;
        symbols?: Array<{ name: string; meaning: string }>;
    };
    faqs?: FAQ[];
    isAnonymous?: boolean;
    is_anonymous?: boolean;
    publishedAt?: string;
    published_at?: string;
    qualityScore?: number;
    quality_score?: number;

    // Legacy Mongo-era fields (present in some older rows)
    engagingTitle?: string;
    dreamContent?: string;
    keywords?: string[];
    publishDate?: string;
}

/** Resolve the best available public_version from a raw DB row */
export function resolvePublicVersion(row: Record<string, unknown>): PublicVersion | null {
    const pv = (row.public_version ?? row.publicVersion) as PublicVersion | null | undefined;
    return pv ?? null;
}

/** Resolve the comprehensive interpretation from a public_version */
export function resolveComprehensive(pv: PublicVersion | null): ComprehensiveInterpretation | null {
    if (!pv) return null;
    return pv.comprehensiveInterpretation ?? pv.comprehensive_interpretation ?? null;
}

/** Safely parse a date string, returning null if invalid */
export function safeDate(raw: unknown): Date | null {
    if (!raw) return null;
    const d = new Date(raw as string);
    return isNaN(d.getTime()) ? null : d;
}

/** Format a date for Arabic locale display, returning a fallback string if invalid */
export function formatArabicDate(raw: unknown, fallback = ''): string {
    const d = safeDate(raw);
    if (!d) return fallback;
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface DreamRow {
    id: string;
    user_id?: string;
    title?: string;
    content: string;
    mood?: 'happy' | 'sad' | 'anxious' | 'confused' | 'neutral';
    social_status?: 'single' | 'married' | 'divorced' | 'widowed';
    dominant_feeling?: string;
    age_range?: 'child' | 'teen' | 'adult' | 'elderly';
    gender?: 'male' | 'female';
    is_recurring?: boolean;
    tags: string[];
    interpretation?: {
        summary: string;
        symbols?: Array<{ name: string; meaning: string }>;
        advice?: string[];
        is_premium?: boolean;
        ai_generated?: boolean;
        human_response?: string;
    };
    is_public: boolean;
    visibility_status: 'private' | 'pending_public' | 'public' | 'rejected';
    public_version?: PublicVersion | null;
    seo_slug?: string;
    previous_slugs?: string[];
    status: 'pending' | 'completed' | 'reviewed';
    request_human_review?: boolean;
    human_review_status?: 'none' | 'pending' | 'completed';
    created_at: string;
    updated_at: string;
}

export interface SymbolRow {
    id: string;
    name: string;
    slug: string;
    category: string;
    icon: string;
    aliases: string[];
    interpretations: {
        general: string;
        ibn_sirin?: string;
        nabulsi?: string;
        psychological?: string;
    };
    variations: Array<{ context: string; meaning: string }>;
    related_symbols: string[];
    view_count: number;
    created_at: string;
    updated_at: string;
}

export interface PageMetricRow {
    id: string;
    slug: string;
    views: number;
    likes: number;
    dislikes: number;
    updated_at: string;
}

export interface ProgrammaticPageRow {
    id: string;
    keyword_slug: string;
    title: string;
    content: string;
    symbol_ref?: string;
    generated_at: string;
    created_at: string;
    updated_at: string;
}

export interface DreamRequestRow {
    id: string;
    type: 'HUMAN' | 'AI';
    user_id: string;
    user_email?: string;
    interpreter_id?: string;
    interpreter_user_id?: string;
    interpreter_name?: string;
    booking_id?: string;
    dream_text: string;
    dream_hash: string;
    idempotency_key?: string;
    context?: {
        gender?: string;
        social_status?: string;
        age_range?: string;
        dominant_feeling?: string;
        is_recurring?: boolean;
    };
    interpretation_text?: string;
    price: number;
    locked_price: number;
    currency: string;
    status: string;
    payment_status: string;
    payment_locked_amount?: number;
    platform_commission?: number;
    interpreter_earning?: number;
    payment_id?: string;
    rating?: number;
    feedback?: string;
    rated_at?: string;
    created_at: string;
    updated_at: string;
}

export interface UserRow {
    id: string;
    firebase_uid: string;
    email: string;
    display_name?: string;
    credits: number;
    plan: 'free' | 'pro' | 'premium';
    role: 'user' | 'admin' | 'interpreter';
    status: 'active' | 'suspended';
    subscription_status: 'active' | 'inactive' | 'canceled';
    subscription_end_date?: string;
    last_free_dream_at?: string;
    created_at: string;
    updated_at: string;
}

export interface InterpreterRow {
    id: string;
    user_id: string;
    email: string;
    display_name: string;
    avatar?: string;
    bio: string;
    interpretation_type: 'religious' | 'psychological' | 'symbolic' | 'mixed';
    price: number;
    currency: string;
    response_time: number;
    rating: number;
    total_ratings: number;
    total_dreams: number;
    completed_dreams: number;
    earnings: number;
    pending_earnings: number;
    is_active: boolean;
    status: 'active' | 'suspended' | 'pending';
    created_at: string;
    updated_at: string;
}

// ─── Normalized dream for UI consumption ────────────────────────────────────

/**
 * Normalized dream shape consumed by DreamArticle, DreamDetailsContent, etc.
 * Accepts both snake_case (Supabase) and legacy camelCase fields.
 */
export interface NormalizedPublicDream {
    id: string;
    title: string;
    content: string;
    interpretation: string;
    mood: string;
    tags: string[];
    date: string;
    slug: string;
    /** Resolved public_version — always prefer this over raw DB fields */
    public_version?: PublicVersion | null;
    /** Legacy compat alias — components that still read publicVersion */
    publicVersion?: PublicVersion | null;
}
