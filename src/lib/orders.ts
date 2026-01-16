/**
 * Order Management - Single Source of Truth
 * 
 * This module is the ONLY place where DreamRequest (Order) records are created.
 * All endpoints must call these functions instead of creating records directly.
 */

import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { getSettings } from '@/models/PlatformSettings';

// ============================================
// TYPES
// ============================================

export interface CreateOrderInput {
    userId: string;
    userEmail: string;
    interpreterId: string;
    dreamText: string;
    context?: {
        gender?: string;
        socialStatus?: string;
        ageRange?: string;
        dominantFeeling?: string;
        isRecurring?: boolean;
    };
    bookingId?: string; // Optional: link to a booking record
}

export interface CreateOrderResult {
    success: boolean;
    order: {
        id: string;
        status: string;
        interpreterName: string;
        price: number;
        createdAt: Date;
    };
    isDuplicate: boolean;
    message: string;
}

// ============================================
// HASH GENERATION - Permanent Duplicate Prevention
// ============================================

/**
 * Generate a permanent hash for duplicate prevention
 * Same user + Same dreamText = Same hash (ALWAYS)
 */
export function generateDreamHash(userId: string, dreamText: string): string {
    const normalized = dreamText.trim().toLowerCase();
    return crypto.createHash('sha256').update(`${userId}_${normalized}`).digest('hex');
}

// ============================================
// STATE MACHINE - Valid Status Transitions
// ============================================

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    'new': ['assigned', 'cancelled'],
    'assigned': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': []  // Terminal state
};

/**
 * Validate if a status transition is allowed
 */
export function isValidTransition(fromStatus: string, toStatus: string): boolean {
    const allowed = VALID_STATUS_TRANSITIONS[fromStatus];
    if (!allowed) return false;
    return allowed.includes(toStatus);
}

// ============================================
// ORDER CREATION - Single Entry Point
// ============================================

