import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        '[DB] MONGODB_URI is not defined in .env.local — add it and restart the server'
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents existing connections being created on every
 * API route call.
 */
interface MongooseCache {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
    if (cached!.conn) {
        return cached!.conn;
    }

    if (!cached!.promise) {
        const opts = {
            bufferCommands: false,
            // Standard limits (30s) instead of aggressive 5s to prevent cold-start timeouts
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 30000,
        };

        console.log('[DB] Connecting to MongoDB Atlas...');
        cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
            console.log('[DB] ✅ Connected to MongoDB Atlas successfully');
            return m.connection;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e: any) {
        cached!.promise = null; // Reset so next call retries
        console.error('[DB] ❌ MongoDB Atlas connection failed:', e?.message);
        if (e.name === 'MongooseServerSelectionError' && e.reason && e.reason.servers) {
            console.error('[DB DEBUG] Servers Topology State:');
            const servers = Array.from(e.reason.servers.entries());
            servers.forEach(([address, server]: [string, any]) => {
                console.error(`- Server ${address}: error = ${server.error?.message || 'unknown'}`);
            });
        }
        throw e;
    }

    return cached!.conn;
}

/**
 * Executes a Promise-based database operation with timeout and retries.
 * @param operation The database query function to execute
 * @param maxRetries Maximum number of retries (default 2)
 * @param timeoutMs Timeout per attempt in milliseconds (default 5000)
 */
export async function withDbRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    timeoutMs: number = 5000
): Promise<T> {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            await dbConnect(); // ensure DB is connected
            
            // Promise.race to enforce timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('DB_TIMEOUT')), timeoutMs);
            });
            
            const result = await Promise.race([operation(), timeoutPromise]);
            return result;
        } catch (error: any) {
            attempt++;
            console.error(`[DB RETRY] Attempt ${attempt} failed:`, error?.message);
            
            if (attempt > maxRetries) {
                console.error(`[DB RETRY] Max retries reached (${maxRetries}). Giving up.`);
                throw error;
            }
            
            // Short exponential backoff
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
    }
    throw new Error('Unreachable code');
}

export default dbConnect;
