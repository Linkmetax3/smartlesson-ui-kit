import React, { useState } from 'react';
import { useResourceSuggestions } from '@/hooks/useResourceSuggestions';
import ResourceSuggestionCard from '@/components/resource/ResourceSuggestionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Terminal, Filter, FileVideo, FileText, Newspaper, Image as ImageIcon } from "lucide-react";

// Define resource types for filtering
const resourceTypes = [
  { name: "All", icon: Filter },
  { name: "Video", icon: FileVideo },
  { name: "Worksheet", icon: FileText },
  { name: "Article", icon: Newspaper },
  { name: "Image", icon: ImageIcon },
];

const ResourcesPage = () => {
  const { data: suggestions, isLoading, error } = useResourceSuggestions();
  const [selectedType, setSelectedType] = useState<string>("All");

  const filteredSuggestions = suggestions?.filter(suggestion => {
    if (selectedType === "All") return true;
    const typeLower = suggestion.resource.type.toLowerCase();
    const selectedTypeLower = selectedType.toLowerCase();
    // Special handling for "Worksheet" if its type might be more general like "article" or "text"
    if (selectedTypeLower === "worksheet") {
        return typeLower.includes("worksheet") || typeLower.includes("textbook") || typeLower.includes("chapter") || typeLower.includes("article");
    }
    return typeLower.includes(selectedTypeLower);
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">AI-Generated Resources</h1>
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {resourceTypes.map((type) => (
            <Skeleton key={type.name} className="h-9 w-24 rounded-full" />
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
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Fetching Resources</AlertTitle>
          <AlertDescription>
            Could not load resource suggestions. Please try again later. <br />
            <span className="text-xs mt-2 block">Details: {error.message}</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-6">AI-Generated Resources</h1>
        <p>No resource suggestions available at the moment. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">AI-Generated Resources</h1>
      
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
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

      {filteredSuggestions && filteredSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuggestions.map((suggestion) => (
            <ResourceSuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">No resources match the selected filter.</p>
      )}
    </div>
  );
};

export default ResourcesPage;
