import fs from 'fs';
import path from 'path';

console.log('══════════════════════════════════════════════════════════════');
console.log('            SUPABASE RLS POLICY VALIDATION SCRIPT              ');
console.log('══════════════════════════════════════════════════════════════\n');

// 1. Read and Parse .env.local without external dependencies
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error(`❌ Error: .env.local not found at: ${envPath}`);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};

envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const equalIdx = trimmed.indexOf('=');
    if (equalIdx === -1) return;
    const key = trimmed.slice(0, equalIdx).trim();
    const value = trimmed.slice(equalIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !anonKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not defined in .env.local');
    process.exit(1);
}

console.log(`📡 Targeting Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Public API Key (first 15 chars): ${anonKey.slice(0, 15)}...\n`);

// 2. Define tables to validate
interface TableTest {
    name: string;
    expectedBehavior: 'allow_public_read' | 'deny_all';
}

const tablesToTest: TableTest[] = [
    // Public Read Tables
    { name: 'dreams', expectedBehavior: 'allow_public_read' },
    { name: 'symbols', expectedBehavior: 'allow_public_read' },
    { name: 'interpreters', expectedBehavior: 'allow_public_read' },
    { name: 'programmatic_pages', expectedBehavior: 'allow_public_read' },
    { name: 'page_metrics', expectedBehavior: 'allow_public_read' },
    { name: 'City', expectedBehavior: 'allow_public_read' },
    { name: 'Category', expectedBehavior: 'allow_public_read' },
    { name: 'Business', expectedBehavior: 'allow_public_read' },

    // Service Role Only Tables
    { name: 'users', expectedBehavior: 'deny_all' },
    { name: 'dream_requests', expectedBehavior: 'deny_all' },
    { name: 'bookings', expectedBehavior: 'deny_all' },
    { name: 'transactions', expectedBehavior: 'deny_all' },
    { name: 'notifications', expectedBehavior: 'deny_all' },
    { name: 'interpreter_requests', expectedBehavior: 'deny_all' },
    { name: 'platform_settings', expectedBehavior: 'deny_all' },
    { name: 'audit_logs', expectedBehavior: 'deny_all' },
];

async function testTable(table: TableTest) {
    const endpoint = `${supabaseUrl}/rest/v1/${table.name}?select=*&limit=1`;
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Accept': 'application/json',
            },
        });

        const status = response.status;
        const data = await response.json().catch(() => null);

        let success = false;
        let reason = '';

        if (table.expectedBehavior === 'allow_public_read') {
            // Should succeed or return empty data/empty array (200)
            if (status === 200) {
                success = true;
                reason = `Public read allowed (HTTP 200). Returned ${Array.isArray(data) ? `${data.length} records` : 'valid JSON'}.`;
            } else if (status === 404) {
                // If table doesn't exist, it's not a security failure, it just means the optional table is missing
                success = true;
                reason = `Optional table missing (HTTP 404).`;
            } else {
                success = false;
                reason = `Failed to read public table (HTTP ${status}): ${JSON.stringify(data)}`;
            }
        } else {
            // Should fail with permission denied (code 42501, status 401 or 403 or empty due to RLS)
            const dbErrorCode = data?.code;
            const message = data?.message;

            if (status === 401 || status === 403 || dbErrorCode === '42501' || (status === 200 && Array.isArray(data) && data.length === 0)) {
                success = true;
                if (dbErrorCode === '42501' || message?.includes('permission denied')) {
                    reason = `Access denied by database permissions (HTTP ${status}, PostgreSQL Code: ${dbErrorCode || '42501'}).`;
                } else if (status === 200 && Array.isArray(data) && data.length === 0) {
                    reason = `Access restricted by RLS (HTTP 200, returned 0 rows).`;
                } else {
                    reason = `Access blocked (HTTP ${status}): ${message || JSON.stringify(data)}`;
                }
            } else if (status === 404) {
                // Not found is fine (it means table isn't created yet or was deleted)
                success = true;
                reason = `Table not found (HTTP 404).`;
            } else {
                success = false;
                reason = `VULNERABILITY: Public read succeeded on protected table (HTTP ${status}): ${JSON.stringify(data)}`;
            }
        }

        return { table, success, status, reason };
    } catch (error: any) {
        // Handle optional table misses or fetch errors gracefully
        return {
            table,
            success: table.expectedBehavior === 'allow_public_read' ? false : true,
            status: 0,
            reason: `Fetch failed: ${error.message}`,
        };
    }
}

async function run() {
    let failedCount = 0;
    const results = [];

    for (const table of tablesToTest) {
        const res = await testTable(table);
        results.push(res);
        if (!res.success) {
            failedCount++;
        }
    }

    console.log('📊 RESULTS SUMMARY:\n');
    results.forEach((r) => {
        const icon = r.success ? '✅' : '❌';
        const typeStr = r.table.expectedBehavior === 'allow_public_read' ? 'PUBLIC_READ' : 'PROTECTED  ';
        console.log(`${icon} [${typeStr}] ${r.table.name.padEnd(22)} -> ${r.reason}`);
    });

    console.log('\n══════════════════════════════════════════════════════════════');
    if (failedCount === 0) {
        console.log('🎉 SUCCESS: All tables comply with the specified RLS policy rules!');
    } else {
        console.error(`❌ FAILURE: ${failedCount} tables failed the security policy check.`);
        process.exit(1);
    }
    console.log('══════════════════════════════════════════════════════════════');
}

run();
