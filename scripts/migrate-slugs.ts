
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

import { slugifyArabic } from '../src/lib/slugifyArabic';
import Dream from '../src/models/Dream';

// ─── Load .env.local ─────────────────────────────────────────────
if (!process.env.MONGODB_URI && fs.existsSync('.env.local')) {
    const envConfig = fs.readFileSync('.env.local', 'utf8');
    envConfig.split('\n').forEach(line => {
        if (!line || line.startsWith('#')) return;
        const firstEq = line.indexOf('=');
        if (firstEq === -1) return;
        const key = line.substring(0, firstEq).trim();
        let value = line.substring(firstEq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    });
}

// ─── CLI Flags ───────────────────────────────────────────────────
const SWAP_MODE = process.argv.includes('--swap');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Domain config ───────────────────────────────────────────────
const BASE_URL = 'https://almofasir.com';

async function migrate() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🔄 Slug Migration Tool                   ║');
    console.log('╚════════════════════════════════════════════╝');

    const mode = SWAP_MODE ? '🔀 SWAP (activating new slugs + generating redirect map)'
        : DRY_RUN ? '👁️  DRY-RUN (no DB changes)'
            : '📝 CALCULATE (saving to slug_new field)';
    console.log(`Mode: ${mode}\n`);

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined. Check .env.local');
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // ═══════════════════════════════════════════════
        // SWAP MODE: Activate slug_new → seoSlug
        // ═══════════════════════════════════════════════
        if (SWAP_MODE) {
            console.log('Running SWAP operation...');
            const cursor = Dream.find({ slug_new: { $exists: true } }).cursor();

            // Key-value map: oldPath → newPath (for middleware)
            const redirectMap: Record<string, string> = {};
            // Array format for CSV export
            const csvRows: string[] = ['OldURL,NewURL,Status'];
            let swapped = 0;
            let cleaned = 0;

            for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
                if (doc.slug_new && doc.slug_new !== doc.seoSlug) {
                    const oldSlug = doc.seoSlug;
                    const newSlug = doc.slug_new;

                    if (oldSlug) {
                        // Build redirect mapping (both route patterns)
                        // /old-slug → /new-slug (root-level [dreamSlug])
                        redirectMap[`/${oldSlug}`] = `/${newSlug}`;
                        // /interpreted-dreams/old-slug → /new-slug (if someone bookmarked nested path)
                        redirectMap[`/interpreted-dreams/${oldSlug}`] = `/${newSlug}`;

                        csvRows.push(`${BASE_URL}/${oldSlug},${BASE_URL}/${newSlug},301`);
                    }

                    // Perform Swap + store previousSlugs for history
                    await Dream.updateOne({ _id: doc._id }, {
                        $set: { seoSlug: newSlug },
                        $push: { previousSlugs: oldSlug || '' } as any,
                        $unset: { slug_new: 1 }
                    });
                    swapped++;
                } else if (doc.slug_new) {
                    // slug_new === seoSlug → just cleanup
                    await Dream.updateOne({ _id: doc._id }, { $unset: { slug_new: 1 } });
                    cleaned++;
                }
            }

            console.log(`\n✅ Swapped: ${swapped} slugs`);
            console.log(`🧹 Cleaned (identical): ${cleaned}`);
            console.log(`📊 Redirect entries: ${Object.keys(redirectMap).length}`);

            // Save redirect map for middleware (key-value JSON)
            fs.writeFileSync('redirects-map.json', JSON.stringify(redirectMap, null, 2));
            console.log('📁 Saved: redirects-map.json (for middleware)');

            // Save CSV for SEO team / manual review
            fs.writeFileSync('redirects-report.csv', csvRows.join('\n'));
            console.log('📁 Saved: redirects-report.csv');

            // Also save array format if needed
            const redirectsArray = Object.entries(redirectMap).map(([source, destination]) => ({
                source, destination, permanent: true
            }));
            fs.writeFileSync('redirects.json', JSON.stringify(redirectsArray, null, 2));
            console.log('📁 Saved: redirects.json (legacy array format)');

            return;
        }

        // ═══════════════════════════════════════════════
        // CALCULATE MODE: Generate slug_new for all docs
        // ═══════════════════════════════════════════════
        const cursor = Dream.find({}).cursor();
        const takenSlugs = new Set<string>();

        // Reserve static routes
        ['about', 'contact', 'privacy', 'terms', 'search', 'category', 'tag',
            'interpreted-dreams', 'symbols', 'experts', 'pricing', 'auth', 'dashboard',
            'admin', 'learn', 'mufassir', 'interpret', 'join', 'journal', 'checkout',
            'booking', 'chat', 'tafsir-al-ahlam', 'tafsir-ahlam-mufassirin-haqiqin'
        ].forEach(s => takenSlugs.add(s));

        let total = 0;
        let changed = 0;
        let collisions = 0;
        const csvRows: string[] = ['ID,OldSlug,NewSlug,Status'];
        const examples: string[] = [];

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            total++;
            if (total % 100 === 0) console.log(`  Processed ${total} docs...`);

            const existingSlug = doc.seoSlug || '';
            const title = doc.publicVersion?.title;
            const content = doc.publicVersion?.content || doc.content || '';

            // Source text for slug generation
            let sourceText = title;
            if (!sourceText || sourceText.length < 5) {
                sourceText = content.substring(0, 100);
            }

            // Generate clean slug
            let newSlug = slugifyArabic(sourceText);

            // Fallback for empty slugs
            if (!newSlug || newSlug.length < 3) {
                newSlug = `تفسير-حلم-${doc._id.toString().slice(-6)}`;
            }

            // Ensure uniqueness
            let uniqueSlug = newSlug;
            let counter = 2;
            while (takenSlugs.has(uniqueSlug)) {
                uniqueSlug = `${newSlug}-${counter}`;
                counter++;
                if (counter > 2) collisions++;
            }
            takenSlugs.add(uniqueSlug);

            // Track changes
            const isChanged = existingSlug !== uniqueSlug;
            if (isChanged) {
                changed++;
                const status = counter > 2 ? 'CHANGED+COLLISION' : 'CHANGED';
                csvRows.push(`${doc._id},${existingSlug},${uniqueSlug},${status}`);

                if (examples.length < 50) {
                    examples.push(`  ${existingSlug || '(empty)'} → ${uniqueSlug}`);
                }
            }

            if (!DRY_RUN) {
                await Dream.updateOne({ _id: doc._id }, {
                    $set: { slug_new: uniqueSlug }
                });
            }
        }

        // ─── Report ──────────────────────────────────────
        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║   📊 Migration Report                      ║');
        console.log('╚════════════════════════════════════════════╝');
        console.log(`  Total Docs:       ${total}`);
        console.log(`  Changed Slugs:    ${changed}`);
        console.log(`  Collisions:       ${collisions}`);
        console.log(`  Unchanged:        ${total - changed}`);

        if (examples.length > 0) {
            console.log(`\n  Top ${examples.length} Examples (old → new):`);
            examples.forEach(e => console.log(e));
        }

        // Write CSV report
        fs.writeFileSync('migration-report.csv', csvRows.join('\n'));
        console.log('\n📁 Saved: migration-report.csv');

        if (DRY_RUN) {
            console.log('\n⚠️  DRY-RUN mode: No DB changes were made.');
            console.log('    Run without --dry-run to populate slug_new field.');
        } else {
            console.log('\n✅ slug_new field populated for all docs.');
            console.log('    Next step: Review migration-report.csv, then run:');
            console.log('    npx tsx scripts/migrate-slugs.ts --swap');
        }

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔒 Disconnected from MongoDB');
    }
}

migrate();
