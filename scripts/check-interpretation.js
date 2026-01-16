const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const DreamRequestSchema = new mongoose.Schema({
    userId: String,
    interpreterId: String,
    status: String,
    dreamText: String,
    interpretationText: String,
    createdAt: Date,
    updatedAt: Date
}, { strict: false });

const DreamRequest = mongoose.model('DreamRequest', DreamRequestSchema);

async function inspectLatestCompleted() {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log('--- Latest Completed Requests ---');
        const requests = await DreamRequest.find({ status: 'completed' })
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean();

        if (requests.length === 0) {
            console.log('No completed requests found.');
        } else {
            requests.forEach((req, i) => {
                console.log(`\n[${i}] ID: ${req._id}`);
                console.log(`    Status: ${req.status}`);
                console.log(`    Updated: ${req.updatedAt}`);
                console.log(`    Interpretation Length: ${req.interpretationText ? req.interpretationText.length : 'MISSING/NULL'}`);
                if (req.interpretationText) {
                    console.log(`    Preview: ${req.interpretationText.substring(0, 50)}...`);
                }
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspectLatestCompleted();
