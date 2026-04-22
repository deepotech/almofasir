/**
 * dreamInterpreter.ts
 * ============================================================
 * Advanced Single source of truth for AI dream interpretation.
 * Supports: Enriched symbols, Dynamic Confidence, Type Detection, Memory Caching.
 * ============================================================
 */
import crypto from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DreamContext {
    gender?: string;
    socialStatus?: string;
    dominantFeeling?: string;
    isRecurring?: boolean;
}

export interface EnrichedSymbol {
    symbol: string;
    meaning: string;
}

export type DreamType = 'بشارة' | 'تنبيه' | 'حلم نفسي' | 'عام';

export interface InterpretationResult {
    text: string;
    symbols: EnrichedSymbol[];
    type: DreamType;
    confidenceScore: number;
    wordCount: number;
    skipped: boolean;
    skipReason?: string;
}

// ─── Constants & State ────────────────────────────────────────────────────────

const MIN_WORD_COUNT = 15;
const MAX_TOKENS = 500; // Increased slightly for structured symbols
const TEMPERATURE = 0.6;
const MODEL = 'openai/gpt-4o-mini';

// Memory Cache to prevent duplicate API calls across hot-reloads/concurrent requests
const interpretationCache = new Map<string, { result: InterpretationResult, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// ─── System Prompt ───────────────────────────────────────────────────────────

const DREAM_SYSTEM_PROMPT = `أنت مفسر أحلام خبير تعتمد على منهج ابن سيرين في تفسير الرموز، وتدعمه بتحليل منطقي ونفسي حديث.

مهمتك: تقديم تفسير واضح، دقيق، ومخصص للحلم.

📌 تعليمات التفكير الداخلي:
1. فكّر أولاً في قراءة الحلم، وحلل الرائي، واستخرج الرموز والعلاقات بينها داخلياً. (لا تكتب أفكارك للمستخدم، احتفظ بها لنفسك).
2. حدد نوع الرؤيا (بشارة، تنبيه، أم حلم نفسي).
3. استخرج رسالة الحلم المترابطة.

📌 قواعد الإخراج النهائي:
* قدّم التفسير النهائي فقط.
* في قسم الرموز اذكر كل رمز ومعناه المباشر بصيغة هندسية نقطية.
* لا تستخدم تفسيرات عامة، كن محدداً جداً لحالة الرائي.
* إذا كانت الرؤيا بشارة أبرز ذلك، وإذا كانت تنبيهاً فليكن بلطف.

🎯 أجب بهذا الشكل الحرفي فقط (لا تضف عناوين من عندك):

🧩 الرموز:
- [الرمز الأول]: [معناه ودلالته باختصار]
- [الرمز الثاني]: [معناه ودلالته باختصار]

✨ الخلاصة:
(سطرين يوضحان المعنى العام ونوع الحلم بوضوح)

🔍 التفسير:
(تحليل مترابط يربط الرموز بحالة الرائي وظروفه)

💡 النصيحة:
(توجيه عملي واقعي ومناسب)`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function cleanDreamText(text: string): string {
    const sentences = text
        .replace(/\s+/g, ' ')
        .trim()
        .split(/[.،,\n]+/)
        .map(s => s.trim())
        .filter(Boolean);

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const s of sentences) {
        const normalized = s.replace(/\s+/g, '');
        if (!seen.has(normalized)) {
            seen.add(normalized);
            unique.push(s);
        }
    }
    return unique.join('، ');
}

export function buildContextString(context?: DreamContext): string {
    if (!context) return 'لا توجد معلومات محددة عن الرائي.';

    const genderMap: Record<string, string> = { male: 'ذكر', female: 'أنثى' };
    const statusMap: Record<string, string> = {
        single: 'أعزب/عزباء',
        married: 'متزوج/متزوجة',
        divorced: 'مطلق/مطلقة',
        widowed: 'أرمل/أرملة',
    };

    const gender = genderMap[context.gender || ''] || 'غير محدد';
    const status = statusMap[context.socialStatus || ''] || context.socialStatus || 'غير محدد';
    const feeling = context.dominantFeeling || 'غير محدد';
    const recurring = context.isRecurring ? 'نعم' : 'لا';

    return `• الجنس: ${gender}\n• الحالة الاجتماعية: ${status}\n• الشعور السائد: ${feeling}\n• حلم متكرر: ${recurring}`;
}

function generateCacheKey(dreamText: string, contextString: string): string {
    const normalizedText = dreamText.trim().substring(0, 200).toLowerCase();
    return crypto.createHash('md5').update(`${normalizedText}_${contextString}`).digest('hex');
}

/**
 * Extracts symbols and their meanings from the response.
 */
function extractEnrichedSymbols(responseText: string): EnrichedSymbol[] {
    const match = responseText.match(/🧩\s*الرموز[\s\S]*?(?=✨|🔍|💡|$)/);
    if (!match) return [];

    const lines = match[0].split('\n');
    const symbols: EnrichedSymbol[] = [];

    for (const line of lines) {
        const cleaned = line.replace(/^[\s\-•*🧩]+/, '').trim();
        if (!cleaned || cleaned.includes('الرموز') || cleaned.length < 3) continue;

        let splitIndex = cleaned.indexOf(':');
        if (splitIndex === -1) splitIndex = cleaned.indexOf(' - ');
        if (splitIndex === -1) splitIndex = cleaned.indexOf('،');

        if (splitIndex !== -1) {
            symbols.push({
                symbol: cleaned.substring(0, splitIndex).trim(),
                meaning: cleaned.substring(splitIndex + 1).replace(/^[-:\s]+/, '').trim()
            });
        } else {
            symbols.push({ symbol: cleaned, meaning: 'دلالة مستنبطة من السياق' });
        }
    }
    return symbols.slice(0, 6);
}

