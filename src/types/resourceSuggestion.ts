
import type { Tables } from '@/integrations/supabase/types';

// Define the structure for the 'resource' JSONB field
export interface ResourceDetail {
  type: string;
  title: string;
  url:string;
  description: string;
  tags?: string[]; // Added tags
}

// Define the type for a Resource Suggestion, extending the Supabase table row
// and specifying the 'resource' field with our detailed type.
export interface ResourceSuggestion extends Omit<Tables<'resource_suggestions'>, 'resource'> {
  resource: ResourceDetail;
}
