
// Import Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Update-lesson function script started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Initializing Supabase admin client...");
    // Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your Edge Function secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase URL or Service Role Key is not set in environment variables.");
      return new Response(JSON.stringify({ error: "Server configuration error." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log("Supabase admin client initialized.");

    const body = await req.json();
    const { planId, content } = body;
    console.log("Received planId for update:", planId);
    // console.log("Received content for update:", JSON.stringify(content, null, 2)); // Log full content if needed for debugging, can be large

    if (!planId || !content) {
      console.error("planId and content are required. Received:", { planId, contentIsPresent: !!content });
      return new Response(JSON.stringify({ error: "planId and content are required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Updating lesson_plans table for id: ${planId}`);
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('lesson_plans')
      .update({ content: content, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .select() // Select the updated row
      .single(); // Expect a single row

    if (updateError) {
      console.error(`Supabase update error for planId ${planId}:`, updateError);
      if (updateError.code === 'PGRST116') { // PGRST116: "The result contains 0 rows"
         return new Response(JSON.stringify({ error: `Lesson plan with ID ${planId} not found.` }), {
          status: 404, // Not Found
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: updateError.message || "Database update failed." }), {
        status: 500, // Internal Server Error for other DB errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!updateData) {
      // This case should ideally be caught by PGRST116, but as a fallback
      console.error(`No data returned after update for planId ${planId}, though no explicit error was thrown.`);
      return new Response(JSON.stringify({ error: `Lesson plan with ID ${planId} not found or update failed silently.` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Successfully updated content for planId ${planId}.`);
    // console.log("Updated data from DB:", JSON.stringify(updateData, null, 2)); // Log if needed

    return new Response(JSON.stringify({ content: updateData }), { // Return the updated data from DB
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Unhandled error in update-lesson function:", error);
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
