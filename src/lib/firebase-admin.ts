import * as admin from 'firebase-admin';

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

export const initFirebaseAdmin = () => {
    if (!admin.apps.length) {
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
        } else {
            // Fallback for development/build without secrets - preventing crash
            // Note: verifyIdToken will fail if not properly initialized
            console.warn('Firebase Admin not initialized: Missing Service Account Credentials.');

            // In a real scenario, we might initialize with applicationDefault() 
            // if running in GCP, or throw an error.
            // For this demo, we verify if we can proceed without craching.
            try {
                admin.initializeApp();
            } catch (e) {
                console.error('Failed to initialize Firebase Admin automatically:', e);
            }
        }
    }
};
// Initialize immediately
initFirebaseAdmin();

export const auth = admin.apps.length ? admin.auth() : null;
export const db = admin.apps.length ? admin.firestore() : null;

/**
 * Verifies the ID token. 
 * If Firebase Admin is not configured (missing Service Account), 
 * it falls back to insecurely decoding the token for development purposes.
 */
export const verifyIdToken = async (token: string) => {
    if (auth && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            return await auth.verifyIdToken(token);
        } catch (error) {
            console.error("Firebase Admin Verification Failed:", error);
            // Fallthrough to decode if verification fails in dev? No, failing verification is good.
            throw error;
        }
    }

    // Fallback for Development without Service Account
    console.warn('⚠️ Firebase Admin credentials missing. Using insecure token decoding for development.');
    try {
        const parts = token.split('.');
        if (parts.length < 2) throw new Error('Invalid token format');

        // Base64 decode the payload
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - payloadBase64.length % 4) % 4);
        const payloadJson = Buffer.from(payloadBase64 + padding, 'base64').toString();
        const payload = JSON.parse(payloadJson);

        return {
            uid: payload.sub || payload.user_id,
            email: payload.email,
            ...payload
        };
    } catch (e) {
        console.error('Failed to decode token manually:', e);
        throw new Error('Invalid token');
    }
};
