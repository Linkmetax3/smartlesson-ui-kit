import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit3 } from 'lucide-react';
import { LessonContent } from '@/types/lesson'; // For typing content.lessonTopic
import { Json } from '@/integrations/supabase/types'; // Import Json type

interface LessonPlanRecord {
  id: string;
  content: LessonContent; 
  parameters: Json; // Keep as Json or specify if known
  created_at: string;
  updated_at: string;
}

const fetchLessonPlans = async (userId: string | undefined): Promise<LessonPlanRecord[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('id, content, parameters, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching lesson plans:', error);
    throw new Error(error.message);
  }
  return (data || []).map(plan => ({
    ...plan,
    content: plan.content as unknown as LessonContent,
    parameters: plan.parameters as Json, // Ensure parameters is Json
  })) as LessonPlanRecord[];
};

const LessonsPage = () => {
  const { user } = useAuth();
  const { data: lessonPlans, isLoading, error } = useQuery<LessonPlanRecord[], Error>({
    queryKey: ['lessonPlans', user?.id],
    queryFn: () => fetchLessonPlans(user?.id),
    enabled: !!user,
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Lesson Plans</h1>
        <Button asChild>
          <Link to="/lessons/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Lesson
          </Link>
        </Button>
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
          <p className="text-red-600 font-semibold">Failed to load lesson plans</p>
          <p className="text-red-500 text-sm mt-1">{error.message}</p>
           <p className="text-muted-foreground text-xs mt-2">Please try again later. If the issue persists, ensure your connection is stable and you have lesson plans associated with your account.</p>
        </div>
      )}

      {!isLoading && !error && lessonPlans && lessonPlans.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-muted rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">No Lesson Plans Yet</h2>
          <p className="text-muted-foreground mb-4">Start by creating your first lesson plan.</p>
          <Button asChild variant="outline">
            <Link to="/lessons/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Lesson Plan
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !error && lessonPlans && lessonPlans.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lessonPlans.map((plan) => {
            const planParams = plan.parameters as { subject?: string; grade?: string; [key: string]: any } | null;
            return (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{(plan.content as LessonContent)?.lessonTopic || 'Untitled Lesson'}</CardTitle>
                  <CardDescription>
                    Created: {new Date(plan.created_at).toLocaleDateString()}
                    {planParams?.subject && ` | Subject: ${planParams.subject}`}
                    {planParams?.grade && ` | Grade: ${planParams.grade}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {(plan.content as LessonContent)?.learningObjective || 'No learning objective specified.'}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/lessons/new?planId=${plan.id}`}>
                      <Edit3 className="mr-2 h-4 w-4" /> View & Edit
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LessonsPage;
