import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import Interpreter from '@/models/Interpreter';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/data-check
 *
 * Quick diagnostic endpoint to check DB data health.
 * Returns counts and samples — NO sensitive data.
 * Only runs in development mode for security.
 */
export async function GET() {
    // Security: only allow in dev or with debug header
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev) {
        return NextResponse.json(
            { error: 'Debug endpoint only available in development mode' },
            { status: 403 }
        );
    }

    try {
        await dbConnect();

        // ── Dreams Diagnostics ──────────────────────────────────────────────
        const dreamsTotal = await Dream.countDocuments({});
        const dreamsPublic = await Dream.countDocuments({ visibilityStatus: 'public' });
        const dreamsPublicWithContent = await Dream.countDocuments({
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true, $ne: '' }
        });
        const dreamsPending = await Dream.countDocuments({ visibilityStatus: 'pending_public' });
        const dreamsPrivate = await Dream.countDocuments({ visibilityStatus: 'private' });

        const visibilityBreakdown = await Dream.aggregate([
            { $group: { _id: '$visibilityStatus', count: { $sum: 1 } } }
        ]);

        const statusBreakdown = await Dream.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Sample 3 public dreams for inspection
        const samplePublicDreams = await Dream.find({
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true }
        })
            .select('publicVersion.title seoSlug tags publicVersion.publishedAt publicVersion.comprehensiveInterpretation.snippetSummary')
            .limit(3)
            .lean();

        // ── Interpreters Diagnostics ────────────────────────────────────────
        const interpretersTotal = await Interpreter.countDocuments({});
        const interpretersActive = await Interpreter.countDocuments({ isActive: true, status: 'active' });
        const interpretersAny = await Interpreter.countDocuments({ status: { $ne: 'suspended' } });

        const interpreterStatusBreakdown = await Interpreter.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const interpreterIsActiveBreakdown = await Interpreter.aggregate([
            { $group: { _id: '$isActive', count: { $sum: 1 } } }
        ]);

        // Sample 3 interpreters (without sensitive fields)
        const sampleInterpreters = await Interpreter.find({})
            .select('displayName interpretationType status isActive rating completedDreams price')
            .limit(3)
            .lean();

        // ── Build Report ───────────────────────────────────────────────────
        const report = {
            timestamp: new Date().toISOString(),
            dreams: {
                total: dreamsTotal,
                public: dreamsPublic,
                public_with_content: dreamsPublicWithContent,
                pending_public: dreamsPending,
                private: dreamsPrivate,
                visibility_breakdown: visibilityBreakdown,
                status_breakdown: statusBreakdown,
                sample_public: samplePublicDreams.map((d: any) => ({
                    title: d.publicVersion?.title,
                    seoSlug: d.seoSlug,
                    publishedAt: d.publicVersion?.publishedAt,
                    snippetSummary: d.publicVersion?.comprehensiveInterpretation?.snippetSummary?.substring(0, 100),
                    tagsCount: d.tags?.length
                }))
            },
            interpreters: {
                total: interpretersTotal,
                active_strict: interpretersActive,
                non_suspended: interpretersAny,
                status_breakdown: interpreterStatusBreakdown,
                is_active_breakdown: interpreterIsActiveBreakdown,
                sample: sampleInterpreters.map((i: any) => ({
                    displayName: i.displayName,
                    type: i.interpretationType,
                    status: i.status,
                    isActive: i.isActive,
                    rating: i.rating,
                    completedDreams: i.completedDreams,
                    price: i.price
                }))
            },
            diagnosis: {
                dreams_visible_to_public: dreamsPublicWithContent,
                interpreters_visible_to_public: interpretersAny,
                issues: [] as string[]
            }
        };

        // Auto-diagnose issues
        if (dreamsPublicWithContent === 0) {
            report.diagnosis.issues.push(
                '❌ NO public dreams with content found. Dreams need visibilityStatus="public" AND publicVersion.content to appear on /interpreted-dreams'
            );
        }
        if (interpretersAny === 0) {
            report.diagnosis.issues.push(
                '❌ NO non-suspended interpreters found. Add interpreters to DB or check isActive/status fields'
            );
        }
        if (interpretersTotal > 0 && interpretersActive === 0 && interpretersAny > 0) {
            report.diagnosis.issues.push(
                '⚠️  Interpreters exist but none have status="active" + isActive=true. They may still appear with relaxed API filter.'
            );
        }
        if (dreamsPublic > 0 && dreamsPublicWithContent === 0) {
            report.diagnosis.issues.push(
                '⚠️  Dreams have visibilityStatus="public" but publicVersion.content is empty/missing. Run the publish action to populate.'
            );
        }

        if (report.diagnosis.issues.length === 0) {
            report.diagnosis.issues.push('✅ No obvious data issues found. Check network/CORS or browser console for other errors.');
        }

        return NextResponse.json(report, { status: 200 });

    } catch (error: any) {
        console.error('[DEBUG DATA CHECK] Error:', error);
        return NextResponse.json({
            error: 'Failed to run diagnostics',
            message: error?.message || 'Unknown error',
            hint: 'Check MONGODB_URI in .env.local'
        }, { status: 500 });
    }
}
