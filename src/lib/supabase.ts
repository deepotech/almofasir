import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Lazy singleton pattern — avoids throwing at module load during build
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            '[Supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env.local'
        );
    }
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

function getAdminClient(): SupabaseClient {
    if (!supabaseUrl) {
        throw new Error('[Supabase] NEXT_PUBLIC_SUPABASE_URL must be defined in .env.local');
    }
    if (!_supabaseAdmin) {
        const key = supabaseServiceKey || supabaseAnonKey;
        if (!key) {
            throw new Error(
                '[Supabase] SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env.local'
            );
        }
        _supabaseAdmin = createClient(supabaseUrl, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return _supabaseAdmin;
}

// Proxy objects — module-level exports that evaluate lazily on first property access
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getClient() as any)[prop];
    },
});

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getAdminClient() as any)[prop];
    },
});
