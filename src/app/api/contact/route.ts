import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { name, email, subject, message } = await req.json();

        // Validate input
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Configure transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Sender email (e.g. your gmial)
                pass: process.env.EMAIL_PASS  // App Password
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'dev23hecoplus93mor@gmail.com', // Target email
            replyTo: email,
            subject: `[Almofasser Contact] ${subject}`,
            html: `
                <h3>New Contact Message</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
