import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    return NextResponse.json(
        { error: 'DEPRECATED_ENDPOINT_USE_/api/orders_ONLY' },
        { status: 410 }
    );
}

export async function GET(req: NextRequest) {
    return NextResponse.json(
        { error: 'DEPRECATED_ENDPOINT_USE_/api/orders_ONLY' },
        { status: 410 }
    );
}
