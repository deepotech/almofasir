
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';

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
        if (key && !process.env[key]) process.env[key] = value;
    });
}

async function verify() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🔍 Slug Verification Tool                ║');
    console.log('╚════════════════════════════════════════════╝\n');

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const dreams = await Dream.find({ seoSlug: { $exists: true, $ne: null } })
        .select('seoSlug publicVersion.title _id')
        .lean();

    let total = dreams.length;
    let errors = 0;

    // ─── Check 1: Duplicate slugs ────────────────────────────────
    console.log('── Check 1: Duplicate Slugs ──');
    const slugCount: Record<string, string[]> = {};
    for (const d of dreams) {
        const slug = (d as any).seoSlug;
        if (!slugCount[slug]) slugCount[slug] = [];
        slugCount[slug].push((d as any)._id.toString());
    }
    const duplicates = Object.entries(slugCount).filter(([, ids]) => ids.length > 1);
    if (duplicates.length > 0) {
        console.log(`  ❌ Found ${duplicates.length} duplicate slugs:`);
        duplicates.forEach(([slug, ids]) => {
            console.log(`     "${slug}" → IDs: ${ids.join(', ')}`);
        });
        errors += duplicates.length;
    } else {
        console.log('  ✅ No duplicates found');
    }

    // ─── Check 2: Slug length > 60 chars ─────────────────────────
    console.log('\n── Check 2: Slug Length > 60 ──');
    const tooLong = dreams.filter(d => ((d as any).seoSlug || '').length > 60);
    if (tooLong.length > 0) {
        console.log(`  ❌ Found ${tooLong.length} slugs longer than 60 chars:`);
        tooLong.slice(0, 10).forEach(d => {
            const slug = (d as any).seoSlug;
            console.log(`     [${slug.length} chars] "${slug}"`);
        });
        errors += tooLong.length;
    } else {
        console.log('  ✅ All slugs ≤ 60 chars');
    }

    // ─── Check 3: Repeated "تفسير-حلم-تفسير-حلم" pattern ────────
    console.log('\n── Check 3: Repeated "تفسير-حلم" Pattern ──');
    const repeated = dreams.filter(d => {
        const slug = (d as any).seoSlug || '';
        return slug.includes('تفسير-حلم-تفسير-حلم')
            || slug.includes('حلم-حلم')
            || slug.includes('تفسير-تفسير');
    });
    if (repeated.length > 0) {
        console.log(`  ❌ Found ${repeated.length} slugs with repeated phrases:`);
        repeated.slice(0, 10).forEach(d => {
            console.log(`     "${(d as any).seoSlug}"`);
        });
        errors += repeated.length;
    } else {
        console.log('  ✅ No repeated phrase patterns found');
    }

    // ─── Check 4: Token count > 6 ───────────────────────────────
    console.log('\n── Check 4: Token Count > 6 ──');
    const tooManyTokens = dreams.filter(d => {
        const slug = (d as any).seoSlug || '';
        return slug.split('-').length > 6;
    });
    if (tooManyTokens.length > 0) {
        console.log(`  ❌ Found ${tooManyTokens.length} slugs with > 6 tokens:`);
        tooManyTokens.slice(0, 10).forEach(d => {
            const slug = (d as any).seoSlug;
            console.log(`     [${slug.split('-').length} tokens] "${slug}"`);
        });
        errors += tooManyTokens.length;
    } else {
        console.log('  ✅ All slugs have ≤ 6 tokens');
    }

    // ─── Check 5: Contains junk words ────────────────────────────
    console.log('\n── Check 5: Junk Words Scan ──');
    const junkPatterns = ['بالتفصيل', 'في-المنام', 'دلالات-', 'ومعنى-'];
    const hasJunk = dreams.filter(d => {
        const slug = (d as any).seoSlug || '';
        return junkPatterns.some(j => slug.includes(j));
    });
    if (hasJunk.length > 0) {
        console.log(`  ⚠️  Found ${hasJunk.length} slugs potentially containing junk:`);
        hasJunk.slice(0, 10).forEach(d => {
            console.log(`     "${(d as any).seoSlug}"`);
        });
    } else {
        console.log('  ✅ No junk word patterns detected');
    }

    // ─── Summary ─────────────────────────────────────────────────
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   📊 Summary                               ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`  Total dreams scanned: ${total}`);
    console.log(`  Errors found:         ${errors}`);
    console.log(`  Status:               ${errors === 0 ? '✅ ALL CHECKS PASSED' : '❌ ISSUES FOUND'}`);

    await mongoose.disconnect();
    console.log('\n🔒 Disconnected from MongoDB');
}

verify().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
