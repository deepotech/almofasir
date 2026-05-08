import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { canAccessDreamRequest, canViewInterpretation, UserRole } from '@/lib/permissions';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

/**
 * GET /api/dream-requests/[id]
 * Permissions: User (own), Interpreter (assigned), Admin (all)
 * Users can only see interpretation when status >= 'completed'
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;
        try {
            const decoded = await verifyIdToken(token);
            userId = decoded.uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user role from Supabase
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('firebase_uid', userId)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const role = user.role as UserRole;

        // Get dream request from Supabase
        const { data: dreamRequest } = await supabaseAdmin
            .from('dream_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (!dreamRequest) {
            return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
        }

        console.log(`[dream-requests/${id}] User: ${userId}, Owner: ${dreamRequest.user_id}, Interpreter: ${dreamRequest.interpreter_user_id}`);

        if (!canAccessDreamRequest(userId, dreamRequest.user_id, dreamRequest.interpreter_user_id, role)) {
            return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 });
        }

        const canSeeInterpretation = canViewInterpretation(
            dreamRequest.status,
            userId,
            dreamRequest.user_id,
            role
        );

        const response = {
            ...dreamRequest,
            interpretation_text: canSeeInterpretation ? dreamRequest.interpretation_text : undefined,
        };

        return NextResponse.json({ request: response });
    } catch (error) {
        console.error('[dream-requests/[id]] Error:', error);
        return NextResponse.json({ error: 'حدث خطأ في جلب الطلب' }, { status: 500 });
    }
}
