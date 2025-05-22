
import React, { useState, useEffect } from 'react';
import { LessonContent, lessonContentKeys, lessonSectionTitles } from '@/types/lesson';
import { LessonSectionCard } from './LessonSectionCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface LessonPreviewProps {
  initialPlanId: string | null;
  initialContent: LessonContent | null;
  isLoading?: boolean; // For initial generation loading
}

export const LessonPreview: React.FC<LessonPreviewProps> = ({ initialPlanId, initialContent, isLoading }) => {
  const [planId, setPlanId] = useState<string | null>(initialPlanId);
  const [currentLessonContent, setCurrentLessonContent] = useState<LessonContent | null>(initialContent);
  const { toast } = useToast();

  useEffect(() => {
    setPlanId(initialPlanId);
    setCurrentLessonContent(initialContent);
  }, [initialPlanId, initialContent]);

  // This function will be called by LessonSectionCard on save
  const handleSaveSection = async (
    _planIdFromCard: string, // planId from card, should match current state planId
    updatedFullContent: LessonContent
  ): Promise<{ success: boolean; data?: LessonContent; error?: string }> => {
    if (!planId) {
      toast({ variant: "destructive", title: "Error", description: "Plan ID is missing. Cannot save." });
      return { success: false, error: "Plan ID is missing." };
    }
    console.log("Attempting to save planId:", planId);
    console.log("Sending updatedFullContent:", updatedFullContent);

    try {
      const { data: functionResponse, error: invokeError } = await supabase.functions.invoke('update-lesson', {
        body: {
          planId: planId,
          content: updatedFullContent, // Send the entire updated lesson content
        },
      });

      if (invokeError) {
        console.error("Supabase function invocation error:", invokeError);
        throw invokeError;
      }
      
      // The edge function returns { content: updatedLessonPlanFromDB }
      if (functionResponse && functionResponse.content) {
        console.log("Successfully saved. Response content:", functionResponse.content);
        setCurrentLessonContent(functionResponse.content as LessonContent); // Update the preview's main state
        return { success: true, data: functionResponse.content as LessonContent };
      } else {
        console.error("Update response was empty or invalid:", functionResponse);
        return { success: false, error: "Update response was empty or invalid." };
      }
    } catch (error: any) {
      console.error("Failed to save section via edge function:", error);
      return { success: false, error: error.message || "An unexpected error occurred during save." };
    }
  };

  // Passed to LessonSectionCard so it can construct the full updated content object
  const getFullContent = (): LessonContent => {
    if (!currentLessonContent) {
        // This should ideally not happen if we're rendering cards based on currentLessonContent
        console.error("Critical: currentLessonContent is null in getFullContent");
        toast({ variant: "destructive", title: "Internal Error", description: "Lesson data unavailable." });
        // Fallback to an empty-ish structure to prevent crashes, though this indicates a deeper issue.
        // A more robust solution might involve re-fetching or error state management.
        return { id: planId || "", lessonTopic: "", themeOfWeek: "", learningObjective: "", materialsNeeded: [], introduction: "", mainActivities: [], differentiations: { strugglingLearners: "", onTrackLearners: "", advancedLearners: "", accommodations: "" }, extensionActivity: "", conclusion: "", evaluation: "", assessmentType: "teacher", teacherReflection: "" };
    }
    return currentLessonContent;
  }


  if (isLoading) { //isLoading is for the initial generation process
    return (
      <div className="mt-10 pt-6 border-t space-y-4">
        <h2 className="text-2xl font-semibold mb-6">Generating Lesson Plan...</h2>
        {lessonContentKeys.map((key) => (
          <div key={key} className="p-4 border rounded-lg shadow-sm bg-card">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-4/5 mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }
  
  if (!planId || !currentLessonContent) {
    return (
      <div className="mt-10 pt-6 border-t text-center text-muted-foreground">
        <p>Generate a lesson plan using the form above to see the preview and edit options here.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 pt-6 border-t">
      <h2 className="text-2xl font-semibold mb-6">Lesson Preview & Edit</h2>
      {lessonContentKeys.map((key) => (
        <LessonSectionCard
          key={`${planId}-${key}`} // Ensure key is unique if planId can change or multiple previews exist
          planId={planId}
          sectionKey={key}
          sectionTitle={lessonSectionTitles[key]}
          initialData={currentLessonContent[key]} // Pass the specific section data
          onSave={handleSaveSection}
          getFullContent={getFullContent}
        />
      ))}
    </div>
  );
};
