import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

initFirebaseAdmin();

async function resolveUserId(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = await getAuth().verifyIdToken(token);
        return decoded.uid;
    } catch {
        if (process.env.NODE_ENV === 'development') {
            try {
                const payload = token.split('.')[1];
                const d = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                return d.user_id || d.sub || null;
            } catch { return null; }
        }
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Total dreams count
        const { count: totalDreams } = await supabaseAdmin
            .from('dreams')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Mood stats
        const { data: moodRows } = await supabaseAdmin
            .from('dreams')
            .select('mood')
            .eq('user_id', userId);

        const moods: Record<string, number> = {};
        (moodRows ?? []).forEach((r: any) => {
            const m = r.mood || 'neutral';
            moods[m] = (moods[m] || 0) + 1;
        });

        // Interpreter stats
        const { data: interpRows } = await supabaseAdmin
            .from('dreams')
            .select('interpreter')
            .eq('user_id', userId);

        const interpreters: Record<string, number> = {};
        (interpRows ?? []).forEach((r: any) => {
            const k = r.interpreter || 'unknown';
            interpreters[k] = (interpreters[k] || 0) + 1;
        });

        const topInterpreter = Object.entries(interpreters)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        // Timeline stats — last 6 months, grouped by month
        const { data: timelineRows } = await supabaseAdmin
            .from('dreams')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', sixMonthsAgo.toISOString());

        const timelineMap: Record<string, number> = {};
        (timelineRows ?? []).forEach((r: any) => {
            const month = r.created_at?.substring(0, 7); // "YYYY-MM"
            if (month) timelineMap[month] = (timelineMap[month] || 0) + 1;
        });

        const timeline = Object.entries(timelineMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([_id, count]) => ({ _id, count }));

        return NextResponse.json({ totalDreams, moods, interpreters, topInterpreter, timeline });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
