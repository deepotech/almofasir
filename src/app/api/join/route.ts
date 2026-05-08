import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            fullName, email, phone, country,
            experienceYears, interpretationType, bio, sampleInterpretation,
        } = body;

        if (!fullName || !email || !country || !experienceYears || !interpretationType || !bio || !sampleInterpretation) {
            return NextResponse.json({ message: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('interpreter_requests')
            .insert({
                full_name: fullName,
                email: email.toLowerCase(),
                phone: phone || '',
                country,
                experience_years: experienceYears,
                interpretation_type: interpretationType,
                bio,
                sample_interpretation: sampleInterpretation,
            });

        if (error) throw error;

        // Send email notification (fire-and-forget)
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            await Promise.race([
                transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: process.env.ADMIN_EMAIL || 'dev23hecoplus93mor@gmail.com',
                    subject: `طلب انضمام مفسر جديد: ${fullName}`,
                    html: `<div dir="rtl"><h2>طلب انضمام مفسر</h2>
                        <p><strong>الاسم:</strong> ${fullName}</p>
                        <p><strong>البريد:</strong> ${email}</p>
                        <p><strong>الدولة:</strong> ${country}</p>
                        <p><strong>الخبرة:</strong> ${experienceYears} سنوات</p>
                        <p><strong>نوع التفسير:</strong> ${interpretationType}</p>
                        <p><strong>نبذة:</strong> ${bio}</p>
                        <p><strong>نموذج:</strong> ${sampleInterpretation}</p></div>`,
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
            ]);
        } catch (emailErr) {
            console.error('Email warning (non-fatal):', emailErr);
        }

        return NextResponse.json({ message: 'تم استلام طلبك بنجاح', success: true }, { status: 201 });
    } catch (error) {
        console.error('Error in Join API:', error);
        return NextResponse.json({ message: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
    }
}
