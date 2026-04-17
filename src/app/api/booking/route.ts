import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Interpreter from '@/models/Interpreter';
import { createOrder, generateDreamHash } from '@/lib/orders';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { interpreter: interpreterId, interpreterName, date, time, timeSlot, name, phone, email, notes, price, userId } = body;

        // التحقق من البيانات المطلوبة
        if (!interpreterId || !date || !time || !name || !phone) {
            console.error('[API/booking] Missing required fields:', { interpreterId, date, time, name, phone });
            return NextResponse.json(
                { error: 'جميع الحقول المطلوبة يجب ملؤها' },
                { status: 400 }
            );
        }

        // التحقق من وجود إعدادات البريد الإلكتروني
        const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

        // Connect to DB
        await dbConnect();

        // Safe Interpreter Fetch logic
        let interpreterDoc = null;
        try {
            interpreterDoc = await Interpreter.findById(interpreterId);
        } catch (e) {
            console.error(`[API/booking] Invalid interpreter ID format: ${interpreterId}`);
            // Fallthrough - interpreterDoc stays null
        }

        if (!interpreterDoc) {
            return NextResponse.json(
                { error: 'المفسر غير موجود أو المعرف غير صحيح' },
                { status: 404 }
            );
        }

        const bookingPrice = price || interpreterDoc?.price || 14.99;

        // Build dream content with validation context
        // Ensure content > 20 chars to pass createOrder validation
        const appointmentDetails = ` تفاصيل الموعد: ${date} الساعة ${timeSlot || time}`;
        let dreamContent = notes ? `${notes}\n\n[حجز موعد] ${appointmentDetails}` : `طلب تفسير حلم (حجز موعد). ${appointmentDetails}`;

        if (dreamContent.length < 25) {
            dreamContent = `طلب حجز موعد للتفسير الخاص.\n${dreamContent}`;
        }

        const stableIdentifier = userId || phone || email;

        // ============================================
        // CHECK FOR DUPLICATE BOOKING (Strict Check)
        // ============================================
        // Prevent 4 emails/records if user double-clicks or net lag
        const existingBooking = await Booking.findOne({
            interpreterId,
            date,
            timeSlot: timeSlot || time,
            $or: [
                { userId: userId },
                { userEmail: email },
                { clientPhone: phone }
            ],
            status: { $ne: 'cancelled' }
        });

        let newBooking;

        if (existingBooking) {
            console.log(`[Booking] Duplicate prevented: returning existing booking ${existingBooking._id}`);
            newBooking = existingBooking;
            // Skip email sending for duplicates
        } else {
            // ============================================
            // CREATE BOOKING RECORD
            // ============================================
            try {
                newBooking = await Booking.create({
                    userEmail: email || 'unknown',
                    userId: userId || undefined,
                    interpreterName: interpreterName || interpreterDoc?.displayName || 'Unknown',
                    interpreterId: interpreterId,
                    date,
                    timeSlot: timeSlot || time,
                    clientName: name,
                    clientPhone: phone,
                    notes,
                    amount: bookingPrice,
                    currency: 'USD',
                    status: 'confirmed',
                    paymentStatus: 'paid'
                });
            } catch (bookingErr: any) {
                console.error('[API/booking] DB Create Booking Failed:', bookingErr);
                return NextResponse.json(
                    { error: 'فشل في إنشاء سجل الحجز. يرجى المحاولة لاحقاً.', details: bookingErr.message },
                    { status: 500 }
                );
            }
        }

        // ============================================
        // USE CENTRALIZED ORDER CREATION (Single Source of Truth)
        // ============================================
        let orderResult;
        try {
            orderResult = await createOrder({
                userId: stableIdentifier,
                userEmail: email || 'unknown',
                interpreterId: interpreterDoc._id.toString(),
                dreamText: dreamContent,
                context: {},
                bookingId: newBooking._id.toString()
            });
        } catch (orderErr: any) {
            console.error('[API/booking] Create Order Failed (Continuing booking):', orderErr);
            // Verify if we should abort? Usually booking record is enough, but order sync is preferred.
            // We continue to avoid failing the user's paid booking just because of order sync.
            orderResult = { success: false, order: null };
        }

        // Link booking to order
        if (orderResult && orderResult.success) {
            newBooking.dreamId = orderResult.order.id;
            await newBooking.save();
        }

        if (orderResult && orderResult.isDuplicate && orderResult.order) {
            console.log(`[Booking] Order was duplicate, returning existing: ${orderResult.order.id}`);
        } else if (orderResult && orderResult.success && orderResult.order) {
            console.log(`[Booking] New order created: ${orderResult.order.id}`);
        }


        if (emailConfigured && !existingBooking) {
            try {
                // Configure transporter (same as contact page)
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                // HTML Content for Admin
                const htmlContent = `
                    <h2>طلب حجز موعد جديد 📅</h2>
                    <hr>
                    <h3>تفاصيل الموعد:</h3>
                    <p><strong>رقم الحجز:</strong> #${newBooking._id.toString().slice(-6)}</p>
                    <p><strong>المفسر المطلوب:</strong> ${interpreterName || interpreterDoc?.displayName}</p>
                    <p><strong>التاريخ:</strong> ${date}</p>
                    <p><strong>الوقت:</strong> ${timeSlot || time}</p>
                    <p><strong>السعر:</strong> $${price || interpreterDoc?.price || 14.99}</p>
                    <hr>
                    <h3>بيانات العميل:</h3>
                    <p><strong>الاسم:</strong> ${name}</p>
                    <p><strong>رقم الواتساب:</strong> ${phone}</p>
                    <p><strong>البريد الإلكتروني:</strong> ${email || 'غير مُدخل'}</p>
                    <hr>
                    <h3>ملاحظات:</h3>
                    <p>${notes || 'لا توجد ملاحظات'}</p>
                `;

                // Send to admin
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: 'dev23hecoplus93mor@gmail.com',
                    replyTo: email || undefined,
                    subject: `[حجز موعد] طلب جديد من ${name} (#${newBooking._id.toString().slice(-6)})`,
                    html: htmlContent
                });

                // Send to Interpreter
                if (interpreterDoc?.email) {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: interpreterDoc.email,
                        subject: `[موعد جديد] لديك حجز جديد من ${name}`,
                        html: `
                            <div dir="rtl">
                                <h2>لديك حجز موعد جديد! 🎉</h2>
                                <p>مرحباً ${interpreterDoc.displayName}،</p>
                                <p>تم حجز موعد جديد للتفسير الخاص.</p>
                                <hr/>
                                <h3>بيانات العميل:</h3>
                                <ul>
                                    <li><strong>الاسم:</strong> ${name}</li>
                                    <li><strong>رقم الواتساب:</strong> ${phone}</li>
                                    <li><strong>البريد الإلكتروني:</strong> ${email || 'غير متوفر'}</li>
                                </ul>
                                <h3>تفاصيل الموعد:</h3>
                                <ul>
                                    <li><strong>التاريخ:</strong> ${date}</li>
                                    <li><strong>الوقت:</strong> ${timeSlot || time}</li>
                                    <li><strong>ملاحظات:</strong> ${notes || 'لا يوجد'}</li>
                                </ul>
                                <p>يرجى التواصل مع العميل لتأكيد الموعد.</p>
                            </div>
                        `
                    });
                }

                // إرسال تأكيد للعميل إذا أدخل بريده الإلكتروني
                if (email) {
                    const clientHtmlContent = `
                        <h2>تأكيد حجز موعد - المفسر 🌙</h2>
                        <p>مرحباً ${name}،</p>
                        <p>شكراً لحجز موعد معنا في منصة المفسر.</p>
                        <hr>
                        <h3>تفاصيل حجزك:</h3>
                        <ul>
                            <li><strong>رقم الحجز:</strong> #${newBooking._id.toString().slice(-6)}</li>
                            <li><strong>المفسر:</strong> ${interpreterName || interpreterDoc?.displayName}</li>
                            <li><strong>التاريخ:</strong> ${date}</li>
                            <li><strong>الوقت:</strong> ${timeSlot || time}</li>
                        </ul>
                        <hr>
                        <p>سنتواصل معك قريباً عبر الواتساب على الرقم <strong>${phone}</strong> لتأكيد الموعد وإتمام عملية الدفع.</p>
                        <hr>
                    `;

                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: 'تأكيد حجز موعد - المفسر',
                        html: clientHtmlContent
                    });
                }
            } catch (emailErr) {
                console.error('[API/booking] Email sending failed (Non-critical):', emailErr);
                // Continue - don't fail booking if email fails
            }
        } else {
            // وضع التطوير - تسجيل الحجز في الكونسول فقط
            console.log('📅 [DEV MODE] New booking received:', name);
        }

        return NextResponse.json({
            success: true,
            message: 'تم حجز الموعد بنجاح'
        });

    } catch (error: any) {
        console.error('Booking global error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ غير متوقع أثناء معالجة الحجز', details: error.message },
            { status: 500 }
        );
    }
}
