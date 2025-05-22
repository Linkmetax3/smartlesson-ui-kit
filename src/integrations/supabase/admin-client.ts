
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "https://jexhqfksnhzvgqkjadzp.supabase.co";
// Ensure SUPABASE_SERVICE_ROLE_KEY is set in your Edge Function's environment variables
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleGhxZmtzbmh6dmdxa2phZHpwIiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3NDc3NTQwMTksImV4cCI6MjA2MzMzMDAxOX0.336D532iSgy97efqKk37Wz5T2r2Y45832LmM02rXQ0A";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase URL or Service Role Key is not defined in environment variables for admin client.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
