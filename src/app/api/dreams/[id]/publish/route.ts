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
أنت خبير في تفسير الأحلام (مستند إلى ابن سيرين والنابلسي) ومحرر محتوى SEO محترف.
مهمتك: تحويل تفسير الحلم الخام إلى "مقال شامل" عالي الجودة لمحركات البحث ومفيد للقارئ.

🚫 القواعد الصارمة:
1. التزم بهيكل JSON المطلوب حرفياً.
2. استخدم لغة عربية فصيحة، سلسة، وغير آلية (تجنب التكرار الممل).
3. "Anti-Pattern": لا تجعل كل المقالات تبدو بنفس الصيغة الجامدة. نوّع في العبارات.

📋 هيكل المحتوى المطلوب (The Template):

1️⃣ العنوان (title):
"تفسير حلم [الرمز الرئيسي] في المنام ورؤية [رمز آخر] للمتزوجة والعزباء" (اجعله جذاباً وشاملاً).

2️⃣ مقدمة السيو (seoIntro):
فقرة سياقية (40-60 كلمة) تكتب قبل سرد الحلم.
- ادخل في الموضوع مباشرة: "تعد رؤية... من الرؤى التي..."
- اذكر أهمية الرمز وعلاقته بالواقع الاجتماعي والنفسي.
- لا تذكر "رأى الحالم كذا" هنا، بل تحدث عن الرمز بشكل عام.

3️⃣ نص الحلم (dream_text):
أعد صياغة الحلم بأسلوب سردي قصصي مشوق ومنقح من الأخطاء، بضمير الغائب ("رأت، ذهبت...").

4️⃣ التفسير المهيكل (Structured Interpretation):
- **الخلاصة (summary)**: سطرين يعطيان المعنى العام المباشر.
- **تفكيك الرموز (symbols)**: مصفوفة تشرح كل رمز على حدة (الرمز ومعناه).
- **تنويع الحالات (variations)**: كيف يختلف التفسير للعزباء، المتزوجة، الحامل، الرجل (بناءً على سياق الحلم أو بشكل عام للرمز).
- **الجانب النفسي (psychological)**: تحليل نفسي للمشاعر والدوافع.
- **خاتمة (conclusion)**: نصيحة أو توجيه ختامي قصير.

5️⃣ الأسئلة الشائعة (FAQ):
3-4 أسئلة يبحث عنها الناس حول هذا الرمز مع إجابات دقيقة.

🔹 المخرجات المطلوبة (JSON حصراً):
{
  "decision": "Publish" | "Archive",
  "reason": "...",
  "article_data": {
    "title": "...",
    "seoIntro": "تعتبر رؤية ... من الرموز التي تشير إلى ...",
    "dream_text": "...",
    "interpretation": {
      "summary": "...",
      "symbols": [
          {"name": "...", "meaning": "..."}
      ],
      "variations": [
          {"status": "للعزباء", "meaning": "..."},
          {"status": "للمتزوجة", "meaning": "..."}
      ],
      "psychological": "...",
      "conclusion": "..."
    },
    "faqs": [
       {"question": "...", "answer": "..."}
    ],
    "keywords": ["..."]
  }
}
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
                            { role: "user", content: `نص الحلم: ${dream.content}\n\nالتفسير الأولي: ${dream.interpretation?.summary || ''}\n\nسياق الرائي: ${dream.socialStatus || 'غير محدد'}` }
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

                            const symbolsList = article.interpretation.symbols
                                .map((s: any) => `- **${s.name}:** ${s.meaning}`)
                                .join('\n');

                            const formattedInterpretation = `
**الخلاصة:**
${article.interpretation.summary}

**تفكيك الرموز:**
${symbolsList}

**الدلالة النفسية:**
${article.interpretation.psychological}

**همسة ختامية:**
${article.interpretation.conclusion}
                            `.trim();

                            dream.publicVersion = {
                                title: article.title || dream.title,
                                content: article.dream_text,
                                seoIntro: article.seoIntro,
                                interpretation: formattedInterpretation,
                                structuredInterpretation: {
                                    summary: article.interpretation.summary,
                                    symbols: article.interpretation.symbols,
                                    variations: article.interpretation.variations,
                                    psychological: article.interpretation.psychological,
                                    conclusion: article.interpretation.conclusion
                                },
                                faqs: article.faqs,
                                isAnonymous: true,
                                publishedAt: new Date(),
                                qualityScore: 92
                            };
                            dream.isPublic = true;
                            dream.visibilityStatus = 'public';
                            if (article.keywords) dream.tags = article.keywords;

                            // ── Generate SEO slug for NEW article ──
                            // Only generate if dream doesn't already have a seoSlug
                            if (!dream.seoSlug) {
                                const dreamId = dream._id.toString();
                                const slugTitle = article.title || dream.title || dream.content?.slice(0, 100) || '';
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
            publishedAt: new Date()
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
