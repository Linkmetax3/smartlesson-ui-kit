
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ResourceSuggestion, ResourceDetail } from '@/types/resourceSuggestion';
import type { PostgrestError } from '@supabase/supabase-js';

const fetchResourceSuggestions = async (): Promise<ResourceSuggestion[]> => {
  const { data, error } = await supabase
    .from('resource_suggestions')
    .select(`
      id,
      plan_id,
      resource,
      created_at
    `);

  if (error) {
    console.error('Error fetching resource suggestions:', error);
    throw error;
  }

  // Ensure data is not null and cast the resource field
  return (data || []).map(item => ({
    ...item,
    resource: item.resource as unknown as ResourceDetail, // Cast 'resource' from Json to ResourceDetail
  }));
};

export const useResourceSuggestions = () => {
  return useQuery<ResourceSuggestion[], PostgrestError, ResourceSuggestion[], ["resourceSuggestions"]>({
    queryKey: ['resourceSuggestions'],
    queryFn: fetchResourceSuggestions,
  });
};

