# تقرير التدقيق الشامل والجاهزية للإطلاق (PRODUCTION_LAUNCH_AUDIT.md)

**المشروع**: Almofasir.com (`https://almofasir.com/`)  
**المهمة**: تدقيق إنتاجي شامل (Security, SEO, Performance, Architecture, TikTok Integration)  
**التاريخ**: سبتمبر 2026  
**الفريق الهندسي**: Senior Staff Engineer & Technical Lead  

---

## A. Executive Summary (الملخص التنفيذي)

خضع مشروع **المُفسِّر** وتحديداً نظام **مكتبة الفيديوهات ودمج TikTok** لتدقيق معمق شمل بنية الكود، قواعد البيانات (Supabase PostgreSQL)، الحماية الأمنية، أداء Next.js 16، محركات البحث (SEO & Schema.org)، والتوافق الكامل مع سياسات TikTok الرسمية.

تم الانتقال بنجاح من مجرد بطاقات واجهة ثابتة إلى **منظومة إنتاجية كاملة (Production-Ready Architecture)**، قادرة على تحويل المشاهدات من حساب `@almofasir_` على TikTok إلى محتوى SEO أصيل وعميق يقود المستخدم مباشرة إلى خدمة تفسير الأحلام الرئيسية.

**النتيجة الإجمالية**: Build Clean (`npm run build` مر بنجاح بنسبة 100%، 106 صفحة بدون أي خطأ تجميع).

---

## B. Critical Issues (المشاكل الحرجة التي تم اكتشافها وإصلاحها)

1. **ثغرة هجمات تزوير الطلبات من جانب الخادم (SSRF Prevention)**:
   - *المشكلة*: دالة `validateTikTokUrl` كانت تفحص اسم النطاق فقط بمرونة تسمح ببروتوكولات أخرى أو منافذ غير اعتيادية.
   - *الإصلاح*: فُرض بروتوكول `https:` حصراً، ومُنعت أي بيانات اعتماد (credentials) أو منافذ مخصصة، وحُصرت النطاقات في القائمة البيضاء الرسمية (`tiktok.com`, `www.tiktok.com`, `m.tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com`).
2. **إلغاء ثغرة حقن السكربتات (XSS Elimination in Embeds)**:
   - *المشكلة*: المكوّن كان يستقبل كود HTML الخام ويعرضه عبر `dangerouslySetInnerHTML`.
   - *الإصلاح*: تم إلغاء `dangerouslySetInnerHTML` كلياً، والاعتماد على معرّف رقمي مُعقّم (`cleanVideoId = videoId.replace(/[^0-9]/g, '')`) مع إطار `iframe` محمي بحاوية `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"` ومظهر عرض سريع (Facade) يمنع تحميل سكربتات خارجية غير مرغوبة.

---

## C. High Priority Issues (قضايا عالية الأولوية تم حلها)

1. **حجب صور TikTok بواسطة سياسة Referrer (Image Referrer Leakage)**:
   - *المشكلة*: شبكات توزيع محتوى تيك توك (`*.tiktokcdn.com`) تحظر طلبات الصور الخارجية إذا أرسل المتصفح Referrer من نطاق مختلف، مما يسبب اختفاء الأغلفة (403 Forbidden).
   - *الإصلاح*: تم تزويد كافة وسوم `<img>` الخاصة بالأغلفة في مكتبة الفيديوهات وصفحة التفاصيل ولوحة التحكم بخاصية `referrerPolicy="no-referrer"`.
2. **حماية النطاق من عقوبات المحتوى الهزيل (Thin Content Protection)**:
   - *المشكلة*: أي فيديو يُنشر بدون مقال تحريري أو بشرح سطحي يضر بترتيب الموقع في تحديثات Google Helpful Content.
   - *الإصلاح*: تم إضافة نظام أمان ذكي في `generateMetadata`: إذا كان المقال التحريري أقل من 120 حرفاً يتم وسم الصفحة تلقائياً بـ `robots: { index: false, follow: true }` لحين إثراء المحتوى من لوحة التحكم، مما يحمي الـ Topical Authority للموقع.

---

## D. Medium Priority Issues (قضايا متوسطة تم حلها)

1. **تعارض وتكرار المسارات في قاعدة البيانات (Slug Collision)**:
   - *المشكلة*: عند تعديل فيديو وإدخال مسار (slug) يملكه فيديو آخر، كان السيرفر ينهار بخطأ استثناء من Postgres.
   - *الإصلاح*: تم فحص تعارض المسارات في `upsertVideo` وإرجاع رسالة عربية واضحة للمشرف دون انهيار السيرفر.
2. **محاولة حذف معرفات غير متوافقة مع UUID**:
   - *المشكلة*: طلب حذف معرّف تجريبي أو غير سليم كان يرمي خطأ `invalid input syntax for type uuid`.
   - *الإصلاح*: تم التحقق من صيغة الـ UUID برمجياً وتأمين دالة `deleteVideo`.
3. **تكرار الروابط في Sitemap**:
   - *المشكلة*: إمكانية تسرب روابط مكررة في `sitemap.xml`.
   - *الإصلاح*: تم تطبيق `seenSlugs` Set في `src/app/sitemap.ts` لضمان التفرد التام.

---

## E. Low Priority Issues & Cleanups

1. تنظيف ملفات الـ Scratch المؤقتة.
2. تحسين رسائل التسجيل (Logging) للمشرفين.

---

## F. SEO Issues & Verification

