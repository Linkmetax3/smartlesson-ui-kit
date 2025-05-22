import React, { useState, useEffect } from 'react';
import { LessonContent, lessonContentKeys, lessonSectionTitles } from '@/types/lesson';
import { LessonSectionCard } from './LessonSectionCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { QuizModal } from '@/components/quiz/QuizModal';
import { QuizQuestion } from '@/types/quiz';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourcesTab } from '@/components/resource/ResourcesTab';

interface LessonPreviewProps {
  initialPlanId: string | null;
  initialContent: LessonContent | null;
  isLoading?: boolean;
  onQuizGenerated: (quizData: { quizId: string; content: QuizQuestion[]; planId: string }) => void;
}

export const LessonPreview: React.FC<LessonPreviewProps> = ({ initialPlanId, initialContent, isLoading, onQuizGenerated }) => {
  const [planId, setPlanId] = useState<string | null>(initialPlanId);
  const [currentLessonContent, setCurrentLessonContent] = useState<LessonContent | null>(initialContent);
  const { toast } = useToast();
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  useEffect(() => {
    setPlanId(initialPlanId);
    setCurrentLessonContent(initialContent);
  }, [initialPlanId, initialContent]);

  const handleSaveSection = async (
    _planIdFromCard: string, 
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
          content: updatedFullContent, 
        },
      });

      if (invokeError) {
        console.error("Supabase function invocation error:", invokeError);
        throw invokeError;
      }
      
      if (functionResponse && functionResponse.content) {
        console.log("Successfully saved. Response content:", functionResponse.content);
        setCurrentLessonContent(functionResponse.content as LessonContent); 
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

  const getFullContent = (): LessonContent => {
    if (!currentLessonContent) {
        console.error("Critical: currentLessonContent is null in getFullContent");
        toast({ variant: "destructive", title: "Internal Error", description: "Lesson data unavailable." });
        return { id: planId || "", lessonTopic: "", themeOfWeek: "", learningObjective: "", materialsNeeded: [], introduction: "", mainActivities: [], differentiations: { strugglingLearners: "", onTrackLearners: "", advancedLearners: "", accommodations: "" }, extensionActivity: "", conclusion: "", evaluation: "", assessmentType: "teacher", teacherReflection: "" };
    }
    return currentLessonContent;
  }

  if (isLoading) {
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Lesson Details</h2>
        <Button variant="secondary" onClick={() => setIsQuizModalOpen(true)} disabled={!planId || !currentLessonContent}>
          Generate Quiz
        </Button>
      </div>

      <Tabs defaultValue="lesson" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lesson">Lesson Content</TabsTrigger>
          <TabsTrigger value="quiz">Quiz (Preview/Generate)</TabsTrigger>
          <TabsTrigger value="resources">Suggested Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="lesson">
          {lessonContentKeys.map((key) => (
            <LessonSectionCard
              key={`${planId}-${key}`} 
              planId={planId}
              sectionKey={key}
              sectionTitle={lessonSectionTitles[key]}
              initialData={currentLessonContent[key]}
              onSave={handleSaveSection}
              getFullContent={getFullContent}
            />
          ))}
        </TabsContent>
        <TabsContent value="quiz">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-2">Quiz Generation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click the "Generate Quiz" button above to create a quiz for this lesson plan.
              If a quiz is already generated, its details might appear here or on a dedicated quizzes page.
            </p>
            {/* Placeholder for quiz preview or more actions */}
          </div>
        </TabsContent>
        <TabsContent value="resources">
          {planId && <ResourcesTab planId={planId} />}
        </TabsContent>
      </Tabs>

      {planId && currentLessonContent && (
        <QuizModal
          isOpen={isQuizModalOpen}
          onOpenChange={setIsQuizModalOpen}
          lessonPlanId={planId}
          lessonContent={currentLessonContent}
          onQuizGenerated={onQuizGenerated}
        />
      )}
    </div>
  );
};
