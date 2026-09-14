# Almofasir — Architecture & Technical Audit (AUDIT_ARCHITECTURE.md)

**Domain**: `https://almofasir.com/`  
**Audit Date**: September 2026  
**Auditor**: Senior Staff Engineer & Technical Lead  

---

## 1. System Overview & Tech Stack

| Component | Actual Technology | Code Reference |
|---|---|---|
| **Framework** | Next.js 16.1.1 (App Router) | `package.json` |
| **Core Engine** | React 19.2.3 | `package.json` |
| **Styling** | Tailwind CSS v4 + Custom CSS Design System | `package.json`, `src/app/globals.css` |
| **Language** | TypeScript 5.x | `tsconfig.json` |
| **Primary Database** | **Supabase PostgreSQL** via `@supabase/supabase-js` | `src/lib/supabase.ts`, `supabase/schema.sql` |
| **Authentication** | Firebase Auth (Client) + Firebase Admin (Server Token Verification) | `src/lib/firebase.ts`, `src/lib/firebase-admin.ts` |
| **Role Authorization** | Hybrid: Firebase ID Token decoded → verified against `users` table in Supabase (`role = 'admin'`) | `src/lib/adminAuth.ts` |
| **Edge Middleware** | Minimal Edge Middleware (Trailing slash normalization 301) | `src/middleware.ts` |
| **Fonts** | Google Fonts (`Cairo` font, Arabic subset, `display: swap`) | `src/app/layout.tsx` |
| **SEO & Sitemap** | Dynamic App Router Sitemap + Metadata API + Schema.org JSON-LD | `src/app/sitemap.ts`, `src/lib/schema.ts`, `src/lib/seo.ts` |
| **External Video Source** | Official TikTok oEmbed API (`https://www.tiktok.com/oembed`) | `src/lib/tiktok.ts` |

---

## 2. Rendering & Data Fetching Strategy

- **Server Components (RSC)**: 
  - Main marketing and educational landing pages (`/learn`, `/learn/videos`, `/learn/videos/[slug]`, `/symbols`, `/tafsir-al-ahlam`) are designed as Server Components.
  - Video Library uses **ISR (Incremental Static Regeneration)** with `revalidate = 1800` (30 minutes).
- **Client Components ('use client')**:
  - Interactive widgets (`TikTokEmbed.tsx`, Header mobile menu, dream input form on homepage, and Admin Dashboard).
- **Database Access Strategy**:
  - `supabaseAdmin` proxy client utilizing `SUPABASE_SERVICE_ROLE_KEY` exclusively server-side.
  - `supabase` client utilizing `NEXT_PUBLIC_SUPABASE_ANON_KEY` for public reads.
  - Zero DB crash design: `src/lib/dataHelpers.ts`, `src/lib/fallbackData.ts`, and `src/lib/videoSeed.ts` ensure the site never crashes even if Supabase is offline or migrating.

---

## 3. Security & Access Control Architecture

- **Admin Route Protection**:
  - Protected via `verifyAdmin(req)` in `src/lib/adminAuth.ts`.
  - Flow: Extracts `Authorization: Bearer <token>` → Verifies Firebase token via `verifyIdToken` → Queries Supabase `users` for `firebase_uid` → Enforces `role === 'admin'` and `status === 'active'`.
  - Unauthenticated or unauthorized callers receive HTTP 401 or 403.
- **Row Level Security (RLS)**:
  - Enabled on tables in `supabase/migrations/`.
  - Public can only SELECT where `is_published = true`. Public INSERT, UPDATE, DELETE are blocked by RLS policies; writes require service-role.

---

## 4. Video & TikTok System Architecture

```
[Admin Dashboard]
       │
       ├─► Inputs TikTok URL (e.g. https://www.tiktok.com/@almofasir_/video/...)
       │
       ▼
[API: /api/admin/videos/oembed] (Protected by verifyAdmin)
       │
       ├─► Validates TikTok URL & extracts Video ID
       ├─► Calls official TikTok oEmbed endpoint (with timeout & safe headers)
       ├─► Returns sanitized metadata: title, author, thumbnail, suggested slug
       │
       ▼
[Admin Dashboard Review & Enrichment]
       │
       ├─► Admin verifies metadata, customizes Arabic slug
       ├─► Admin writes Original Editorial Article Content (SEO depth)
       ├─► Admin adds "Key Takeaways" & "FAQs"
       ├─► Admin toggles Publish state
       │
       ▼
[API: /api/admin/videos] (Protected by verifyAdmin)
       │
       ├─► Validates required fields, slug uniqueness, and types
       ├─► Saves to Supabase `videos` table (Idempotent upsert on `tiktok_video_id`)
       │
       ▼
[Public Endpoints]
       ├─► /learn/videos (Library: SSR, fast thumbnails, categories, pagination)
       ├─► /learn/videos/[slug] (Video Page: Official embed, article, FAQ, internal links, CTA)
       └─► /sitemap.xml (Dynamically indexes published video pages only)
```

---

## 5. Identified Areas for Immediate Engineering Hardening

1. **SSRF Hardening in `validateTikTokUrl`**: Enforce strict HTTPS protocol, reject userinfo/credentials, and limit allowed hostnames strictly to canonical TikTok domains.
2. **XSS Protection in Embed**: Eliminate raw `dangerouslySetInnerHTML` on arbitrary HTML; build official TikTok blockquote/iframe deterministically using validated video IDs.
3. **Referrer Policy for TikTok CDN**: Add `referrerPolicy="no-referrer"` to all TikTok thumbnail images to prevent CDN 403 blocks due to cross-origin referrer leakage.
4. **Thin Content SEO Protection**: Automatically apply `robots: { index: false, follow: true }` to video pages with minimal or missing editorial content to protect domain authority under Google's Helpful Content System.
5. **Slug Collision Handling**: Prevent database unique constraint crashes when an admin inputs a slug that already belongs to another video.
6. **UUID Validation in Delete API**: Safely handle deletion attempts of non-UUID IDs (such as seed identifiers) without throwing PostgreSQL syntax errors.
