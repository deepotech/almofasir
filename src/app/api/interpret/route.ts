import { NextRequest, NextResponse } from 'next/server';

/**
 * ⚠️ DEPRECATED ENDPOINT ⚠️
 * 
 * This endpoint has been deprecated to enforce strict quota control.
 * All dream interpretations must go through POST /api/orders with type: 'AI'.
 * 
 * The /api/orders endpoint uses validateAccess() with proper transaction support
 * to prevent quota bypass attacks.
 * 
 * Date deprecated: 2026-01-15
 */

export async function POST(req: NextRequest) {
    console.warn('[DEPRECATED] Attempt to use /api/interpret endpoint');
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
                    interpreter: 'ibn-sirin',
                    context: {}
                }
            }
        },
        { status: 410 }
    );
}
