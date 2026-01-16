import { NextResponse } from 'next/server';

/**
 * ⚠️ DEPRECATED ENDPOINT ⚠️
 * 
 * This endpoint has been deprecated to enforce strict quota control.
 * All dream interpretations must go through POST /api/orders with type: 'AI'.
 * 
 * SECURITY ISSUE: This endpoint had its own quota logic that:
 * - Trusted client-provided isGuest flag (easily spoofable)
 * - Did not use transactions
 * - Had inconsistent reset time logic (calendar day vs 24h rolling)
 * 
 * Date deprecated: 2026-01-15
 */

export async function POST(req: Request) {
    console.warn('[DEPRECATED] Attempt to use /api/dreams/analyze endpoint');
    return NextResponse.json(
        {
            error: 'DEPRECATED_ENDPOINT_USE_/api/orders_ONLY',
            message: 'This endpoint is no longer supported. Please use POST /api/orders with type: "AI"',
            migration: {
                endpoint: '/api/orders',
                method: 'POST',
                body: {
                    type: 'AI',
                    dreamText: 'your dream content',
                    context: {}
                }
            }
        },
        { status: 410 }
    );
}
