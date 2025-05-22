
import React from 'react';
import { useResourceSuggestions } from '@/hooks/useResourceSuggestions';
import ResourceSuggestionCard from '@/components/resource/ResourceSuggestionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const ResourcesPage = () => {
  const { data: suggestions, isLoading, error } = useResourceSuggestions();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">AI-Generated Resources</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion) => (
          <ResourceSuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>
    </div>
  );
};

export default ResourcesPage;
