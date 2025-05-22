
// Import Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Update-lesson function script started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    // Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your Edge Function secrets
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { planId, content } = await req.json();
    console.log("Received planId:", planId);
    console.log("Received content for update:", content);

    if (!planId || !content) {
      return new Response(JSON.stringify({ error: "planId and content are required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Implement actual database update logic here using supabaseAdmin client
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('lesson_plans')
      .update({ content: content, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      // Check if the error is due to no rows found, which might not be an "error" if upsert-like behavior is desired
      // or if the planId simply doesn't exist. For now, we'll treat it as an error.
      if (updateError.code === 'PGRST116') { // PGRST116: "The result contains 0 rows"
         return new Response(JSON.stringify({ error: `Lesson plan with ID ${planId} not found.` }), {
          status: 404, // Not Found
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Successfully updated content:", updateData);

    return new Response(JSON.stringify({ content: updateData }), { // Return the updated data from DB
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Error in update-lesson function:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

