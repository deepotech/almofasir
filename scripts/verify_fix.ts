
import mongoose from 'mongoose';
import User from '../src/models/User';
import dotenv from 'dotenv';
import { headers } from 'next/headers';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('No MONGODB_URI');
    process.exit(1);
}

// Mock Fetch for API simulation (roughly) or we define a test function that calls the logic? 
// Better: We script the DB state changes and call the API URL if running app, or just simulate steps if easier.
// Since we have a running dev server at localhost:3000, let's hit the endpoint!

const BASE_URL = 'http://localhost:3000';

async function runTest() {
    console.log('--- STARTING CRITICAL BUG VERIFICATION ---');

    // 1. Setup Database Connection to find/reset user
    await mongoose.connect(MONGODB_URI!);
    console.log('DB Connected');

    const testUid = 'test-critical-fix-user';

    // Reset User
    await User.deleteMany({ firebaseUid: testUid });
    const user = await User.create({
        firebaseUid: testUid,
        email: 'test@fix.com',
        credits: 1,
        plan: 'free',
        lastFreeDreamAt: new Date(Date.now() - 86400000 * 2) // 2 days ago (Available)
    });
    console.log('Test User Created:', user._id);

    // Mock Token (The API has a dev-mode fallback for base64 tokens)
    const mockToken = Buffer.from(JSON.stringify({ user_id: testUid, email: 'test@fix.com' })).toString('base64');
    const authHeader = `Bearer header.${mockToken}.signature`;

    // --- TEST CASE 1: Daily Free Usage ---
    console.log('\n[TEST 1] Daily Free Usage (Expect: Success)');

    // Request 1: Should Succeed (First of Day)
    const res1 = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'AI',
            dreamText: 'Test Dream 1 (First)',
            context: { gender: 'male' }
        })
    });

    const data1 = await res1.json();
    console.log('Req 1 Status:', res1.status);

    if (res1.status === 200) {
        console.log('✅ PASS: First request succeeded.');
    } else {
        console.error('❌ FAIL: First request failed.', data1);
    }

    // Request 2: Should Fail (Strict Daily Limit)
    console.log('\n[TEST 1.B] Second Request Same Day (Expect: 403 DAILY_FREE_LIMIT_REACHED)');
    const res1b = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'AI',
            dreamText: 'Test Dream 1b (Second - Should Fail)',
            context: { gender: 'male' }
        })
    });

    const data1b = await res1b.json();
    console.log('Req 2 Status:', res1b.status);
    console.log('Response:', data1b);

    if (res1b.status === 403 && data1b.code === 'DAILY_FREE_LIMIT_REACHED') {
        console.log('✅ PASS: Second request strictly blocked by server limit.');
    } else {
        console.error('❌ FAIL: Second request not blocked or wrong error.', data1b);
    }

    // --- TEST CASE 2: Paid Credit Usage ---
    console.log('\n[TEST 2] Paid Credit Usage (Expect: Success, Credits: 0)');

    // Force a small delay to ensure DB sync if any (though await should handle it)

    const res2 = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'AI',
            dreamText: 'Test Dream 2 (Paid)',
            context: { gender: 'male' }
        })
    });

    const data2 = await res2.json();
    console.log('Status:', res2.status);
    console.log('Response:', data2);

    const userAfter2 = await User.findOne({ firebaseUid: testUid });

    if (userAfter2?.credits === 0) {
        console.log('✅ PASS: Paid Credit deducted.');
    } else {
        console.error('❌ FAIL: Credits:', userAfter2?.credits);
    }

    // --- TEST CASE 3: Insufficient Credits ---
    console.log('\n[TEST 3] Insufficient Credits (Expect: 403)');

    const res3 = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'AI',
            dreamText: 'Test Dream 3 (Fail)',
            context: { gender: 'male' }
        })
    });

    const data3 = await res3.json();
    console.log('Status:', res3.status);
    console.log('Response:', data3);

    if (res3.status === 403 && data3.error === 'INSUFFICIENT_CREDITS') {
        console.log('✅ PASS: Request blocked correctly.');
    } else {
        console.error('❌ FAIL: Status', res3.status);
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
    process.exit(0);
}

runTest().catch(console.error);
