import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `
      You are an expert instructional designer and presentation architect. 
      Analyze the following slide content (Markdown) and decide on the best visual layout.
      
      You MUST return a VALID JSON object with this exact structure:
      {
        "layout": "HERO" | "SPLIT_LEFT" | "SPLIT_RIGHT" | "BIG_STAT" | "COMPARISON" | "QUOTATION" | "TRIAD" | "TIMELINE" | "DEFAULT",
        "title": "Refined Title (short)",
        "content": ["Bullet 1", "Bullet 2"],
        "imagePrompt": "A detailed visual description for Unsplash search",
        "accentColor": "#HexColor"
      }

      Layout Logic:
      - HERO: Start of section, big concept.
      - SPLIT_LEFT/RIGHT: Standard content + image.
      - BIG_STAT: If there is a key number/percentage.
      - COMPARISON: If comparing 2 things.
      - QUOTATION: If it's a quote.
      - TRIAD: If there are exactly 3 key points.
      - TIMELINE: If there is a sequence or process.
      - DEFAULT: Fallback.

      Keep content concise. "imagePrompt" should be visual and descriptive, suitable for finding high-quality stock photos (e.g., "office meeting, modern style, bright lighting").
    `;

    const prompt = `${systemPrompt}\n\nSlide Content:\n${content}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if present
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let jsonResponse;
    try {
        jsonResponse = JSON.parse(cleanedText);
    } catch (e) {
        // Fallback if JSON parsing fails
        jsonResponse = {
            layout: "DEFAULT",
            title: "Error Parsing AI Response",
            content: [content],
            imagePrompt: "business abstract",
            error: "Failed to parse JSON"
        };
    }

    return new Response(JSON.stringify(jsonResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
