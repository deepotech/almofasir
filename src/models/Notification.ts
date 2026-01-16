import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
