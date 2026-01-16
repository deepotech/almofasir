// Platform-wide constants

// Default values if database settings are missing
export const DEFAULT_COMMISSION_RATE = 0.30;
export const DEFAULT_AI_PRICE = 2.99;

// Thresholds
export const STUCK_ORDER_THRESHOLD_HOURS = 24;
export const AI_FAILURE_ALERT_THRESHOLD = 5;

// Status Enums for quick reference
export const ORDER_STATUS = {
    NEW: 'new',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
} as const;

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    RELEASED: 'released',
    REFUNDED: 'refunded'
} as const;

export const INTERPRETER_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    PENDING: 'pending'
} as const;
