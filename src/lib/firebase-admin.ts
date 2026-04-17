import * as admin from 'firebase-admin';

export const initFirebaseAdmin = () => {
    if (admin.apps.length) return; // Already initialized

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
        console.log('[Firebase Admin] ✅ Initialized with Service Account');
    } else {
        console.warn('[Firebase Admin] ⚠️ Missing Service Account credentials (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). Token verification will use fallback decode.');
        try {
            admin.initializeApp({ projectId: projectId || 'almofaser' });
        } catch (e) {
            // ignore if already initialized
        }
    }
};

// Initialize immediately on module load
initFirebaseAdmin();

const hasServiceAccount = !!(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

export const auth = hasServiceAccount && admin.apps.length ? admin.auth() : null;
export const db = hasServiceAccount && admin.apps.length ? admin.firestore() : null;

/**
 * Verifies the ID token.
 * - If Firebase Admin Service Account credentials are present → uses Firebase Admin SDK (secure/production).
 * - Otherwise → falls back to JWT payload decode (dev only, not cryptographically verified).
 */
export const verifyIdToken = async (token: string): Promise<{ uid: string; email?: string; [key: string]: unknown }> => {
    if (hasServiceAccount) {
        try {
            const adminAuth = admin.auth();
            const decoded = await adminAuth.verifyIdToken(token);
            return decoded as { uid: string; email?: string; [key: string]: unknown };
        } catch (error) {
            console.error('[Firebase Admin] Token verification failed:', error);
            throw error;
        }
    }

    // ── Development Fallback: Decode JWT without verification ──────────────
    // WARNING: This is NOT cryptographically secure. Only used when Service Account is missing.
    console.warn('[Firebase Admin] Using insecure JWT decode fallback (no Service Account configured).');
    try {
        const parts = token.split('.');
        if (parts.length < 3) throw new Error('Invalid JWT format');

        // Fix base64url encoding to standard base64
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (payloadBase64.length % 4)) % 4);
        const payloadJson = Buffer.from(payloadBase64 + padding, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);

        const uid = payload.user_id || payload.sub;
        if (!uid) throw new Error('Cannot extract uid from token payload');

        return {
            uid,
            email: payload.email,
            ...payload,
        };
    } catch (e) {
        console.error('[Firebase Admin] Failed to decode token manually:', e);
        throw new Error('Invalid token');
    }
};
