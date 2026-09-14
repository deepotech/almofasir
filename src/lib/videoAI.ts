/**
 * src/lib/videoAI.ts
 *
 * Dedicated AI Content Generator for Video Library.
 * Generates rich, authentic educational dream interpretation articles,
 * key takeaways, FAQs, and SEO metadata from video titles/topics.
 */

import { VideoFAQ } from '@/types/video';

export interface GeneratedVideoContent {
    cleanTitle: string;
    slug: string;
    category: string;
    seoTitle: string;
    seoDescription: string;
    description: string;
    articleContent: string;
    takeaways: string[];
    faq: VideoFAQ[];
}

/**
 * Remove hashtags, invisible unicode characters, and clean title.
 */
export function cleanRawTitle(raw: string): string {
    if (!raw) return '';
    return raw
        // Remove zero-width and directional marks
        .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
        // Remove hashtags
        .replace(/#[^\s#]+/g, '')
        // Remove duplicate spaces
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Generate a clean, SEO-friendly Arabic slug from title
 */
export function slugifyArabic(text: string): string {
    const cleaned = text
        .toLowerCase()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, ' ')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Cut at last hyphen before 65 chars to avoid word slicing
    if (cleaned.length > 65) {
        const truncated = cleaned.slice(0, 65);
        const lastHyphen = truncated.lastIndexOf('-');
        return lastHyphen > 20 ? truncated.slice(0, lastHyphen) : truncated;
    }

    return cleaned || `video-${Date.now()}`;
}

const SYSTEM_PROMPT = `أنت باحث شرعي ومحرر أول متخصص في علوم تفسير الأحلام وفق أصول أهل السنة والجماعة ومنهج الإمامين محمد بن سيرين وعبد الغني النابلسي، مع مراعاة الضوابط النفسية والمنهجية الحديثة.

مهمتك:
عند تزويدك بعنوان فيديو أو موضوع متعلق بتفسير الأحلام، يجب عليك صياغة محتوى تحريري وتعليمي عالي القيمة للمقال المرافق للفيديو.

المطلوب بدقة:
1. cleanTitle: عنوان جذاب ومهني خالٍ من الهاشتاجات أو ترقيم القوائم العشوائي (بين 5 و 12 كلمة).
2. category: تصنيف دقيق من بين هذه التصنيفات فقط: ["تفسير الرموز", "تعليمي", "مفاهيم", "رموز", "آداب", "تساؤلات"].
3. seoTitle: عنوان سيو لا يتجاوز 58 حرفاً ينتهي بـ "| المُفسِّر".
4. seoDescription: وصف ميتا غني ودقيق بين 120 و 155 حرفاً يلخص فائدة المقطع للزائر ومحركات البحث.
5. description: فقرة تمهيدية من سطرين تلخص فكرة المقطع وأبرز ما فيه.
6. takeaways: مصفوفة من 4 إلى 5 نقاط جوهرية تعليمية ومستفادة (ماذا يتعلم المشاهد من هذا المقطع؟)، كل نقطة جملة واضحة ومفيدة.
7. articleContent: مقال تحليلي مفصل بين 350 و 600 كلمة، مقسم بفقرات وعناوين واضحة:
   - مدخل تمهيدي عن الرمز أو المفهوم.
   - أولاً: الدلالات والمعاني في تراث المفسرين (ابن سيرين والنابلسي).
   - ثانياً: اختلاف المعنى باختلاف حال الرائي وتفاصيل الرؤيا.
   - ثالثاً: متى يكون الرمز بشارة خير ومتى يكون تنبيهاً.
   - رابعاً: وصايا وآداب إسلامية عند رؤية هذه المشاهد.
   (ممنوع اختلاق أحاديث نبوية أو فتاوى قاطعة بالغيب، والتركيز على الاستبشار والاستئناس).
8. faq: مصفوفة من 2 إلى 3 أسئلة شائعة وإجاباتها، بحيث كل عنصر يحتوي على question و answer دقيق ومقنع.

أرجع النتيجة بتنسيق JSON حصراً بنفس أسماء المفاتيح المذكورة أعلاه.`;

export async function generateVideoContentWithAI(input: {
    title: string;
    description?: string;
    category?: string;
    tiktokUrl?: string;
}): Promise<GeneratedVideoContent> {
    const rawCleanTitle = cleanRawTitle(input.title);
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        return buildDeterministicFallback(rawCleanTitle, input.category);
    }

    try {
        const userPrompt = `عنوان المقطع: "${rawCleanTitle}"
الوصف أو السياق المتوفر: "${input.description || 'لا يوجد'}"
التصنيف المقترح: "${input.category || 'تفسير الرموز'}"

قم بتوليد المحتوى المطلوب وفق الشروط المحددة وأرجع كائن JSON فقط.`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://almofasir.com',
                'X-Title': 'Almofasser Video Engine',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.6,
            }),
        });

        clearTimeout(timeout);

        if (!response.ok) {
            console.warn('[videoAI] OpenRouter error status:', response.status);
            return buildDeterministicFallback(rawCleanTitle, input.category);
        }

        const data = await response.json();
        const contentStr = data.choices?.[0]?.message?.content;
        if (!contentStr) {
            return buildDeterministicFallback(rawCleanTitle, input.category);
        }

        const parsed = JSON.parse(contentStr);

        const cleanTitle = parsed.cleanTitle?.trim() || rawCleanTitle;
        const slug = slugifyArabic(cleanTitle);

        return {
            cleanTitle,
            slug,
            category: parsed.category || input.category || 'تفسير الرموز',
            seoTitle: parsed.seoTitle?.trim() || `${cleanTitle} | المُفسِّر`,
            seoDescription:
                parsed.seoDescription?.trim() ||
                `تعرف على دلالة ${cleanTitle} في المنام وتفسير الرموز وفق أصول ابن سيرين وتوجيهات أهل العلم.`,
            description: parsed.description?.trim() || `شرح تفصيلي حول ${cleanTitle} وأهم دلالاته في المنام.`,
            articleContent: parsed.articleContent?.trim() || buildFallbackArticle(cleanTitle),
            takeaways: Array.isArray(parsed.takeaways) && parsed.takeaways.length > 0
                ? parsed.takeaways
                : buildFallbackTakeaways(cleanTitle),
            faq: Array.isArray(parsed.faq) && parsed.faq.length > 0
                ? parsed.faq
                : buildFallbackFaq(cleanTitle),
        };
    } catch (err: any) {
        console.error('[videoAI] Failed to generate content with AI:', err?.message);
        return buildDeterministicFallback(rawCleanTitle, input.category);
    }
}

