import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import Interpreter from '@/models/Interpreter';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug
 * Tests MongoDB connection and returns system diagnostics.
 * Remove or protect this endpoint before production deployment.
 */
export async function GET() {
    const startTime = Date.now();
    const report: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        env: {
            MONGODB_URI: process.env.MONGODB_URI
                ? `✅ Set (${process.env.MONGODB_URI.substring(0, 30)}...)`
                : '❌ MISSING — add to .env.local',
            NODE_ENV: process.env.NODE_ENV,
            OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing',
            FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        },
    };

    // ── DB Connection Test ─────────────────────────────────────────────────
    try {
        await dbConnect();
        report.db_connection = '✅ Connected successfully';

        // Quick stats
        const [dreamCount, publicDreamCount, interpreterCount, activeInterpreterCount] = await Promise.all([
            Dream.countDocuments({}),
            Dream.countDocuments({ visibilityStatus: 'public', 'publicVersion.content': { $exists: true, $ne: '' } }),
            Interpreter.countDocuments({}),
            Interpreter.countDocuments({ isActive: true, status: { $ne: 'suspended' } }),
        ]);

        const visibilityBreakdown = await Dream.aggregate([
            { $group: { _id: '$visibilityStatus', count: { $sum: 1 } } }
        ]);

        report.db_stats = {
            dreams: {
                total: dreamCount,
                public_visible: publicDreamCount,
                visibility_breakdown: visibilityBreakdown.reduce((acc: any, v: any) => {
                    acc[v._id || 'null'] = v.count;
                    return acc;
                }, {}),
                note: publicDreamCount === 0
                    ? '⚠️ No public dreams — set visibilityStatus="public" and publicVersion.content in admin panel'
                    : `✅ ${publicDreamCount} dreams ready to display on /interpreted-dreams`
            },
            interpreters: {
                total: interpreterCount,
                active: activeInterpreterCount,
                note: activeInterpreterCount === 0
                    ? '⚠️ No active interpreters in DB — /experts will use static fallback data'
                    : `✅ ${activeInterpreterCount} active interpreters`
            }
        };

    } catch (error: any) {
        const isWhitelist =
            error?.name === 'MongoServerSelectionError' ||
            error?.message?.includes('timed out') ||
            error?.message?.includes('ECONNREFUSED') ||
            error?.message?.includes('IP');

        report.db_connection = isWhitelist
            ? '❌ FAILED — IP not whitelisted in MongoDB Atlas'
            : `❌ FAILED — ${error?.message}`;

        report.db_fix = isWhitelist ? {
            problem: 'Your current IP is not in MongoDB Atlas IP Whitelist',
            steps: [
                '1. Go to cloud.mongodb.com',
                '2. Select your cluster',
                '3. Click "Network Access" in the left menu',
                '4. Click "Add IP Address"',
                '5. Click "Allow Access from Anywhere" (adds 0.0.0.0/0)',
                '6. Click "Confirm" and wait ~30 seconds',
                '7. Retry this endpoint'
            ]
        } : null;
    }

    const elapsed = Date.now() - startTime;
    report.elapsed_ms = elapsed;

    return NextResponse.json(report, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
    });
}
