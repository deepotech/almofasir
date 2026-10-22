import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Basic email format validation (server-side)
function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Sanitize plain-text values before embedding in HTML
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body as {
            name: string;
            email: string;
            subject: string;
            message: string;
        };

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate email format to prevent header injection
        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Check for API key — fail fast with a clear server-side log
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('[contact] RESEND_API_KEY is not set – email cannot be sent');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Resolve sender address.
        // For production use a verified domain address, e.g. contact@almofasir.com.
        // Falls back to the Resend sandbox address only if CONTACT_FROM_EMAIL is absent
        // (sandbox only delivers to the API-key owner's inbox).
        const fromAddress =
            process.env.CONTACT_FROM_EMAIL ?? 'Almofasser Contact <onboarding@resend.dev>';

        const toAddress =
            process.env.EMAIL_TO ?? 'dev23hecoplus93mor@gmail.com';

        const resend = new Resend(apiKey);

        const { data, error } = await resend.emails.send({
            from: fromAddress,
            // reply_to ensures clicking Reply in Gmail goes to the visitor
            replyTo: `${escapeHtml(name)} <${email}>`,
            to: toAddress,
            subject: `[Almofasser Contact] ${escapeHtml(subject)}`,
            html: `
                <h3>&#1585;&#1587;&#1575;&#1604;&#1577; &#1580;&#1583;&#1610;&#1583;&#1577; &#1605;&#1606; &#1606;&#1605;&#1608;&#1584;&#1580; &#1575;&#1604;&#1578;&#1608;&#1575;&#1589;&#1604;</h3>
                <p><strong>&#1575;&#1604;&#1575;&#1587;&#1605;:</strong> ${escapeHtml(name)}</p>
                <p><strong>&#1575;&#1604;&#1576;&#1585;&#1610;&#1583; &#1575;&#1604;&#1573;&#1604;&#1603;&#1578;&#1585;&#1608;&#1606;&#1610;:</strong> ${escapeHtml(email)}</p>
                <p><strong>&#1575;&#1604;&#1605;&#1608;&#1590;&#1608;&#1593;:</strong> ${escapeHtml(subject)}</p>
                <div style="margin-top:20px;padding:15px;background-color:#f5f5f5;border-radius:5px;">
                    <p><strong>&#1575;&#1604;&#1585;&#1587;&#1575;&#1604;&#1577;:</strong></p>
                    <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
                </div>
                <hr style="margin-top:30px;border:none;border-top:1px solid #ddd;" />
                <p style="color:#888;font-size:12px;">
                    To reply to this message, click Reply — your response will go directly to ${escapeHtml(email)}
                </p>
            `,
        });

        if (error) {
            // Log the structured Resend error without exposing the API key
            console.error('[contact] Resend send error:', JSON.stringify(error));
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            );
        }

        // Log only the message ID for traceability – no personal data
        console.info('[contact] Email sent successfully, id:', data?.id);

        return NextResponse.json({ success: true, id: data?.id });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[contact] Unexpected error:', message);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
