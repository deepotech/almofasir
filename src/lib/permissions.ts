import { DreamRequestStatus } from '@/models/DreamRequest';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export type UserRole = 'user' | 'admin' | 'interpreter';

// Valid status transitions
const STATUS_TRANSITIONS: Record<DreamRequestStatus, { nextStatus: DreamRequestStatus; allowedRoles: UserRole[] }[]> = {
    'new': [
        { nextStatus: 'in_progress', allowedRoles: ['interpreter'] }
    ],
    'in_progress': [
        { nextStatus: 'completed', allowedRoles: ['interpreter'] }
    ],
    'completed': [
        { nextStatus: 'clarification_requested', allowedRoles: ['user'] },
        { nextStatus: 'closed', allowedRoles: ['user', 'admin'] }  // User can close without clarification
    ],
    'clarification_requested': [
        { nextStatus: 'closed', allowedRoles: ['interpreter'] }
    ],
    'closed': []  // Terminal state - no transitions allowed
};

/**
 * Validate if a status transition is allowed
 */
export function validateStatusTransition(
    currentStatus: DreamRequestStatus,
    newStatus: DreamRequestStatus,
    role: UserRole
): { valid: boolean; error?: string } {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions || allowedTransitions.length === 0) {
        return { valid: false, error: `Cannot transition from '${currentStatus}' - terminal state` };
    }

    const transition = allowedTransitions.find(t => t.nextStatus === newStatus);

    if (!transition) {
        return { valid: false, error: `Invalid transition from '${currentStatus}' to '${newStatus}'` };
    }

    if (!transition.allowedRoles.includes(role)) {
        return { valid: false, error: `Role '${role}' cannot perform transition to '${newStatus}'` };
    }

    return { valid: true };
}

/**
 * Check if user has required role
 */
export async function checkUserRole(
    userId: string,
    allowedRoles: UserRole[]
): Promise<{ authorized: boolean; role?: UserRole; error?: string }> {
    await dbConnect();

    const user = await User.findOne({ firebaseUid: userId });

    if (!user) {
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
 * Check if user can access a dream request
 */
export function canAccessDreamRequest(
    userId: string,
    requestUserId: string,
    requestInterpreterUserId: string,
    role: UserRole
): boolean {
    // Admin can access all
    if (role === 'admin') return true;

    // User can access their own requests
    if (role === 'user' && userId === requestUserId) return true;

    // Interpreter can access assigned requests only
    if (role === 'interpreter' && userId === requestInterpreterUserId) return true;

    return false;
}

/**
 * Check if user can view interpretation text
 * User can ONLY see interpretation when status is completed or later
 */
export function canViewInterpretation(
    status: DreamRequestStatus,
    userId: string,
    requestUserId: string,
    role: UserRole
): boolean {
    // Admin and interpreter can always view
    if (role === 'admin' || role === 'interpreter') return true;

    // User can only view after completion
    if (role === 'user' && userId === requestUserId) {
        return ['completed', 'clarification_requested', 'closed'].includes(status);
    }

    return false;
}

/**
 * Check if clarification can be requested
 */
export function canRequestClarification(
    status: DreamRequestStatus,
    existingQuestion: string | undefined
): { allowed: boolean; error?: string } {
    if (status !== 'completed') {
        return { allowed: false, error: 'Clarification can only be requested after interpretation is completed' };
    }

    if (existingQuestion) {
        return { allowed: false, error: 'Only ONE clarification question is allowed' };
    }

    return { allowed: true };
}
