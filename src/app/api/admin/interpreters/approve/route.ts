import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { requestId, email, name } = await req.json();

        if (!requestId || !email) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Update interpreter request status
        const { data: request, error: reqError } = await supabaseAdmin
            .from('interpreter_requests')
            .update({ status: 'approved' })
            .eq('id', requestId)
            .select()
            .single();

        if (reqError || !request) {
            return NextResponse.json({ message: 'Request not found' }, { status: 404 });
        }

        console.log(`[Approve API] Processing approval for request: ${requestId}, email: ${email}`);

        // 2. Update user role if they exist
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, firebase_uid, email, display_name')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (user) {
            console.log(`[Approve API] Found user. Firebase UID: ${user.firebase_uid}`);

            await supabaseAdmin
                .from('users')
                .update({ role: 'interpreter' })
                .eq('id', user.id);

            // Create or update interpreter profile
            try {
                await supabaseAdmin
                    .from('interpreters')
                    .upsert(
                        {
                            user_id: user.firebase_uid,
                            email: user.email,
                            display_name: request.full_name || name,
                            bio: request.bio || 'مفسر أحلام معتمد',
                            interpretation_type: request.interpretation_type || 'mixed',
                            price: 15,
                            currency: 'USD',
                            response_time: 24,
                            is_active: true,
                            status: 'active',
                        },
                        { onConflict: 'user_id' }
                    );
                console.log('[Approve API] Interpreter profile upserted successfully');
            } catch (err) {
                console.error('[Approve API] Error creating interpreter profile:', err);
            }
        } else {
            console.warn(`[Approve API] User NOT found for email: ${email}`);
        }

        // 3. Send acceptance email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const loginLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://almofasser.com'}/auth/login`;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'مبروك! تم قبول طلب انضمامك لمنصة المفسر',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; text-align: right;">
                        <h2 style="color: #4f46e5;">مبارك! تم قبولك كمفسر في منصة المفسر 🎉</h2>
                        <p>مرحباً ${name}،</p>
                        <p>يسعدنا إبلاغك بأنه تمت مراجعة طلب انضمامك والموافقة عليه.</p>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${loginLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                الدخول إلى لوحة المفسر
                            </a>
                        </div>
                        <p style="color: #666;">يرجى تسجيل الدخول بنفس البريد الإلكتروني الذي قدمت الطلب به.</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error('Failed to send acceptance email', emailError);
        }

        return NextResponse.json({ success: true, message: 'Interpreter Approved Successfully' });

    } catch (error) {
        console.error('Error approving interpreter:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