/**
 * Create a new order (DreamRequest)
 * This is the ONLY function that creates orders.
 * 
 * Defense in Depth:
 * 1. Generate dreamHash from userId + dreamText
 * 2. Check if order already exists with this hash
 * 3. If exists, return existing (no duplicate)
 * 4. If not, create with unique constraint as final guard
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    await dbConnect();

    const { userId, userEmail, interpreterId, dreamText, context, bookingId } = input;

    // 1. Validate required fields
    if (!userId || !dreamText || !interpreterId) {
        throw new Error('Missing required fields: userId, dreamText, interpreterId');
    }

    if (dreamText.trim().length < 20) {
        throw new Error('Dream text must be at least 20 characters');
    }

    // 2. Get interpreter (to lock price)
    const interpreter = await Interpreter.findById(interpreterId);
    if (!interpreter) {
        throw new Error('Interpreter not found');
    }

    if (!interpreter.isActive || interpreter.status !== 'active') {
        throw new Error('Interpreter not available');
    }

    // 3. Generate PERMANENT hash & Idempotency Key
    const type = 'HUMAN'; // Default for this function as it's used for experts/bookings

    // Normalized text (first 100 chars) for strict key
    const normalizedTextKey = dreamText.trim().substring(0, 100).toLowerCase();
    const rawKey = `${userId}_${normalizedTextKey}_${interpreterId}_${type}`;
    const idempotencyKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Legacy hash for backward compat
    const dreamHash = generateDreamHash(userId, dreamText);

    console.log(`[Order] Creating order. User: ${userId}, Key: ${idempotencyKey.substring(0, 10)}...`);

    // 4. Check for existing order (Defense in Depth)

    // A. Check for RECENT order (Time Window Throttling - anti-spam < 1 min)
    // This catches double-clicks that might have slightly different text/hashes
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOrder = await DreamRequest.findOne({
        userId,
        createdAt: { $gt: oneMinuteAgo }
    });

    if (recentOrder) {
        console.log(`[Order] THROTTLE: User ${userId} blocked (recent order ${recentOrder._id} < 1min)`);
        return {
            success: true,
            order: {
                id: recentOrder._id.toString(),
                status: recentOrder.status,
                interpreterName: recentOrder.interpreterName,
                price: recentOrder.lockedPrice,
                createdAt: recentOrder.createdAt
            },
            isDuplicate: true,
            message: 'تم استقبال طلبك بنجاح (مكرر)'
        };
    }

    // B. Check exact hash or key
    const existingOrder = await DreamRequest.findOne({
        $or: [
            { idempotencyKey },
            { userId, dreamHash }
        ]
    });

    if (existingOrder) {
        console.log(`[Order] DUPLICATE BLOCKED: Returning existing order ${existingOrder._id}`);
        return {
            success: true,
            order: {
                id: existingOrder._id.toString(),
                status: existingOrder.status,
                interpreterName: existingOrder.interpreterName,
                price: existingOrder.lockedPrice,
                createdAt: existingOrder.createdAt
            },
            isDuplicate: true,
            message: 'لقد قمت بإرسال هذا الحلم مسبقاً'
        };
    }

    // 5. Lock price at creation time (IMMUTABLE)
    const lockedPrice = interpreter.price;
    const settings = await getSettings();
    const platformCommission = lockedPrice * settings.commissionRate;
    const interpreterEarning = lockedPrice - platformCommission;

    // 6. Create order with unique constraint as FINAL GUARD
    let newOrder;
    try {
        newOrder = await DreamRequest.create({
            userId,
            userEmail,
            type, // Explicitly set type
            interpreterId: interpreter._id.toString(),
            interpreterUserId: interpreter.userId,
            interpreterName: interpreter.displayName,
            dreamText: dreamText.trim(),
            dreamHash, // Legacy
            idempotencyKey, // STRICT GUARD
            context: context || {},
            price: lockedPrice,
            lockedPrice, // IMMUTABLE
            currency: interpreter.currency || 'USD',
            status: 'new',
            paymentStatus: 'paid', // Assuming payment completed before this
            paymentLockedAmount: lockedPrice,
            platformCommission,
            interpreterEarning,
            bookingId: bookingId || undefined
        });

        console.log(`[Order] NEW ORDER CREATED: ${newOrder._id}`);

    } catch (error: any) {
        // Handle race condition (MongoDB duplicate key error)
        if (error.code === 11000) {
            console.log(`[Order] RACE CONDITION: Duplicate key, fetching winner...`);
            const winner = await DreamRequest.findOne({ userId, dreamHash });
            if (winner) {
                return {
                    success: true,
                    order: {
                        id: winner._id.toString(),
                        status: winner.status,
                        interpreterName: winner.interpreterName,
                        price: winner.lockedPrice,
                        createdAt: winner.createdAt
                    },
                    isDuplicate: true,
                    message: 'تم استقبال طلبك بنجاح'
                };
            }
        }
        throw error;
    }

    // 7. Update interpreter stats (only for NEW orders)
    await Interpreter.findByIdAndUpdate(interpreterId, {
        $inc: { totalDreams: 1 }
    });

    return {
        success: true,
        order: {
            id: newOrder._id.toString(),
            status: newOrder.status,
            interpreterName: newOrder.interpreterName,
            price: newOrder.lockedPrice,
            createdAt: newOrder.createdAt
        },
        isDuplicate: false,
        message: 'تم إرسال طلب تفسير الحلم بنجاح'
    };
}

// ============================================
// ORDER STATUS UPDATE - With State Machine Validation
// ============================================

export interface UpdateOrderStatusInput {
    orderId: string;
    newStatus: string;
    interpreterId?: string; // Required for assignment
}

/**
 * Update order status with strict state machine validation
 */
export async function updateOrderStatus(input: UpdateOrderStatusInput): Promise<{ success: boolean; order: any }> {
    await dbConnect();

    const { orderId, newStatus, interpreterId } = input;

    const order = await DreamRequest.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    // Validate transition
    if (!isValidTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition: ${order.status} → ${newStatus}`);
    }

    // Build update object
    const update: Record<string, any> = { status: newStatus };

    if (newStatus === 'assigned' && interpreterId) {
        update.assignedAt = new Date();
    }

    if (newStatus === 'in_progress') {
        update.startedAt = new Date();
        update.acceptedAt = new Date();
    }

    if (newStatus === 'completed') {
        update.completedAt = new Date();
        update.paymentStatus = 'released';
    }

    if (newStatus === 'cancelled') {
        update.closedAt = new Date();
        update.paymentStatus = 'refunded';
    }

    const updatedOrder = await DreamRequest.findByIdAndUpdate(orderId, update, { new: true });

    console.log(`[Order] Status updated: ${order.status} → ${newStatus} for order ${orderId}`);

    return { success: true, order: updatedOrder };
}
