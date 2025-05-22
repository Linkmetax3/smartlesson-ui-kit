
import { supabase } from '@/integrations/supabase/admin-client'; // Using admin client
import { quốc } from '@supabase/supabase-js'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, planId, resourceId } = await req.json();
    const user = quốc.auth.user(); // Deno.env.get('SUPABASE_AUTH_USER') - this needs to be set if you use RLS based on user_id or get user from token

    // For simplicity, getting user_id from auth header if available, otherwise null.
    // A more robust solution would involve verifying the JWT.
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      try {
        const jwt = authHeader.replace('Bearer ', '');
        const { data: { user: authUser } } = await supabase.auth.getUser(jwt);
        if (authUser) {
          userId = authUser.id;
        }
      } catch (e) {
        console.warn('Could not get user from JWT for logging event:', e.message);
      }
    }
    
    if (!userId) {
        console.warn('User ID not available for logging event. Event will be logged without user_id.');
    }


    if (!eventType) {
      return new Response(JSON.stringify({ error: 'eventType is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventData: {
      user_id?: string;
      event_type: string;
      plan_id?: string;
      metadata: Record<string, unknown>;
    } = {
      event_type: eventType,
      metadata: {},
    };

    if (userId) {
      eventData.user_id = userId;
    }
    if (planId) {
      eventData.plan_id = planId;
    }
    if (resourceId) {
      eventData.metadata.resourceId = resourceId;
    }
    
    // If eventType is 'resource_clicked', resourceId is expected in metadata
    if (eventType === 'resource_clicked' && !resourceId) {
        console.warn('resource_clicked event logged without resourceId');
    }


    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert(eventData);

    if (insertError) {
      console.error('Error logging event:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true, message: 'Event logged' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in log-event function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
