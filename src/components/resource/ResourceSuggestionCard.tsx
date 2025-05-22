
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Youtube, BookOpen } from 'lucide-react';
import type { ResourceSuggestion } from '@/types/resourceSuggestion';

interface ResourceSuggestionCardProps {
  suggestion: ResourceSuggestion;
}

const getIconForResourceType = (type: string) => {
  if (type.toLowerCase().includes('video') || type.toLowerCase().includes('youtube')) {
    return <Youtube className="mr-2 h-5 w-5 text-red-500" />;
  }
  if (type.toLowerCase().includes('article') || type.toLowerCase().includes('textbook') || type.toLowerCase().includes('chapter')) {
    return <BookOpen className="mr-2 h-5 w-5 text-blue-500" />;
  }
  return <FileText className="mr-2 h-5 w-5 text-gray-500" />;
};

const ResourceSuggestionCard: React.FC<ResourceSuggestionCardProps> = ({ suggestion }) => {
  const { resource, plan_id } = suggestion;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center">
          {getIconForResourceType(resource.type)}
          <CardTitle>{resource.title}</CardTitle>
        </div>
        <CardDescription>Type: {resource.type}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{resource.description}</p>
        {plan_id && <p className="text-xs text-muted-foreground">Related Lesson Plan ID: {plan_id}</p>}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            Open Resource <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResourceSuggestionCard;