/**
 * Detects the core type of the dream based on language context.
 */
function detectDreamType(responseText: string): DreamType {
    const text = responseText.replace(/\s+/g, ' ');
    
    if (/(بشارة|سار|خير|رزق|فرج|زواج|شفاء|نجاح|ارتقاء|نعمة|يُبشر|تبشر)/.test(text)) {
        if (!/(ليس(ت)? بشارة)/.test(text)) return 'بشارة';
    }
    if (/(تنبيه|حذر|تحذير|احذر|انتبه|رسالة تحذيرية|احتمال خطر|مراجعة للنفس)/.test(text)) {
        return 'تنبيه';
    }
    if (/(نفسي|عقل باطن|تفكير|قلق|توتر|حديث نفس|اضطراب|ضغوط|أضغاث|انعكاس لحالتك)/.test(text)) {
        return 'حلم نفسي';
    }
    return 'عام';
}

/**
 * Calculates a dynamic confidence score based on input quality and structural integrity.
 */
function calculateConfidence(wordCount: number, symbolsCount: number, context?: DreamContext, text?: string): number {
    let score = 0.75;

    // Size of dream input
    if (wordCount > 60) score += 0.08;
    else if (wordCount > 30) score += 0.05;
    else if (wordCount > 15) score += 0.02;

    // Symbols richness
    if (symbolsCount >= 3) score += 0.05;
    else if (symbolsCount >= 1) score += 0.02;

    // Context availability
    if (context) {
        if (context.dominantFeeling && context.dominantFeeling !== 'غير محدد') score += 0.04;
        if (context.socialStatus && context.socialStatus !== 'غير محدد') score += 0.02;
    }

    // Structural integrity
    if (text) {
        if (text.includes('✨ الخلاصة')) score += 0.01;
        if (text.includes('🔍 التفسير')) score += 0.01;
        if (text.includes('💡 النصيحة')) score += 0.01;
    }

    return Math.min(Math.round(score * 100) / 100, 0.98);
}

/**
 * Formats response text to ensure clean headers and spacing.
 */
function formatResponseText(text: string): string {
    return text
        .replace(/\*\*(🧩.*?)\*\*/g, '$1')
        .replace(/\*\*(✨.*?)\*\*/g, '$1')
        .replace(/\*\*(🔍.*?)\*\*/g, '$1')
        .replace(/\*\*(💡.*?)\*\*/g, '$1')
        .trim();
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export async function interpretDream(
    dreamText: string,
    context?: DreamContext,
    retries = 2
): Promise<InterpretationResult> {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    // ── 1. Validate word count
    const cleaned = cleanDreamText(dreamText);
    const wordCount = countWords(cleaned);

    if (wordCount < MIN_WORD_COUNT) {
        return {
            text: `حلمك قصير جداً للتفسير الدقيق. يرجى وصف الحلم بتفاصيل أكثر (الأشخاص، الأماكن، المشاعر) لأتمكن من تقديم تفسير صحيح ومخصص لك.`,
            symbols: [],
            type: 'عام',
            confidenceScore: 0,
            wordCount,
            skipped: true,
            skipReason: 'dream_too_short',
        };
    }

    // ── 2. Memory Cache Check
    const contextString = buildContextString(context);
    const cacheKey = generateCacheKey(cleaned, contextString);
    const cached = interpretationCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.result;
    }

    if (!OPENROUTER_API_KEY) {
        return {
            text: `(Mock) تفسير تجريبي للحلم: "${cleaned.substring(0, 30)}..."`,
            symbols: [{ symbol: 'مثال', meaning: 'هذا محاكي للتجربة' }],
            type: 'عام',
            confidenceScore: 0.8,
            wordCount,
            skipped: false,
        };
    }

    // ── 3. AI call with retry
    const userMessage = `معلومات الرائي:\n${contextString}\n\nنص الحلم:\n${cleaned}`;
    let attempt = 0;
    let lastError: string = '';

    while (attempt <= retries) {
        const controller = new AbortController();
        const timeout = attempt === 0 ? 9000 : 16000;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                    'X-Title': 'Almofasser',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: MODEL,
                    temperature: TEMPERATURE,
                    max_tokens: MAX_TOKENS,
                    messages: [
                        { role: 'system', content: DREAM_SYSTEM_PROMPT },
                        { role: 'user', content: userMessage },
                    ],
                }),
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                let text: string = data.choices?.[0]?.message?.content || '';

                if (!text) {
                    attempt++;
                    lastError = 'empty_response';
                    continue;
                }

                // Post-process the response
                text = formatResponseText(text);
                const symbols = extractEnrichedSymbols(text);
                const type = detectDreamType(text);
                const confidenceScore = calculateConfidence(wordCount, symbols.length, context, text);

                const finalResult: InterpretationResult = {
                    text,
                    symbols,
                    type,
                    confidenceScore,
                    wordCount,
                    skipped: false,
                };

                // Save to cache
                interpretationCache.set(cacheKey, { result: finalResult, timestamp: now });

                return finalResult;
            } else {
                clearTimeout(timeoutId);
                lastError = `http_${response.status}`;
                attempt++;
            }
        } catch (err: any) {
            clearTimeout(timeoutId);
            lastError = err?.name === 'AbortError' ? 'timeout' : err?.message || 'unknown';
            attempt++;
        }
    }

    return {
        text: 'عذراً، لم نتمكن من إتمام التفسير في الوقت المحدد. يرجى المحاولة مجدداً باسترسال أكثر.',
        symbols: [],
        type: 'عام',
        confidenceScore: 0,
        wordCount,
        skipped: false,
        skipReason: lastError,
    };
}
