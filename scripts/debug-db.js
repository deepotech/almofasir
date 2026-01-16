const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const DreamRequestSchema = new mongoose.Schema({
    userId: String,
    interpreterId: String,
    dreamText: String,
    idempotencyKey: String,
    status: String
}, { strict: false }); // Loose schema to read everything

const DreamRequest = mongoose.model('DreamRequest', DreamRequestSchema);

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const collection = mongoose.connection.collection('dreamrequests');

        // 1. List Indexes
        console.log('\n--- Current Indexes ---');
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        const hasUniqueIndex = indexes.some(idx => idx.key.idempotencyKey === 1 && idx.unique === true);
        if (hasUniqueIndex) {
            console.log('✅ Unique Index on idempotencyKey EXISTS.');
        } else {
            console.log('❌ Unique Index on idempotencyKey is MISSING.');
        }

        // 2. Count Duplicates
        console.log('\n--- Checking for Duplicates ---');
        const duplicates = await DreamRequest.aggregate([
            {
                $group: {
                    _id: {
                        userId: "$userId",
                        interpreterId: "$interpreterId",
                        dreamText: "$dreamText"
                    },
                    ids: { $push: "$_id" },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log(`Found ${duplicates.length} groups of duplicates.`);

        // 3. Cleanup
        if (duplicates.length > 0) {
            console.log('Cleaning up duplicates...');
            let deletedCount = 0;
            for (const group of duplicates) {
                // Keep the first one, delete the rest
                const idsToDelete = group.ids.slice(1);
                await DreamRequest.deleteMany({ _id: { $in: idsToDelete } });
                deletedCount += idsToDelete.length;
            }
            console.log(`Deleted ${deletedCount} duplicate documents.`);
        } else {
            console.log('No duplicates to clean.');
        }

        // 4. Force Index Creation if missing
        if (!hasUniqueIndex) {
            console.log('\n--- Creating Unique Index ---');
            // We need to ensure idempotencyKey is populated for this to work well with sparse? 
            // Or if existing docs don't have it, sparse=true handles it.
            // But we need to make sure logic uses it.

            // Let's backfill idempotencyKey first to be safe
            console.log('Backfilling idempotencyKey for recent docs...');
            const docs = await DreamRequest.find({ idempotencyKey: { $exists: false } });
            for (const doc of docs) {
                if (doc.userId && doc.interpreterId && doc.dreamText) {
                    const key = `${doc.userId}_${doc.interpreterId}_${doc.dreamText.substring(0, 100)}`;
                    // Check if this key already exists (in case we have duplicates that aggregation missed somehow?)
                    // No, aggregation caught exact matches.
                    await DreamRequest.updateOne({ _id: doc._id }, { $set: { idempotencyKey: key } });
                }
            }
            console.log('Backfill complete.');

            try {
                await collection.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true });
                console.log('✅ Index created successfully.');
            } catch (err) {
                console.error('❌ Failed to create index:', err.message);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

main();
