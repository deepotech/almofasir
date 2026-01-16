import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // 0. Force Regenerate Hash for ALL Records
        const crypto = require('crypto');
        const generateHash = (uid: string, text: string) => {
            const normalized = (text || '').toLowerCase().trim();
            return crypto.createHash('sha256').update(`${uid}_${normalized}`).digest('hex');
        };

        const allDocs = await DreamRequest.find({}); // Fetch everything
        console.log(`Regenerating hashes for ${allDocs.length} records...`);

        for (const doc of allDocs) {
            if (!doc.dreamText || !doc.userId) {
                console.log(`Deleting invalid record: ${doc._id}`);
                await DreamRequest.findByIdAndDelete(doc._id);
                continue;
            }
            const hash = generateHash(doc.userId, doc.dreamText);

            // Allow update even if it fails validation (we fix data)
            await DreamRequest.collection.updateOne(
                { _id: doc._id },
                { $set: { dreamHash: hash } }
            );
        }

        console.log('Hash regeneration complete.');

        // 1. Aggressive Cleanup (Duplicate Removal)
        const allRequests = await DreamRequest.find({}).lean(); // Fetch FRESH data
        const seen = new Map();
        const duplicatesToDelete: any[] = [];

        console.log(`Scanning ${allRequests.length} requests for duplicates...`);

        for (const req of allRequests) {
            // Normalize: lowercase, trim, collapse whitespace
            // @ts-ignore
            const text = req.dreamText || '';
            const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ');
            // @ts-ignore
            const key = `${req.userId}_${normalizedText}`;

            if (seen.has(key)) {
                // @ts-ignore
                duplicatesToDelete.push(req._id);
            } else {
                // @ts-ignore
                seen.set(key, req._id);
            }
        }

        let deletedCount = 0;
        if (duplicatesToDelete.length > 0) {
            await DreamRequest.deleteMany({ _id: { $in: duplicatesToDelete } });
            deletedCount = duplicatesToDelete.length;
            console.log(`Deleted ${deletedCount} duplicates.`);
        }

        // 2. FORCE Index Creation
        let indexResult = 'Not attempted';
        try {
            // Drop potential partial/bad index
            try {
                await DreamRequest.collection.dropIndex('userId_1_dreamHash_1');
                console.log('Dropped existing index');
            } catch (e) {
                console.log('No existing index to drop');
            }

            // Create fresh
            const result = await DreamRequest.collection.createIndex(
                { userId: 1, dreamHash: 1 },
                { unique: true, name: 'userId_1_dreamHash_1', background: false } // Foreground build
            );
            indexResult = `Success: ${result}`;
        } catch (error: any) {
            indexResult = `FAILED: ${error.message}`;
            // If creation failed, it might be due to a race condition putting records back in?
            // Or inconsistent data.
        }

        return NextResponse.json({
            success: true,
            totalScanned: allRequests.length,
            deletedCount,
            indexCreation: indexResult
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
