import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InterpreterRequest from '@/models/InterpreterRequest';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();
        const {
            fullName,
            email,
            phone,
            country,
            experienceYears,
            interpretationType,
            bio,
            sampleInterpretation,
        } = body;

        // Validation
        if (!fullName || !email || !country || !experienceYears || !interpretationType || !bio || !sampleInterpretation) {
            return NextResponse.json(
                { message: 'يرجى ملء جميع الحقول المطلوبة' },
                { status: 400 }
            );
        }

        // Create new request
        const newRequest = await InterpreterRequest.create({
            fullName,
            email,
            phone,
            country,
            experienceYears,
            interpretationType,
            bio,
            sampleInterpretation,
        });

        // Send Email Notification to Admin
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const adminEmail = process.env.ADMIN_EMAIL || 'dev23hecoplus93mor@gmail.com';

        const emailContent = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
                <h2 style="color: #4f46e5;">طلب انضمام مفسر جديد</h2>
                <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <p><strong>الاسم:</strong> ${fullName}</p>
                    <p><strong>البريد الإلكتروني:</strong> ${email}</p>
                    <p><strong>رقم الهاتف:</strong> ${phone || 'غير محدد'}</p>
                    <p><strong>الدولة:</strong> ${country}</p>
                    <p><strong>سنوات الخبرة:</strong> ${experienceYears}</p>
                    <p><strong>نوع التفسير:</strong> ${interpretationType}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p><strong>نبذة:</strong></p>
                    <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px;">${bio}</p>
                    <p><strong>نموذج تفسير:</strong></p>
                    <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px;">${sampleInterpretation}</p>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: adminEmail,
                subject: `طلب انضمام مفسر جديد: ${fullName}`,
                html: emailContent,
            });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Continue even if email fails, as DB is more important
        }

        return NextResponse.json(
            { message: 'تم استلام طلبك بنجاح', success: true },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error in Join API:', error);
        return NextResponse.json(
            { message: 'حدث خطأ أثناء معالجة الطلب' },
            { status: 500 }
        );
    }
}
