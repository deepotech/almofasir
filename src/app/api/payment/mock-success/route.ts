import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { planId, userId, orderId, type } = body;

        // ============================================================
        // HUMAN DREAM PAYMENT FLOW
        // ============================================================
        if (type === 'human-dream' && orderId) {
            console.log('PAYMENT SUCCESS FOR:', orderId, Date.now());

            const { data: order } = await supabaseAdmin
                .from('dream_requests')
                .select('id')
                .eq('id', orderId)
                .maybeSingle();

            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            await supabaseAdmin
                .from('dream_requests')
                .update({
                    payment_status: 'paid',
                    status: 'assigned',
                    payment_id: `mock_${Date.now()}`,
                })
                .eq('id', orderId);

            console.log(`[Payment] Human dream order ${orderId} marked as PAID`);

            return NextResponse.json({
                success: true,
                orderId,
                message: 'Payment successful, order visible to interpreter',
            });
        }

        // ============================================================
        // PLAN-BASED PAYMENT FLOW
        // ============================================================
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Upsert user
        let tempEmail = `user_${userId.substring(0, 8)}@example.com`;
        const { data: user } = await supabaseAdmin
            .from('users')
            .upsert(
                {
                    firebase_uid: userId,
                    email: tempEmail,
                    credits: 0,
                    plan: 'free',
                    status: 'active',
                    subscription_status: 'inactive',
                },
                { onConflict: 'firebase_uid', ignoreDuplicates: true }
            )
            .select()
            .maybeSingle();

        // Fetch current user
        const { data: currentUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('firebase_uid', userId)
            .single();

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Try to sync email from Firebase
        try {
            if (currentUser.email?.startsWith('user_')) {
                const firebaseUser = await getAuth().getUser(userId);
                if (firebaseUser.email) {
                    await supabaseAdmin
                        .from('users')
                        .update({ email: firebaseUser.email })
                        .eq('firebase_uid', userId);
                }
            }
        } catch (e) {
            console.warn('[Payment API] Could not sync email from Firebase:', e);
        }

        // Apply Plan Logic
        const planUpdates: Record<string, unknown> = {};
        let creditsToAdd = 0;

        switch (planId) {
            case 'ai-single':
                creditsToAdd = 3;
                break;
            case 'ai-monthly':
                planUpdates.plan = 'pro';
                planUpdates.subscription_status = 'active';
                planUpdates.subscription_end_date = new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString();
                creditsToAdd = 15;
                break;
            case 'human-expert':
                break;
        }

        if (creditsToAdd > 0) {
            planUpdates.credits = (currentUser.credits || 0) + creditsToAdd;
        }

        if (Object.keys(planUpdates).length > 0) {
            await supabaseAdmin
                .from('users')
                .update(planUpdates)
                .eq('firebase_uid', userId);
        }

        const newCredits = (currentUser.credits || 0) + creditsToAdd;

        return NextResponse.json({ success: true, credits: newCredits });

    } catch (error: any) {
        console.error('Payment mock error:', error);
        return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
    }
}
