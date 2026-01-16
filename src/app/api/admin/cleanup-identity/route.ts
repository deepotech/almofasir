import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Find all requests
        const allRequests = await DreamRequest.find({}).sort({ createdAt: -1 }).lean();

        const contentMap = new Map();
        const duplicatesToDelete: any[] = [];
        let duplicateCount = 0;

        for (const req of allRequests) {
            // @ts-ignore
            const text = (req.dreamText || '').toLowerCase().trim().replace(/\s+/g, ' ');
            // @ts-ignore
            const interpreter = req.interpreterId?.toString() || 'none';

            // Key is strictly CONTENT + INTERPRETER (ignoring UserID)
            const key = `${text}_${interpreter}`;

            if (contentMap.has(key)) {
                // We found a content duplicate! 
                // We need to decide which one to keep.
                const existing = contentMap.get(key);

                // Strategy: Keep Firebase UID (longer, alphanumeric) over Phone Number (+212...)
                // Or keep the one that is NOT a phone number.

                // @ts-ignore
                const currentUserId = req.userId || '';
                // @ts-ignore
                const existingUserId = existing.userId || '';

                const currentIsPhone = currentUserId.startsWith('+') || /^\d+$/.test(currentUserId);
                const existingIsPhone = existingUserId.startsWith('+') || /^\d+$/.test(existingUserId);

                let toDelete;

                if (currentIsPhone && !existingIsPhone) {
                    // Current is phone, existing is likely UID. Delete current.
                    // @ts-ignore
                    toDelete = req;
                } else if (!currentIsPhone && existingIsPhone) {
                    // Current is UID, existing is phone. Delete existing, update map to current.
                    toDelete = existing;
                    contentMap.set(key, req);
                } else {
                    // Both same type? Keep the older one? Or newer?
                    // Let's keep the one created LATER (latest state)? 
                    // Or keep the one created EARLIER?
                    // Typically keep the one with "better" status?
                    // For now, just delete the current one (treating it as duplicate of existing)
                    // @ts-ignore
                    toDelete = req;
                }

                duplicatesToDelete.push(toDelete._id);
                duplicateCount++;

            } else {
                contentMap.set(key, req);
            }
        }

        if (duplicatesToDelete.length > 0) {
            await DreamRequest.deleteMany({ _id: { $in: duplicatesToDelete } });
        }

        return NextResponse.json({
            success: true,
            foundDuplicates: duplicateCount,
            deletedCount: duplicatesToDelete.length,
            message: "Cross-Identity cleanup complete."
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
