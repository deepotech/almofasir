import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    adminUserId: string;          // Firebase UID of admin
    adminEmail: string;
    action:
    | 'approve_interpreter'
    | 'suspend_interpreter'
    | 'reactivate_interpreter'
    | 'refund_order'
    | 'reassign_order'
    | 'edit_price'
    | 'update_settings'
    | 'login';

    targetType: 'interpreter' | 'order' | 'user' | 'settings' | 'system';
    targetId: string;             // ID of affected resource
    details: any;                 // JSON details of the change
    ipAddress?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        adminUserId: { type: String, required: true, index: true },
        adminEmail: { type: String, required: true },
        action: {
            type: String,
            required: true,
            enum: [
                'approve_interpreter',
                'suspend_interpreter',
                'reactivate_interpreter',
                'refund_order',
                'reassign_order',
                'edit_price',
                'update_settings',
                'login'
            ],
            index: true
        },
        targetType: {
            type: String,
            required: true,
            enum: ['interpreter', 'order', 'user', 'settings', 'system']
        },
        targetId: { type: String, required: true, index: true },
        details: { type: Schema.Types.Mixed },
        ipAddress: { type: String }
    },
    { timestamps: { createdAt: true, updatedAt: false } } // Immutable logs
);

const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog ||
    mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
