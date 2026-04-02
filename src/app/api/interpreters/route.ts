import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interpreter from '@/models/Interpreter';

export const dynamic = 'force-dynamic';

// GET /api/interpreters - List all active interpreters
export async function GET(req: NextRequest) {
    const startTime = Date.now();

    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // religious, psychological, symbolic, mixed
        const sortBy = searchParams.get('sort') || 'rating'; // rating, price, responseTime
        const includeAll = searchParams.get('includeAll') === 'true'; // Debug: bypass filters

        console.log('[DATA DEBUG] /api/interpreters called', {
            type,
            sortBy,
            includeAll,
            timestamp: new Date().toISOString()
        });

        // Build query — relaxed to show active OR pending interpreters
        const query: Record<string, unknown> = {
            // Only hard-exclude suspended accounts
            status: { $ne: 'suspended' },
        };

        // Allow dev/debug to bypass all filters
        if (!includeAll) {
            query.isActive = true;
            // Exclude test accounts by name
            query.displayName = {
                $nin: ['HICHAM EL MORSLI', 'مفسر تجريبي', 'Test Interpreter']
            };
        }

        if (type && ['religious', 'psychological', 'symbolic', 'mixed'].includes(type)) {
            query.interpretationType = type;
        }

        console.log('[DATA DEBUG] Query filters:', JSON.stringify(query));

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

        console.log(`[DATA DEBUG] Interpreters fetched: ${interpreters.length} records`);

        if (interpreters.length === 0) {
            // Debug: also try without filters to see if any records exist at all
            const totalCount = await Interpreter.countDocuments({});
            const activeCount = await Interpreter.countDocuments({ isActive: true });
            const statusCounts = await Interpreter.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            console.log('[DATA DEBUG] No active interpreters found!', {
                totalInDB: totalCount,
                activeInDB: activeCount,
                statusBreakdown: statusCounts,
                hint: 'Check if interpreters have isActive=true and status!=suspended in the DB'
            });
        }

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
            rating: interpreter.rating || 0,
            totalRatings: interpreter.totalRatings || 0,
            completedDreams: interpreter.completedDreams || 0,
            isActive: interpreter.isActive,
            status: interpreter.status
        }));

        const elapsed = Date.now() - startTime;
        console.log(`[DATA DEBUG] Interpreters response ready: count=${formatted.length}, elapsed=${elapsed}ms`);

        return NextResponse.json({
            success: true,
            count: formatted.length,
            interpreters: formatted,
            total: formatted.length
        });

    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`[DATA DEBUG] Supabase/DB error fetching interpreters (elapsed=${elapsed}ms):`, error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch interpreters',
                interpreters: [],
                count: 0
            },
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
    if (hours <= 6) return 'خلال 6 ساعات';
    if (hours <= 24) return 'خلال 24 ساعة';
    if (hours <= 48) return 'خلال 48 ساعة';
    if (hours <= 72) return 'خلال 3 أيام';
    return `خلال ${Math.ceil(hours / 24)} أيام`;
}
