import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interpreter from '@/models/Interpreter';

// GET /api/interpreters - List all active interpreters
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // religious, psychological, symbolic, mixed
        const sortBy = searchParams.get('sort') || 'rating'; // rating, price, responseTime

        // Build query
        const query: Record<string, unknown> = {
            status: 'active',
            isActive: true
        };

        if (type && ['religious', 'psychological', 'symbolic', 'mixed'].includes(type)) {
            query.interpretationType = type;
        }

        // Build sort
        let sort: Record<string, 1 | -1> = { rating: -1 }; // Default: highest rated first
        if (sortBy === 'price') {
            sort = { price: 1 }; // Lowest price first
        } else if (sortBy === 'responseTime') {
            sort = { responseTime: 1 }; // Fastest first
        } else if (sortBy === 'dreams') {
            sort = { completedDreams: -1 }; // Most experienced first
        }

        const interpreters = await Interpreter.find(query)
            .select('-earnings -pendingEarnings -userId') // Hide sensitive fields
            .sort(sort)
            .lean();

        // Format response
        const formatted = interpreters.map(interpreter => ({
            id: interpreter._id,
            displayName: interpreter.displayName,
            avatar: interpreter.avatar,
            bio: interpreter.bio,
            interpretationType: interpreter.interpretationType,
            interpretationTypeAr: getTypeArabic(interpreter.interpretationType),
            price: interpreter.price,
            responseTime: interpreter.responseTime,
            responseTimeText: getResponseTimeText(interpreter.responseTime),
            rating: interpreter.rating,
            totalRatings: interpreter.totalRatings,
            completedDreams: interpreter.completedDreams,
            isActive: interpreter.isActive
        }));

        return NextResponse.json({
            interpreters: formatted,
            total: formatted.length
        });

    } catch (error) {
        console.error('Error fetching interpreters:', error);
        return NextResponse.json(
            { error: 'Failed to fetch interpreters' },
            { status: 500 }
        );
    }
}

// Helper functions
function getTypeArabic(type: string): string {
    const types: Record<string, string> = {
        'religious': 'شرعي',
        'psychological': 'نفسي',
        'symbolic': 'رمزي',
        'mixed': 'شامل'
    };
    return types[type] || 'شامل';
}

function getResponseTimeText(hours: number): string {
    if (hours <= 24) return 'خلال 24 ساعة';
    if (hours <= 48) return 'خلال 48 ساعة';
    if (hours <= 72) return 'خلال 3 أيام';
    return `خلال ${Math.ceil(hours / 24)} أيام`;
}
