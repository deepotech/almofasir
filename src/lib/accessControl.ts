import { ClientSession } from 'mongoose';
import DreamRequest from '@/models/DreamRequest';
import User, { IUser } from '@/models/User';

type AccessResult =
    | { allowed: true; mode: 'guest' | 'free' | 'credit' }
    | { allowed: false; reason: 'guest_exhausted' | 'daily_limit_reached' | 'no_credits'; nextReset?: Date };

/**
 * STRICT ACCESS CONTROL
 * Validates if a user (or guest) is allowed to create a new dream interpretation.
 * MUST be called inside a transaction.
 */
export async function validateAccess(
    userId: string,
    isGuest: boolean,
    session: ClientSession
): Promise<AccessResult> {

    // 1. STRICT GUEST CHECK
    if (isGuest) {
        // Count ALL non-cancelled requests by this guest ID
        // We do NOT trust the client regarding how many they did. Database is truth.
        const lifetimeCount = await DreamRequest.countDocuments({
            userId: userId,
            status: { $ne: 'cancelled' } // Count all attempts even if failed, unless explicitly cancelled
        }).session(session);

        if (lifetimeCount >= 1) {
            return { allowed: false, reason: 'guest_exhausted' };
        }

        return { allowed: true, mode: 'guest' };
    }

    // 2. REGISTERED USER CHECK
    const user = await User.findOne({ firebaseUid: userId }).session(session);
    if (!user) {
        throw new Error('User not found in validation');
    }

    // PAID User (Has plan OR has credits)
    // Priority: usage of plan limit vs usage of credits?
    // User requirement: "Paid User... Unlimited (based on credits/plan)"
    // Interpreted as: If they have credits, use them. If they have a plan, verify plan limits?
    // Actually, simpliest strict logic: 
    // If Free Plan -> Check Daily Limit -> then Check Credits.
    // If Paid Plan -> Assuming paid plan also has restrictions or just unlimited? 
    // Requirement says: "Paid User... allowed... subscription OR credits".
    // Let's implement: 
    // A) Daily Free Check (Available to everyone, even paid users usually get 1 free daily?)
    //    Actually user said: "Free User: 1 free every 24h". "Paid User: allowed by plan/credits".
    //    Let's stick to: Try to use Daily Free first. If exhausted, try Credits.

    // A) Check Daily Free Availability
    const now = new Date();
    const lastFree = user.lastFreeDreamAt;
    let isDailyFreeAvailable = true;

    if (lastFree) {
        const diffMs = now.getTime() - new Date(lastFree).getTime();
        const hoursDiff = diffMs / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            isDailyFreeAvailable = false;
        }
    }

    // Strict Rule: Free Plan users get 1 free.
    // Paid plans might get more, but let's assume 1 free daily for now for all to be safe, 
    // or strictly follow "Free User" vs "Paid User".

    if (user.plan === 'free' || !user.plan) {
        // STRICT: Free users get ONLY 1 daily free interpretation
        // NO credits fallback - credits are for paid users only
        if (isDailyFreeAvailable) {
            return { allowed: true, mode: 'free' };
        }

        // Daily used - DENY (free users cannot use credits)
        const nextReset = lastFree ? new Date(lastFree.getTime() + 24 * 60 * 60 * 1000) : undefined;
        return {
            allowed: false,
            reason: 'daily_limit_reached',
            nextReset
        };
    }

    // B) Paid Plan Logic
    // If user is PRO/PREMIUM, they might have unlimited?
    // User said: "Paid User... allowed by plan".
    // For now, if Plan != free, we assume they rely on credits or a higher limit.
    // BUT user said "Paid User ... allowed by plan OR credits".
    // To be strict and safe: If we haven't implemented "Unlimited Plan" logic yet, 
    // we default to CREDITS logic for safety, unless we know for sure what "Pro" means.
    // Let's assume Paid Plan = Unlimited for now? NO, "Do not assume behaviors".
    // Safe bet: Paid users also burn credits OR have a separate logic.
    // Given the prompt didn't specify "Unlimited Plan details", but said "Allowed by plan or credits".
    // I will implementation: Check Credits. If they have a plan that implies unlimited (not defined yet), 
    // we might block or allow.
    // SAFEST STRICT IMPLEMENTATION: Treat Paid Plan users same as Free regarding "Daily Free", 
    // but they likely have purchased credits. 
    // Actually, looking at `User.ts`, `credits` seems to be the currency.

    // So for Paid Users: 
    if (isDailyFreeAvailable) {
        return { allowed: true, mode: 'free' };
    }

    if (user.credits > 0) {
        return { allowed: true, mode: 'credit' };
    }

    return { allowed: false, reason: 'no_credits' };
}
