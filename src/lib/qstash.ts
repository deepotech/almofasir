import { Client } from '@upstash/qstash';
import { logger } from './logger';

export const hasQstashConfig = !!process.env.QSTASH_TOKEN;

const qstashClient = hasQstashConfig ? new Client({ token: process.env.QSTASH_TOKEN! }) : null;

/**
 * Safely dispatch a job to QStash.
 * If QStash isn't configured, throws so the caller can fall back to synchronous execution.
 */
export async function dispatchToQStash(endpointPath: string, payload: any): Promise<boolean> {
    if (!hasQstashConfig || !qstashClient) {
        throw new Error('QStash not configured');
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const destinationUrl = `${baseUrl}${endpointPath}`;

    try {
        await qstashClient.publishJSON({
            url: destinationUrl,
            body: payload,
            retries: 2, // Enable retries purely at the QStash worker layer
        });
        
        logger.info('Dispatched job to QStash', { event: 'QSTASH_DISPATCH', destinationUrl });
        return true;
    } catch (error) {
        logger.error('Failed to dispatch QStash job', { event: 'QSTASH_ERROR', destinationUrl }, error);
        throw error;
    }
}
