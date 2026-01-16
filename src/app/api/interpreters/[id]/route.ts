import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interpreter from '@/models/Interpreter';

// GET /api/interpreters/[id] - Get single interpreter details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;

        const interpreter = await Interpreter.findById(id)
            .select('-earnings -pendingEarnings -userId')
            .lean();

        if (!interpreter) {
            return NextResponse.json(
                { error: 'Interpreter not found' },
                { status: 404 }
            );
        }

        // Format response
        const formatted = {
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
            isActive: interpreter.isActive,
            status: interpreter.status
        };

        return NextResponse.json({ interpreter: formatted });

    } catch (error) {
        console.error('Error fetching interpreter:', error);
        return NextResponse.json(
            { error: 'Failed to fetch interpreter' },
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
