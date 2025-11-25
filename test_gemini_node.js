import https from 'https';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
    console.error("Run with: set GEMINI_API_KEY=your_key && node test_gemini_node.js (Windows CMD)");
    console.error("Or: $env:GEMINI_API_KEY='your_key'; node test_gemini_node.js (PowerShell)");
    process.exit(1);
}

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp", // Trying experimental if 2.0 was seen
    "gemini-2.0-flash"      // Trying what was in git history
];

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);

    const data = JSON.stringify({
        contents: [{
            parts: [{ text: "Hello, are you working?" }]
        }]
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ Success with ${modelName}!`);
                    try {
                        const parsed = JSON.parse(responseBody);
                        if (parsed.candidates && parsed.candidates[0].content) {
                            console.log("Response snippet:", parsed.candidates[0].content.parts[0].text.substring(0, 50));
                        } else {
                            console.log("Response structure:", JSON.stringify(parsed, null, 2));
                        }
                    } catch (e) {
                        console.log("Raw response:", responseBody);
                    }
                    resolve(true);
                } else {
                    console.log(`❌ Failed with ${modelName}. Status: ${res.statusCode}`);
                    // console.log("Error details:", responseBody); // Less verbose on failure unless needed
                    if (res.statusCode === 404) console.log("  -> 404 Not Found (Model not available or API key invalid for this model)");
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`Error requesting ${modelName}:`, error);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log("Starting Gemini API connectivity tests (ESM Mode)...");

    let anySuccess = false;
    for (const model of modelsToTest) {
        const success = await testModel(model);
        if (success) anySuccess = true;
    }

    if (!anySuccess) {
        console.log("\n⚠️ All model tests failed. This usually indicates an invalid API key or a project configuration issue in Google AI Studio.");
    } else {
        console.log("\n🎉 At least one model worked! Please use that model name in your code.");
    }
}

runTests();
