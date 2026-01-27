
# Deployment Instructions

## Google Analytics
The application uses `@next/third-parties` for Google Analytics.
**Required Environment Variable:**
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Your GA Measurement ID (e.g., `G-XXXXXXXXXX`).

## Contact Form
The contact form uses **Resend** (HTTP API).
**Required Environment Variables:**
- `RESEND_API_KEY`: Your API key from Resend.
- `EMAIL_TO` (Optional): The recipient email address.

> [!IMPORTANT]
> **Redeploy Required**: After adding these variables to your hosting dashboard (Vercel/Netlify), you must **REDEPLOY** the application for them to take effect.
