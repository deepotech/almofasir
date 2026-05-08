#!/usr/bin/env tsx
/**
 * ============================================================
 * Almofasser — MongoDB → Supabase Data Migration Script
 * ============================================================
 *
 * Collections migrated:
 *   dreams            → dreams (Supabase)
 *   symbols           → symbols (Supabase)
 *   pagemetrics       → page_metrics (Supabase)
 *   programmaticpages → programmatic_pages (Supabase)
 *
 * Safety guarantees:
 *   ✓ READ-ONLY on MongoDB — never writes or deletes
 *   ✓ Skips duplicates via ON CONFLICT DO NOTHING
 *   ✓ Inserts in batches of 100
 *   ✓ Full try/catch around every operation
 *   ✓ Summary report at the end
 *
 * Usage:
 *   npx tsx scripts/migrate-data.ts
 * ============================================================
 */

import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// ── Load env ────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGO_URI     = process.env.MONGODB_URI!;
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BATCH_SIZE    = 100;

// ── Validate env vars ────────────────────────────────────────
if (!MONGO_URI)    throw new Error('Missing MONGODB_URI in .env.local');
if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
if (!SUPABASE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');

// ── Supabase admin client ────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ── Logging helpers ──────────────────────────────────────────
const log = {
    info:  (msg: string) => console.log(`  ℹ  ${msg}`),
    ok:    (msg: string) => console.log(`  ✓  ${msg}`),
    skip:  (msg: string) => console.log(`  ↩  ${msg}`),
    fail:  (msg: string) => console.error(`  ✗  ${msg}`),
    head:  (msg: string) => console.log(`\n━━━ ${msg} ━━━`),
    sep:   ()            => console.log('─'.repeat(50)),
};

// ── Stats tracker ────────────────────────────────────────────
interface Stats {
    inserted: number;
    skipped:  number;
    failed:   number;
    total:    number;
}

function emptyStats(): Stats {
    return { inserted: 0, skipped: 0, failed: 0, total: 0 };
}

// ── Batch insert helper ──────────────────────────────────────
async function batchInsert<T extends Record<string, unknown>>(
    table: string,
    rows: T[],
    stats: Stats,
    idField = 'id'
): Promise<void> {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        stats.total += batch.length;

        try {
            const { data, error } = await supabase
                .from(table)
                .upsert(batch, { onConflict: idField, ignoreDuplicates: true })
                .select(idField);

            if (error) {
                log.fail(`Batch ${Math.floor(i / BATCH_SIZE) + 1} → ${error.message}`);
                stats.failed += batch.length;
            } else {
                const inserted = data?.length ?? 0;
                const skipped  = batch.length - inserted;
                stats.inserted += inserted;
                stats.skipped  += skipped;
                log.ok(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${inserted} inserted, ${skipped} skipped`);
            }
        } catch (err: any) {
            log.fail(`Batch ${Math.floor(i / BATCH_SIZE) + 1} exception: ${err.message}`);
            stats.failed += batch.length;
        }
    }
}

// ============================================================
// COLLECTION 1: dreams → dreams
// ============================================================
async function migrateDreams(): Promise<Stats> {
    log.head('dreams');
    const stats = emptyStats();

    let cursor: any;
    try {
        const db   = mongoose.connection.db!;
        const coll = db.collection('dreams');
        const count = await coll.countDocuments();
        log.info(`Found ${count} documents in MongoDB dreams`);

        cursor = coll.find({}, { projection: {} });
    } catch (err: any) {
        log.fail(`Could not read dreams collection: ${err.message}`);
        return stats;
    }

    const buffer: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
        try {
            const row: Record<string, unknown> = {
                // Preserve created dates by using MongoDB _id timestamp as fallback
                created_at:           doc.createdAt   ?? new Date(parseInt(doc._id.toString().substring(0, 8), 16) * 1000),
                updated_at:           doc.updatedAt   ?? doc.createdAt ?? new Date(),
                user_id:              doc.userId       ?? null,
                title:                doc.title        ?? null,
                content:              doc.content,
                date:                 doc.date         ?? doc.createdAt ?? new Date(),
                mood:                 doc.mood         ?? 'neutral',
                social_status:        doc.socialStatus ?? null,
                dominant_feeling:     doc.dominantFeeling ?? null,
                age_range:            doc.ageRange     ?? null,
                gender:               doc.gender       ?? null,
                emotions:             doc.emotions     ?? [],
                keywords:             doc.keywords     ?? [],
                sentiment:            doc.sentiment    ?? null,
                is_recurring:         doc.isRecurring  ?? false,
                interpreter:          doc.interpreter  ?? null,
                tags:                 doc.tags         ?? [],
                // Complex nested objects → JSONB
                interpretation:       doc.interpretation  ? JSON.parse(JSON.stringify(doc.interpretation))  : null,
                user_feedback:        doc.userFeedback    ? JSON.parse(JSON.stringify(doc.userFeedback))    : null,
                rating:               doc.rating          ?? null,
                rating_feedback:      doc.ratingFeedback  ?? null,
                rated_at:             doc.ratedAt         ?? null,
                is_public:            doc.isPublic        ?? false,
                visibility_status:    doc.visibilityStatus ?? 'private',
                public_version:       doc.publicVersion   ? JSON.parse(JSON.stringify(doc.publicVersion))   : null,
                // SEO fields — critical to preserve
                seo_slug:             doc.seoSlug         ?? doc.slug_new ?? null,
                previous_slugs:       doc.previousSlugs   ?? [],
                status:               ['pending', 'completed', 'reviewed'].includes(doc.status) ? doc.status : 'pending',
                request_human_review: doc.requestHumanReview  ?? false,
                human_review_status:  doc.humanReviewStatus   ?? 'none',
            };

            // Skip rows without required content
            if (!row.content) {
                log.skip(`Dream _id=${doc._id} has no content, skipping`);
                stats.skipped++;
                continue;
            }

            // Deduplicate seo_slug — only one row can have a given slug
            // If seo_slug already exists in buffer, nullify it for the duplicate
            if (row.seo_slug) {
                const existing = buffer.find(r => r.seo_slug === row.seo_slug);
                if (existing) {
                    log.skip(`Duplicate seo_slug "${row.seo_slug}" — nullifying for _id=${doc._id}`);
                    row.seo_slug = null;
                }
            }

            buffer.push(row);

            if (buffer.length >= BATCH_SIZE) {
                await batchInsert('dreams', buffer, stats, 'seo_slug');
                buffer.length = 0;
            }
        } catch (err: any) {
            log.fail(`Error mapping dream _id=${doc._id}: ${err.message}`);
            stats.failed++;
        }
    }

    // Flush remainder
    if (buffer.length > 0) {
        await batchInsert('dreams', buffer, stats, 'seo_slug');
    }

    return stats;
}

// ============================================================
// COLLECTION 2: symbols → symbols
// ============================================================
async function migrateSymbols(): Promise<Stats> {
    log.head('symbols');
    const stats = emptyStats();

    let cursor: any;
    try {
        const db   = mongoose.connection.db!;
        const coll = db.collection('symbols');
        const count = await coll.countDocuments();
        log.info(`Found ${count} documents in MongoDB symbols`);
        cursor = coll.find({});
    } catch (err: any) {
        log.fail(`Could not read symbols collection: ${err.message}`);
        return stats;
    }

    const buffer: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
        try {
            if (!doc.name || !doc.slug || !doc.category) {
                log.skip(`Symbol _id=${doc._id} missing required fields (name/slug/category)`);
                stats.skipped++;
                continue;
            }

            const row: Record<string, unknown> = {
                name:            doc.name,
                slug:            doc.slug,
                category:        doc.category,
                icon:            doc.icon            ?? '💭',
                aliases:         doc.aliases         ?? [],
                // interpretations object → JSONB
                interpretations: doc.interpretations  ? JSON.parse(JSON.stringify(doc.interpretations)) : null,
                // variations array → JSONB
                variations:      doc.variations      ? JSON.parse(JSON.stringify(doc.variations)) : null,
                related_symbols: doc.relatedSymbols  ?? [],
                view_count:      doc.viewCount       ?? 0,
                created_at:      doc.createdAt       ?? new Date(parseInt(doc._id.toString().substring(0, 8), 16) * 1000),
                updated_at:      doc.updatedAt       ?? doc.createdAt ?? new Date(),
            };

            buffer.push(row);

            if (buffer.length >= BATCH_SIZE) {
                await batchInsert('symbols', buffer, stats, 'slug');
                buffer.length = 0;
            }
        } catch (err: any) {
            log.fail(`Error mapping symbol _id=${doc._id}: ${err.message}`);
            stats.failed++;
        }
    }

    if (buffer.length > 0) {
        await batchInsert('symbols', buffer, stats, 'slug');
    }

    return stats;
}

// ============================================================
// COLLECTION 3: pagemetrics → page_metrics
// ============================================================
async function migratePageMetrics(): Promise<Stats> {
    log.head('page_metrics');
    const stats = emptyStats();

    let cursor: any;
    try {
        const db   = mongoose.connection.db!;
        // Mongoose pluralizes 'PageMetrics' → 'pagemetrics'
        const coll = db.collection('pagemetrics');
        const count = await coll.countDocuments();
        log.info(`Found ${count} documents in MongoDB pagemetrics`);
        cursor = coll.find({});
    } catch (err: any) {
        log.fail(`Could not read pagemetrics collection: ${err.message}`);
        return stats;
    }

    const buffer: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
        try {
            if (!doc.slug) {
                log.skip(`PageMetrics _id=${doc._id} has no slug, skipping`);
                stats.skipped++;
                continue;
            }

            const row: Record<string, unknown> = {
                slug:       doc.slug,
                views:      doc.views    ?? 0,
                likes:      doc.likes    ?? 0,
                dislikes:   doc.dislikes ?? 0,
                updated_at: doc.lastUpdated ?? doc.updatedAt ?? new Date(),
            };

            buffer.push(row);

            if (buffer.length >= BATCH_SIZE) {
                await batchInsert('page_metrics', buffer, stats, 'slug');
                buffer.length = 0;
            }
        } catch (err: any) {
            log.fail(`Error mapping pagemetrics _id=${doc._id}: ${err.message}`);
            stats.failed++;
        }
    }

    if (buffer.length > 0) {
        await batchInsert('page_metrics', buffer, stats, 'slug');
    }

    return stats;
}

// ============================================================
// COLLECTION 4: programmaticpages → programmatic_pages
// ============================================================
async function migrateProgrammaticPages(): Promise<Stats> {
    log.head('programmatic_pages');
    const stats = emptyStats();

    let cursor: any;
    try {
        const db   = mongoose.connection.db!;
        const coll = db.collection('programmaticpages');
        const count = await coll.countDocuments();
        log.info(`Found ${count} documents in MongoDB programmaticpages`);
        cursor = coll.find({});
    } catch (err: any) {
        log.fail(`Could not read programmaticpages collection: ${err.message}`);
        return stats;
    }

    const buffer: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
        try {
            if (!doc.keywordSlug || !doc.title || !doc.content) {
                log.skip(`ProgrammaticPage _id=${doc._id} missing required fields, skipping`);
                stats.skipped++;
                continue;
            }

            const row: Record<string, unknown> = {
                keyword_slug: doc.keywordSlug,
                title:        doc.title,
                content:      doc.content,
                symbol_ref:   doc.symbolRef  ?? null,
                generated_at: doc.generatedAt ?? doc.createdAt ?? new Date(),
                created_at:   doc.createdAt  ?? new Date(parseInt(doc._id.toString().substring(0, 8), 16) * 1000),
                updated_at:   doc.updatedAt  ?? doc.createdAt ?? new Date(),
            };

            buffer.push(row);

            if (buffer.length >= BATCH_SIZE) {
                await batchInsert('programmatic_pages', buffer, stats, 'keyword_slug');
                buffer.length = 0;
            }
        } catch (err: any) {
            log.fail(`Error mapping programmaticpage _id=${doc._id}: ${err.message}`);
            stats.failed++;
        }
    }

    if (buffer.length > 0) {
        await batchInsert('programmatic_pages', buffer, stats, 'keyword_slug');
    }

    return stats;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('\n' + '═'.repeat(50));
    console.log('  Almofasser — MongoDB → Supabase Data Migration');
    console.log('═'.repeat(50));
    console.log(`  MongoDB:  ${MONGO_URI.replace(/:\/\/[^@]+@/, '://***@')}`);
    console.log(`  Supabase: ${SUPABASE_URL}`);
    console.log(`  Batch size: ${BATCH_SIZE}`);
    console.log('═'.repeat(50));

    // ── Connect to MongoDB (read-only) ──────────────────────
    try {
        log.info('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10_000,
            socketTimeoutMS: 45_000,
        });
        log.ok('MongoDB connected');
    } catch (err: any) {
        log.fail(`MongoDB connection failed: ${err.message}`);
        process.exit(1);
    }

    // ── Run migrations ──────────────────────────────────────
    const results: Record<string, Stats> = {};

    results.dreams             = await migrateDreams();
    results.symbols            = await migrateSymbols();
    results.page_metrics       = await migratePageMetrics();
    results.programmatic_pages = await migrateProgrammaticPages();

    // ── Disconnect MongoDB ──────────────────────────────────
    await mongoose.disconnect();
    log.ok('MongoDB disconnected — original data untouched');

    // ── Final report ────────────────────────────────────────
    console.log('\n' + '═'.repeat(50));
    console.log('  MIGRATION SUMMARY');
    console.log('═'.repeat(50));
    console.log(`  ${'Table'.padEnd(25)} ${'Total'.padStart(7)} ${'✓ Ins'.padStart(7)} ${'↩ Skip'.padStart(7)} ${'✗ Fail'.padStart(7)}`);
    log.sep();

    let grandTotal = 0, grandInserted = 0, grandSkipped = 0, grandFailed = 0;

    for (const [table, s] of Object.entries(results)) {
        console.log(`  ${table.padEnd(25)} ${String(s.total).padStart(7)} ${String(s.inserted).padStart(7)} ${String(s.skipped).padStart(7)} ${String(s.failed).padStart(7)}`);
        grandTotal    += s.total;
        grandInserted += s.inserted;
        grandSkipped  += s.skipped;
        grandFailed   += s.failed;
    }

    log.sep();
    console.log(`  ${'TOTAL'.padEnd(25)} ${String(grandTotal).padStart(7)} ${String(grandInserted).padStart(7)} ${String(grandSkipped).padStart(7)} ${String(grandFailed).padStart(7)}`);
    console.log('═'.repeat(50));

    if (grandFailed > 0) {
        console.log(`\n  ⚠️  ${grandFailed} rows failed. Check logs above for details.`);
    } else {
        console.log('\n  🎉  Migration completed successfully!');
    }

    // ── Write log file ──────────────────────────────────────
    const logPath = path.resolve(process.cwd(), 'scripts/migration.log');
    const logContent = JSON.stringify({
        timestamp:  new Date().toISOString(),
        supabaseUrl: SUPABASE_URL,
        results,
        totals: { grandTotal, grandInserted, grandSkipped, grandFailed },
    }, null, 2);

    try {
        fs.writeFileSync(logPath, logContent);
        console.log(`\n  📝  Full log saved to: ${logPath}`);
    } catch {
        // Non-fatal
    }

    process.exit(grandFailed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('\n  FATAL:', err);
    process.exit(1);
});
