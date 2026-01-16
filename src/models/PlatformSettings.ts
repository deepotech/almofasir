import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatformSettings extends Document {
    // Platform Configuration
    commissionRate: number;              // 0.30 = 30% commission

    // AI Pricing
    aiPriceSingle: number;               // Single AI interpretation
    aiPriceMonthly: number;              // Monthly AI subscription

    // Human Pricing
    humanMinPrice: number;               // Minimum price for human interpreters
    humanMaxPrice: number;               // Maximum price for human interpreters

    // Response Time Limits
    maxResponseTimeHours: number;        // Max hours for interpreter response
    stuckOrderThresholdHours: number;    // Hours before order considered stuck

    // Notification Templates
    notificationTemplates: {
        welcomeInterpreter?: string;
        orderCompleted?: string;
        paymentReceived?: string;
        refundProcessed?: string;
        interpretationReady?: string;
    };

    // System Settings
    maintenanceMode: boolean;
    maintenanceMessage?: string;

    updatedBy?: string;         // Admin who last updated
    createdAt: Date;
    updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
    {
        commissionRate: {
            type: Number,
            required: true,
            default: 0.30,
            min: 0,
            max: 1
        },

        aiPriceSingle: {
            type: Number,
            required: true,
            default: 2.99
        },

        aiPriceMonthly: {
            type: Number,
            required: true,
            default: 9.99
        },

        humanMinPrice: {
            type: Number,
            required: true,
            default: 5.00
        },

        humanMaxPrice: {
            type: Number,
            required: true,
            default: 50.00
        },

        maxResponseTimeHours: {
            type: Number,
            required: true,
            default: 48
        },

        stuckOrderThresholdHours: {
            type: Number,
            required: true,
            default: 24
        },

        notificationTemplates: {
            welcomeInterpreter: String,
            orderCompleted: String,
            paymentReceived: String,
            refundProcessed: String,
            interpretationReady: String
        },

        maintenanceMode: {
            type: Boolean,
            default: false
        },

        maintenanceMessage: String,

        updatedBy: { type: String }
    },
    { timestamps: true }
);

const PlatformSettings: Model<IPlatformSettings> =
    mongoose.models.PlatformSettings ||
    mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);

export default PlatformSettings;

// Helper to get or create default settings
export async function getSettings(): Promise<IPlatformSettings> {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
        settings = await PlatformSettings.create({
            commissionRate: 0.30,
            aiPriceSingle: 2.99,
            aiPriceMonthly: 9.99,
            humanMinPrice: 5.00,
            humanMaxPrice: 50.00,
            maxResponseTimeHours: 48,
            stuckOrderThresholdHours: 24
        });
    }
    return settings;
}
