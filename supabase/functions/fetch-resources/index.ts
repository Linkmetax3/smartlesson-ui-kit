
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/admin-client.ts"; // Updated import path
import type { ResourceDetail } from "../../../src/types/resourceSuggestion.ts"; // Adjusted path, ensure this resolves

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId } = await req.json();

    if (!planId) {
      return new Response(JSON.stringify({ error: 'planId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`Fetching resources for planId: ${planId}`);

    const { data, error } = await supabase
      .from('resource_suggestions')
      .select('id, resource')
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching resources in Edge Function:', error);
      throw error; // This will be caught by the outer try-catch
    }
    console.log('Successfully fetched resources:', data);

    const formattedData = (data || []).map(item => ({
      id: item.id,
      // The 'resource' field is JSONB, so it should already be an object.
      // Casting to ResourceDetail aligns with its expected structure.
      resource: item.resource as ResourceDetail,
    }));

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in fetch-resources function:', error.message);
    // Ensure the response error format is consistent
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
