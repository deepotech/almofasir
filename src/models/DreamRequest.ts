import mongoose, { Schema, Document, Model } from 'mongoose';

// Status enum - strict flow (State Machine)
export type DreamRequestStatus =
    | 'new'                     // User submitted, paid, waiting for assignment
    | 'assigned'                // Interpreter assigned but hasn't started
    | 'in_progress'             // Interpreter actively working
    | 'completed'               // Interpretation submitted (terminal)
    | 'cancelled';              // Order cancelled (terminal)

// Payment status
export type PaymentStatus = 'pending' | 'paid' | 'released' | 'refunded';

export interface IDreamRequest extends Document {
    type: 'HUMAN' | 'AI';
    // User Info
    userId: string;                  // Firebase UID
    userEmail: string;

    // Interpreter Info
    interpreterId: string;           // Interpreter model _id
    interpreterUserId: string;       // Interpreter's Firebase UID
    interpreterName: string;

    // Booking Reference (optional)
    bookingId?: string;

    // Dream Content (locked after submission)
    dreamText: string;
    dreamHash: string;               // SHA256(userId + dreamText) - PERMANENT duplicate prevention
    context?: {
        gender?: string;
        socialStatus?: string;
        ageRange?: string;
        dominantFeeling?: string;
        isRecurring?: boolean;
    };

    // Interpretation (nullable until completed)
    interpretationText?: string;

    // Pricing (locked at creation time)
    price: number;                   // Original interpreter price
    lockedPrice: number;             // Price locked at creation (immutable)
    currency: string;

    // Status
    status: DreamRequestStatus;

    // Clarification (ONE question only)
    clarificationQuestion?: string;
    clarificationAnswer?: string;
    clarificationRequestedAt?: Date;
    clarificationAnsweredAt?: Date;

    // Payment
    paymentStatus: PaymentStatus;
    paymentLockedAmount: number;     // Amount held until completion
    platformCommission: number;      // Calculated at completion
    interpreterEarning: number;      // Calculated at completion
    paymentId?: string;              // External payment reference
    idempotencyKey?: string;         // Backup key for race conditions

    // Timeline (State Machine Timestamps)
    assignedAt?: Date;               // When interpreter was assigned
    startedAt?: Date;                // When interpreter started work
    acceptedAt?: Date;               // Legacy: When interpreter accepted
    completedAt?: Date;              // When interpretation submitted
    cancelledAt?: Date;              // When order was cancelled

    // Rating (optional, after completion)
    rating?: number;                 // 1-5 stars
    feedback?: string;               // Optional feedback text
    ratedAt?: Date;                  // When rating was submitted

    createdAt: Date;
    updatedAt: Date;
}

const DreamRequestSchema = new Schema<IDreamRequest>(
    {
        // Request Type
        type: {
            type: String,
            enum: ['HUMAN', 'AI'],
            default: 'HUMAN',
            index: true
        },

        // User Info
        userId: { type: String, required: true, index: true },
        userEmail: { type: String, required: false }, // Optional for AI/Guests

        // Interpreter Info (Required for HUMAN only)
        interpreterId: { type: String, required: false, index: true },
        interpreterUserId: { type: String, required: false, index: true },
        interpreterName: { type: String, required: false },

        // Booking Reference
        bookingId: { type: String },

        // Dream Content
        dreamText: { type: String, required: true },
        dreamHash: { type: String, required: true, index: true }, // SHA256(userId + dreamText)
        context: {
            gender: String,
            socialStatus: String,
            ageRange: String,
            dominantFeeling: String,
            isRecurring: Boolean
        },

        // Interpretation
        interpretationText: { type: String },

        // Pricing
        price: { type: Number, default: 0 },
        lockedPrice: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },

        // Status
        status: {
            type: String,
            enum: ['new', 'assigned', 'in_progress', 'completed', 'cancelled'],
            default: 'new',
            index: true
        },

        // Clarification
        clarificationQuestion: { type: String },
        clarificationAnswer: { type: String },
        clarificationRequestedAt: { type: Date },
        clarificationAnsweredAt: { type: Date },

        // Payment
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'released', 'refunded'],
            default: 'pending'
        },
        paymentLockedAmount: { type: Number, default: 0 },
        platformCommission: { type: Number, default: 0 },
        interpreterEarning: { type: Number, default: 0 },
        paymentId: { type: String },
        idempotencyKey: { type: String, unique: true, sparse: true },

        // Timeline (State Machine Timestamps)
        assignedAt: { type: Date },
        startedAt: { type: Date },
        acceptedAt: { type: Date },
        completedAt: { type: Date },
        cancelledAt: { type: Date },

        // Rating (optional, after completion)
        rating: { type: Number, min: 1, max: 5 },
        feedback: { type: String },
        ratedAt: { type: Date }
    },
    { timestamps: true }
);

// Compound indexes for common queries
DreamRequestSchema.index({ status: 1, interpreterUserId: 1 });
DreamRequestSchema.index({ userId: 1, status: 1 });
DreamRequestSchema.index({ paymentStatus: 1, status: 1 });

// PERMANENT duplicate prevention: Same user cannot submit same dream text twice
DreamRequestSchema.index({ userId: 1, dreamHash: 1 }, { unique: true });

// CRITICAL: Unique index on idempotencyKey for same user + same dream + same interpreter
// This is THE definitive protection against duplicates
// (Index defined in schema definition)


const DreamRequest: Model<IDreamRequest> =
    mongoose.models.DreamRequest ||
    mongoose.model<IDreamRequest>('DreamRequest', DreamRequestSchema);

export default DreamRequest;
