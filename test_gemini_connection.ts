import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const apiKey = Deno.env.get("GEMINI_API_KEY");

if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
    console.error("Run with: GEMINI_API_KEY=your_key_here deno run --allow-net --allow-env test_gemini_connection.ts");
    Deno.exit(1);
}

console.log("Checking available models with provided API key...");

try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using a dummy model to get the model list, or just listModels if available on the client
    // The SDK doesn't have a direct 'listModels' on the client instance in all versions, 
    // but we can try to get a model and run a simple prompt, or use the model manager if exposed.

    // Actually, the error message suggested calling ListModels. 
    // In the JS SDK, this is often done via the `getGenerativeModel` then maybe not directly.
    // Let's try to just run a simple generation with gemini-1.5-flash to see the exact error locally.

    const modelName = "gemini-1.5-flash";
    console.log(`\nTesting generation with model: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    console.log("✅ Success! Response:", response.text());

} catch (error) {
    console.error("\n❌ Error details:");
    console.error(error);

    if (error.message.includes("404")) {
        console.log("\n💡 Analysis: 404 usually means the model name is wrong OR the API key is for a project that doesn't have access to this model.");
    }
}
