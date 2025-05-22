
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ResourceSuggestion } from '@/types/resourceSuggestion';
import ResourceSuggestionCard from './ResourceSuggestionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Filter, ListCollapse, LayoutGrid, FileVideo, FileText, Newspaper, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon

interface ResourcesTabProps {
  planId: string;
}

const resourceTypes = [
  { name: "All", icon: Filter },
  { name: "Video", icon: FileVideo },
  { name: "Worksheet", icon: FileText }, // Assuming worksheet can be FileText
  { name: "Article", icon: Newspaper },
  { name: "Image", icon: ImageIcon },
];

export const ResourcesTab: React.FC<ResourcesTabProps> = ({ planId }) => {
  const [suggestions, setSuggestions] = useState<ResourceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("All");

  useEffect(() => {
    const fetchResourcesForPlan = async () => {
      if (!planId) return;
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('fetch-resources', {
          body: { planId }
        });

        if (invokeError) throw invokeError;
        
        // Ensure data is correctly typed as ResourceSuggestion[]
        // The edge function returns { id: string, resource: ResourceDetail }[]
        // We need to map this to ResourceSuggestion[] which also includes plan_id and created_at
        // For now, we adapt to what the function returns. If full ResourceSuggestion is needed, function must return it.
        const typedData = (data as any[] || []).map(item => ({
            ...item, // This will include id and resource
            plan_id: planId, // Add planId back as it's part of ResourceSuggestion
            created_at: new Date().toISOString(), // Mock created_at as it's not returned by function
        })) as ResourceSuggestion[];


        setSuggestions(typedData);
      } catch (err: any) {
        console.error("Error fetching resources for plan:", err);
        setError(err.message || "Failed to load resources for this lesson plan.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourcesForPlan();
  }, [planId]);

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (selectedType === "All") return true;
    const typeLower = suggestion.resource.type.toLowerCase();
    const selectedTypeLower = selectedType.toLowerCase();
    // Handle "Worksheet" which might be covered by "article" or "text" in getIconForResourceType
    if (selectedTypeLower === "worksheet") {
        return typeLower.includes("worksheet") || typeLower.includes("textbook") || typeLower.includes("chapter") || typeLower.includes("article");
    }
    return typeLower.includes(selectedTypeLower);
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex space-x-2 mb-4">
          {resourceTypes.map(() => (
            <Skeleton key={Math.random()} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col space-y-3">
              <Skeleton className="h-[125px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[calc(100%-30px)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="p-4">
      <div className="mb-6 flex flex-wrap gap-2">
        {resourceTypes.map(type => {
          const IconComponent = type.icon;
          return (
            <Button
              key={type.name}
              variant={selectedType === type.name ? "default" : "outline"}
              onClick={() => setSelectedType(type.name)}
              className="rounded-full px-4 py-2 text-sm"
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {type.name}
            </Button>
          );
        })}
      </div>
      {filteredSuggestions.length === 0 ? (
        <p>No resources found for this lesson plan matching your filter.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuggestions.map((suggestion) => (
            <ResourceSuggestionCard key={suggestion.id} suggestion={suggestion} planIdForAnalytics={planId} />
          ))}
        </div>
      )}
    </div>
  );
};
