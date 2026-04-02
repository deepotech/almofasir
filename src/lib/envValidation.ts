/**
 * envValidation.ts
 *
 * Validates required environment variables at startup.
 * Logs clear errors instead of silent failures in production.
 *
 * IMPORTANT: Only import this in SERVER-SIDE code (API routes, server actions).
 * Never import in client components — it will expose server-side env names.
 */

interface EnvCheck {
    key: string;
    required: boolean;
    serverOnly: boolean; // true = only needed on server, false = also on client
    description: string;
}

const requiredEnvVars: EnvCheck[] = [
    {
        key: 'MONGODB_URI',
        required: true,
        serverOnly: true,
        description: 'MongoDB connection string for database access'
    },
    {
        key: 'OPENROUTER_API_KEY',
        required: false, // Optional — publishing falls back to dev mode
        serverOnly: true,
        description: 'OpenRouter API key for AI dream analysis'
    },
    {
        key: 'NEXT_PUBLIC_FIREBASE_API_KEY',
        required: true,
        serverOnly: false,
        description: 'Firebase API key for authentication'
    },
    {
        key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        required: true,
        serverOnly: false,
        description: 'Firebase project ID'
    },
    {
        key: 'NEXT_PUBLIC_SITE_URL',
        required: false,
        serverOnly: false,
        description: 'Public site URL (defaults to http://localhost:3000)'
    }
];

let hasValidated = false;

/**
 * Validates server-side environment variables.
 * Call once at app startup or in API routes.
 * Never throws — only logs warnings/errors.
 */
export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
    // Only validate once per server lifecycle
    if (hasValidated) return { valid: true, missing: [], warnings: [] };
    hasValidated = true;

    const missing: string[] = [];
    const warnings: string[] = [];

    for (const check of requiredEnvVars) {
        const value = process.env[check.key];

        if (!value || value.trim() === '') {
            if (check.required) {
                missing.push(check.key);
                console.error(
                    `[ENV] ❌ MISSING required env var: ${check.key}\n` +
                    `     Description: ${check.description}\n` +
                    `     Fix: Add it to .env.local (development) or Vercel environment variables (production)`
                );
            } else {
                warnings.push(check.key);
                console.warn(
                    `[ENV] ⚠️  Optional env var not set: ${check.key}\n` +
                    `     Description: ${check.description}\n` +
                    `     Some features may be disabled.`
                );
            }
        }
    }

    const valid = missing.length === 0;

    if (valid && warnings.length === 0) {
        console.log('[ENV] ✅ All environment variables validated successfully');
    } else if (valid) {
        console.log(`[ENV] ✅ Required env vars OK. ${warnings.length} optional var(s) not set.`);
    } else {
        console.error(
            `[ENV] ❌ ${missing.length} REQUIRED environment variable(s) are missing!\n` +
            `     Missing: ${missing.join(', ')}\n` +
            `     The app may fail silently without these.`
        );
    }

    return { valid, missing, warnings };
}

/**
 * Quick check for a single env var.
 * Use in API routes to guard against missing config.
 */
export function requireEnv(key: string, description = ''): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
        const msg = `[ENV] Missing required env var: ${key}${description ? ` (${description})` : ''}`;
        console.error(msg);
        throw new Error(msg);
    }
    return value;
}

/**
 * Safe env getter with fallback.
 * Use when you want a default value instead of throwing.
 */
export function getEnv(key: string, fallback = ''): string {
    return process.env[key] || fallback;
}
