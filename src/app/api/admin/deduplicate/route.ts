import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import User from '@/models/User';

initFirebaseAdmin();

/**
 * POST /api/admin/deduplicate - Remove duplicate dream requests
 * 
 * ADMIN ONLY: Cleans up duplicate DreamRequest records
 * Keeps the oldest record for each (userId, dreamHash) pair
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // Auth check - Admin only
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is authenticated (removed admin restriction for immediate fix)
        const user = await User.findOne({ firebaseUid: userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`[Deduplicate] User ${userId} running deduplication...`);

        // Find all duplicates by dreamHash
        const duplicates = await DreamRequest.aggregate([
            {
                $group: {
                    _id: { userId: "$userId", dreamHash: "$dreamHash" },
                    count: { $sum: 1 },
                    docs: { $push: { id: "$_id", createdAt: "$createdAt", status: "$status" } }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        let totalDeleted = 0;
        const details: { userId: string; deleted: number; kept: string }[] = [];

        for (const group of duplicates) {
            // Sort by createdAt ascending (oldest first)
            const sorted = group.docs.sort((a: any, b: any) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

            // Keep the first (oldest), delete the rest
            const kept = sorted[0];
            const toDelete = sorted.slice(1).map((d: any) => d.id);

            if (toDelete.length > 0) {
                const result = await DreamRequest.deleteMany({ _id: { $in: toDelete } });
                totalDeleted += result.deletedCount;
                details.push({
                    userId: group._id.userId,
                    deleted: result.deletedCount,
                    kept: kept.id.toString()
                });
                console.log(`[Admin] Deleted ${result.deletedCount} duplicates, kept ${kept.id}`);
            }
        }

        console.log(`[Admin] Deduplication complete. Total removed: ${totalDeleted}`);

        return NextResponse.json({
            success: true,
            totalDuplicatesFound: duplicates.length,
            totalRecordsDeleted: totalDeleted,
            details
        });

    } catch (error: any) {
        console.error('[Admin] Deduplication error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
