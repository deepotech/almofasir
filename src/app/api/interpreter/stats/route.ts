import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            console.error('Auth verify failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Aggregate Stats strictly from DreamRequest (The Truth)
        // We only count earnings where:
        // - status is 'completed' or 'closed' (assuming closed means finalized/paid)
        // - paymentStatus is 'released' (or 'paid' if we are lenient, but 'released' is safer for interpreter view)
        // User requested: "Earnings = sum of prices of completed requests only"

        const stats = await DreamRequest.aggregate([
            {
                $match: {
                    interpreterUserId: userId // Match requests for this interpreter
                }
            },
            {
                $group: {
                    _id: null,
                    // Total Earnings: Sum of interpreterEarning for completed requests
                    totalEarnings: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $in: ["$status", ["completed", "closed"]] },
                                        // We can enforce paymentStatus == 'released' here if stric
                                        // For now, let's stick to status=completed as requested
                                    ]
                                },
                                "$interpreterEarning", // Use the calculated earning stored in the request
                                0
                            ]
                        }
                    },
                    // Count by Status
                    completedRequests: {
                        $sum: {
                            $cond: [{ $in: ["$status", ["completed", "closed"]] }, 1, 0]
                        }
                    },
                    pendingRequests: {
                        $sum: {
                            $cond: [{ $in: ["$status", ["new", "in_progress"]] }, 1, 0] // new=pending, in_progress=started
                        }
                    },
                    totalRequests: { $sum: 1 }
                }
            }
        ]);

        const result = stats[0] || {
            totalEarnings: 0,
            completedRequests: 0,
            pendingRequests: 0,
            totalRequests: 0
        };

        return NextResponse.json({
            balance: result.totalEarnings, // Currently available (simplified for now, usually needs withdrawal logic)
            totalEarnings: result.totalEarnings,
            totalRequests: result.totalRequests,
            completedRequests: result.completedRequests,
            pendingRequests: result.pendingRequests
        });

    } catch (error) {
        console.error('Error fetching interpreter stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
