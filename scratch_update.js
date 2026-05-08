const fs = require('fs');

let content = fs.readFileSync('src/app/api/dreams/[id]/publish/route.ts', 'utf8');

// 1. Imports
content = content.replace(
    /import dbConnect from '@\/lib\/mongodb';\s*import Dream from '@\/models\/Dream';\s*import DreamRequest from '@\/models\/DreamRequest';/,
    `import { supabaseAdmin } from '@/lib/supabase';`
);

// 2. generateUniqueSlug existing check
content = content.replace(
    /const existing = await Dream\.findOne\(\{ seoSlug: candidateSlug \}\)\.select\('_id'\)\.lean\(\);\s*if \(!existing \|\| existing\._id\.toString\(\) === dreamId\) \{/g,
    `const { data: existing } = await supabaseAdmin.from('dreams').select('id').eq('seo_slug', candidateSlug).single();
        if (!existing || existing.id === dreamId) {`
);

// 3. POST DB Connect & Fetch
content = content.replace(
    /await dbConnect\(\);\n\n        \/\/ 1\. Authenticate/,
    `// 1. Authenticate`
);

content = content.replace(
    /let dream = await Dream\.findById\(id\);\s*let fromRequest = false;\s*\/\/ If not found in Dream collection, look in DreamRequest \(New Flow\)\s*if \(!dream\) \{\s*const dreamRequest = await DreamRequest\.findById\(id\);\s*if \(dreamRequest\) \{\s*fromRequest = true;\s*if \(dreamRequest\.userId\) \{\s*if \(!userId \|\| dreamRequest\.userId !== userId\) \{\s*return NextResponse\.json\(\{ error: 'Unauthorized: You do not own this dream request' \}, \{ status: 401 \}\);\s*\}\s*\}\s*dream = new Dream\(\{\s*userId: dreamRequest\.userId,\s*content: dreamRequest\.dreamText,\s*mood: dreamRequest\.context\?\.dominantFeeling \|\| 'neutral',\s*socialStatus: dreamRequest\.context\?\.socialStatus,\s*gender: dreamRequest\.context\?\.gender,\s*isRecurring: dreamRequest\.context\?\.isRecurring \|\| false,\s*interpretation: \{\s*summary: dreamRequest\.interpretationText \|\| 'تفسير آلي',\s*aiGenerated: dreamRequest\.type === 'AI',\s*isPremium: false\s*\},\s*status: 'completed',\s*createdAt: dreamRequest\.createdAt\s*\}\);\s*\}\s*\}/,
    `let { data: dream } = await supabaseAdmin.from('dreams').select('*').eq('id', id).single();
        let fromRequest = false;

        if (!dream) {
            const { data: dreamRequest } = await supabaseAdmin.from('dream_requests').select('*').eq('id', id).single();
            if (dreamRequest) {
                fromRequest = true;
                if (dreamRequest.user_id) {
                    if (!userId || dreamRequest.user_id !== userId) {
                        return NextResponse.json({ error: 'Unauthorized: You do not own this dream request' }, { status: 401 });
                    }
                }

                dream = {
                    id: dreamRequest.id,
                    user_id: dreamRequest.user_id,
                    content: dreamRequest.dream_text,
                    mood: dreamRequest.context?.dominantFeeling || 'neutral',
                    social_status: dreamRequest.context?.socialStatus,
                    gender: dreamRequest.context?.gender,
                    is_recurring: dreamRequest.context?.isRecurring || false,
                    interpretation: {
                        summary: dreamRequest.interpretation_text || 'تفسير آلي',
                        aiGenerated: dreamRequest.type === 'AI',
                        isPremium: false
                    },
                    status: 'completed',
                    created_at: dreamRequest.created_at
                };
            }
        }`
);

// 4. Check user ownership
content = content.replace(
    /if \(\!fromRequest && dream\.userId\) \{\s*if \(\!userId \|\| dream\.userId !== userId\) \{/g,
    `if (!fromRequest && dream.user_id) {
            if (!userId || dream.user_id !== userId) {`
);

// 5. Check isPublic
content = content.replace(
    /if \(dream\.isPublic\) \{/g,
    `if (dream.is_public) {`
);

// 6. Word count
content = content.replace(
    /const wordCount = dream\.content\.trim\(\)\.split\(\/\\s\+\/\)\.length;/,
    `const wordCount = dream.content.trim().split(/\\s+/).length;`
);

// 7. Save on rejection
content = content.replace(
    /dream\.visibilityStatus = 'rejected';\s*dream\.publicVersion = \{\s*rejectionReason: 'Too short'\s*\};\s*await dream\.save\(\);/g,
    `dream.visibility_status = 'rejected';
            dream.public_version = { rejectionReason: 'Too short' };
            await supabaseAdmin.from('dreams').upsert({
                id: dream.id,
                visibility_status: dream.visibility_status,
                public_version: dream.public_version
            });`
);

// 8. Save on AI Archive decision
content = content.replace(
    /dream\.visibilityStatus = 'rejected';\s*dream\.publicVersion = \{\s*rejectionReason: result\.reason \|\| 'AI decided to archive'\s*\};\s*await dream\.save\(\);/g,
    `dream.visibility_status = 'rejected';
                        dream.public_version = {
                            rejectionReason: result.reason || 'AI decided to archive'
                        };
                        await supabaseAdmin.from('dreams').upsert({
                            id: dream.id,
                            visibility_status: dream.visibility_status,
                            public_version: dream.public_version
                        });`
);

// 9. Format AI result for save
content = content.replace(
    /dream\.publicVersion = \{\s*\/\/ Also update top-level publicVersion fields for easier access\/fallback\s*title: article\.h1 \|\| article\.metaTitle \|\| dream\.title,\s*content: article\.dream_text,\s*seoIntro: article\.seoIntro,/g,
    `dream.public_version = {
                        title: article.h1 || article.metaTitle || dream.title,
                        content: article.dream_text,
                        seoIntro: article.seoIntro,`
);

content = content.replace(
    /faqs: article\.faqs,\s*isAnonymous: true,\s*publishedAt: new Date\(\),\s*qualityScore: calculatedQualityScore\s*\};\s*dream\.isPublic = true;\s*dream\.visibilityStatus = 'public';\s*if \(article\.keywords\) dream\.tags = article\.keywords;/g,
    `faqs: article.faqs,
                        isAnonymous: true,
                        publishedAt: new Date().toISOString(),
                        qualityScore: calculatedQualityScore
                    };
                    dream.is_public = true;
                    dream.visibility_status = 'public';
                    if (article.keywords) dream.tags = article.keywords;`
);

content = content.replace(
    /if \(\!dream\.seoSlug\) \{\s*const dreamId = dream\._id\.toString\(\);\s*const slugTitle = article\.metaTitle \|\| article\.title \|\| dream\.content\?\.slice\(0, 100\) \|\| '';\s*dream\.seoSlug = await generateUniqueSlug\(slugTitle, dream\.tags, dreamId\);\s*console\.log\(`\[Publish\] Generated seoSlug: "\$\{dream\.seoSlug\}" for dream \$\{dreamId\}`\);\s*\}\s*await dream\.save\(\);/g,
    `if (!dream.seo_slug) {
                        const dreamId = dream.id;
                        const slugTitle = article.metaTitle || article.title || dream.content?.slice(0, 100) || '';
                        dream.seo_slug = await generateUniqueSlug(slugTitle, dream.tags, dreamId);
                        console.log(\`[Publish] Generated seoSlug: "\${dream.seo_slug}" for dream \${dreamId}\`);
                    }

                    await supabaseAdmin.from('dreams').upsert({
                        ...dream,
                        updated_at: new Date().toISOString()
                    }).eq('id', dream.id);`
);

content = content.replace(
    /slug: dream\.seoSlug,/g,
    `slug: dream.seo_slug,`
);

// 10. Fallback publish save
content = content.replace(
    /dream\.publicVersion = \{\s*title: dream\.title \|\| 'حلم مفسر',\s*content: dream\.content,\s*interpretation: dream\.interpretation\?\.summary \|\| 'تفسير عام',\s*isAnonymous: true,\s*publishedAt: new Date\(\),\s*qualityScore: 60 \/\/ Base score for fallback\s*\};\s*dream\.isPublic = true;\s*dream\.visibilityStatus = 'public';\s*\/\/ ── Generate SEO slug for fallback publish too ──\s*if \(\!dream\.seoSlug\) \{\s*const dreamId = dream\._id\.toString\(\);\s*const slugTitle = dream\.title \|\| dream\.content\?\.slice\(0, 100\) \|\| '';\s*dream\.seoSlug = await generateUniqueSlug\(slugTitle, dream\.tags \|\| \[\], dreamId\);\s*console\.log\(`\[Publish\/Fallback\] Generated seoSlug: "\$\{dream\.seoSlug\}" for dream \$\{dreamId\}`\);\s*\}\s*await dream\.save\(\);/g,
    `dream.public_version = {
            title: dream.title || 'حلم مفسر',
            content: dream.content,
            interpretation: dream.interpretation?.summary || 'تفسير عام',
            isAnonymous: true,
            publishedAt: new Date().toISOString(),
            qualityScore: 60
        };
        dream.is_public = true;
        dream.visibility_status = 'public';

        if (!dream.seo_slug) {
            const dreamId = dream.id;
            const slugTitle = dream.title || dream.content?.slice(0, 100) || '';
            dream.seo_slug = await generateUniqueSlug(slugTitle, dream.tags || [], dreamId);
            console.log(\`[Publish/Fallback] Generated seoSlug: "\${dream.seo_slug}" for dream \${dreamId}\`);
        }

        await supabaseAdmin.from('dreams').upsert({
            ...dream,
            updated_at: new Date().toISOString()
        }).eq('id', dream.id);`
);

// Also need to adjust 'userMessage' reference to dream
content = content.replace(
    /نص الحلم: \$\{dream\.content\}\s*الحالة الاجتماعية \(إن وُجدت\): \$\{dream\.socialStatus \|\| "غير محدد"\}\s*المشاعر الظاهرة: \$\{dream\.mood \|\| "غير مذكور"\}\s*ملاحظات\/سياق إضافي \(اختياري\): \$\{dream\.isRecurring \? 'الحلم متكرر' : 'لا يوجد'\}/,
    `نص الحلم: \${dream.content}

الحالة الاجتماعية (إن وُجدت): \${dream.social_status || "غير محدد"}
المشاعر الظاهرة: \${dream.mood || "غير مذكور"}

ملاحظات/سياق إضافي (اختياري): \${dream.is_recurring ? 'الحلم متكرر' : 'لا يوجد'}`
);

fs.writeFileSync('src/app/api/dreams/[id]/publish/route.ts', content, 'utf8');
console.log('Publish route updated successfully.');
