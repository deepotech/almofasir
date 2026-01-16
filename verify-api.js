
const fs = require('fs');
const path = require('path');

async function verify() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('No .env.local found');
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/OPENROUTER_API_KEY=(.+)/);

        if (!match) {
            console.error('No OPENROUTER_API_KEY found in .env.local');
            return;
        }

        const apiKey = match[1].trim();
        console.log('Found API Key (length):', apiKey.length);

        const payload = {
            model: "openai/gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: "Hello, are you working?"
                }
            ]
        };

        console.log('Testing with payload:', JSON.stringify(payload, null, 2));

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Almofasser Test",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Result:', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

verify();
