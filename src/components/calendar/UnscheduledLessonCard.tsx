
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LessonContent } from '@/types/lesson';
import { Json } from '@/integrations/supabase/types';

interface LessonPlanRecord {
  id: string;
  content: LessonContent;
  parameters: Json;
  created_at: string;
  updated_at: string;
}

interface UnscheduledLessonCardProps {
  lessonPlan: LessonPlanRecord;
}

const UnscheduledLessonCard: React.FC<UnscheduledLessonCardProps> = ({ lessonPlan }) => {
  return (
    <Card className="mb-2 cursor-grab active:cursor-grabbing">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium truncate">
          {lessonPlan.content?.lessonTopic || 'Untitled Lesson'}
        </CardTitle>
        <CardDescription className="text-xs">
          Created: {new Date(lessonPlan.created_at).toLocaleDateString()}
        </CardDescription>
        {/* Add a placeholder for draggable icon or similar if needed later */}
      </CardHeader>
    </Card>
  );
};

export default UnscheduledLessonCard;
