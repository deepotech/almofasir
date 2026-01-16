import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

// GET /api/interpreter/dreams/[id] - Get single dream for interpreter
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decoded.user_id || decoded.sub;
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const dream = await DreamRequest.findOne({
            _id: id,
            interpreterUserId: userId,
            type: 'HUMAN'
        }).lean();

        if (!dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        // Map to expected Frontend Interface
        const mappedDream = {
            _id: dream._id,
            content: dream.dreamText,
            context: dream.context || {},
            price: dream.lockedPrice || dream.price || 0,
            interpreterEarning: (dream.lockedPrice || dream.price || 0) * 0.8,
            status: mapStatusToFrontend(dream.status),
            deadline: calculateDeadline(dream.createdAt),
            interpretation: dream.interpretationText, // Map interpretationText -> interpretation
            createdAt: dream.createdAt,
            aiSuggestion: null // Can be populated if needed
        };

        return NextResponse.json({ dream: mappedDream });

    } catch (error) {
        console.error('Error fetching dream:', error);
        return NextResponse.json({ error: 'Failed to fetch dream' }, { status: 500 });
    }
}

// PUT /api/interpreter/dreams/[id] - Submit interpretation or update status
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decoded.user_id || decoded.sub;
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body = await req.json();
        const { action, interpretation } = body;

        const dream = await DreamRequest.findOne({
            _id: id,
            interpreterUserId: userId
        });

        if (!dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        if (action === 'start') {
            // Start working on dream (Status: assigned -> in_progress)
            if (dream.status !== 'assigned' && dream.status !== 'new') { // 'new' also allowed if assigned directly
                // Allow re-start if strictly needed, but better check
                if (dream.status === 'completed') {
                    return NextResponse.json({ error: 'Already completed' }, { status: 400 });
                }
            }
            dream.status = 'in_progress';
            dream.startedAt = new Date();
            await dream.save();

        } else if (action === 'submit') {
            // Submit interpretation
            if (!interpretation || interpretation.trim().length < 50) {
                return NextResponse.json({ error: 'التفسير قصير جداً' }, { status: 400 });
            }

            dream.interpretationText = interpretation; // Save to interpretationText
            dream.status = 'completed';
            dream.completedAt = new Date();
            await dream.save();

            // Update interpreter stats
            // Calculate earning based on actual price
            const earning = (dream.lockedPrice || dream.price || 0) * 0.8;

            await Interpreter.findOneAndUpdate(
                { userId },
                {
                    $inc: {
                        completedDreams: 1,
                        pendingEarnings: earning
                    }
                }
            );

            // TODO: Send notification to user

        } else if (action === 'answer_followup') {
            const { followUpAnswer } = body;
            if (!followUpAnswer || followUpAnswer.trim().length < 10) {
                return NextResponse.json({ error: 'الرد قصير جداً' }, { status: 400 });
            }

            // Map follow-up logic to clarification fields
            if (!dream.clarificationQuestion) {
                return NextResponse.json({ error: 'No pending follow-up question' }, { status: 400 });
            }

            dream.clarificationAnswer = followUpAnswer;
            dream.clarificationAnsweredAt = new Date();
            await dream.save();

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Return updated dream mapped
        const mappedDream = {
            _id: dream._id,
            content: dream.dreamText,
            context: dream.context || {},
            price: dream.lockedPrice || dream.price || 0,
            interpreterEarning: (dream.lockedPrice || dream.price || 0) * 0.8,
            status: mapStatusToFrontend(dream.status),
            deadline: calculateDeadline(dream.createdAt),
            interpretation: dream.interpretationText,
            createdAt: dream.createdAt
        };

        return NextResponse.json({ success: true, dream: mappedDream });

    } catch (error) {
        console.error('Error updating dream:', error);
        return NextResponse.json({ error: 'Failed to update dream' }, { status: 500 });
    }
}

// Helpers (Same as list route)
function mapStatusToFrontend(status: string): string {
    const map: Record<string, string> = {
        'new': 'pending_interpretation',
        'assigned': 'pending_interpretation',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'expired'
    };
    return map[status] || 'pending_interpretation';
}

function calculateDeadline(createdAt: Date): Date {
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + 24);
    return deadline;
}
