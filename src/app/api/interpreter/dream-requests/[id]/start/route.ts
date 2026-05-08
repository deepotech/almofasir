import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = request.headers.get('Authorization');
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

        // Validate interpreter
        const { data: interpreter } = await supabaseAdmin
            .from('interpreters')
            .select('id, user_id, status')
            .eq('user_id', userId)
            .maybeSingle();

        if (!interpreter) {
            return NextResponse.json({ error: 'Not an interpreter' }, { status: 403 });
        }

        // Find dream request
        const { data: dreamRequest } = await supabaseAdmin
            .from('dream_requests')
            .select('id, status, interpreter_user_id')
            .eq('id', id)
            .maybeSingle();

        if (!dreamRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (dreamRequest.interpreter_user_id !== userId) {
            return NextResponse.json({ error: 'Not authorized for this request' }, { status: 403 });
        }

        // Strict transition: only from 'new'
        if (dreamRequest.status === 'in_progress') {
            return NextResponse.json({ message: 'Already in progress', status: 'in_progress' });
        }

        if (dreamRequest.status !== 'new') {
            return NextResponse.json({
                error: `Cannot start request in status: ${dreamRequest.status}`
            }, { status: 400 });
        }

        await supabaseAdmin
            .from('dream_requests')
            .update({
                status: 'in_progress',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', id);

        return NextResponse.json({
            success: true,
            status: 'in_progress',
            message: 'Interpretation started',
        });

    } catch (error) {
        console.error('Error starting interpretation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
