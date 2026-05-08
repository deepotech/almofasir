import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

// Dummy Notification Function - Replace with real implementation later
async function sendNotification(userId: string, title: string, message: string) {
    console.log(`[Notification] To User ${userId}: ${title} - ${message}`);
    try {
        await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title,
            message,
            type: 'interpretation_completed',
            read: false,
            created_at: new Date().toISOString()
        });
    } catch (e) {
        console.warn('Notification model not found or error:', e);
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        let userId: string;
        try { userId = (await verifyIdToken(token)).uid; } 
        catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

        const body = await request.json();
        const { interpretationText } = body;

        if (!interpretationText || interpretationText.trim().length < 50) {
            return NextResponse.json({ error: 'يجب أن يكون التفسير 50 حرفاً على الأقل' }, { status: 400 });
        }

        const { data: interpreter } = await supabaseAdmin.from('interpreters').select('status, display_name').eq('user_id', userId).single();
        if (!interpreter || interpreter.status === 'suspended') return NextResponse.json({ error: 'Interpreter not active' }, { status: 403 });

        const { data: dreamRequest } = await supabaseAdmin.from('dream_requests').select('*').eq('id', id).single();
        if (!dreamRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        if (dreamRequest.interpreter_user_id !== userId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

        if (dreamRequest.status !== 'in_progress') {
            if (dreamRequest.status === 'completed') return NextResponse.json({ message: 'Already completed', status: 'completed' });
            return NextResponse.json({ error: 'Request must be In Progress before completion. Please start it first.' }, { status: 400 });
        }

        const { data: settings } = await supabaseAdmin.from('platform_settings').select('commission_rate').single();
        const commissionRate = settings?.commission_rate || 0.3;

        const lockedPrice = dreamRequest.locked_price;
        const platformCommission = lockedPrice * commissionRate;
        const interpreterEarning = lockedPrice - platformCommission;

        // Create transaction
        await supabaseAdmin.from('transactions').insert({
            user_id: userId,
            amount: interpreterEarning,
            currency: dreamRequest.currency || 'USD',
            type: 'earning',
            status: 'completed',
            description: `Interpretation for request #${dreamRequest.id}`,
            related_entity_id: dreamRequest.id,
            related_entity_type: 'dream_requests'
        });

        // Update Request
        await supabaseAdmin.from('dream_requests').update({
            interpretation_text: interpretationText.trim(),
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            platform_commission: platformCommission,
            interpreter_earning: interpreterEarning,
            payment_status: 'released'
        }).eq('id', id);

        await sendNotification(
            dreamRequest.user_id,
            'تم تفسير حلمك! ✨',
            `قام المفسر ${interpreter.display_name} بالرد على حلمك.`
        );

        return NextResponse.json({ success: true, status: 'completed', message: 'Interpretation submitted successfully' });

    } catch (error) {
        console.error('Error submitting interpretation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
