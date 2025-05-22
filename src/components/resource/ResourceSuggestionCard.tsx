
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Youtube, BookOpen, Tag } from 'lucide-react';
import type { ResourceSuggestion } from '@/types/resourceSuggestion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client'; // For invoking log-event
import { useToast } from '@/hooks/use-toast';

interface ResourceSuggestionCardProps {
  suggestion: ResourceSuggestion;
  planIdForAnalytics?: string; // Optional planId if context is known
}

const getIconForResourceType = (type: string) => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('video') || lowerType.includes('youtube')) {
    return <Youtube className="mr-2 h-5 w-5 text-red-500" />;
  }
  if (lowerType.includes('article') || lowerType.includes('textbook') || lowerType.includes('chapter') || lowerType.includes('worksheet')) {
    return <BookOpen className="mr-2 h-5 w-5 text-blue-500" />;
  }
  if (lowerType.includes('image')) {
    return <FileText className="mr-2 h-5 w-5 text-green-500" />; // Using FileText for image for now, consider FileImage
  }
  return <FileText className="mr-2 h-5 w-5 text-gray-500" />;
};

const ResourceSuggestionCard: React.FC<ResourceSuggestionCardProps> = ({ suggestion, planIdForAnalytics }) => {
  const { resource, id: resourceId, plan_id: resourcePlanId } = suggestion;
  const { toast } = useToast();

  const finalPlanIdForAnalytics = planIdForAnalytics || resourcePlanId;

  const handleOpenResource = async () => {
    try {
      await supabase.functions.invoke('log-event', {
        body: { 
          eventType: 'resource_clicked', 
          planId: finalPlanIdForAnalytics, 
          resourceId: resourceId 
        }
      });
      console.log('Resource click event logged for resourceId:', resourceId);
    } catch (error) {
      console.error('Failed to log resource click event:', error);
      toast({
        title: "Analytics Error",
        description: "Could not log resource interaction.",
        variant: "destructive",
      });
    }
    // Open link regardless of logging success/failure
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="w-full max-w-md flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start">
          {getIconForResourceType(resource.type)}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="truncate hover:text-clip">
                  {resource.title.length > 50 ? resource.title.substring(0, 50) + '...' : resource.title}
                </CardTitle>
              </TooltipTrigger>
              {resource.title.length > 50 && (
                <TooltipContent>
                  <p>{resource.title}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Type: {resource.type}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">{resource.description}</p>
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {resource.tags.map(tag => (
              <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center">
                <Tag className="h-3 w-3 mr-1" /> {tag}
              </span>
            ))}
          </div>
        )}
        {resourcePlanId && <p className="text-xs text-muted-foreground mt-2">Related Lesson Plan ID: {resourcePlanId}</p>}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleOpenResource}>
          Open Resource <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResourceSuggestionCard;
