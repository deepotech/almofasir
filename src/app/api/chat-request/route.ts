import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { interpreter, interpreterName, name, phone, email, dreamText, type } = body;

        // التحقق من البيانات المطلوبة
        if (!interpreter || !name || !phone || !dreamText) {
            return NextResponse.json(
                { error: 'جميع الحقول المطلوبة يجب ملؤها' },
                { status: 400 }
            );
        }

        // إنشاء محتوى البريد الإلكتروني
        const emailContent = `
طلب دردشة مباشرة جديد
=====================

المفسر المطلوب: ${interpreterName || interpreter}
نوع الخدمة: دردشة مباشرة
السعر: 39 ر.س

بيانات العميل:
--------------
الاسم: ${name}
رقم الواتساب: ${phone}
البريد الإلكتروني: ${email || 'غير مُدخل'}

الحلم:
------
${dreamText}

---
تم استلام هذا الطلب من موقع المفسر
يرجى التواصل مع العميل خلال 30 دقيقة
        `.trim();

        // إرسال البريد الإلكتروني
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.ADMIN_EMAIL || 'support@almofasir.com',
            subject: `طلب دردشة مباشرة جديد - ${name}`,
            text: emailContent
        });

        // إرسال تأكيد للعميل إذا أدخل بريده الإلكتروني
        if (email) {
            const clientEmailContent = `
مرحباً ${name}،

شكراً لتواصلك معنا في منصة المفسر.

تفاصيل طلبك:
- الخدمة: دردشة مباشرة
- المفسر: ${interpreterName || interpreter}
- التكلفة: 39 ر.س

سنتواصل معك قريباً عبر الواتساب على الرقم ${phone} لبدء جلسة الدردشة.

⏰ وقت الانتظار المتوقع: 30 دقيقة كحد أقصى

مع أطيب التحيات،
فريق المفسر
            `.trim();

            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'تأكيد طلب دردشة مباشرة - المفسر',
                text: clientEmailContent
            });
        }

        return NextResponse.json({
            success: true,
            message: 'تم إرسال الطلب بنجاح'
        });

    } catch (error) {
        console.error('Chat request error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء معالجة الطلب' },
            { status: 500 }
        );
    }
}
