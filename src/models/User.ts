import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    displayName?: string;
    credits: number;
    plan: 'free' | 'pro' | 'premium'; // pro = monthly, premium = human expert (or handled separately)
    role: 'user' | 'admin' | 'interpreter';
    status: 'active' | 'suspended';
    subscriptionStatus: 'active' | 'inactive' | 'canceled';
    subscriptionEndDate?: Date;
    lastFreeDreamAt?: Date; // Tracks usage of daily free AI interpretation
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: { type: String },
    credits: { type: Number, default: 0 }, // STRICT: Free users get 0 credits, only 1 daily free
    plan: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
    role: { type: String, enum: ['user', 'admin', 'interpreter'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    subscriptionStatus: { type: String, enum: ['active', 'inactive', 'canceled'], default: 'inactive' },
    subscriptionEndDate: { type: Date },
    lastFreeDreamAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
