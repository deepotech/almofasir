import mongoose, { Schema, Document } from 'mongoose';

export interface IDream extends Document {
    userId: string; // Firebase UID
    title?: string;
    content: string;
    date: Date;
    mood: 'happy' | 'sad' | 'anxious' | 'confused' | 'neutral';
    // Dream Context Fields
    socialStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    dominantFeeling?: string;
    ageRange?: 'child' | 'teen' | 'adult' | 'elderly';
    gender?: 'male' | 'female';
    emotions?: string[];
    keywords?: string[];
    sentiment?: string;
    isRecurring?: boolean;
    interpreter?: string; // e.g. 'ibn-sirin'
    tags: string[]; // Symbols found
    interpretation?: {
        summary: string;
        symbols: Array<{
            name: string;
            meaning: string;
        }>;
        advice: string[];
        isPremium: boolean;
        aiGenerated?: boolean;
        humanResponse?: string;
        psychologicalInsight?: string; // New: psychological perspective
    };
    // User Feedback
    userFeedback?: {
        liked: boolean | null;
        cameTrue: boolean | null;
        feedbackDate?: Date;
    };
    // Star Rating (1-5)
    rating?: number;
    ratingFeedback?: string;
    ratedAt?: Date;
    isPublic: boolean;
    visibilityStatus: 'private' | 'pending_public' | 'public';
    publicVersion?: {
        title: string;
        content: string; // Sanitized dream text
        seoIntro?: string; // Contextual intro for SEO
        interpretation: string;
        structuredInterpretation?: {
            summary: string;
            symbols: Array<{ name: string; meaning: string }>;
            variations: Array<{ status: string; meaning: string }>;
            psychological: string;
            conclusion: string;
        };
        comprehensiveInterpretation?: {
            primarySymbol?: string;
            secondarySymbols?: string[];
            snippetSummary?: string;
            metaTitle?: string;
            metaDescription?: string;
            sections?: Array<{
                heading: string;
                content?: string;
                subsections?: Array<{ heading: string; content: string }>;
                bullets?: string[];
            }>;
            internalLinkAnchors?: string[];
            safetyNote?: string;
        };
        faqs?: Array<{ question: string; answer: string }>;
        isAnonymous: boolean;
        publishedAt: Date;
        qualityScore?: number;
    };
    seoSlug?: string; // SEO-friendly URL slug
    slug_new?: string; // Temporary migration field
    previousSlugs?: string[]; // History of old slugs (for redirect lookup)
    status: 'pending' | 'completed' | 'reviewed';
    requestHumanReview: boolean;
    humanReviewStatus: 'none' | 'pending' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}

const DreamSchema: Schema = new Schema(
    {
        userId: { type: String, required: false, index: true }, // Store Firebase UID (optional for guests)
        title: { type: String },
        content: { type: String, required: true },
        date: { type: Date, default: Date.now },
        mood: {
            type: String,
            enum: ['happy', 'sad', 'anxious', 'confused', 'neutral'],
            default: 'neutral'
        },
        // Dream Context Fields
        socialStatus: {
            type: String,
            enum: ['single', 'married', 'divorced', 'widowed']
        },
        dominantFeeling: { type: String },
        ageRange: {
            type: String,
            enum: ['child', 'teen', 'adult', 'elderly']
        },
        gender: {
            type: String,
            enum: ['male', 'female']
        },
        emotions: [{ type: String }], // Detailed emotions list
        keywords: [{ type: String }], // Extracted via natural
        sentiment: { type: String }, // Positive/Negative/Neutral
        isRecurring: { type: Boolean, default: false },
        interpreter: { type: String },
        tags: [{ type: String }],
        interpretation: {
            summary: { type: String },
            symbols: [{
                name: { type: String },
                meaning: { type: String }
            }],
            advice: [{ type: String }],
            isPremium: { type: Boolean, default: false },
            aiGenerated: { type: Boolean, default: true },
            humanResponse: { type: String },
            psychologicalInsight: { type: String }
        },
        // User Feedback
        userFeedback: {
            liked: { type: Boolean, default: null },
            cameTrue: { type: Boolean, default: null },
            feedbackDate: { type: Date }
        },
        // Star Rating (1-5)
        rating: { type: Number, min: 1, max: 5 },
        ratingFeedback: { type: String, maxlength: 500 },
        ratedAt: { type: Date },
        isPublic: { type: Boolean, default: false },
        visibilityStatus: {
            type: String,
            enum: ['private', 'pending_public', 'public'],
            default: 'private'
        },
        publicVersion: {
            title: { type: String }, // Engaging title (e.g. Question)
            content: { type: String }, // Sanitized dream text
            seoIntro: { type: String }, // Contextual intro for SEO
            interpretation: { type: String },
            structuredInterpretation: {
                summary: { type: String },
                symbols: [{
                    name: { type: String },
                    meaning: { type: String }
                }],
                variations: [{
                    status: { type: String }, // e.g. Single, Married, General
                    meaning: { type: String }
                }],
                psychological: { type: String },
                conclusion: { type: String }
            },
            comprehensiveInterpretation: {
                primarySymbol: { type: String },
                secondarySymbols: [{ type: String }],
                snippetSummary: { type: String },
                metaTitle: { type: String },
                metaDescription: { type: String },
                sections: [{
                    heading: { type: String },
                    content: { type: String },
                    subsections: [{
                        heading: { type: String },
                        content: { type: String }
                    }],
                    bullets: [{ type: String }]
                }],
                internalLinkAnchors: [{ type: String }],
                safetyNote: { type: String }
            },
            faqs: [{
                question: { type: String },
                answer: { type: String }
            }],
            isAnonymous: { type: Boolean, default: true },
            publishedAt: { type: Date },
            qualityScore: { type: Number }
        },
        seoSlug: { type: String }, // SEO-friendly URL slug
        slug_new: { type: String }, // Temporary field for migration
        previousSlugs: [{ type: String }], // History of old slugs
        status: { type: String, enum: ['pending', 'completed', 'reviewed'], default: 'pending' },
        requestHumanReview: { type: Boolean, default: false },
        humanReviewStatus: { type: String, enum: ['none', 'pending', 'completed'], default: 'none' },
    },
    { timestamps: true }
);
// Unique sparse index on seoSlug — prevents duplicate slugs
// sparse: true means null/missing values won't conflict
DreamSchema.index({ seoSlug: 1 }, { unique: true, sparse: true });

// Index on previousSlugs for fast redirect lookups
DreamSchema.index({ previousSlugs: 1 });

export default mongoose.models.Dream || mongoose.model<IDream>('Dream', DreamSchema);
