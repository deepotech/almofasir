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
 */
function calculateQualityScore(article: any): number {
    let score = 70; // Base score

    // 1. Snippet Summary Length (ideal: 100-300 chars)
    if (article.snippetSummary && article.snippetSummary.length >= 100 && article.snippetSummary.length <= 350) {
        score += 5;
    }

    // 2. Number of FAQs (ideal: 5-7)
    if (article.faqs && Array.isArray(article.faqs)) {
        if (article.faqs.length >= 5) score += 5;
        if (article.faqs.length >= 6) score += 2; // Bonus for 6+
    }

    // 3. Meta Title Length (ideal: <= 60 chars)
    if (article.metaTitle && article.metaTitle.length <= 60) {
        score += 3;
    }

    // 4. Meta Description Length (ideal: 120-160 chars)
    if (article.metaDescription && article.metaDescription.length >= 100 && article.metaDescription.length <= 160) {
        score += 3;
    }

    // 5. Structure Presence
    if (article.sections && article.sections.length >= 3) score += 5;
    if (article.internalLinkAnchors && article.internalLinkAnchors.length >= 2) score += 2;
    if (article.primarySymbol) score += 5;

    // Cap at 100
    return Math.min(score, 100);
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

        // --- PHASE 2 & 4: AI Analysis, Quality Check, & Enhancement ---
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

        if (OPENROUTER_API_KEY) {
            const systemPrompt = `
أنت خبير تفسير أحلام ومحرر SEO عربي محترف لموقع "المفسر".
مهمتك: تحويل "نص الحلم" + "سياق الرائي" إلى مقال SEO مفيد وطبيعي، بدون بصمة AI واضحة.

ممنوعات صارمة:
- ممنوع عناوين طويلة أو محشوة أو تكرار كلمات.
- ممنوع اختلاق اقتباسات من ابن سيرين/النابلسي أو نسب كلام حرفي لهم.
- ممنوع تكرار قوالب ثابتة (نفس افتتاحية/نفس جمل) عبر المقالات.
- ممنوع حشو "في المنام" أو "يدل على" في كل سطر.

قواعد الجودة:
- ركّز على "رمز رئيسي واحد" + 2–4 رموز ثانوية فقط.
- اكتب فقرات قصيرة + نقاط bullets.
- ابدأ بخلاصة سريعة قابلة للظهور كـ Featured Snippet.
- اجعل التفسير مشروطًا بتفاصيل الحلم (القبول/الرفض/الخوف/الشخص/المكان/النتيجة).

المدخلات التي ستصلك:
- نص الحلم الخام (قد يحتوي معلومات حساسة تم تنظيفها مسبقًا)
- الحالة الاجتماعية (إن ذُكرت): عزباء/متزوجة/حامل/مطلقة/رجل/غير محدد
- مشاعر الرائي إن توفرت (خوف/فرح/قلق…)

المخرجات المطلوبة (JSON فقط، بنفس الهيكل حرفيًا):

{
  "decision": "Publish" | "Archive",
  "reason": "سبب مختصر إن كان Archive أو ملاحظة جودة",
  "article_data": {
    "primarySymbol": "الرمز الرئيسي المستخرج",
    "secondarySymbols": ["...", "..."],
    "metaTitle": "عنوان جوجل <= 58 حرف، يتضمن الرمز الرئيسي والحالة إن وجدت",
    "metaDescription": "وصف <= 155 حرف يشرح المعنى + عامل يغيّر التفسير",
    "h1": "عنوان الصفحة واضح ومباشر",
    "seoIntro": "مقدمة قصيرة 45–70 كلمة بدون سرد الحلم",
    "snippetSummary": "2–3 أسطر مباشرة: هل بشارة/تنبيه + ما الذي يغيّر المعنى",
    "dream_text": "إعادة صياغة الحلم بأسلوب قصصي مختصر بضمير الغائب، 90–160 كلمة",
    "sections": [
      {
        "heading": "معنى الحلم بشكل عام",
        "content": "شرح عام مركز دون حشو"
      },
      {
        "heading": "التفسير حسب تفاصيل الحلم",
        "subsections": [
          { "heading": "إذا كان الشعور خوفًا/قلقًا", "content": "..." },
          { "heading": "إذا حدث قبول/نجاح/تيسير", "content": "..." },
          { "heading": "إذا حدث رفض/تعطّل/عراقيل", "content": "..." },
          { "heading": "وجود شخص/مكان واضح في الحلم", "content": "..." }
        ]
      },
      {
        "heading": "التفسير حسب الحالة الاجتماعية",
        "content": "فقرة قصيرة مخصصة للحالة المذكورة، وإن لم تُذكر قدم تفسيرًا عامًا بلا افتراضات."
      },
      {
        "heading": "الدلالة النفسية للحلم",
        "content": "تحليل نفسي مرتبط بمشاعر الحلم: ضغط/طموح/ذنب/حاجة للأمان…"
      },
      {
        "heading": "متى يكون الحلم بشارة؟",
        "bullets": ["...", "...", "..."]
      },
      {
        "heading": "متى يكون الحلم تنبيهًا؟",
        "bullets": ["...", "...", "..."]
      },
      {
        "heading": "ماذا تفعل بعد هذا الحلم؟",
        "bullets": ["نصيحة عملية 1", "نصيحة 2", "نصيحة 3"]
      }
    ],
    "faqs": [
      { "question": "سؤال شائع مرتبط بالحلم", "answer": "جواب 2–4 أسطر" }
    ],
    "internalLinkAnchors": [
      "تفسير حلم ...",
      "تفسير حلم ..."
    ],
    "keywords": ["كلمة رئيسية", "تنويعات طبيعية 5–10"],
    "safetyNote": "تنبيه قصير: التفسير اجتهاد ورمزي ولا يبنى عليه قرار مصيري."
  }
}

معيار القرار:
- Publish إذا كان الحلم مفهومًا ويوجد رمز رئيسي واضح ويمكن إنتاج مقال مفيد.
- Archive إذا كان النص فارغًا/غير مفهوم/سبام/قصير جدًا (< 15 كلمة) أو يحتوي فقط على حروف.

تحقق قبل الإخراج:
- metaTitle <= 58 حرف
- metaDescription <= 155 حرف
- لا تكرار "تفسير حلم" في العنوان
- لا اختلاق مصادر
- أسئلة FAQ بين 5 و7 (يفضل 6)
- النص طبيعي ومتنوّع
`;

            try {
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
                        messages: [
                            { role: "system", content: systemPrompt },
                            {
                                role: "user",
                                content: `
نص الحلم: ${dream.content}

الحالة الاجتماعية (إن وُجدت): ${dream.socialStatus || "غير محدد"}
المشاعر الظاهرة: ${dream.mood || "غير مذكور"}

ملاحظات/سياق إضافي (اختياري): ${dream.isRecurring ? 'الحلم متكرر' : 'لا يوجد'}
`
                            }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiContent = data.choices[0]?.message?.content;
                    if (aiContent) {
                        const result = JSON.parse(aiContent);

                        if (result.decision === 'Archive') {
                            dream.visibilityStatus = 'rejected';
                            dream.publicVersion = {
                                rejectionReason: result.reason || 'AI decided to archive'
                            };
                            await dream.save();
                            return NextResponse.json({ success: false, reason: 'archived', details: result.reason });
                        }

                        if (result.decision === 'Publish') {
                            const article = result.article_data;
                            const calculatedQualityScore = calculateQualityScore(article);

                            // Format internal interpretation for fallback/legacy views if needed
                            // But primarily we will use the structured data
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
                                title: article.h1 || article.metaTitle || dream.title,
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
                                // Keep legacy fields for backward compat or just in case
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
                            // Only generate if dream doesn't already have a seoSlug
                            if (!dream.seoSlug) {
                                const dreamId = dream._id.toString();
                                const slugTitle = article.metaTitle || article.title || dream.content?.slice(0, 100) || '';
                                dream.seoSlug = await generateUniqueSlug(slugTitle, dream.tags, dreamId);
                                console.log(`[Publish] Generated seoSlug: "${dream.seoSlug}" for dream ${dreamId}`);
                            }

                            await dream.save();
                            return NextResponse.json({ success: true, message: 'Dream published successfully with enhanced content', slug: dream.seoSlug });
                        }
                    }
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
