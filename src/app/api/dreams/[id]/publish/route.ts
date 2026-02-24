import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import DreamRequest from '@/models/DreamRequest';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { slugifyArabic } from '@/lib/slugifyArabic';

initFirebaseAdmin();

/**
 * Generate a unique seoSlug for a dream.
 * Uses slugifyArabic for strict Arabic SEO rules.
 * Enforces uniqueness by appending "-2", "-3", etc. if slug already exists.
 * Only called for NEW dreams at publish time.
 */
async function generateUniqueSlug(title: string, tags: string[] = [], dreamId: string): Promise<string> {
    // Build source text from title + top tags
    let sourceText = title || '';
    if (tags.length > 0) {
        sourceText += ' ' + tags.slice(0, 3).join(' ');
    }

    let baseSlug = slugifyArabic(sourceText);

    // Validation guard: if generated slug is empty or too short, use a safe fallback
    if (!baseSlug || baseSlug.length < 4) {
        const shortId = dreamId.slice(-6);
        baseSlug = `تفسير-حلم-${shortId}`;
    }

    // Validation guard: block repetition patterns like "تفسير-حلم-تفسير-حلم"
    const tokens = baseSlug.split('-');
    const halfLen = Math.floor(tokens.length / 2);
    if (halfLen >= 2) {
        const firstHalf = tokens.slice(0, halfLen).join('-');
        const secondHalf = tokens.slice(halfLen, halfLen * 2).join('-');
        if (firstHalf === secondHalf) {
            // Deduplicate: use only the first half
            baseSlug = firstHalf;
        }
    }

    // Enforce max length (60 chars)
    if (baseSlug.length > 60) {
        baseSlug = baseSlug.substring(0, 60);
        const lastHyphen = baseSlug.lastIndexOf('-');
        if (lastHyphen > 0) {
            baseSlug = baseSlug.substring(0, lastHyphen);
        }
    }

    // Uniqueness check: append suffix if slug already taken
    let candidateSlug = baseSlug;
    let suffix = 1;
    const MAX_ATTEMPTS = 20;

    while (suffix <= MAX_ATTEMPTS) {
        const existing = await Dream.findOne({ seoSlug: candidateSlug }).select('_id').lean();
        if (!existing || existing._id.toString() === dreamId) {
            // Available or it's the same dream
            return candidateSlug;
        }
        suffix++;
        candidateSlug = `${baseSlug}-${suffix}`;
    }

    // Ultimate fallback: append short ID
    return `${baseSlug}-${dreamId.slice(-6)}`;
}

/**
 * Calculate a quality score based on the generated article structure.
 * Updated to validate the enhanced SEO article requirements.
 */
function calculateQualityScore(article: any): number {
    let score = 60; // Base score

    // 1. Snippet Summary Length (ideal: 100-300 chars)
    if (article.snippetSummary && article.snippetSummary.length >= 100 && article.snippetSummary.length <= 350) {
        score += 5;
    }

    // 2. Number of FAQs (ideal: 5-7)
    if (article.faqs && Array.isArray(article.faqs)) {
        if (article.faqs.length >= 5) score += 5;
        if (article.faqs.length >= 6) score += 2; // Bonus for 6+
        if (article.faqs.length === 7) score += 1; // Max FAQ bonus
    }

    // 3. Meta Title Length (ideal: <= 58 chars)
    if (article.metaTitle && article.metaTitle.length <= 58) {
        score += 3;
    }

    // 4. Meta Description Length (ideal: 100-155 chars)
    if (article.metaDescription && article.metaDescription.length >= 100 && article.metaDescription.length <= 155) {
        score += 3;
    }

    // 5. Sections count (ideal: >= 7)
    if (article.sections && Array.isArray(article.sections)) {
        if (article.sections.length >= 7) score += 5;
        if (article.sections.length >= 8) score += 2; // Bonus for extra sections

        // 6. Check for subsections in التفسير حسب تفاصيل الحلم
        const detailSection = article.sections.find((s: any) => s.subsections && Array.isArray(s.subsections));
        if (detailSection && detailSection.subsections.length >= 4) {
            score += 4;
        }
    }

    // 7. dream_text word count (ideal: 90-160 words)
    if (article.dream_text) {
        const dreamWordCount = article.dream_text.trim().split(/\s+/).length;
        if (dreamWordCount >= 90 && dreamWordCount <= 160) score += 3;
    }

    // 8. Primary symbol and secondary symbols
    if (article.primarySymbol) score += 3;
    if (article.secondarySymbols && article.secondarySymbols.length >= 2) score += 2;

    // 9. Internal link anchors
    if (article.internalLinkAnchors && article.internalLinkAnchors.length >= 2) score += 2;

    // Cap at 100
    return Math.min(score, 100);
}

