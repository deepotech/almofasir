import { supabaseAdmin } from '@/lib/supabase';
import {
    DreamRequestStatus,
    UserRole,
    STATUS_TRANSITIONS,
} from '@/types/index';

export type { UserRole };

/**
 * Validate if a status transition is allowed for a given role.
 */
export function validateStatusTransition(
    currentStatus: DreamRequestStatus,
    newStatus: DreamRequestStatus,
    role: UserRole
): { valid: boolean; error?: string } {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions || allowedTransitions.length === 0) {
        return {
            valid: false,
            error: `Cannot transition from '${currentStatus}' — terminal state`,
        };
    }

    const transition = allowedTransitions.find(t => t.nextStatus === newStatus);

    if (!transition) {
        return {
            valid: false,
            error: `Invalid transition from '${currentStatus}' to '${newStatus}'`,
        };
    }

    if (!transition.allowedRoles.includes(role)) {
        return {
            valid: false,
            error: `Role '${role}' cannot perform transition to '${newStatus}'`,
        };
    }

    return { valid: true };
}

/**
 * Check if user exists in Supabase and has required role.
 */
export async function checkUserRole(
    userId: string,
    allowedRoles: UserRole[]
): Promise<{ authorized: boolean; role?: UserRole; error?: string }> {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('role, status')
        .eq('firebase_uid', userId)
        .single();

    if (error || !user) {
        return { authorized: false, error: 'User not found' };
    }

    if (user.status === 'suspended') {
        return { authorized: false, error: 'User account is suspended' };
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
        return { authorized: false, error: 'Insufficient permissions' };
    }

    return { authorized: true, role: user.role as UserRole };
}

/**
 * Check if user can access a specific dream request.
 */
export function canAccessDreamRequest(
    userId: string,
    requestUserId: string,
    requestInterpreterUserId: string,
    role: UserRole
): boolean {
    if (role === 'admin') return true;
    if (role === 'user' && userId === requestUserId) return true;
    if (role === 'interpreter' && userId === requestInterpreterUserId) return true;
    return false;
}

/**
 * Check if user can view the interpretation text.
 * Users can only read it after status reaches 'completed' or later.
 */
export function canViewInterpretation(
    status: DreamRequestStatus,
    userId: string,
    requestUserId: string,
    role: UserRole
): boolean {
    if (role === 'admin' || role === 'interpreter') return true;
    if (role === 'user' && userId === requestUserId) {
        return ['completed', 'clarification_requested', 'closed'].includes(status);
    }
    return false;
}

/**
 * Check if a clarification question can be requested.
 */
export function canRequestClarification(
    status: DreamRequestStatus,
    existingQuestion: string | undefined
): { allowed: boolean; error?: string } {
    if (status !== 'completed') {
        return {
            allowed: false,
            error: 'Clarification can only be requested after interpretation is completed',
        };
    }
    if (existingQuestion) {
        return { allowed: false, error: 'Only ONE clarification question is allowed' };
    }
    return { allowed: true };
}
