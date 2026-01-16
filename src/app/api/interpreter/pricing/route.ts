import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interpreter from '@/models/Interpreter';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

async function getUserId(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (authError) {
        if (process.env.NODE_ENV === 'development') {
            try {
                const payload = token.split('.')[1];
                const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                return decodedValue.user_id || decodedValue.sub || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const interpreter = await Interpreter.findOne({ userId });
        if (!interpreter) {
            return NextResponse.json({ error: 'Interpreter profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            price: interpreter.price,
            responseTime: interpreter.responseTime,
            pricingNote: interpreter.pricingNote,
            lastPriceUpdate: interpreter.lastPriceUpdate
        });
    } catch (error) {
        console.error('Error fetching pricing:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { price, responseTime, pricingNote } = body;

        // Validation
        if (typeof price !== 'number' || price < 5) { // Assuming 5 is strict min
            return NextResponse.json({ error: 'Invalid price. Minimum is 5.' }, { status: 400 });
        }

        const validResponseTimes = [6, 12, 24, 48];
        if (!validResponseTimes.includes(responseTime)) {
            return NextResponse.json({ error: 'Invalid response time.' }, { status: 400 });
        }

        const interpreter = await Interpreter.findOne({ userId });
        if (!interpreter) {
            return NextResponse.json({ error: 'Interpreter profile not found' }, { status: 404 });
        }

        // Check 24 hour limit if price changed
        if (interpreter.price !== price) {
            if (interpreter.lastPriceUpdate) {
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - new Date(interpreter.lastPriceUpdate).getTime());
                const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                if (diffHours < 24) {
                    return NextResponse.json({ error: `Cannot change price. Try again in ${24 - diffHours} hours.` }, { status: 429 });
                }
            }
            interpreter.lastPriceUpdate = new Date();
        }

        interpreter.price = price;
        interpreter.responseTime = responseTime;
        if (pricingNote !== undefined) interpreter.pricingNote = pricingNote;

        await interpreter.save();

        return NextResponse.json({ success: true, interpreter });
    } catch (error) {
        console.error('Error updating pricing:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
