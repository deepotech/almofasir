import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInterpreterRequest extends Document {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    experienceYears: number;
    interpretationType: 'religious' | 'psychological' | 'symbolic' | 'mixed';
    bio: string;
    sampleInterpretation: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const InterpreterRequestSchema = new Schema<IInterpreterRequest>(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, default: '' },
        country: { type: String, required: true },
        experienceYears: { type: Number, required: true, min: 0 },
        interpretationType: {
            type: String,
            required: true,
            enum: ['religious', 'psychological', 'symbolic', 'mixed'],
        },
        bio: { type: String, required: true },
        sampleInterpretation: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

// Prevent model recompilation error in development
const InterpreterRequest: Model<IInterpreterRequest> =
    mongoose.models.InterpreterRequest ||
    mongoose.model<IInterpreterRequest>('InterpreterRequest', InterpreterRequestSchema);

export default InterpreterRequest;
