// Database Deduplication Script for DreamRequest
// Run this in MongoDB shell or as a one-time script

// This script:
// 1. Finds duplicate dreams by (userId, dreamText)
// 2. Keeps only the OLDEST record (first submission)
// 3. Deletes the newer duplicates

// MongoDB Shell Version:
/*
db.dreamrequests.aggregate([
  {
    $group: {
      _id: { userId: "$userId", dreamHash: "$dreamHash" },
      count: { $sum: 1 },
      docs: { $push: "$_id" },
      firstId: { $first: "$_id" }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]).forEach(function(group) {
  // Remove the first (oldest) from the list
  var toDelete = group.docs.filter(id => !id.equals(group.firstId));
  print("Deleting " + toDelete.length + " duplicates for hash: " + group._id.dreamHash);
  db.dreamrequests.deleteMany({ _id: { $in: toDelete } });
});
*/

// Node.js Version (for Next.js API route):
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';

async function deduplicateDreams() {
    await dbConnect();

    // Find all duplicates
    const duplicates = await DreamRequest.aggregate([
        {
            $group: {
                _id: { userId: "$userId", dreamHash: "$dreamHash" },
                count: { $sum: 1 },
                docs: { $push: { id: "$_id", createdAt: "$createdAt" } }
            }
        },
        {
            $match: { count: { $gt: 1 } }
        }
    ]);

    let totalDeleted = 0;

    for (const group of duplicates) {
        // Sort by createdAt to keep the oldest
        const sorted = group.docs.sort((a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Keep the first (oldest), delete the rest
        const toDelete = sorted.slice(1).map((d: any) => d.id);

        if (toDelete.length > 0) {
            const result = await DreamRequest.deleteMany({ _id: { $in: toDelete } });
            totalDeleted += result.deletedCount;
            console.log(`Deleted ${result.deletedCount} duplicates for user ${group._id.userId}`);
        }
    }

    console.log(`Total duplicates removed: ${totalDeleted}`);
    return totalDeleted;
}

export default deduplicateDreams;
