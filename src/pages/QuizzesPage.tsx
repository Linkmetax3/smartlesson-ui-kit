import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit3, ClipboardList } from 'lucide-react';
import { Quiz, QuizQuestion } from '@/types/quiz';
import { LessonContent } from '@/types/lesson';
import { Json } from '@/integrations/supabase/types';

interface QuizRecord extends Quiz {
  lessonTopic?: string;
  lessonSubject?: string;
  lessonGrade?: string;
}

// Function to fetch lesson details for a given planId
const fetchLessonDetailsForPlan = async (planId: string): Promise<{ topic: string, subject?: string, grade?: string } | null> => {
  const { data: lessonPlan, error: lessonError } = await supabase
    .from('lesson_plans')
    .select('content, parameters')
    .eq('id', planId)
    .single();

  if (lessonError || !lessonPlan) {
    console.error(`Error fetching lesson details for plan ${planId}:`, lessonError);
    return null;
  }
  const content = lessonPlan.content as unknown as LessonContent;
  const parameters = lessonPlan.parameters as unknown as { subject?: string, grade?: string };
  return {
    topic: content?.lessonTopic || 'Untitled Lesson',
    subject: parameters?.subject,
    grade: parameters?.grade,
  };
};


const fetchQuizzes = async (userId: string | undefined): Promise<QuizRecord[]> => {
  if (!userId) return [];

  // 1. Fetch user's lesson plan IDs first
  const { data: userLessonPlans, error: plansError } = await supabase
    .from('lesson_plans')
    .select('id')
    .eq('user_id', userId);

  if (plansError) {
    console.error('Error fetching user lesson plans:', plansError);
    throw new Error(plansError.message);
  }
  if (!userLessonPlans || userLessonPlans.length === 0) {
    return []; // No lesson plans means no quizzes for this user
  }

  const planIds = userLessonPlans.map(p => p.id);

  // 2. Fetch quizzes for these plan_ids
  const { data: quizzesData, error: quizzesError } = await supabase
    .from('quizzes')
    .select('id, plan_id, content, parameters, created_at')
    .in('plan_id', planIds)
    .order('created_at', { ascending: false });

  if (quizzesError) {
    console.error('Error fetching quizzes for plan IDs:', quizzesError);
    throw new Error(quizzesError.message);
  }
  if (!quizzesData) return [];

  // 3. Fetch lesson details for each quiz (enrichment)
  const quizzesWithTopics = await Promise.all(
    quizzesData.map(async (quiz) => {
      let lessonDetails: { topic: string, subject?: string, grade?: string } | null = null;
      if (quiz.plan_id) {
        // We could potentially pass lesson_plans.content and lesson_plans.parameters directly
        // if we selected them in step 1 and matched them here, to avoid N+1 calls to fetchLessonDetailsForPlan.
        // For now, keeping fetchLessonDetailsForPlan for simplicity if it's designed for individual lookups.
        // Or, optimize by fetching all relevant lesson_plans once and then looking them up locally.
        // For now, the existing fetchLessonDetailsForPlan is called.
        lessonDetails = await fetchLessonDetailsForPlan(quiz.plan_id);
      }
      return {
        ...quiz,
        content: quiz.content as unknown as QuizQuestion[],
        parameters: quiz.parameters as Json,
        lessonTopic: lessonDetails?.topic || 'N/A',
        lessonSubject: lessonDetails?.subject,
        lessonGrade: lessonDetails?.grade,
      } as QuizRecord;
    })
  );

  return quizzesWithTopics;
};

const QuizzesPage = () => {
  const { user } = useAuth();
  const { data: quizzes, isLoading, error } = useQuery<QuizRecord[], Error>({
    queryKey: ['quizzes', user?.id],
    queryFn: () => fetchQuizzes(user?.id),
    enabled: !!user,
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Quizzes</h1>
        {/* Optional: Add a button to create a quiz directly, though current flow is via lessons */}
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-10 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 font-semibold">Failed to load quizzes</p>
          <p className="text-red-500 text-sm mt-1">{error.message}</p>
          <p className="text-muted-foreground text-xs mt-2">Please try again later. If the issue persists, ensure your connection is stable.</p>
        </div>
      )}

      {!isLoading && !error && quizzes && quizzes.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-muted rounded-lg">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">No Quizzes Found</h2>
          <p className="text-muted-foreground mb-4">
            Quizzes are generated from lesson plans. Create a lesson plan and generate a quiz for it first, or check if you have any existing lesson plans.
          </p>
          <Button asChild variant="outline">
            <Link to="/lessons">
              <PlusCircle className="mr-2 h-4 w-4" /> View Lesson Plans
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !error && quizzes && quizzes.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">
                  Quiz for: {quiz.lessonTopic || 'Untitled Lesson'}
                </CardTitle>
                <CardDescription>
                  Created: {new Date(quiz.created_at || Date.now()).toLocaleDateString()}
                  {quiz.lessonSubject && ` | Subject: ${quiz.lessonSubject}`}
                  {quiz.lessonGrade && ` | Grade: ${quiz.lessonGrade}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {Array.isArray(quiz.content) ? quiz.content.length : 0} question{Array.isArray(quiz.content) && quiz.content.length !== 1 ? 's' : ''}
                </p>
                {(quiz.parameters as any)?.learnerLevel && 
                  <p className="text-xs text-muted-foreground mt-1">
                    Learner Level: {(quiz.parameters as any).learnerLevel}
                  </p>
                }
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/lessons/new?planId=${quiz.plan_id}&tab=quiz`}>
                    <Edit3 className="mr-2 h-4 w-4" /> View & Edit Quiz
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;
