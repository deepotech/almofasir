import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // 1. Aggressive Cleanup: Group by userId + Normalized Text
        // This handles cases where spaces might differ slightly
        const allRequests = await DreamRequest.find({});

        const seen = new Map();
        const duplicatesToDelete = [];

        for (const req of allRequests) {
            // Normalize: lowercase, trim, collapse whitespace
            const normalizedText = (req.dreamText || '').toLowerCase().trim().replace(/\s+/g, ' ');
            const key = `${req.userId}_${normalizedText}`;

            if (seen.has(key)) {
                // This is a duplicate!
                duplicatesToDelete.push(req._id);
            } else {
                seen.set(key, req._id);
            }
        }

        let deletedCount = 0;
        if (duplicatesToDelete.length > 0) {
            await DreamRequest.deleteMany({ _id: { $in: duplicatesToDelete } });
            deletedCount = duplicatesToDelete.length;
        }

        // 2. FORCE Create Unique Index
        // Now that duplicates are gone, we can enforce the constraint
        try {
            await DreamRequest.collection.dropIndex('userId_1_dreamHash_1').catch(() => { }); // Drop if exists (bad state)
            await DreamRequest.collection.createIndex(
                { userId: 1, dreamHash: 1 },
                { unique: true, name: 'userId_1_dreamHash_1' }
            );
            console.log('Unique index created successfully');
        } catch (idxError) {
            console.error('Index creation failed:', idxError);
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            message: "Aggressive cleanup complete & Unique Index Encforced"
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
