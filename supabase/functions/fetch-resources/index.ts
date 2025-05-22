
import { supabase } from '@/integrations/supabase/admin-client'; // Using admin client for direct DB access from function
import type { ResourceSuggestion, ResourceDetail } from '@/types/resourceSuggestion.ts'; // Assuming path aliasing works or adjust path

// Note: Ensure this path alias '@/types/resourceSuggestion.ts' resolves correctly in your Deno environment
// or use a relative path like '../../src/types/resourceSuggestion.ts'.
// For simplicity, I'm using the alias; you might need to adjust for Deno's import resolution.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    const { data, error } = await supabase
      .from('resource_suggestions')
      .select('id, resource')
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }

    const formattedData = (data || []).map(item => ({
      id: item.id,
      resource: item.resource as unknown as ResourceDetail,
    }));

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-resources function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
