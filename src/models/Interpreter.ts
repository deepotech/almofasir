import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInterpreter extends Document {
    userId: string;           // Firebase UID - link to User model
    email: string;
    displayName: string;
    avatar?: string;
    bio: string;
    interpretationType: 'religious' | 'psychological' | 'symbolic' | 'mixed';
    price: number;            // Price
    currency: string;         // Currency code (SAR, USD)
    responseTime: number;     // Response time in hours (24, 48, 72)
    rating: number;           // Average rating 1-5
    totalRatings: number;     // Number of ratings received
    totalDreams: number;      // Total dreams interpreted
    completedDreams: number;  // Successfully completed
    earnings: number;         // Total earnings
    pendingEarnings: number;  // Pending payout
    pricingNote?: string;      // Note about pricing/service
    lastPriceUpdate?: Date;   // To limit price changes frequency
    isActive: boolean;        // Available for new dreams
    status: 'active' | 'suspended' | 'pending';
    createdAt: Date;
    updatedAt: Date;
}

const InterpreterSchema = new Schema<IInterpreter>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true, lowercase: true },
        displayName: { type: String, required: true },
        avatar: { type: String },
        bio: { type: String, required: true },
        interpretationType: {
            type: String,
            required: true,
            enum: ['religious', 'psychological', 'symbolic', 'mixed'],
            default: 'religious'
        },
        price: { type: Number, required: true, min: 5, default: 10 },
        currency: { type: String, default: 'USD' },
        responseTime: { type: Number, required: true, default: 24 }, // hours
        pricingNote: { type: String },
        lastPriceUpdate: { type: Date },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        totalRatings: { type: Number, default: 0 },
        totalDreams: { type: Number, default: 0 },
        completedDreams: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 },
        pendingEarnings: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        status: {
            type: String,
            enum: ['active', 'suspended', 'pending'],
            default: 'active'
        }
    },
    { timestamps: true }
);

const Interpreter: Model<IInterpreter> =
    mongoose.models.Interpreter ||
    mongoose.model<IInterpreter>('Interpreter', InterpreterSchema);

export default Interpreter;
