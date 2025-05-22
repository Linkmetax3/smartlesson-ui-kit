
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/admin-client.ts"; // Updated import path
import { getAuth } from "https://deno.land/x/supabase_auth_helpers@v0.1.0/mod.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, planId, resourceId, quizId, metadata: additionalMetadata } = await req.json();
    
    // Get user from JWT
    const { user, error: authError } = await getAuth(req, { supabaseClient: supabase });
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!eventType) {
      return new Response(JSON.stringify({ error: 'eventType is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`Logging event: ${eventType} for user: ${user.id}`);

    const eventData: {
      user_id: string;
      event_type: string;
      plan_id?: string;
      quiz_id?: string;
      metadata?: object;
    } = {
      user_id: user.id,
      event_type: eventType,
    };

    if (planId) eventData.plan_id = planId;
    if (quizId) eventData.quiz_id = quizId;

    let combinedMetadata = { ...additionalMetadata };
    if (resourceId) {
      combinedMetadata = { ...combinedMetadata, resourceId };
    }
    if (Object.keys(combinedMetadata).length > 0) {
        eventData.metadata = combinedMetadata;
    }


    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert(eventData);

    if (insertError) {
      console.error('Error logging event in Edge Function:', insertError);
      throw insertError; // Caught by outer try-catch
    }
    console.log('Successfully logged event:', eventType, eventData);

    return new Response(JSON.stringify({ message: 'Event logged successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in log-event function:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
