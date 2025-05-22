
import React, { useState, useEffect } from 'react';
import { LessonContent, lessonContentKeys, lessonSectionTitles } from '@/types/lesson';
import { LessonSectionCard } from './LessonSectionCard';
import { supabase } from '@/integrations/supabase/client'; // For invoking edge function
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface LessonPreviewProps {
  initialPlanId: string | null;
  initialContent: LessonContent | null;
  isLoading?: boolean;
}

export const LessonPreview: React.FC<LessonPreviewProps> = ({ initialPlanId, initialContent, isLoading }) => {
  const [planId, setPlanId] = useState<string | null>(initialPlanId);
  const [currentLessonContent, setCurrentLessonContent] = useState<LessonContent | null>(initialContent);
  const { toast } = useToast();

  useEffect(() => {
    setPlanId(initialPlanId);
    setCurrentLessonContent(initialContent);
  }, [initialPlanId, initialContent]);

  const handleSaveSection = async (
    _planId: string, // planId from card, should match current state
    updatedFullContent: LessonContent
  ): Promise<{ success: boolean; data?: LessonContent; error?: string }> => {
    if (!planId) {
      return { success: false, error: "Plan ID is missing." };
    }

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('update-lesson', {
        body: {
          planId: planId,
          content: updatedFullContent,
        },
      });

      if (invokeError) throw invokeError;
      
      if (data && data.content) {
        setCurrentLessonContent(data.content as LessonContent);
        return { success: true, data: data.content as LessonContent };
      } else {
        return { success: false, error: "Update response was empty or invalid." };
      }
    } catch (error: any) {
      console.error("Failed to save section:", error);
      return { success: false, error: error.message || "An unexpected error occurred during save." };
    }
  };

  const getFullContent = (): LessonContent => {
    if (!currentLessonContent) {
        // This should ideally not happen if we're rendering cards
        throw new Error("Current lesson content is not available.");
    }
    return currentLessonContent;
  }


  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold mb-6">Lesson Preview</h2>
        {lessonContentKeys.map((key) => (
          <div key={key} className="p-4 border rounded-lg shadow-md">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </div>
        ))}
      </div>
    );
  }
  
  if (!planId || !currentLessonContent) {
    return (
      <div className="mt-8 text-center text-muted-foreground">
        <p>Generate a lesson plan using the form above to see the preview here.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 pt-6 border-t">
      <h2 className="text-2xl font-semibold mb-6">Lesson Preview & Edit</h2>
      {lessonContentKeys.map((key) => (
        <LessonSectionCard
          key={key}
          planId={planId}
          sectionKey={key}
          sectionTitle={lessonSectionTitles[key]}
          initialData={currentLessonContent[key]}
          onSave={handleSaveSection}
          getFullContent={getFullContent}
        />
      ))}
    </div>
  );
};