/**
 * Intelligent deterministic fallback generator if AI API is down or unavailable
 */
function buildDeterministicFallback(title: string, category?: string): GeneratedVideoContent {
    const cleanTitle = title || 'تفسير الرموز في المنام';
    const slug = slugifyArabic(cleanTitle);

    return {
        cleanTitle,
        slug,
        category: category || 'تفسير الرموز',
        seoTitle: `${cleanTitle.slice(0, 45)} | المُفسِّر`,
        seoDescription: `تعرف على دلالات ${cleanTitle} في المنام وتفسير الرموز وفق أصول ابن سيرين وتوجيهات أهل العلم.`,
        description: `شرح تحليلي وتوجيهي حول ${cleanTitle} وأثر الرموز في توجيه مسار الرؤيا والتعبير.`,
        articleContent: buildFallbackArticle(cleanTitle),
        takeaways: buildFallbackTakeaways(cleanTitle),
        faq: buildFallbackFaq(cleanTitle),
    };
}

function buildFallbackArticle(title: string): string {
    return `يعتبر موضوع "${title}" من المسائل الهامة التي تحظى باهتمام واسع لدى المهتمين بعلم تفسير الأحلام، حيث تنطوي الرؤى المرتبطة بهذا المعنى على إشارات نفسية ودلالات استبشارية متعددة.

أولاً: الدلالات والمعاني في تراث المفسرين
أوضح أئمة التعبير كابن سيرين والنابلسي أن مثل هذه الرموز ترتبط في الأصل بحال الرائي ومقصده. فالرموز التي تشير إلى النمو أو الانتقال أو الاستقرار تمثل في الغالب بشارات بالفرج، واليسر بعد العسر، وتحسن الأحوال المعيشية أو المهنية.

ثانياً: اختلاف المعنى باختلاف حال الرائي
من القواعد المنهجية الراسخة أن الرؤيا تتغير دلالتها من شخص إلى آخر بحسب ظروفه وهمومه. فالأمر المحمود في منام المهموم قد يكون دليلاً على زوال همه، ولطالب العلم دليلاً على بلوغ مقصده ونجاحه، بينما للشخص العازب قد يشير إلى خطوة مباركة نحو الاستقرار والزواج.

ثالثاً: متى يكون الرمز بشارة ومتى يكون تنبيهاً
إذا اقترن المشهد في المنام بانشراح الصدر والوضوح والبهجة، فذلك من علامات الرؤيا الصالحة المبشرة بإذن الله. أما إذا اقترن بالضيق أو الخوف الشديد، فقد يكون تنبيهاً للرائي لمراجعة بعض شؤونه أو الحذر في قراراته القادمة.

رابعاً: وصايا وآداب إسلامية عند رؤية المبشرات
يستحب لمن رأى ما يسره أن يحمد الله سبحانه، ويستبشر بالخير، وألا يقص رؤياه إلا على ناصح أو محب أمين، عملاً بالتوجيه النبوي الشريف: «إذا رأى أحدكم ما يحب فليحمد الله عليها وليحدث بها».`;
}

function buildFallbackTakeaways(title: string): string[] {
    return [
        `دلالة الرمز ترتبط ارتباطاً وثيقاً بسياق المشاهد في المنام وحال الرائي الواقعية.`,
        `الرموز الإيجابية في الرؤى تستدعي الاستبشار وحسن الظن بالله دون قطع بالغيب.`,
        `اختلاف مشاعر الرائي داخل الحلم (الاطمئنان مقابل القلق) يرجح وجه التعبير.`,
        `الأصل في تأويل الرؤى حملها على المحامل الحسنة وعدم التحديث بها أمام الحاقدين.`
    ];
}

function buildFallbackFaq(title: string): VideoFAQ[] {
    return [
        {
            question: `هل ما جاء في الفيديو عن "${title}" يعتبر تفسيراً حتمياً لكل من يراه؟`,
            answer: `لا، تفسير الرؤى مبني على القرائن وظروف كل شخص، وما يُذكر هو قواعد عامة وأصول استئناسية وفق كتب أهل التأويل.`
        },
        {
            question: `ما هو أفضل تصرف عند رؤية هذه المشاهد في المنام؟`,
            answer: `إذا كانت الرؤيا سارة يُستحب الاستبشار والدعاء بالبركة، وإذا كان فيها ما يقلق يُستعاذ بالله من شرها ويُتصدق بنية التيسير والفرج.`
        }
    ];
}
