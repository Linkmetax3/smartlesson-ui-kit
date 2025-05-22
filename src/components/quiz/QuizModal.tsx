
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { LearnerLevel, learnerLevels, QuizQuestion } from '@/types/quiz';
import { LessonContent } from '@/types/lesson';

interface QuizModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lessonPlanId: string;
  lessonContent: LessonContent | null;
  onQuizGenerated: (quizData: { quizId: string; content: QuizQuestion[], planId: string }) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onOpenChange,
  lessonPlanId,
  lessonContent,
  onQuizGenerated,
}) => {
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedLearnerLevel, setSelectedLearnerLevel] = useState<LearnerLevel>('on-track');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateQuiz = async () => {
    if (!lessonContent || !lessonPlanId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Lesson data is missing.' });
      return;
    }
    if (numQuestions < 3 || numQuestions > 10) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Number of questions must be between 3 and 10.' });
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        planId: lessonPlanId,
        topics: [lessonContent.lessonTopic || 'General Knowledge'], // Use lesson topic
        learnerLevel: selectedLearnerLevel,
        numQuestions: numQuestions,
      };
      console.log("Invoking generate-quiz with payload:", payload);

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: payload,
      });

      if (error) throw error;

      if (data && data.quizId && data.content) {
        console.log("Quiz generated successfully:", data);
        toast({ title: 'Success!', description: 'Quiz generated successfully.' });
        onQuizGenerated(data as { quizId: string; content: QuizQuestion[]; planId: string });
        onOpenChange(false); // Close modal
      } else {
        throw new Error('Invalid response from quiz generation function.');
      }
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      toast({
        variant: 'destructive',
        title: 'Quiz Generation Failed',
        description: error.message || 'Could not generate quiz. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Quiz</DialogTitle>
          <DialogDescription>
            Configure options for the quiz based on the current lesson plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numQuestions" className="text-right col-span-1">
              Questions
            </Label>
            <Input
              id="numQuestions"
              type="number"
              min="3"
              max="10"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right col-span-1">Level</Label>
            <RadioGroup
              value={selectedLearnerLevel}
              onValueChange={(value: LearnerLevel) => setSelectedLearnerLevel(value)}
              className="col-span-3 flex space-x-2"
            >
              {learnerLevels.map((level) => (
                <div key={level} className="flex items-center space-x-1">
                  <RadioGroupItem value={level} id={`level-${level}`} />
                  <Label htmlFor={`level-${level}`} className="font-normal capitalize">{level.replace('-', ' ')}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerateQuiz} disabled={isGenerating || numQuestions < 3 || numQuestions > 10}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
