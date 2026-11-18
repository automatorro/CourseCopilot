// ==========================================
// EDGE FUNCTION: analyze-slide
// VERSION: v3.0-CLAUDE
// ==========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, generation_run_id: providedRunId } = await req.json();

    if (typeof content !== 'string' || !content.trim()) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');
    if (!supabaseUrl || !serviceRoleKey || !authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated or server configuration is incomplete' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generationRunId = providedRunId ?? crypto.randomUUID();
    if (typeof generationRunId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(generationRunId)) {
      return new Response(JSON.stringify({ error: 'Invalid generation_run_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: operationStatus, error: operationError } = await supabase.rpc('increment_ai_operations', {
      p_user_id: user.id,
      p_amount: 1,
    });
    if (operationError || !operationStatus?.allowed) {
      return new Response(JSON.stringify({ error: operationError?.message || 'AI operation limit reached' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
    // Only needed for identity-linked keys not scoped to one workspace at creation —
    // see https://platform.claude.com/docs/en/manage-claude/authentication#select-a-workspace.
    const workspaceId = Deno.env.get('ANTHROPIC_WORKSPACE_ID') || 'wrkspc_01CfRoZ5D1KYnNSLd7i8C1Yz';

    const client = new Anthropic({
      apiKey,
      maxRetries: 0,
      defaultHeaders: { 'anthropic-workspace-id': workspaceId }
    });
    const model = "claude-sonnet-5";

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

    const tokenCount = await client.messages.countTokens({
      model,
      messages: [{ role: "user", content: prompt }]
    });
    const { data: reservation, error: reservationError } = await supabase.rpc('reserve_generation_ai_cost', {
      p_user_id: user.id,
      p_generation_run_id: generationRunId,
      p_model: model,
      p_estimated_input_tokens: tokenCount.input_tokens,
      p_requested_output_tokens: 2048,
      p_cost_cap_usd: 0.50,
    });
    if (reservationError) throw new Error(`AI cost reservation failed; no provider call was sent: ${reservationError.message}`);
    if (!reservation?.allowed) throw new Error('This generation reached its $0.50 AI cost limit.');
    if (typeof reservation.reservation_id !== 'string' ||
        !Number.isInteger(reservation.max_output_tokens) ||
        reservation.max_output_tokens < 256) {
      throw new Error('AI cost reservation returned invalid data; no provider call was sent.');
    }

    console.log(`[analyze-slide] Calling Claude model: ${model}...`);
    const result = await client.messages.create({
      model,
      max_tokens: reservation.max_output_tokens,
      messages: [{ role: "user", content: prompt }]
    });
    const responseText = result.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join('');
    if (!responseText.trim()) throw new Error('Slide analysis returned empty content.');

    const { error: usageError } = await supabase.from('user_usage').insert({
      user_id: user.id,
      model,
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      total_tokens: result.usage.input_tokens + result.usage.output_tokens,
      action: 'analyze_slide',
      generation_run_id: generationRunId,
    });
    if (usageError) throw new Error(`Token usage logging failed; generation stopped: ${usageError.message}`);

    const { error: settlementError } = await supabase.rpc('settle_generation_ai_cost', {
      p_reservation_id: reservation.reservation_id,
      p_user_id: user.id,
      p_actual_input_tokens: result.usage.input_tokens,
      p_actual_output_tokens: result.usage.output_tokens,
    });
    if (settlementError) throw new Error(`AI cost settlement failed; generation stopped: ${settlementError.message}`);

    // Clean up markdown code blocks if present
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let jsonResponse: unknown;
    try {
        jsonResponse = JSON.parse(cleanedText);
    } catch (e) {
        throw new Error(`Slide analysis returned invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }

    return new Response(JSON.stringify(jsonResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
