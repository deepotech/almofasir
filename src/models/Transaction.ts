import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType = 'earning' | 'withdrawal' | 'refund' | 'commission';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface ITransaction extends Document {
    userId: string;              // User who owns this transaction (Interpreter)
    amount: number;              // Positive for earning, Negative for withdrawal
    currency: string;
    type: TransactionType;
    status: TransactionStatus;
    description: string;
    referenceId?: string;        // E.g., DreamRequest ID
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: { type: String, required: true, index: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        type: {
            type: String,
            enum: ['earning', 'withdrawal', 'refund', 'commission'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'completed'
        },
        description: { type: String, required: true },
        referenceId: { type: String, index: true }, // Index for fast lookups by Dream ID
        metadata: { type: Map, of: Schema.Types.Mixed }
    },
    { timestamps: true }
);

// Index for aggregate queries (Calc balance)
TransactionSchema.index({ userId: 1, type: 1, status: 1 });

const Transaction: Model<ITransaction> =
    mongoose.models.Transaction ||
    mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
