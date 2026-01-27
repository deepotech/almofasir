import { NextResponse } from 'next/server';
import { Resend } from 'resend';

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

        // Check for API Key
        if (!process.env.RESEND_API_KEY) {
            console.error('Missing RESEND_API_KEY');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        // Email content
        const { data, error } = await resend.emails.send({
            from: 'Almofasser Contact <onboarding@resend.dev>', // Use verified domain or testing email
            to: process.env.EMAIL_TO || 'dev23hecoplus93mor@gmail.com', // Fallback to your email
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
        });

        if (error) {
            console.error('Resend Error:', error);
            return NextResponse.json(
                { error: 'Failed to send email', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Failed to send email', details: error?.message || String(error) },
            { status: 500 }
        );
    }
}
