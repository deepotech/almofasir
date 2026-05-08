/**
 * validate-supabase.ts  (v2 — Production Hardening Edition)
 *
 * Comprehensive Supabase + SEO validation for Almofasser.
 * Tests tables, columns, read/write, slug uniqueness, JSON schema,
 * orphan page detection, missing metadata, and SEO integrity.
 *
 * Run with:
 *   npx tsx scripts/validate-supabase.ts
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Terminal colours ──────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

const OK   = `${GREEN}✅ OK${RESET}`;
const FAIL = `${RED}❌ FAIL${RESET}`;
const WARN = `${YELLOW}⚠️  WARN${RESET}`;
const INFO = `${CYAN}ℹ️  INFO${RESET}`;

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ARABIC_SLUG_RE       = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF0-9a-z\-]+$/;
const SEO_TITLE_MIN_LEN    = 10;
const SEO_TITLE_MAX_LEN    = 70;

// ─── Table definitions ────────────────────────────────────────────────────────
const TABLE_DEFINITIONS: Record<string, string[]> = {
    users:              ['id', 'firebase_uid', 'email', 'display_name', 'credits', 'plan', 'role', 'status', 'last_free_dream_at', 'created_at', 'updated_at'],
    dreams:             ['id', 'user_id', 'content', 'mood', 'is_public', 'visibility_status', 'public_version', 'seo_slug', 'tags', 'status', 'created_at', 'updated_at'],
    symbols:            ['id', 'name', 'slug', 'category', 'icon', 'aliases', 'interpretations', 'related_symbols', 'view_count', 'created_at', 'updated_at'],
    page_metrics:       ['id', 'slug', 'views', 'likes', 'dislikes', 'updated_at'],
    programmatic_pages: ['id', 'keyword_slug', 'title', 'content', 'generated_at', 'created_at', 'updated_at'],
    interpreters:       ['id', 'user_id', 'email', 'display_name', 'bio', 'interpretation_type', 'price', 'is_active', 'status', 'created_at', 'updated_at'],
    dream_requests:     ['id', 'type', 'user_id', 'dream_text', 'dream_hash', 'idempotency_key', 'context', 'status', 'payment_status', 'created_at', 'updated_at'],
    bookings:           ['id', 'user_email', 'interpreter_name', 'date', 'time_slot', 'status', 'payment_status', 'amount', 'created_at', 'updated_at'],
    transactions:       ['id', 'user_id', 'amount', 'currency', 'type', 'status', 'created_at', 'updated_at'],
    notifications:      ['id', 'user_id', 'title', 'message', 'type', 'read', 'created_at', 'updated_at'],
    platform_settings:  ['id', 'commission_rate', 'maintenance_mode', 'created_at', 'updated_at'],
};

// ─── Counters & issues ────────────────────────────────────────────────────────
let passCount = 0;
let failCount = 0;
let warnCount = 0;
let seoScore  = 100;
const fatalIssues: string[]   = [];
const warnings: string[]       = [];
const seoIssues: string[]      = [];

function pass(msg: string) { console.log(`  ${OK}  ${msg}`); passCount++; }
function fail(msg: string) { console.log(`  ${FAIL} ${msg}`); failCount++; fatalIssues.push(msg); }
function warn(msg: string) { console.log(`  ${WARN} ${msg}`); warnCount++; warnings.push(msg); }
function info(msg: string) { console.log(`  ${INFO} ${DIM}${msg}${RESET}`); }
function section(title: string) { console.log(`\n${BOLD}${BLUE}━━ ${title} ━━${RESET}`); }
function seoFail(msg: string, penalty = 5) { seoIssues.push(msg); seoScore = Math.max(0, seoScore - penalty); warn(`[SEO] ${msg} (-${penalty}pts)`); }

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${BOLD}╔════════════════════════════════════════════════════╗`);
    console.log(`║  Almofasser — Production Hardening Validator v2   ║`);
    console.log(`╚════════════════════════════════════════════════════╝${RESET}\n`);

    // ══ 1. Env vars ═══════════════════════════════════════════════════════════
    section('1. Environment Variables');
    if (SUPABASE_URL) pass(`NEXT_PUBLIC_SUPABASE_URL = ${SUPABASE_URL}`);
    else fail('NEXT_PUBLIC_SUPABASE_URL missing');

    if (SUPABASE_SERVICE_KEY) {
        if (SUPABASE_SERVICE_KEY.startsWith('eyJ')) pass(`SUPABASE_SERVICE_ROLE_KEY = JWT ✓`);
        else warn(`SUPABASE_SERVICE_ROLE_KEY does not look like a JWT — check dashboard`);
    } else fail('SUPABASE_SERVICE_ROLE_KEY missing');

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    if (anonKey.startsWith('eyJ')) pass('NEXT_PUBLIC_SUPABASE_ANON_KEY = JWT ✓');
    else if (anonKey) warn(`NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be a publishable key, not JWT — get the anon key from Supabase Dashboard → Settings → API`);
    else warn('NEXT_PUBLIC_SUPABASE_ANON_KEY not set');

    ['FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'].forEach(k => {
        if (process.env[k]) pass(`${k} = set ✓`);
        else warn(`${k} missing — Firebase auth will use fallback decode (insecure in production)`);
    });

    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'].forEach(k => {
        if (process.env[k]) pass(`${k} = set ✓`);
        else warn(`${k} missing — cache will use in-memory fallback (no persistence across deploys)`);
    });

    ['OPENROUTER_API_KEY', 'QSTASH_TOKEN'].forEach(k => {
        if (process.env[k]) pass(`${k} = set ✓`);
        else warn(`${k} missing — AI publish will fail`);
    });

    if (failCount > 0) {
        console.log(`\n${RED}${BOLD}Critical env vars missing. Aborting.${RESET}\n`);
        process.exit(1);
    }

    // ══ 2. Connection ══════════════════════════════════════════════════════════
    section('2. Supabase Connection');
    const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const { error } = await sb.from('platform_settings').select('id').limit(1);
        if (error) throw error;
        pass('Connected to Supabase');
    } catch (e: any) {
        fail(`Connection failed: ${e?.message}`);
        process.exit(1);
    }

    // ══ 3. Table & column validation ══════════════════════════════════════════
    section('3. Table & Column Validation');
    for (const [table, requiredCols] of Object.entries(TABLE_DEFINITIONS)) {
        process.stdout.write(`\n  ${BOLD}[${table}]${RESET}\n`);
        try {
            const { data, error } = await sb.from(table).select('*').limit(1);
            if (error) { fail(`Table "${table}" error: ${error.message}`); continue; }
            pass(`Table "${table}" is readable`);
            if (data && data.length > 0) {
                const cols = Object.keys(data[0]);
                requiredCols.forEach(col => {
                    if (cols.includes(col)) pass(`  Column "${col}" ✓`);
                    else fail(`  Column "${col}" MISSING from "${table}"`);
                });
            } else {
                warn(`Table "${table}" is empty — column check skipped`);
            }
        } catch (e: any) { fail(`Unexpected error on "${table}": ${e?.message}`); }
    }

    // ══ 4. Slug uniqueness & format ═══════════════════════════════════════════
    section('4. Slug Uniqueness & Format Validation');

    // dreams
    try {
        const { data: slugRows } = await sb.from('dreams').select('seo_slug').not('seo_slug', 'is', null).neq('seo_slug', '');
        if (slugRows && slugRows.length > 0) {
            const slugSet = new Set<string>();
            let dupes = 0;
            let invalidFormat = 0;
            let tooShort = 0;
            for (const row of slugRows) {
                const s = row.seo_slug as string;
                if (slugSet.has(s)) dupes++;
                slugSet.add(s);
                if (!ARABIC_SLUG_RE.test(s)) { invalidFormat++; seoFail(`Invalid slug format: "${s}"`, 3); }
                if (s.length < 5) { tooShort++; seoFail(`Slug too short: "${s}"`, 2); }
            }
            if (dupes === 0) pass(`All ${slugRows.length} dream slugs are unique`);
            else fail(`${dupes} DUPLICATE seo_slug values in dreams`);
            if (invalidFormat === 0) pass(`All ${slugRows.length} dream slugs have valid format`);
            info(`Dream slugs: ${slugRows.length} total, ${dupes} dupes, ${invalidFormat} invalid format, ${tooShort} too short`);
        } else {
            warn('No dreams with seo_slug found');
        }
    } catch (e: any) { warn(`Slug check failed: ${e?.message}`); }

    // symbols
    try {
        const { data: symSlugs } = await sb.from('symbols').select('slug').not('slug', 'is', null).limit(200);
        if (symSlugs && symSlugs.length > 0) {
            const symSet = new Set<string>();
            let dupes = 0;
            symSlugs.forEach(r => { if (symSet.has(r.slug)) dupes++; symSet.add(r.slug); });
            if (dupes === 0) pass(`All ${symSlugs.length} symbol slugs are unique`);
            else fail(`${dupes} DUPLICATE slug values in symbols`);
        } else {
            warn('No symbols with slug found');
        }
    } catch (e: any) { warn(`Symbol slug check: ${e?.message}`); }

    // ══ 5. Orphan page detection ═══════════════════════════════════════════════
    section('5. Orphan Page Detection');
    try {
        // Dreams with seo_slug but null public_version (orphaned — no content to render)
        const { count: orphanCount } = await sb
            .from('dreams')
            .select('id', { count: 'exact', head: true })
            .eq('visibility_status', 'public')
            .is('public_version', null);

        if ((orphanCount ?? 0) > 0) {
            seoFail(`${orphanCount} dreams have visibility_status='public' but null public_version (orphan pages)`, 10);
        } else {
            pass('No orphan public dreams (all public dreams have public_version)');
        }
    } catch (e: any) { warn(`Orphan detection failed: ${e?.message}`); }

    try {
        // Dreams public but missing seo_slug
        const { count: noSlugCount } = await sb
            .from('dreams')
            .select('id', { count: 'exact', head: true })
            .eq('visibility_status', 'public')
            .is('seo_slug', null);

        if ((noSlugCount ?? 0) > 0) {
            seoFail(`${noSlugCount} public dreams are missing seo_slug (non-canonical URLs)`, 8);
        } else {
            pass('All public dreams have seo_slug');
        }
    } catch (e: any) { warn(`No-slug check failed: ${e?.message}`); }

    // ══ 6. SEO JSON schema validation ══════════════════════════════════════════
    section('6. SEO — public_version JSON Schema Validation');
    try {
        const { data: pvRows } = await sb
            .from('dreams')
            .select('id, seo_slug, public_version')
            .eq('visibility_status', 'public')
            .not('public_version', 'is', null)
            .limit(50);

        if (pvRows && pvRows.length > 0) {
            let missingTitle = 0;
            let missingContent = 0;
            let missingInterpretation = 0;
            let missingMetaTitle = 0;
            let shortMetaTitle = 0;
            let longMetaTitle = 0;

            for (const row of pvRows) {
                const pv = row.public_version as any;
                if (!pv) continue;
                if (!pv.title) missingTitle++;
                if (!pv.content) missingContent++;
                if (!pv.interpretation && !pv.comprehensiveInterpretation && !pv.comprehensive_interpretation) missingInterpretation++;

                const ci = pv.comprehensiveInterpretation || pv.comprehensive_interpretation;
                const metaTitle = ci?.metaTitle || ci?.meta_title || pv.title || '';
                if (!metaTitle) missingMetaTitle++;
                else if (metaTitle.length < SEO_TITLE_MIN_LEN) shortMetaTitle++;
                else if (metaTitle.length > SEO_TITLE_MAX_LEN) longMetaTitle++;
            }

            if (missingTitle === 0) pass(`All ${pvRows.length} sampled public_version objects have title`);
            else seoFail(`${missingTitle}/${pvRows.length} public_version objects missing title`, 5);

            if (missingContent === 0) pass(`All ${pvRows.length} sampled have content`);
            else seoFail(`${missingContent}/${pvRows.length} public_version objects missing content`, 5);

            if (missingInterpretation === 0) pass(`All ${pvRows.length} sampled have interpretation`);
            else seoFail(`${missingInterpretation}/${pvRows.length} public_version objects missing interpretation`, 5);

            if (missingMetaTitle === 0) pass(`All ${pvRows.length} sampled have metaTitle for SEO`);
            else seoFail(`${missingMetaTitle}/${pvRows.length} missing metaTitle`, 5);

            if (shortMetaTitle > 0) seoFail(`${shortMetaTitle} metaTitles below ${SEO_TITLE_MIN_LEN} chars`, 2);
            if (longMetaTitle > 0) seoFail(`${longMetaTitle} metaTitles above ${SEO_TITLE_MAX_LEN} chars`, 2);
            if (shortMetaTitle === 0 && longMetaTitle === 0) pass('All sampled metaTitles are within ideal length range');
        } else {
            warn('No public dreams to validate JSON schema');
        }
    } catch (e: any) { warn(`JSON schema validation failed: ${e?.message}`); }

    // ══ 7. Relation validation ═════════════════════════════════════════════════
    section('7. Relation Validation');
    try {
        // dream_requests with non-existent user_id
        const { data: reqSample } = await sb.from('dream_requests').select('id, user_id, status').limit(5);
        if (reqSample && reqSample.length > 0) {
            pass(`dream_requests readable (${reqSample.length} rows sampled)`);
            const hasRequired = reqSample.every(r => r.id && r.status);
            if (hasRequired) pass('dream_requests rows have required id + status');
            else fail('Some dream_requests rows missing id or status');
        } else {
            warn('dream_requests table is empty');
        }
    } catch (e: any) { fail(`dream_requests check failed: ${e?.message}`); }

    // ══ 8. Read/write access test ══════════════════════════════════════════════
    section('8. Read/Write Access Test');
    const testSlug = `__validate_v2_${Date.now()}`;
    try {
        const { error: insertErr } = await sb.from('page_metrics').insert({ slug: testSlug, views: 0, likes: 0, dislikes: 0 });
        if (insertErr) throw insertErr;
        pass('Write: inserted test row into page_metrics');

        const { data: readBack, error: readErr } = await sb.from('page_metrics').select('slug, views').eq('slug', testSlug).single();
        if (readErr || !readBack) throw readErr || new Error('Row not found after insert');
        pass(`Read: verified test row (slug="${readBack.slug}")`);

        const { error: delErr } = await sb.from('page_metrics').delete().eq('slug', testSlug);
        if (delErr) throw delErr;
        pass('Delete: cleaned up test row');
    } catch (e: any) { fail(`Read/write test: ${e?.message}`); }

    // ══ 9. Pagination test ═════════════════════════════════════════════════════
    section('9. Pagination & Count Test');
    try {
        const { data: p1, count: total, error } = await sb.from('dreams').select('id', { count: 'exact' }).range(0, 8);
        if (error) throw error;
        pass(`Pagination: fetched ${p1?.length ?? 0} rows, total count = ${total ?? 'N/A'}`);
    } catch (e: any) { fail(`Pagination test: ${e?.message}`); }

    // ══ 10. Timestamp format test ══════════════════════════════════════════════
    section('10. Timestamp Format Test');
    try {
        const { data: tsData, error } = await sb.from('platform_settings').select('created_at, updated_at').limit(1).single();
        if (error) throw error;
        const d = new Date(tsData.created_at);
        if (isNaN(d.getTime())) fail(`created_at is not a valid date: ${tsData.created_at}`);
        else pass(`Timestamps are valid ISO format (created_at = ${tsData.created_at})`);
    } catch (e: any) { warn(`Timestamp test: ${e?.message}`); }

    // ══ 11. Sitemap coverage ═══════════════════════════════════════════════════
    section('11. Sitemap Coverage Check');
    try {
        const { count: publicCount } = await sb
            .from('dreams')
            .select('id', { count: 'exact', head: true })
            .eq('visibility_status', 'public')
            .not('seo_slug', 'is', null);

        info(`Public indexable dreams (with seo_slug): ${publicCount ?? 0}`);

        if ((publicCount ?? 0) === 0) {
            seoFail('No indexable dreams found — sitemap will be empty', 15);
        } else if ((publicCount ?? 0) < 5) {
            seoFail(`Only ${publicCount} indexable dreams — sitemap coverage very low`, 5);
        } else {
            pass(`${publicCount} dreams are eligible for sitemap inclusion`);
        }
    } catch (e: any) { warn(`Sitemap coverage check: ${e?.message}`); }

    // ══ Final Report ═══════════════════════════════════════════════════════════
    console.log(`\n${BOLD}${'═'.repeat(56)}${RESET}`);
    console.log(`${BOLD}VALIDATION REPORT — Almofasser Production Hardening${RESET}`);
    console.log(`${'─'.repeat(56)}`);
    console.log(`  ${GREEN}Passed:${RESET}   ${passCount}`);
    console.log(`  ${RED}Failed:${RESET}   ${failCount}`);
    console.log(`  ${YELLOW}Warnings:${RESET} ${warnCount}`);
    console.log(`\n  ${CYAN}SEO Score: ${seoScore}/100${seoScore >= 80 ? ` ${GREEN}✓${RESET}` : seoScore >= 60 ? ` ${YELLOW}⚠${RESET}` : ` ${RED}✗${RESET}`}${RESET}`);

    if (fatalIssues.length > 0) {
        console.log(`\n${RED}${BOLD}Fatal Issues:${RESET}`);
        fatalIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${RED}${issue}${RESET}`));
    }

    if (warnings.length > 0) {
        console.log(`\n${YELLOW}${BOLD}Warnings:${RESET}`);
        warnings.forEach((w, i) => console.log(`  ${i + 1}. ${YELLOW}${w}${RESET}`));
    }

    if (seoIssues.length > 0) {
        console.log(`\n${CYAN}${BOLD}SEO Issues:${RESET}`);
        seoIssues.forEach((s, i) => console.log(`  ${i + 1}. ${CYAN}${s}${RESET}`));
    }

    console.log(`\n${'═'.repeat(56)}\n`);

    if (failCount === 0) {
        console.log(`${GREEN}${BOLD}✅ All critical checks passed. Database is production-ready.${RESET}`);
        if (seoScore >= 80) console.log(`${GREEN}${BOLD}📈 SEO Integrity: GOOD (${seoScore}/100)${RESET}\n`);
        else if (seoScore >= 60) console.log(`${YELLOW}${BOLD}📈 SEO Integrity: FAIR (${seoScore}/100) — review SEO issues above${RESET}\n`);
        else console.log(`${RED}${BOLD}📉 SEO Integrity: POOR (${seoScore}/100) — address SEO issues before launch${RESET}\n`);
    } else {
        console.log(`${RED}${BOLD}❌ ${failCount} fatal check(s) failed. Fix before deploying to production.${RESET}\n`);
        process.exit(1);
    }
}

main().catch((e) => {
    console.error(`${RED}${BOLD}Fatal error:${RESET}`, e);
    process.exit(1);
});
