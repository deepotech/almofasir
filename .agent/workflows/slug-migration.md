---
description: COMPLETE SEO Slug Migration Workflow
---

# Slug Migration Workflow

Important: Ensure `redirects-map.json` is generated before deployment. Vercel bundles this file at BUILD TIME. If it's empty during build, redirects won't work even if you update it later (unless you redeploy).

## Phase A: Preparation (Local)

1. **Dry Run (Check proposed changes)**
   ```bash
   npx tsx scripts/migrate-slugs.ts --dry-run
   ```
   - Review `migration-report.csv`.
   - Ensure clean Arabic slugs, no junk.

2. **Calculate New Slugs (Save to DB)**
   ```bash
   npx tsx scripts/migrate-slugs.ts
   ```
   - This populates `slug_new` field. Safe to run on live DB (no public changes yet).

3. **Verify Quality**
   ```bash
   npx tsx scripts/verify-slugs.ts
   ```
   - Must show "✅ ALL CHECKS PASSED".

## Phase B: Execution (Create Redirects)

4. **Swap Slugs & Generate Map**
   ```bash
   npx tsx scripts/migrate-slugs.ts --swap
   ```
   - Renames `slug_new` → `seoSlug`.
   - Generates `redirects-map.json` (Critical for Middleware).
   - Generates `redirects.json` (Backup).

5. **Commit the Map**
   The middleware uses `require('../redirects-map.json')`. This file MUST be committed.
   ```bash
   git add redirects-map.json src/middleware.ts src/models/Dream.ts
   git commit -m "chore: update redirects map"
   ```

## Phase C: Deployment

6. **Deploy to Vercel/Production**
   ```bash
   git push origin main
   ```

## Phase D: Post-Deploy Checks

1. **Test Redirect (301)**
   ```bash
   curl -I https://almofasir.com/OLD-SLUG
   # Expect: HTTP/2 301 
   # location: /NEW-SLUG
   ```

2. **Test Sitemap**
   - Visit https://almofasir.com/sitemap.xml
   - Verify only NEW slugs are present.

3. **Monitor 404s**
   - Check Google Search Console for any 404 spikes.
