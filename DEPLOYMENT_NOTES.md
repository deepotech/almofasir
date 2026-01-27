
# Deployment Instructions

## Google Analytics
The application uses `@next/third-parties` for Google Analytics.
**Required Environment Variable:**
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Your GA Measurement ID (e.g., `G-XXXXXXXXXX`).

## Contact Form
The contact form uses `nodemailer` with Gmail.
**Required Environment Variables:**
- `EMAIL_USER`: The Gmail address sending the emails.
- `EMAIL_PASS`: The **App Password** for that Gmail account (16 chars).
- `EMAIL_TO` (Optional): The email address that should receive the messages. If not set, it defaults to `EMAIL_USER`.

> [!IMPORTANT]
> **Redeploy Required**: After adding these variables to your hosting dashboard (Vercel/Netlify), you must **REDEPLOY** the application for them to take effect.
