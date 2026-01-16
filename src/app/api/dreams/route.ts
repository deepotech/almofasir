import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { auth } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

// Initialize Firebase Admin for server-side token verification
// We'll need to create this lib file as well
initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Get the authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            // Add development fallback matching POST handler
            if (process.env.NODE_ENV === 'development') {
                console.warn('[API /api/dreams GET] Auth verification failed, falling back to insecure decoding for development.');
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    if (!userId) throw new Error('No user_id in token');
                } catch (decodeError) {
                    console.error('[API /api/dreams GET] Fallback decode failed:', decodeError);
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                console.error('Auth verification failed:', authError);
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Pagination logic
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        // Unified Flow: Fetch from DreamRequest (Orders) instead of Dream model
        const DreamRequest = (await import('@/models/DreamRequest')).default;

        const requests = await DreamRequest.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await DreamRequest.countDocuments({ userId });

        // Map DreamRequests to expected frontend Dream structure
        const mappedDreams = requests.map(req => ({
            _id: req._id,
            userId: req.userId,
            title: req.dreamText.split(' ').slice(0, 5).join(' ') + '...', // Generate title from text
            content: req.dreamText,
            date: req.createdAt,
            status: req.status === 'completed' ? 'completed' : 'pending',
            interpretation: req.status === 'completed' ? {
                summary: req.interpretationText?.substring(0, 100) + '...',
                humanResponse: req.interpretationText,
                aiGenerated: req.type === 'AI'
            } : undefined,
            type: req.type || 'HUMAN', // 'AI' or 'HUMAN'
            tags: [] // Tags not stored in DreamRequest yet, can add later
        }));

        return NextResponse.json({
            dreams: mappedDreams,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching dreams:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Auth verification failed, falling back to insecure decoding for development.');
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    if (!userId) throw new Error('No user_id in token');
                } catch (decodeError) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body = await req.json();
        const { title, content, mood, date, interpreter, interpretation, tags, status, context } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const dream = await Dream.create({
            userId,
            title: title || 'بدون عنوان',
            content,
            mood: mood || 'neutral',
            date: date || new Date(),
            interpreter,
            status: status || 'pending',
            interpretation,
            tags,
            // Context fields
            // Context fields - Sanitize enums
            socialStatus: (context?.socialStatus && ['single', 'married', 'divorced', 'widowed'].includes(context.socialStatus)) ? context.socialStatus : undefined,
            dominantFeeling: context?.dominantFeeling || undefined,
            gender: (context?.gender && ['male', 'female'].includes(context.gender)) ? context.gender : undefined
        });

        return NextResponse.json({ dream }, { status: 201 });

    } catch (error) {
        console.error('Error creating dream:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
