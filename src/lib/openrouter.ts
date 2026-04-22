/**
 * openrouter.ts
 * ─────────────────────────────────────────────────────────────
 * OpenAI-compatible client pointing to OpenRouter.
 * Use `interpretDream()` from lib/dreamInterpreter for full logic.
 * This file is kept for any lightweight/direct calls if needed.
 * ─────────────────────────────────────────────────────────────
 */
import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const siteName = 'Almofasser';

if (!apiKey) {
    console.warn('[OpenRouter] OPENROUTER_API_KEY is not defined in .env.local');
}

export const openRouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
    defaultHeaders: {
        'HTTP-Referer': siteUrl,
        'X-Title': siteName,
    },
    // ⚠️ Server-side only – never expose this client to the browser
    dangerouslyAllowBrowser: false,
});

/**
 * @deprecated Use `interpretDream()` from lib/dreamInterpreter instead.
 * Kept for backward compatibility only.
 */
export const getInterpretation = async (dreamText: string, context?: string): Promise<string> => {
    const { interpretDream } = await import('./dreamInterpreter');
    const result = await interpretDream(dreamText, undefined);
    return result.text;
};
