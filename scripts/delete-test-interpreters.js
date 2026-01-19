#!/usr/bin/env node
/**
 * Script to delete test interpreters from the database
 * Run with: node scripts/delete-test-interpreters.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Define the Interpreter schema (simplified)
const InterpreterSchema = new mongoose.Schema({
    userId: String,
    email: String,
    displayName: String,
    bio: String,
    isActive: Boolean,
    status: String,
}, { timestamps: true });

const Interpreter = mongoose.model('Interpreter', InterpreterSchema);

async function deleteTestInterpreters() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully!\n');

        // First, let's list all interpreters
        console.log('Current interpreters in database:');
        const allInterpreters = await Interpreter.find({}, 'displayName email userId').lean();
        allInterpreters.forEach((i, idx) => {
            console.log(`${idx + 1}. ${i.displayName} (${i.email}) - userId: ${i.userId}`);
        });
        console.log('');

        // Define the interpreters to delete (by display name)
        const namesToDelete = [
            'HICHAM EL MORSLI',
            'مفسر تجريبي'
        ];

        console.log('Deleting test interpreters:');
        for (const name of namesToDelete) {
            const result = await Interpreter.deleteOne({ displayName: name });
            if (result.deletedCount > 0) {
                console.log(`✓ Deleted: ${name}`);
            } else {
                console.log(`✗ Not found: ${name}`);
            }
        }

        console.log('\nRemaining interpreters:');
        const remaining = await Interpreter.find({}, 'displayName email').lean();
        remaining.forEach((i, idx) => {
            console.log(`${idx + 1}. ${i.displayName} (${i.email})`);
        });

        console.log('\n✅ Cleanup completed successfully!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
    }
}

deleteTestInterpreters();
