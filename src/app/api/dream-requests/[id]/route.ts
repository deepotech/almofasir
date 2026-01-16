import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import User from '@/models/User';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { canAccessDreamRequest, canViewInterpretation, UserRole } from '@/lib/permissions';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

/**
 * GET /api/dream-requests/[id] - Get single dream request
 * 
 * Permission:
 * - User: Can view own request
 * - Interpreter: Can view assigned request
 * - Admin: Can view all
 * - User can ONLY see interpretation when status >= completed
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        await dbConnect();

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            console.error('Auth failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user role
        const user = await User.findOne({ firebaseUid: userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const role = user.role as UserRole;

        // Get dream request
        const dreamRequest = await DreamRequest.findById(id).lean();
        if (!dreamRequest) {
            return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
        }

        // Check access permission
        // Fix: Ensure we pass the Firebase UID (userId) which matches interpreterUserId in the document
        console.log(`[Access Check] User: ${userId}, Request Owner: ${dreamRequest.userId}, Interpreter: ${dreamRequest.interpreterUserId}`);

        if (!canAccessDreamRequest(userId, dreamRequest.userId, dreamRequest.interpreterUserId, role)) {
            // Second chance: Explicit check if logged in user is the interpreter for this request
            if (userId !== dreamRequest.interpreterUserId && userId !== dreamRequest.userId && role !== 'admin') {
                return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 });
            }
        }

        // Check if user can view interpretation
        const canSeeInterpretation = canViewInterpretation(
            dreamRequest.status,
            userId,
            dreamRequest.userId,
            role
        );

        console.log(`[GET Request] ID: ${id}`);
        console.log(`[GET Request] User: ${userId}, RequestUser: ${dreamRequest.userId}, Role: ${role}`);
        console.log(`[GET Request] Status: ${dreamRequest.status}, CanSee: ${canSeeInterpretation}`);

        // Sanitize response based on permissions
        const response = {
            ...dreamRequest,
            interpretationText: canSeeInterpretation ? dreamRequest.interpretationText : undefined
        };

        return NextResponse.json({ request: response });

    } catch (error) {
        console.error('Error fetching dream request:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في جلب الطلب' },
            { status: 500 }
        );
    }
}
