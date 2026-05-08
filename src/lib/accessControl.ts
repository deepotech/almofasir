import { supabaseAdmin } from '@/lib/supabase';

type AccessResult =
    | { allowed: true; mode: 'guest' | 'free' | 'credit' }
    | { allowed: false; reason: 'guest_exhausted' | 'daily_limit_reached' | 'no_credits'; nextReset?: Date };

export async function validateAccess(
    userId: string,
    isGuest: boolean
): Promise<AccessResult> {

    if (isGuest) {
        const { count } = await supabaseAdmin
            .from('dream_requests')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .neq('status', 'cancelled');

        if ((count || 0) >= 1) {
            return { allowed: false, reason: 'guest_exhausted' };
        }
        return { allowed: true, mode: 'guest' };
    }

    const { data: user } = await supabaseAdmin
        .from('users')
        .select('plan, credits, last_free_dream_at')
        .eq('firebase_uid', userId)
        .single();

    if (!user) {
        throw new Error('User not found in validation');
    }

    const now = new Date();
    const lastFree = user.last_free_dream_at;
    let isDailyFreeAvailable = true;

    if (lastFree) {
        const diffMs = now.getTime() - new Date(lastFree).getTime();
        const hoursDiff = diffMs / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            isDailyFreeAvailable = false;
        }
    }

    if (user.plan === 'free' || !user.plan) {
        if (isDailyFreeAvailable) {
            return { allowed: true, mode: 'free' };
        }
        const nextReset = lastFree ? new Date(new Date(lastFree).getTime() + 24 * 60 * 60 * 1000) : undefined;
        return { allowed: false, reason: 'daily_limit_reached', nextReset };
    }

    if (isDailyFreeAvailable) {
        return { allowed: true, mode: 'free' };
    }

    if (user.credits > 0) {
        return { allowed: true, mode: 'credit' };
    }

    return { allowed: false, reason: 'no_credits' };
}
