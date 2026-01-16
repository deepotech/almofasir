import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
    userId?: string; // Optional: Link to registered user if available
    userEmail: string; // Required: To link guest bookings or just for contact
    interpreterName: string;
    interpreterId?: string; // Future proofing
    date: string;
    timeSlot: string;
    clientName: string;
    clientPhone: string;
    notes?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    paymentStatus: 'paid' | 'unpaid' | 'refunded';
    amount: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    dreamId?: string; // Link to the created DreamRequest
}

const BookingSchema: Schema = new Schema({
    userId: { type: String, required: false }, // Store firebaseUid or similar
    userEmail: { type: String, required: true },
    interpreterName: { type: String, required: true },
    interpreterId: { type: String },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    notes: { type: String },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'confirmed'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'unpaid', 'refunded'],
        default: 'paid'
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    dreamId: { type: String }, // Reference to DreamRequest
}, { timestamps: true });

// Prevent duplicate bookings at DB level (Interpreter + Date + Time must be unique for active bookings)
// We include clientName to block same user spamming same slot if we allow multiple slots per time? 
// No, strictly one booking per slot per interpreter.
BookingSchema.index({ interpreterId: 1, date: 1, timeSlot: 1 }, {
    unique: true,
    partialFilterExpression: { status: { $ne: 'cancelled' } }
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
