import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { planId, userId, orderId, type, payPalOrderId } = body;

        console.log(`[Payment Real] Processing capture for Order: ${orderId}, PayPalID: ${payPalOrderId}`);

        // HUMAN DREAM PAYMENT FLOW
        if (type === 'human-dream' && orderId) {
            const { data: order } = await supabaseAdmin.from('dream_requests').select('id').eq('id', orderId).single();

            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            await supabaseAdmin.from('dream_requests').update({
                payment_status: 'paid',
                status: 'assigned',
                payment_id: payPalOrderId || `paypal_${Date.now()}`
            }).eq('id', orderId);

            console.log(`[Payment] Human dream order ${orderId} marked as PAID. Transaction: ${payPalOrderId}`);

            return NextResponse.json({ success: true, orderId, message: 'Payment captured successfully' });
        }

        // PLAN/CREDIT PAYMENT FLOW
        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const { data: user } = await supabaseAdmin.from('users').select('*').eq('firebase_uid', userId).single();
        let finalUser;

        if (!user) {
            const { data } = await supabaseAdmin.from('users').insert({
                firebase_uid: userId,
                email: `user_${userId.substring(0, 8)}@example.com`,
                credits: 0,
                plan: 'free'
            }).select().single();
            finalUser = data;
        } else {
            finalUser = user;
        }

        const updateData: any = { updated_at: new Date().toISOString() };

        if (planId === 'ai-single') {
            updateData.credits = (finalUser.credits || 0) + 3;
        } else if (planId === 'ai-monthly') {
            updateData.plan = 'pro';
            updateData.subscription_status = 'active';
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);
            updateData.subscription_end_date = endDate.toISOString();
            updateData.credits = (finalUser.credits || 0) + 15;
        }

        const { data: updatedUser } = await supabaseAdmin.from('users').update(updateData).eq('id', finalUser.id).select('credits').single();

        return NextResponse.json({ success: true, credits: updatedUser?.credits || 0 });

    } catch (error: any) {
        console.error('Payment capture error:', error);
        return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
    }
}
