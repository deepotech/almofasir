import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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
    } catch {
        if (process.env.NODE_ENV === 'development') {
            try {
                const payload = token.split('.')[1];
                const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                return decodedValue.user_id || decodedValue.sub || null;
            } catch {
                return null;
            }
        }
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: interpreter, error } = await supabaseAdmin
            .from('interpreters')
            .select('price, response_time, pricing_note, last_price_update')
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !interpreter) {
            return NextResponse.json({ error: 'Interpreter profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            price: interpreter.price,
            responseTime: interpreter.response_time,
            pricingNote: interpreter.pricing_note,
            lastPriceUpdate: interpreter.last_price_update,
        });
    } catch (error) {
        console.error('Error fetching pricing:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { price, responseTime, pricingNote } = body;

        if (typeof price !== 'number' || price < 5) {
            return NextResponse.json({ error: 'Invalid price. Minimum is 5.' }, { status: 400 });
        }

        const validResponseTimes = [6, 12, 24, 48];
        if (!validResponseTimes.includes(responseTime)) {
            return NextResponse.json({ error: 'Invalid response time.' }, { status: 400 });
        }

        const { data: interpreter, error } = await supabaseAdmin
            .from('interpreters')
            .select('price, last_price_update')
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !interpreter) {
            return NextResponse.json({ error: 'Interpreter profile not found' }, { status: 404 });
        }

        // Check 24-hour price change limit
        if (interpreter.price !== price && interpreter.last_price_update) {
            const diffMs = Date.now() - new Date(interpreter.last_price_update).getTime();
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
            if (diffHours < 24) {
                return NextResponse.json({
                    error: `Cannot change price. Try again in ${24 - diffHours} hours.`
                }, { status: 429 });
            }
        }

        const updates: Record<string, unknown> = {
            price,
            response_time: responseTime,
        };
        if (pricingNote !== undefined) updates.pricing_note = pricingNote;
        if (interpreter.price !== price) updates.last_price_update = new Date().toISOString();

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('interpreters')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, interpreter: updated });
    } catch (error) {
        console.error('Error updating pricing:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
