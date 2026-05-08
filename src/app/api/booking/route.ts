import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase';
import { createOrder } from '@/lib/orders';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { interpreter: interpreterId, interpreterName, date, time, timeSlot, name, phone, email, notes, price, userId } = body;

        if (!interpreterId || !date || !time || !name || !phone) {
            return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب ملؤها' }, { status: 400 });
        }

        const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

        const { data: interpreterDoc } = await supabaseAdmin
            .from('interpreters')
            .select('*')
            .eq('id', interpreterId)
            .single();

        if (!interpreterDoc) {
            return NextResponse.json({ error: 'المفسر غير موجود أو المعرف غير صحيح' }, { status: 404 });
        }

        const bookingPrice = price || interpreterDoc.price || 14.99;
        const appointmentDetails = ` تفاصيل الموعد: ${date} الساعة ${timeSlot || time}`;
        let dreamContent = notes ? `${notes}\n\n[حجز موعد] ${appointmentDetails}` : `طلب تفسير حلم (حجز موعد). ${appointmentDetails}`;
        if (dreamContent.length < 25) {
            dreamContent = `طلب حجز موعد للتفسير الخاص.\n${dreamContent}`;
        }

        const stableIdentifier = userId || phone || email;

        // Check for duplicate booking
        let query = supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('interpreter_id', interpreterId)
            .eq('date', date)
            .eq('time_slot', timeSlot || time)
            .neq('status', 'cancelled');
        
        if (userId) {
            query = query.or(`user_id.eq.${userId},user_email.eq.${email},client_phone.eq.${phone}`);
        } else {
            query = query.or(`user_email.eq.${email},client_phone.eq.${phone}`);
        }

        const { data: existingBooking } = await query.limit(1).maybeSingle();

        let newBooking;

        if (existingBooking) {
            newBooking = existingBooking;
        } else {
            const { data, error } = await supabaseAdmin
                .from('bookings')
                .insert({
                    user_email: email || 'unknown',
                    user_id: userId || null,
                    interpreter_name: interpreterName || interpreterDoc.display_name || 'Unknown',
                    interpreter_id: interpreterId,
                    date,
                    time_slot: timeSlot || time,
                    client_name: name,
                    client_phone: phone,
                    notes,
                    amount: bookingPrice,
                    currency: 'USD',
                    status: 'confirmed',
                    payment_status: 'paid'
                })
                .select()
                .single();
            if (error) throw error;
            newBooking = data;
        }

        let orderResult;
        try {
            orderResult = await createOrder({
                userId: stableIdentifier,
                userEmail: email || 'unknown',
                interpreterId: interpreterDoc.id,
                dreamText: dreamContent,
                context: {},
                bookingId: newBooking.id
            });
        } catch (orderErr: any) {
            console.error('[API/booking] Create Order Failed:', orderErr);
            orderResult = { success: false, order: null };
        }

        if (orderResult?.success && orderResult.order) {
            await supabaseAdmin.from('bookings').update({ dream_id: orderResult.order.id }).eq('id', newBooking.id);
        }

        if (emailConfigured && !existingBooking) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });

                const htmlContent = `
                    <h2>طلب حجز موعد جديد 📅</h2><hr>
                    <h3>تفاصيل الموعد:</h3>
                    <p><strong>رقم الحجز:</strong> #${newBooking.id.slice(0,6)}</p>
                    <p><strong>المفسر المطلوب:</strong> ${interpreterName || interpreterDoc.display_name}</p>
                    <p><strong>التاريخ:</strong> ${date}</p>
                    <p><strong>الوقت:</strong> ${timeSlot || time}</p>
                    <p><strong>السعر:</strong> $${bookingPrice}</p><hr>
                    <h3>بيانات العميل:</h3>
                    <p><strong>الاسم:</strong> ${name}</p>
                    <p><strong>رقم الواتساب:</strong> ${phone}</p>
                    <p><strong>البريد:</strong> ${email || 'غير مُدخل'}</p><hr>
                    <p><strong>ملاحظات:</strong> ${notes || 'لا توجد'}</p>`;

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: 'dev23hecoplus93mor@gmail.com',
                    replyTo: email || undefined,
                    subject: `[حجز موعد] طلب جديد من ${name} (#${newBooking.id.slice(0,6)})`,
                    html: htmlContent
                });

                if (interpreterDoc.email) {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: interpreterDoc.email,
                        subject: `[موعد جديد] لديك حجز جديد من ${name}`,
                        html: `<div dir="rtl"><h2>لديك حجز موعد جديد! 🎉</h2><p>مرحباً ${interpreterDoc.display_name}...</p></div>`
                    });
                }

                if (email) {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: 'تأكيد حجز موعد - المفسر',
                        html: `<h2>تأكيد حجز موعد - المفسر 🌙</h2><p>مرحباً ${name}...</p>`
                    });
                }
            } catch (emailErr) {}
        }

        return NextResponse.json({ success: true, message: 'تم حجز الموعد بنجاح' });
    } catch (error: any) {
        console.error('Booking error:', error);
        return NextResponse.json({ error: 'حدث خطأ', details: error.message }, { status: 500 });
    }
}
