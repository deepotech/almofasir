import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InterpreterRequest from '@/models/InterpreterRequest';
import User from '@/models/User';
import Interpreter from '@/models/Interpreter'; // Added
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        await dbConnect();

        const { requestId, email, name } = await req.json();

        if (!requestId || !email) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Update Request Status
        const request = await InterpreterRequest.findByIdAndUpdate(
            requestId,
            { status: 'approved' },
            { new: true }
        );

        if (!request) {
            return NextResponse.json({ message: 'Request not found' }, { status: 404 });
        }

        // 2. Update Role if User exists (or just ensure email is recognized as interpreter for future auth)
        // Ideally, the user already registered via Firebase. If so, we find them by email and update role.
        // If not, they will register later, and our signup logic should check this 'approved' status.
        // For MVP: We assume they might be a user or will be. We'll search by email.

        console.log(`[Approve API] Processing approval for request: ${requestId}, email: ${email}`);

        let user = await User.findOne({ email });

        if (user) {
            console.log(`[Approve API] Found user for email ${email}. FirebaseUid: ${user.firebaseUid}`);

            user.role = 'interpreter';
            await user.save();
            console.log(`[Approve API] Updated user role to interpreter.`);

            // CREATE INTERPRETER PROFILE
            try {
                const newInterpreter = await Interpreter.findOneAndUpdate(
                    { userId: user.firebaseUid },
                    {
                        userId: user.firebaseUid,
                        email: user.email,
                        displayName: request.fullName,
                        bio: request.bio || 'مفسر أحلام معتمد',
                        interpretationType: request.interpretationType || 'mixed',
                        price: 15,
                        currency: 'USD',
                        responseTime: 24,
                        isActive: true,
                        status: 'active'
                    },
                    { upsert: true, new: true }
                );
                console.log(`[Approve API] Successfully created/updated interpreter profile: ${newInterpreter._id}`);
            } catch (err) {
                console.error(`[Approve API] Error creating interpreter profile:`, err);
            }

        } else {
            console.warn(`[Approve API] User NOT found for email: ${email}. Interpreter profile was NOT created.`);
            // Note: If user is not found, we cannot link an Interpreter profile to a Firebase UID.
        }

        // 3. Send Acceptance Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const loginLink = `http://localhost:3000/auth/login`; // Change to production URL later

        const emailContent = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; text-align: right;">
                <h2 style="color: #4f46e5;">مبارك! تم قبولك كمفسر في منصة المفسر 🎉</h2>
                <p>مرحباً ${name}،</p>
                <p>يسعدنا إبلاغك بأنه تمت مراجعة طلب انضمامك والموافقة عليه.</p>
                <p>أنت الآن جزء من نخبة المفسرين في منصتنا.</p>
                
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${loginLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        الدخول إلى لوحة المفسر
                    </a>
                </div>

                <p style="color: #666;">يرجى تسجيل الدخول بنفس البريد الإلكتروني الذي قدمت الطلب به.</p>
                <p>نتمنى لك رحلة موفقة في خدمة الناس ونشر العلم النافع.</p>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'مبروك! تم قبول طلب انضمامك لمنصة المفسر',
                html: emailContent,
            });
        } catch (emailError) {
            console.error('Failed to send acceptance email', emailError);
            // Don't fail the request, just log it
        }

        return NextResponse.json({ success: true, message: 'Interpret Approved Successfully' });

    } catch (error) {
        console.error('Error approving interpreter:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
