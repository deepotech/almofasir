/**
 * Shared TypeScript types — no Mongoose dependency.
 * Used across API routes, lib helpers, and components.
 */

// ─── Dream Request ───────────────────────────────────────────────────────────

export type DreamRequestStatus =
    | 'new'
    | 'assigned'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'clarification_requested'
    | 'closed';

export type PaymentStatus = 'pending' | 'paid' | 'released' | 'refunded';

export interface IDreamRequest {
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
    status: DreamRequestStatus;
    clarification_question?: string;
    clarification_answer?: string;
    clarification_requested_at?: string;
    clarification_answered_at?: string;
    payment_status: PaymentStatus;
    payment_locked_amount: number;
    platform_commission: number;
    interpreter_earning: number;
    payment_id?: string;
    idempotency_key?: string;
    assigned_at?: string;
    started_at?: string;
    accepted_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    rating?: number;
    feedback?: string;
    rated_at?: string;
    created_at: string;
    updated_at: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'interpreter';
export type UserPlan = 'free' | 'pro' | 'premium';

export interface IUser {
    id: string;
    firebase_uid: string;
    email: string;
    display_name?: string;
    credits: number;
    plan: UserPlan;
    role: UserRole;
    status: 'active' | 'suspended';
    subscription_status: 'active' | 'inactive' | 'canceled';
    subscription_end_date?: string;
    last_free_dream_at?: string;
    created_at: string;
    updated_at: string;
}

// ─── Interpreter ─────────────────────────────────────────────────────────────

export interface IInterpreter {
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
    pricing_note?: string;
    last_price_update?: string;
    is_active: boolean;
    status: 'active' | 'suspended' | 'pending';
    created_at: string;
    updated_at: string;
}

// ─── Dream (Public SEO) ──────────────────────────────────────────────────────

export interface IDream {
    id: string;
    user_id?: string;
    title?: string;
    content: string;
    date?: string;
    mood: 'happy' | 'sad' | 'anxious' | 'confused' | 'neutral';
    social_status?: 'single' | 'married' | 'divorced' | 'widowed';
    dominant_feeling?: string;
    age_range?: 'child' | 'teen' | 'adult' | 'elderly';
    gender?: 'male' | 'female';
    emotions?: string[];
    keywords?: string[];
    sentiment?: string;
    is_recurring?: boolean;
    interpreter?: string;
    tags: string[];
    interpretation?: {
        summary: string;
        symbols?: Array<{ name: string; meaning: string }>;
        advice?: string[];
        is_premium?: boolean;
        ai_generated?: boolean;
        human_response?: string;
        psychological_insight?: string;
    };
    user_feedback?: {
        liked: boolean | null;
        came_true: boolean | null;
        feedback_date?: string;
    };
    rating?: number;
    rating_feedback?: string;
    rated_at?: string;
    is_public: boolean;
    visibility_status: 'private' | 'pending_public' | 'public' | 'rejected';
    public_version?: {
        title?: string;
        content?: string;
        seo_intro?: string;
        interpretation?: string;
        structured_interpretation?: {
            summary: string;
            symbols: Array<{ name: string; meaning: string }>;
            variations: Array<{ status: string; meaning: string }>;
            psychological: string;
            conclusion: string;
        };
        comprehensive_interpretation?: {
            primary_symbol?: string;
            secondary_symbols?: string[];
            snippet_summary?: string;
            meta_title?: string;
            meta_description?: string;
            sections?: Array<{
                heading: string;
                content?: string;
                subsections?: Array<{ heading: string; content: string }>;
                bullets?: string[];
            }>;
            internal_link_anchors?: string[];
            safety_note?: string;
        };
        faqs?: Array<{ question: string; answer: string }>;
        is_anonymous?: boolean;
        published_at?: string;
        quality_score?: number;
    };
    seo_slug?: string;
    previous_slugs?: string[];
    status: 'pending' | 'completed' | 'reviewed';
    request_human_review?: boolean;
    human_review_status?: 'none' | 'pending' | 'completed';
    created_at: string;
    updated_at: string;
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export interface IBooking {
    id: string;
    user_id?: string;
    user_email: string;
    interpreter_name: string;
    interpreter_id?: string;
    date: string;
    time_slot: string;
    client_name: string;
    client_phone: string;
    notes?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    payment_status: 'paid' | 'unpaid' | 'refunded';
    amount: number;
    currency: string;
    dream_id?: string;
    created_at: string;
    updated_at: string;
}

// ─── Symbol ──────────────────────────────────────────────────────────────────

export interface ISymbol {
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

// ─── Platform Settings ───────────────────────────────────────────────────────

export interface IPlatformSettings {
    id: string;
    commission_rate: number;
    ai_price_single: number;
    ai_price_monthly: number;
    human_min_price: number;
    human_max_price: number;
    max_response_time_hours: number;
    stuck_order_threshold_hours: number;
    notification_templates: {
        welcome_interpreter?: string;
        order_completed?: string;
        payment_received?: string;
        refund_processed?: string;
        interpretation_ready?: string;
    };
    maintenance_mode: boolean;
    maintenance_message?: string;
    updated_by?: string;
    created_at: string;
    updated_at: string;
}

// ─── Permissions ─────────────────────────────────────────────────────────────

// Valid status transitions for DreamRequest state machine
export const STATUS_TRANSITIONS: Record<
    DreamRequestStatus,
    { nextStatus: DreamRequestStatus; allowedRoles: UserRole[] }[]
> = {
    'new': [
        { nextStatus: 'in_progress', allowedRoles: ['interpreter'] }
    ],
    'assigned': [
        { nextStatus: 'in_progress', allowedRoles: ['interpreter'] }
    ],
    'in_progress': [
        { nextStatus: 'completed', allowedRoles: ['interpreter'] }
    ],
    'completed': [
        { nextStatus: 'clarification_requested', allowedRoles: ['user'] },
        { nextStatus: 'closed', allowedRoles: ['user', 'admin'] }
    ],
    'clarification_requested': [
        { nextStatus: 'closed', allowedRoles: ['interpreter'] }
    ],
    'closed': [],
    'cancelled': [],
};