/**
 * Count total words across all text content in the article.
 * Sums: seoIntro, snippetSummary, dream_text, all section contents,
 * all subsection contents, all FAQ answers, all bullets.
 */
function countArticleWords(article: any): number {
    const countWords = (text: string | undefined): number => {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    };

    let total = 0;
    total += countWords(article.seoIntro);
    total += countWords(article.snippetSummary);
    total += countWords(article.dream_text);

    if (article.sections && Array.isArray(article.sections)) {
        for (const section of article.sections) {
            total += countWords(section.content);
            if (section.bullets && Array.isArray(section.bullets)) {
                for (const bullet of section.bullets) {
                    total += countWords(bullet);
                }
            }
            if (section.subsections && Array.isArray(section.subsections)) {
                for (const sub of section.subsections) {
                    total += countWords(sub.content);
                }
            }
        }
    }

    if (article.faqs && Array.isArray(article.faqs)) {
        for (const faq of article.faqs) {
            total += countWords(faq.question);
            total += countWords(faq.answer);
        }
    }

    return total;
}

/**
 * Validate article structure against hard requirements.
 * Returns { valid: true } or { valid: false, failures: string[] }
 */
function validateArticleStructure(article: any): { valid: boolean; failures: string[] } {
    const failures: string[] = [];
    const countWords = (text: string | undefined): number => {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    };

    // ── Required top-level fields ──
    const requiredFields = ['metaTitle', 'metaDescription', 'h1', 'primarySymbol', 'snippetSummary', 'seoIntro', 'dream_text', 'sections', 'faqs'];
    for (const field of requiredFields) {
        if (!article[field]) {
            failures.push(`missing_field:${field}`);
        }
    }

    // ── Total word count >= 900 ──
    const totalWords = countArticleWords(article);
    if (totalWords < 900) {
        failures.push(`total_words:${totalWords}<900`);
    }

    // ── Sections >= 7 ──
    if (!article.sections || !Array.isArray(article.sections) || article.sections.length < 7) {
        failures.push(`sections:${article.sections?.length || 0}<7`);
    }

    // ── FAQs between 5 and 7 ──
    if (!article.faqs || !Array.isArray(article.faqs) || article.faqs.length < 5) {
        failures.push(`faqs:${article.faqs?.length || 0}<5`);
    }

    // ── Required section headings ──
    const requiredHeadings = [
        'متى يكون الحلم بشارة',
        'متى يكون الحلم تنبيه',
        'ماذا تفعل بعد'
    ];
    if (article.sections && Array.isArray(article.sections)) {
        const headings = article.sections.map((s: any) => s.heading || '').join(' ');
        for (const req of requiredHeadings) {
            if (!headings.includes(req)) {
                failures.push(`missing_heading:${req}`);
            }
        }

        // ── Subsections >= 4 in التفسير حسب تفاصيل الحلم ──
        const detailSection = article.sections.find((s: any) =>
            s.heading && s.heading.includes('تفاصيل') && s.subsections
        );
        if (!detailSection || !Array.isArray(detailSection.subsections) || detailSection.subsections.length < 4) {
            failures.push(`subsections:${detailSection?.subsections?.length || 0}<4`);
        }

        // ── Content sections word count >= 90 (skip bullet sections) ──
        for (const section of article.sections) {
            if (section.content && !section.bullets) {
                const wc = countWords(section.content);
                if (wc < 90) {
                    failures.push(`short_section:"${section.heading}"=${wc}words`);
                }
            }
            // Subsection content >= 70 words
            if (section.subsections && Array.isArray(section.subsections)) {
                for (const sub of section.subsections) {
                    const wc = countWords(sub.content);
                    if (wc < 70) {
                        failures.push(`short_subsection:"${sub.heading}"=${wc}words`);
                    }
                }
            }
        }
    }

    // ── dream_text word count: 90-160 ──
    const dreamWords = countWords(article.dream_text);
    if (dreamWords < 90 || dreamWords > 160) {
        failures.push(`dream_text_words:${dreamWords} (need 90-160)`);
    }

    // ── snippetSummary >= 35 words ──
    const snippetWords = countWords(article.snippetSummary);
    if (snippetWords < 35) {
        failures.push(`snippetSummary:${snippetWords}<35words`);
    }

    return { valid: failures.length === 0, failures };
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        // 1. Authenticate
        const authHeader = req.headers.get('Authorization');
        let userId: string | undefined;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            try {
                const decodedToken = await getAuth().verifyIdToken(token);
                userId = decodedToken.uid;
            } catch (authError) {
                console.log('[API] Auth failed (Initial check):', authError);

                // Dev Fallback
                if (process.env.NODE_ENV === 'development') {
                    try {
                        console.log('[API] Attempting Dev Fallback for Auth...');
                        const payload = token.split('.')[1];
                        const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                        userId = decodedValue.user_id || decodedValue.sub;
                        console.log('[API] User ID verified (Fallback):', userId);
                    } catch (e) {
                        console.error('[API] Fallback auth failed:', e);
                    }
                }
            }
        }

        const { id } = await params;
        let dream = await Dream.findById(id);
        let fromRequest = false;

        // If not found in Dream collection, look in DreamRequest (New Flow)
        if (!dream) {
            const dreamRequest = await DreamRequest.findById(id);
            if (dreamRequest) {
                fromRequest = true;
                if (dreamRequest.userId) {
                    if (!userId || dreamRequest.userId !== userId) {
                        return NextResponse.json({ error: 'Unauthorized: You do not own this dream request' }, { status: 401 });
                    }
                }

                dream = new Dream({
                    userId: dreamRequest.userId,
                    content: dreamRequest.dreamText,
                    mood: dreamRequest.context?.dominantFeeling || 'neutral',
                    socialStatus: dreamRequest.context?.socialStatus,
                    gender: dreamRequest.context?.gender,
                    isRecurring: dreamRequest.context?.isRecurring || false,
                    interpretation: {
                        summary: dreamRequest.interpretationText || 'تفسير آلي',
                        aiGenerated: dreamRequest.type === 'AI',
                        isPremium: false
                    },
                    status: 'completed',
                    createdAt: dreamRequest.createdAt
                });
            }
        }

        if (!dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        // 2. Authorization Check (for existing Dreams)
        if (!fromRequest && dream.userId) {
            if (!userId || dream.userId !== userId) {
                return NextResponse.json({ error: 'Unauthorized: You do not own this dream' }, { status: 401 });
            }
        } else if (!fromRequest) {
            console.log('[Publish] Guest dream publishing allowed.');
        }

        if (dream.isPublic) {
            return NextResponse.json({ message: 'Dream is already public' }, { status: 200 });
        }

        // --- PHASE 1: Mandatory Filtering ---
        const wordCount = dream.content.trim().split(/\s+/).length;
        if (wordCount < 10) {
            console.log(`[Publish] Dream rejected: Too short (${wordCount} words)`);
            dream.visibilityStatus = 'rejected';
            dream.publicVersion = { rejectionReason: 'Too short' };
            await dream.save();
            return NextResponse.json({ success: false, reason: 'min_length' });
        }

        // --- PHASE 2 & 4: AI Analysis, Quality Check, Enhancement & Retry ---
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

        if (OPENROUTER_API_KEY) {
            const systemPrompt = `
أنت خبير تفسير أحلام ومحرر SEO عربي محترف لموقع "المفسر".
مهمتك: تحويل "نص الحلم" + "سياق الرائي" إلى مقال SEO كامل (ليس ملخصاً)، مفيد وطبيعي، بدون بصمة AI واضحة.

⚠️ أهم هدف: أن يكون التفسير "ملتصقاً" بتفاصيل الحلم الحقيقي، وليس كلاماً عاماً.
إذا لم تستطع الالتزام بالجودة والهيكل = decision: "Archive".

═══════════════════════════════════
██ ممنوعات صارمة (HARD RULES) ██
═══════════════════════════════════
- ممنوع اختلاق رموز/أشخاص/أماكن/أحداث غير موجودة في نص الحلم.
- ممنوع اختلاق اقتباسات من ابن سيرين/النابلسي أو نسب كلام حرفي لهم.
- ممنوع عناوين طويلة أو محشوة أو تكرار كلمات في العنوان.
- ممنوع تكرار نفس الصيغة/الافتتاحية/الجمل الانتقالية عبر المقالات — نوّع دائمًا.
- ممنوع حشو "في المنام" أو "يدل على" أو "قد يشير إلى" في كل سطر.
- لا تضع الحالة الاجتماعية في العنوان إذا لم تُذكر في الحلم أو السياق.
- ممنوع إنتاج مقال أقل من 900 كلمة. إذا لم تستطع الوصول لـ 900 كلمة = Archive.

═══════════════════════════════════
██ قواعد إلصاق التفسير بالحلم (GROUNDING RULES) ██
═══════════════════════════════════
1) قبل الكتابة، استخرج داخلياً "حقائق الحلم" من النص:
   - الرموز (Symbols)
   - الأفعال (Actions)
   - الأشخاص (People)
   - الأماكن (Places)
   - المشاعر (Emotions)
   - النتيجة/الخاتمة (Outcome)

2) ممنوع إدخال أي رمز أو حدث أو شخص غير موجود في الحلم أو غير مستنتج مباشرة منه.
   مثال: إذا لم يذكر الحلم "شجرة زيتون" ممنوع إضافتها.

3) كل قسم من أقسام المقال يجب أن يحتوي على الأقل على:
   - ذكر تفصيل واحد من الحلم (رمز/فعل/شخص/مكان/نتيجة/شعور)
   - ثم تفسير شرطي مرتبط به بصيغة: (إذا/عندما/في حال/أما إذا…)

4) ممنوع الجمل العامة مثل:
   "تغييرات إيجابية" / "أمل" / "خير كثير" / "مرحلة جديدة"
   إلا إذا تبعتها مباشرة بسبب محدد من الحلم نفسه.

5) إذا كان الحلم قليل التفاصيل:
   - لا تملأ الصفحة بكلام عام.
   - بدلاً من ذلك، ضمن الأقسام أضف فقرات/نقاط بعنوان:
     "تفاصيل تغيّر المعنى" (نوع الرمز/النتيجة/الشعور/من أعطى/من أخذ/هل ضاع…)
   - اجعلها مفيدة ومرتبطة بالرمز الرئيسي.

6) قاعدة نقص التفاصيل (ANTI-FILLER):
   - إذا كان نص الحلم لا يوفر تفاصيل كافية لبناء 1100 كلمة دون عموميات:
     لا تملأ المقال بكلام عام.
     بدلاً من ذلك:
     (أ) وسّع قسم "التفسير حسب تفاصيل الحلم" عبر سيناريوهات شرطية واقعية مرتبطة بالرمز الرئيسي فقط:
         - إذا كان الرمز جديداً/مكسوراً/ضائعاً/هدية/شراء… (اختر فقط ما يمكن أن ينطبق من سياق الحلم)
     (ب) أضف داخل "ماذا تفعل بعد هذا الحلم؟" نقطة بعنوان: "أسئلة تغيّر التفسير" (3–5 أسئلة قصيرة).
     (ج) اجعل FAQ تتضمن 1–2 سؤال من نوع "ماذا يعني إذا…" مرتبط بتفاصيل محتملة (بدون ادعاء أنها حدثت).

═══════════════════════════════════
██ قواعد الهيكل الإلزامية ██
═══════════════════════════════════
- الحد الأدنى للمحتوى النهائي: 900 كلمة (كل النصوص مجتمعة).
- FAQ: بين 5 و7 أسئلة (إلزامي). كل جواب 2–4 أسطر.
- sections: على الأقل 7 أقسام (إلزامي).
- 4 subsections على الأقل في قسم "التفسير حسب تفاصيل الحلم".
- يجب أن توجد الأقسام التالية حرفياً:
  1. معنى الحلم بشكل عام
  2. التفسير حسب تفاصيل الحلم (مع subsections)
  3. التفسير حسب الحالة الاجتماعية
  4. الدلالة النفسية للحلم
  5. متى يكون الحلم بشارة؟
  6. متى يكون الحلم تنبيهًا؟
  7. ماذا تفعل بعد هذا الحلم؟

═══════════════════════════════════
██ قواعد طول المحتوى ██
═══════════════════════════════════
- content في كل قسم (ما عدا أقسام bullets): >= 90 كلمة.
- كل subsection.content >= 70 كلمة.
- dream_text: بين 90 و160 كلمة.
- seoIntro: بين 45 و70 كلمة بدون سرد الحلم.
- snippetSummary: >= 35 كلمة (2–3 أسطر مباشرة).
- كل bullet في أقسام (بشارة/تنبيه/ماذا تفعل): جملة كاملة واضحة.

═══════════════════════════════════
██ قواعد الجودة والتنويع ██
═══════════════════════════════════
- ركّز على "رمز رئيسي واحد" + 2–4 رموز ثانوية فقط، وكلها من الحلم.
- اجعل التفسير مشروطًا بتفاصيل الحلم: (القبول/الرفض/الخوف/الشخص/المكان/النتيجة).
- لا تكرر نفس المعنى بصيغ مختلفة عبر الأقسام.
- لا تستخدم "قد يشير إلى" إلا نادراً ومع سبب واضح من الحلم.
- إذا ذكرت معنى ديني/تراثي: اجعله عاماً (ورد في كتب التأويل…) بدون اقتباسات مختلقة.

═══════════════════════════════════
██ المدخلات ██
═══════════════════════════════════
- نص الحلم الخام (منظف من المعلومات الحساسة)
- الحالة الاجتماعية (إن توفرت)
- المشاعر (إن توفرت)
- هل الحلم متكرر أم لا

═══════════════════════════════════
██ المخرجات (JSON فقط) ██
═══════════════════════════════════

{
  "decision": "Publish" | "Archive",
  "reason": "سبب مختصر إن كان Archive أو ملاحظة جودة",
  "article_data": {
    "metaTitle": "عنوان جوجل <= 58 حرف، يتضمن الرمز الرئيسي بدون تكرار (تفسير حلم…)",
    "metaDescription": "وصف <= 155 حرف يشرح المعنى + عامل يغيّر التفسير من تفاصيل الحلم",
    "h1": "عنوان الصفحة واضح ومباشر",
    "primarySymbol": "الرمز الرئيسي المستخرج من الحلم",
    "secondarySymbols": ["رمز ثانوي 1 من الحلم", "رمز ثانوي 2 من الحلم"],
    "snippetSummary": "2–3 أسطر مباشرة: المعنى العام + هل بشارة/تنبيه + العامل الذي يغيّر المعنى (من الحلم)",
    "seoIntro": "مقدمة 45–70 كلمة عن الرمز الرئيسي (بدون سرد الحلم)",
    "dream_text": "إعادة صياغة الحلم قصصياً بضمير الغائب (90–160 كلمة) بدون إضافة أحداث جديدة",
    "sections": [
      {
        "heading": "معنى الحلم بشكل عام",
        "content": ">= 90 كلمة مرتبطة بالرمز الرئيسي مع ذكر تفصيل من الحلم"
      },
      {
        "heading": "التفسير حسب تفاصيل الحلم",
        "subsections": [
          { "heading": "تفصيل 1 موجود فعلاً في الحلم", "content": ">= 70 كلمة بشرطية واضحة (إذا/أما إذا…)" },
          { "heading": "تفصيل 2 موجود فعلاً في الحلم", "content": ">= 70 كلمة بشرطية واضحة" },
          { "heading": "تفصيل 3 موجود فعلاً في الحلم", "content": ">= 70 كلمة بشرطية واضحة" },
          { "heading": "تفصيل 4 موجود فعلاً في الحلم", "content": ">= 70 كلمة بشرطية واضحة" }
        ]
      },
      {
        "heading": "التفسير حسب الحالة الاجتماعية",
        "content": ">= 90 كلمة. إذا لم تُذكر الحالة قدم تفسيرًا عامًا بلا افتراضات ولا اختلاق."
      },
      {
        "heading": "الدلالة النفسية للحلم",
        "content": ">= 90 كلمة مرتبطة بمشاعر الحلم المذكورة (خوف/فرح/قلق…) مع مثال صغير."
      },
      {
        "heading": "متى يكون الحلم بشارة؟",
        "bullets": ["جملة كاملة مرتبطة بتفصيل من الحلم", "جملة كاملة مرتبطة بتفصيل من الحلم", "جملة كاملة مرتبطة بتفصيل من الحلم"]
      },
      {
        "heading": "متى يكون الحلم تنبيهًا؟",
        "bullets": ["جملة كاملة مرتبطة بتفصيل من الحلم", "جملة كاملة مرتبطة بتفصيل من الحلم", "جملة كاملة مرتبطة بتفصيل من الحلم"]
      },
      {
        "heading": "ماذا تفعل بعد هذا الحلم؟",
        "bullets": ["نصيحة عملية واقعية", "نصيحة عملية واقعية", "نصيحة عملية واقعية"]
      }
    ],
    "faqs": [
      { "question": "سؤال شائع مرتبط مباشرة بتفاصيل الحلم", "answer": "جواب 2–4 أسطر بدون عموميات" },
      { "question": "سؤال 2", "answer": "جواب 2–4 أسطر" },
      { "question": "سؤال 3", "answer": "جواب 2–4 أسطر" },
      { "question": "سؤال 4", "answer": "جواب 2–4 أسطر" },
      { "question": "سؤال 5", "answer": "جواب 2–4 أسطر" }
    ],
    "internalLinkAnchors": ["تفسير حلم ...", "تفسير حلم ..."],
    "keywords": ["كلمة رئيسية", "تنويعات طبيعية 5–10"],
    "safetyNote": "تنبيه: تفسير الأحلام اجتهاد ورمزي ولا يُبنى عليه قرار مصيري."
  }
}

═══════════════════════════════════
██ معيار القرار ██
═══════════════════════════════════
- Publish: إذا كان الحلم مفهومًا ويوجد رمز رئيسي واضح ويمكن إنتاج مقال >= 900 كلمة دون اختلاق تفاصيل.
- Archive: إذا كان النص فارغًا/غير مفهوم/سبام/قصير جدًا (< 15 كلمة)/حروف فقط/لا يمكن إنتاج محتوى كافٍ دون عموميات.

═══════════════════════════════════
██ تحقق ذاتي قبل الإخراج ██
═══════════════════════════════════
□ metaTitle <= 58 حرف
□ metaDescription <= 155 حرف
□ dream_text بين 90 و160 كلمة
□ لا تكرار "تفسير حلم" في metaTitle
□ لا اختلاق رموز/أحداث غير موجودة
□ FAQ بين 5 و7
□ sections >= 7
□ subsections >= 4
□ كل قسم محتواه >= 90 كلمة (إلا bullets)
□ المقال الكلي >= 900 كلمة
□ كل قسم يحتوي تفصيلاً من الحلم + تفسير شرطي .
`;

            // ── Fix & Expand retry prompt (used on retry attempts) ──
            const fixAndExpandPrompt = `
الناتج السابق غير مطابق لمعايير الجودة أو كان عامًا/غير ملتصق بتفاصيل الحلم.
أعد إنتاج JSON بنفس الهيكل، لكن أصلح التالي إلزامياً:
- اجعل إجمالي المقال >= 1100 كلمة.
- اربط كل قسم بتفصيل واحد على الأقل من نص الحلم (رمز/فعل/شخص/نتيجة/شعور).
- احذف أي جملة عامة لا تحتوي سببًا محددًا من الحلم.
- ممنوع إضافة رموز أو أحداث غير موجودة في الحلم.
- كل section.content >= 90 كلمة (إلا bullets).
- كل subsection.content >= 70 كلمة.
- FAQ = 6 أسئلة مرتبطة مباشرة بالحلم.
- snippetSummary >= 35 كلمة.
أخرج JSON فقط.
`;

            const userMessage = `
نص الحلم: ${dream.content}

الحالة الاجتماعية (إن وُجدت): ${dream.socialStatus || "غير محدد"}
المشاعر الظاهرة: ${dream.mood || "غير مذكور"}

ملاحظات/سياق إضافي (اختياري): ${dream.isRecurring ? 'الحلم متكرر' : 'لا يوجد'}
`;

            const MAX_RETRIES = 2;
            let lastArticle: any = null;
            let lastResult: any = null;
            let lastValidation: { valid: boolean; failures: string[] } = { valid: false, failures: ['initial'] };
            let qualityScore = 0;
            let attempt = 0;

            try {
                for (attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
                    const isRetry = attempt > 1;

                    // Build messages array: on retry, include the previous AI output + fix prompt
                    const messages: Array<{ role: string; content: string }> = [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ];

                    if (isRetry && lastResult) {
                        // Add previous AI response + fix instructions
                        messages.push({
                            role: "assistant",
                            content: JSON.stringify(lastResult)
                        });
                        messages.push({
                            role: "user",
                            content: fixAndExpandPrompt + `\n\nالمشاكل المحددة: ${lastValidation.failures.join(' | ')}`
                        });
                        console.log(`[Publish] Retry #${attempt - 1}: sending Fix & Expand. Failures: ${lastValidation.failures.join(', ')}`);
                    }

                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                            "X-Title": "Almofasser Publisher",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "openai/gpt-4o-mini",
                            messages,
                            response_format: { type: "json_object" }
                        })
                    });

                    if (!response.ok) {
                        console.error(`[Publish] AI API error (attempt ${attempt}): ${response.status} ${response.statusText}`);
                        continue; // Try next attempt
                    }

                    const data = await response.json();
                    const aiContent = data.choices?.[0]?.message?.content;

                    if (!aiContent) {
                        console.error(`[Publish] Empty AI response (attempt ${attempt})`);
                        continue;
                    }

                    // ── Parse JSON safely ──
                    let result: any;
                    try {
                        result = JSON.parse(aiContent);
                    } catch (parseError) {
                        console.error(`[Publish] JSON parse failed (attempt ${attempt}):`, parseError);
                        continue;
                    }

                    // ── Archive decision = stop immediately ──
                    if (result.decision === 'Archive') {
                        dream.visibilityStatus = 'rejected';
                        dream.publicVersion = {
                            rejectionReason: result.reason || 'AI decided to archive'
                        };
                        await dream.save();
                        return NextResponse.json({ success: false, reason: 'archived', details: result.reason });
                    }

                    // ── Publish decision: validate structure ──
                    if (result.decision === 'Publish' && result.article_data) {
                        lastResult = result;
                        lastArticle = result.article_data;
                        qualityScore = calculateQualityScore(lastArticle);
                        lastValidation = validateArticleStructure(lastArticle);

                        const totalWords = countArticleWords(lastArticle);
                        console.log(`[Publish] Attempt ${attempt}: qualityScore=${qualityScore}, totalWords=${totalWords}, valid=${lastValidation.valid}, failures=${lastValidation.failures.length}`);

                        // ── Quality Gate: pass if valid AND score >= 80 ──
                        if (lastValidation.valid && qualityScore >= 80) {
                            console.log(`[Publish] ✅ Passed quality gate on attempt ${attempt}`);
                            break; // Exit retry loop — article is good
                        }

                        // ── Failed quality gate ──
                        if (attempt <= MAX_RETRIES) {
                            console.log(`[Publish] ⚠️ Failed quality gate (attempt ${attempt}/${MAX_RETRIES + 1}). Retrying...`);
                            // Let the loop continue to retry
                        } else {
                            console.log(`[Publish] ⚠️ Max retries exhausted. Publishing best available result.`);
                        }
                    } else {
                        // Unexpected response format
                        console.error(`[Publish] Unexpected AI response format (attempt ${attempt}):`, result?.decision);
                        lastResult = result;
                    }
                }

                // ── If we have a valid article (even with lower quality), publish it ──
                if (lastArticle && lastResult?.decision === 'Publish') {
                    const article = lastArticle;
                    const calculatedQualityScore = qualityScore;

                    // Format internal interpretation for fallback/legacy views
                    const legacySymbolsList = article.secondarySymbols && Array.isArray(article.secondarySymbols)
                        ? article.secondarySymbols.map((s: string) => `- ${s}`).join('\n')
                        : '';

                    const formattedLegacyInterpretation = `
**الخلاصة:**
${article.snippetSummary}

**معنى الحلم:**
${article.sections && article.sections[0] ? article.sections[0].content : ''}

**الرموز:**
- ${article.primarySymbol}
${legacySymbolsList}
                    `.trim();

                    dream.publicVersion = {
                        // Also update top-level publicVersion fields for easier access/fallback
                        title: article.h1 || article.metaTitle || dream.title, // H1 is priority for display title
                        content: article.dream_text,
                        seoIntro: article.seoIntro,
                        // Store the new comprehensive structure
                        comprehensiveInterpretation: {
                            primarySymbol: article.primarySymbol,
                            secondarySymbols: article.secondarySymbols,
                            snippetSummary: article.snippetSummary,
                            metaTitle: article.metaTitle,
                            metaDescription: article.metaDescription,
                            sections: article.sections,
                            internalLinkAnchors: article.internalLinkAnchors,
                            safetyNote: article.safetyNote
                        },
                        // Keep legacy fields for backward compat
                        interpretation: formattedLegacyInterpretation,
                        faqs: article.faqs,
                        isAnonymous: true,
                        publishedAt: new Date(),
                        qualityScore: calculatedQualityScore
                    };
                    dream.isPublic = true;
                    dream.visibilityStatus = 'public';
                    if (article.keywords) dream.tags = article.keywords;

                    // ── Generate SEO slug for NEW article ──
                    if (!dream.seoSlug) {
                        const dreamId = dream._id.toString();
                        const slugTitle = article.metaTitle || article.title || dream.content?.slice(0, 100) || '';
                        dream.seoSlug = await generateUniqueSlug(slugTitle, dream.tags, dreamId);
                        console.log(`[Publish] Generated seoSlug: "${dream.seoSlug}" for dream ${dreamId}`);
                    }

                    await dream.save();

                    return NextResponse.json({
                        success: true,
                        message: `Dream published (attempt ${attempt <= MAX_RETRIES + 1 ? attempt : MAX_RETRIES + 1}, score: ${calculatedQualityScore})`,
                        slug: dream.seoSlug,
                        qualityScore: calculatedQualityScore,
                        validationPassed: lastValidation.valid,
                        totalWords: countArticleWords(article)
                    });
                }
            } catch (error) {
                console.error('AI Publishing analysis failed:', error);
                // Continue to fallback
            }
        }

        // Fallback or No API Key (Dev Mode)
        console.warn('AI analysis skipped or failed. Publishing raw (Dev Mode).');

        dream.publicVersion = {
            title: dream.title || 'حلم مفسر',
            content: dream.content,
            interpretation: dream.interpretation?.summary || 'تفسير عام',
            isAnonymous: true,
            publishedAt: new Date(),
            qualityScore: 60 // Base score for fallback
        };
        dream.isPublic = true;
        dream.visibilityStatus = 'public';

        // ── Generate SEO slug for fallback publish too ──
        if (!dream.seoSlug) {
            const dreamId = dream._id.toString();
            const slugTitle = dream.title || dream.content?.slice(0, 100) || '';
            dream.seoSlug = await generateUniqueSlug(slugTitle, dream.tags || [], dreamId);
            console.log(`[Publish/Fallback] Generated seoSlug: "${dream.seoSlug}" for dream ${dreamId}`);
        }

        await dream.save();

        return NextResponse.json({ success: true, message: 'Dream published (fallback)', slug: dream.seoSlug });

    } catch (error) {
        console.error('Error publishing dream:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
