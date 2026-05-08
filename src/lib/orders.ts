import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

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
    bookingId?: string;
}

export interface CreateOrderResult {
    success: boolean;
    order: {
        id: string;
        status: string;
        interpreterName: string;
        price: number;
        createdAt: Date;
    } | null;
    isDuplicate: boolean;
    message: string;
}

// ============================================
// HASH GENERATION
// ============================================

export function generateDreamHash(userId: string, dreamText: string): string {
    const normalized = dreamText.trim().toLowerCase();
    return crypto.createHash('sha256').update(`${userId}_${normalized}`).digest('hex');
}

// ============================================
// STATE MACHINE
// ============================================

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    'new': ['assigned', 'cancelled'],
    'assigned': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
};

export function isValidTransition(fromStatus: string, toStatus: string): boolean {
    const allowed = VALID_STATUS_TRANSITIONS[fromStatus];
    if (!allowed) return false;
    return allowed.includes(toStatus);
}

// ============================================
// ORDER CREATION
// ============================================

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const { userId, userEmail, interpreterId, dreamText, context, bookingId } = input;

    if (!userId || !dreamText || !interpreterId) {
        throw new Error('Missing required fields: userId, dreamText, interpreterId');
    }

    if (dreamText.trim().length < 20) {
        throw new Error('Dream text must be at least 20 characters');
    }

    // Get interpreter
    const { data: interpreter } = await supabaseAdmin
        .from('interpreters')
        .select('*')
        .eq('id', interpreterId)
        .single();

    if (!interpreter) throw new Error('Interpreter not found');
    if (!interpreter.is_active || interpreter.status !== 'active') throw new Error('Interpreter not available');

    const type = 'HUMAN';
    const normalizedTextKey = dreamText.trim().substring(0, 100).toLowerCase();
    const rawKey = `${userId}_${normalizedTextKey}_${interpreterId}_${type}`;
    const idempotencyKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const dreamHash = generateDreamHash(userId, dreamText);

    // Throttling: Check < 1 min order
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentOrder } = await supabaseAdmin
        .from('dream_requests')
        .select('id, status, interpreter_name, locked_price, created_at')
        .eq('user_id', userId)
        .gt('created_at', oneMinuteAgo)
        .limit(1)
        .maybeSingle();

    if (recentOrder) {
        return {
            success: true,
            order: {
                id: recentOrder.id,
                status: recentOrder.status,
                interpreterName: recentOrder.interpreter_name,
                price: recentOrder.locked_price,
                createdAt: new Date(recentOrder.created_at)
            },
            isDuplicate: true,
            message: 'تم استقبال طلبك بنجاح (مكرر)'
        };
    }

    // Exact Duplicate check
    const { data: existingOrder } = await supabaseAdmin
        .from('dream_requests')
        .select('id, status, interpreter_name, locked_price, created_at')
        .or(`idempotency_key.eq.${idempotencyKey},and(user_id.eq.${userId},dream_hash.eq.${dreamHash})`)
        .limit(1)
        .maybeSingle();

    if (existingOrder) {
        return {
            success: true,
            order: {
                id: existingOrder.id,
                status: existingOrder.status,
                interpreterName: existingOrder.interpreter_name,
                price: existingOrder.locked_price,
                createdAt: new Date(existingOrder.created_at)
            },
            isDuplicate: true,
            message: 'لقد قمت بإرسال هذا الحلم مسبقاً'
        };
    }

    // Get commission rate
    const { data: settings } = await supabaseAdmin
        .from('platform_settings')
        .select('commission_rate')
        .single();
    
    const commissionRate = settings?.commission_rate || 0.3;

    const lockedPrice = interpreter.price;
    const platformCommission = lockedPrice * commissionRate;
    const interpreterEarning = lockedPrice - platformCommission;

    const { data: newOrder, error } = await supabaseAdmin
        .from('dream_requests')
        .insert({
            user_id: userId,
            user_email: userEmail,
            type,
            interpreter_id: interpreter.id,
            interpreter_user_id: interpreter.user_id,
            interpreter_name: interpreter.display_name,
            dream_text: dreamText.trim(),
            dream_hash: dreamHash,
            idempotency_key: idempotencyKey,
            context: context || {},
            price: lockedPrice,
            locked_price: lockedPrice,
            currency: interpreter.currency || 'USD',
            status: 'new',
            payment_status: 'paid',
            payment_locked_amount: lockedPrice,
            platform_commission: platformCommission,
            interpreter_earning: interpreterEarning,
            booking_id: bookingId || null
        })
        .select('id, status, interpreter_name, locked_price, created_at')
        .single();

    if (error) {
        // Race condition
        if (error.code === '23505') { 
            const { data: winner } = await supabaseAdmin
                .from('dream_requests')
                .select('id, status, interpreter_name, locked_price, created_at')
                .eq('user_id', userId)
                .eq('dream_hash', dreamHash)
                .single();
            if (winner) {
                return {
                    success: true,
                    order: {
                        id: winner.id,
                        status: winner.status,
                        interpreterName: winner.interpreter_name,
                        price: winner.locked_price,
                        createdAt: new Date(winner.created_at)
                    },
                    isDuplicate: true,
                    message: 'تم استقبال طلبك بنجاح'
                };
            }
        }
        throw error;
    }

    // Update interpreter stats
    await supabaseAdmin.rpc('increment_interpreter_total_dreams', { p_id: interpreter.id });

    return {
        success: true,
        order: {
            id: newOrder.id,
            status: newOrder.status,
            interpreterName: newOrder.interpreter_name,
            price: newOrder.locked_price,
            createdAt: new Date(newOrder.created_at)
        },
        isDuplicate: false,
        message: 'تم إرسال طلب تفسير الحلم بنجاح'
    };
}

// ============================================
// ORDER STATUS UPDATE
// ============================================

export interface UpdateOrderStatusInput {
    orderId: string;
    newStatus: string;
    interpreterId?: string;
}

export async function updateOrderStatus(input: UpdateOrderStatusInput): Promise<{ success: boolean; order: any }> {
    const { orderId, newStatus, interpreterId } = input;

    const { data: order } = await supabaseAdmin
        .from('dream_requests')
        .select('id, status')
        .eq('id', orderId)
        .single();

    if (!order) throw new Error('Order not found');

    if (!isValidTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition: ${order.status} → ${newStatus}`);
    }

    const update: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };

    if (newStatus === 'assigned' && interpreterId) update.assigned_at = new Date().toISOString();
    if (newStatus === 'in_progress') {
        update.started_at = new Date().toISOString();
        update.accepted_at = new Date().toISOString();
    }
    if (newStatus === 'completed') {
        update.completed_at = new Date().toISOString();
        update.payment_status = 'released';
    }
    if (newStatus === 'cancelled') {
        update.cancelled_at = new Date().toISOString();
        update.payment_status = 'refunded';
    }

    const { data: updatedOrder, error } = await supabaseAdmin
        .from('dream_requests')
        .update(update)
        .eq('id', orderId)
        .select()
        .single();

    if (error) throw error;
    return { success: true, order: updatedOrder };
}
