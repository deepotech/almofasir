import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken } from '@/lib/firebase-admin';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        const userId = decodedToken.uid;
        console.log('Fetching bookings for interpreter:', userId);

        // Find interpreter profile
        const { data: interpreter, error: intError } = await supabaseAdmin
            .from('interpreters')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (intError || !interpreter) {
            console.error('Interpreter profile not found for userId:', userId);
            return NextResponse.json({ error: 'ملف المفسر غير موجود' }, { status: 404 });
        }

        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('interpreter_id', interpreter.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`Found ${bookings?.length ?? 0} bookings`);

        return NextResponse.json({ bookings: bookings ?? [] });

    } catch (error: any) {
        console.error('Error fetching interpreter bookings:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