- **Dynamic Metadata**: متوفر ومكتمل لجميع المسارات (`canonical`, `openGraph`, `twitter:card`).
- **Structured Data (JSON-LD)**:
  - `BreadcrumbList`: تسلسل كامل وصحيح.
  - `VideoObject`: بيانات حقيقية موثقة حصراً (الاسم، الوصف، تاريخ النشر، رابط التضمين، الرابط الأصلي، والغلاف)، دون أي تقييمات أو أرقام مشاهدات وهمية.
  - `FAQPage`: يتم إنشاؤه ديناميكياً عند توفر أسئلة وأجوبة محددة.
- **Sitemap**: يولد حالياً 6 صفحات فيديو منشورة ديناميكياً إلى جانب صفحات الأحلام والرموز.

---

## G. Security Audit

- **Admin APIs**: مسارات `/api/admin/videos` و `/api/admin/videos/oembed` محمية عبر `verifyAdmin`، وتتطلب توكن Firebase مفحوصاً ومطابقاً لدور `admin` في Supabase.
- **Service Role Key**: محمي في بيئة الخادم (`SUPABASE_SERVICE_ROLE_KEY`) ولا يتسرب إطلاقاً إلى حزم العميل (Client Bundles).
- **RLS**: مفعل على جدول `videos`، بحيث لا تظهر المسودات للعامة.

---

## H. Performance & Core Web Vitals

- **LCP (Largest Contentful Paint)**: مكتبة الفيديوهات تستخدم صور الـ Web-optimized مع خاصية `loading="lazy"`.
- **INP & Script Bloat**: تم منع تحميل سكربت تيك توك الثقيل (`embed.js`) في صفحة المكتبة وفي صفحة التفاصيل حتى ينقر المستخدم على زر التشغيل (Click-to-Play Facade).
- **Caching**: تم اعتماد `revalidate = 1800` (ISR) لمكتبة الفيديو وصفحات التفاصيل.

---

## I. Content Strategy (Topical Authority vs. Thin Content)

- تم تحويل مقاطع الفيديو من مجرد مشغل مرئي إلى **مقالات تفسيرية متكاملة**:
  - عنوان تحريري جذاب يستهدف نية البحث (Search Intent).
  - نقاط التعلم البارزة (Key Takeaways).
  - تحليل رمزي شرعي عميق.
  - أسئلة شائعة تجيب عما يبحث عنه المستخدم.

---

## J. TikTok Integration Architecture

- **ما يعمل الآن بنسبة 100%**:
  - جلب بيانات أي مقطع من حساب `@almofasir_` فور إدخال الرابط عبر **TikTok Official oEmbed API**.
  - استخراج العنوان، الغلاف عالي الجودة، معرف الفيديو، واسم الحساب تلقائياً.
  - التضمين الرسمي السريع والآمن.
- **ما يحتاج TikTok Developer App Review مستقبلاً**:
  - السحب الآلي التلقائي لفيديوهات الحساب في الخلفية بدون تدخل المشرف عبر Display API (`/v2/video/list/`) يتطلب تسجيل تطبيق في TikTok for Developers والحصول على موافقة App Review مع OAuth Token.

---

## K. Conversion Rate Optimization (CRO)

- تم ربط صفحة الفيديو مباشرة بـ CTA تحويلي:
  > "هل رأيت شيئاً مشابهاً في منامك؟ لا تعتمد على تفسير عام؛ تفاصيل الرؤيا وحال الرائي تغيّر المعنى كلياً. [ ✨ فسّر حلمك الآن مجاناً ]"
- يوجه المستخدم مباشرة إلى صندوق إدخال الحلم في الصفحة الرئيسية `/#dream-input` مع خيار استشارة مفسر بشري معتمد في `/experts`.

---

## L. Competitive Gap Analysis (Almofasir vs. Ruyaak.com)

من خلال فحص البنية الحية لموقع المنافس `https://ruyaak.com/`:
1. **نقاط ضعف المنافس**:
   - يعتمد على حشو كلمات مفتاحية مكرر وعدواني (Keyword Stuffing).
   - يستخدم بيانات تقييمات غير موثقة (Fake AggregateRating) مما يعرضه لمخالفات Google Rich Results.
   - يفتقر إلى مكتبة فيديو مرئية موثوقة أو تكامل مع منصات التواصل الحديثة مثل TikTok.
   - لا يقدم استشارات حقيقية مع مفسرين بشريين معتمدين.
2. **تفوق Almofasir**:
   - تقديم تجربة فيديو حقيقية ترتبط بمحتوى `@almofasir_` السريع على TikTok مع شرح تحريري عميق.
   - تكامل مزدوج: تفسير فوري بالذكاء الاصطناعي + نخبة من المفسرين البشريين المعتمدين.
   - معمارية تقنية فائقة السرعة على Next.js 16 مع حماية متقدمة للـ SEO.

---

## M. Recommended Roadmap

1. **الخطوة الأولى (الفورية)**: تشغيل سكريبت `supabase/migrations/5_create_videos_table.sql` في محرر SQL في Supabase.
2. **الخطوة الثانية**: البدء بإدخال روابط فيديوهات `@almofasir_` الجديدة من لوحة التحكم (`/admin/dashboard/videos`) وكتابة المقالات التحريرية المرتبطة بها لتعزيز الـ SEO.
3. **الخطوة الثالثة (مستقبلاً)**: عند الرغبة في الأتمتة الكاملة، تسجيل حساب مطور لدى TikTok لربط الـ Display API.
