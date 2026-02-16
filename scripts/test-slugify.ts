/**
 * Strategy A — Slug Test Script
 * 
 * Run with: npx tsx scripts/test-slugify.ts
 * 
 * Tests:
 * 1. slugifyArabic produces clean slugs from messy titles
 * 2. validateSlug correctly validates/rejects slugs
 * 3. No migration is needed — old slugs are preserved
 */

import { slugifyArabic, validateSlug } from '../src/lib/slugifyArabic';

console.log('╔════════════════════════════════════════════════════╗');
console.log('║   🧪 Strategy A — Slug Test Suite                  ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// ── Test 1: Clean slug generation from messy titles ──
const testCases = [
    {
        title: 'تفسير حلم تفسير حلم الصلاة في المنام فراق الأحباء بالتفصيل ودلالات المعنى',
        expected: 'Clean slug, no repetition, no filler words'
    },
    {
        title: 'تفسير حلم رؤية النمر في المنام للعزباء والمتزوجة بالتفصيل ومعنى خوف العزباء',
        expected: 'Clean slug, keep النمر, remove fillers'
    },
    {
        title: 'ما معنى حلم السمك الكبير في المنام',
        expected: 'Clean slug about fish'
    },
    {
        title: 'رؤية البيت المتهالك والتشوه في المنام والحلم بالقلق الزوجي بالتفصيل',
        expected: 'Short clean slug about the house'
    },
    {
        title: '',
        expected: 'Should be empty (fallback handled by caller)'
    },
    {
        title: 'حلم',
        expected: 'Single word — might be very short'
    }
];

console.log('── Test 1: slugifyArabic Output ──\n');

for (const tc of testCases) {
    const slug = slugifyArabic(tc.title);
    const validation = validateSlug(slug);
    const statusIcon = validation.valid ? '✅' : '⚠️';

    console.log(`Input:    "${tc.title}"`);
    console.log(`Output:   "${slug}" (${slug.length} chars, ${slug.split('-').length} tokens)`);
    console.log(`Valid:    ${statusIcon} ${validation.valid ? 'YES' : `NO — ${validation.reason}`}`);
    console.log(`Expected: ${tc.expected}`);
    console.log('─'.repeat(60));
}

// ── Test 2: Validate known bad slugs ──
console.log('\n── Test 2: validateSlug on edge cases ──\n');

const validationTests = [
    { slug: 'تفسير-حلم-النمر-خوف', shouldBeValid: true },
    { slug: 'تفسير-حلم-تفسير-حلم', shouldBeValid: false },  // Repetition
    { slug: 'أ', shouldBeValid: false },  // Too short
    { slug: 'تفسير-حلم-النمر-خوف-العزباء-المتزوجة-الحامل', shouldBeValid: false },  // Too many tokens
    { slug: '', shouldBeValid: false },
    { slug: 'تفسير-تفسير-حلم', shouldBeValid: false },  // Consecutive duplicate
];

for (const vt of validationTests) {
    const result = validateSlug(vt.slug);
    const pass = result.valid === vt.shouldBeValid;
    console.log(`${pass ? '✅' : '❌'} "${vt.slug}" → valid=${result.valid} ${result.reason || ''} (expected valid=${vt.shouldBeValid})`);
}

console.log('\n── Test Complete ──');
