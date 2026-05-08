import { supabaseAdmin } from '@/lib/supabase';
import type { IPlatformSettings } from '@/types/index';

const DEFAULT_SETTINGS: Omit<IPlatformSettings, 'id' | 'created_at' | 'updated_at'> = {
    commission_rate: 0.30,
    ai_price_single: 2.99,
    ai_price_monthly: 9.99,
    human_min_price: 5.00,
    human_max_price: 50.00,
    max_response_time_hours: 48,
    stuck_order_threshold_hours: 24,
    notification_templates: {},
    maintenance_mode: false,
};

/**
 * Get platform settings from Supabase.
 * Falls back to hardcoded defaults if the table is empty or unavailable.
 */
export async function getSettings(): Promise<IPlatformSettings> {
    try {
        const { data, error } = await supabaseAdmin
            .from('platform_settings')
            .select('*')
            .limit(1)
            .single();

        if (error || !data) {
            // Auto-seed defaults on first call
            const { data: created } = await supabaseAdmin
                .from('platform_settings')
                .insert(DEFAULT_SETTINGS)
                .select()
                .single();

            return (created as IPlatformSettings) ?? {
                ...DEFAULT_SETTINGS,
                id: 'default',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }

        return data as IPlatformSettings;
    } catch (e) {
        console.error('[platformSettings] Failed to fetch settings:', e);
        return {
            ...DEFAULT_SETTINGS,
            id: 'default',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }
}

/**
 * Update platform settings. Only provided fields are changed.
 */
export async function updateSettings(
    updates: Partial<Omit<IPlatformSettings, 'id' | 'created_at'>>,
    adminUserId?: string
): Promise<IPlatformSettings | null> {
    try {
        const { data: current } = await supabaseAdmin
            .from('platform_settings')
            .select('id')
            .limit(1)
            .single();

        const payload = {
            ...updates,
            updated_by: adminUserId,
            updated_at: new Date().toISOString(),
        };

        if (current?.id) {
            const { data } = await supabaseAdmin
                .from('platform_settings')
                .update(payload)
                .eq('id', current.id)
                .select()
                .single();
            return data as IPlatformSettings;
        } else {
            const { data } = await supabaseAdmin
                .from('platform_settings')
                .insert({ ...DEFAULT_SETTINGS, ...payload })
                .select()
                .single();
            return data as IPlatformSettings;
        }
    } catch (e) {
        console.error('[platformSettings] Failed to update settings:', e);
        return null;
    }
}
