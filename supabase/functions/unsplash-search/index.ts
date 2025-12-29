import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, page = 1, per_page = 20, orientation } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!accessKey) {
        throw new Error("UNSPLASH_ACCESS_KEY not configured");
    }

    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}&client_id=${accessKey}`;
    
    if (orientation) {
        url += `&orientation=${orientation}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : 'Failed to fetch from Unsplash');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
