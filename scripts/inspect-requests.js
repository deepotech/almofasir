const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schema to match what we expect
const DreamRequestSchema = new mongoose.Schema({}, { strict: false });
const DreamRequest = mongoose.model('DreamRequest', DreamRequestSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log('--- Latest 10 Dream Requests ---');
        const requests = await DreamRequest.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        requests.forEach((req, i) => {
            console.log(`\n[${i}] ID: ${req._id}`);
            console.log(`    User: ${req.userId}`);
            console.log(`    Interpreter: ${req.interpreterId}`);
            console.log(`    Status: ${req.status}`);
            console.log(`    Created: ${req.createdAt}`);
            console.log(`    IdempotencyKey: ${req.idempotencyKey}`);
            console.log(`    Text Preview: ${req.dreamText ? req.dreamText.substring(0, 50) : 'N/A'}...`);
            console.log(`    Text Length: ${req.dreamText ? req.dreamText.length : 0}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
