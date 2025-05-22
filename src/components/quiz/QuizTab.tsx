import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Quiz, QuizQuestion } from '@/types/quiz'; 
import { Loader2, Edit3, Trash2, PlusCircle } from 'lucide-react';
import { produce } from 'immer';
import { Json } from '@/integrations/supabase/types'; // Import Json type

interface QuizTabProps {
  quizData: Quiz | null;
  onQuizSaved: (updatedQuiz: Quiz) => void;
  lessonPlanId?: string; // Added lessonPlanId as an optional prop
}

export const QuizTab: React.FC<QuizTabProps> = ({ quizData: initialQuizData, onQuizSaved, lessonPlanId }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuizData);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialQuizData) {
      setQuiz({
        ...initialQuizData,
        content: initialQuizData.content as QuizQuestion[],
      });
    } else {
      setQuiz(null);
    }
  }, [initialQuizData]);

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: string | string[]) => {
    setQuiz(
      produce((draft) => {
        if (draft && draft.content[index]) {
          (draft.content[index] as any)[field] = value;
        }
      })
    );
  };

  const handleChoiceChange = (qIndex: number, cIndex: number, value: string) => {
     setQuiz(
      produce((draft) => {
        if (draft && draft.content[qIndex] && draft.content[qIndex].choices) {
          draft.content[qIndex].choices[cIndex] = value;
        }
      })
    );
  };
  
  const addChoice = (qIndex: number) => {
    setQuiz(
      produce((draft) => {
        if (draft && draft.content[qIndex]) {
          draft.content[qIndex].choices.push('');
        }
      })
    );
  };

  const removeChoice = (qIndex: number, cIndex: number) => {
    setQuiz(
      produce((draft) => {
        if (draft && draft.content[qIndex] && draft.content[qIndex].choices.length > 1) { 
          const currentAnswer = draft.content[qIndex].answer;
          const choiceToRemove = draft.content[qIndex].choices[cIndex];
          if (currentAnswer === choiceToRemove) {
            draft.content[qIndex].answer = draft.content[qIndex].choices.filter((_,i) => i !== cIndex)[0] || "";
          }
          draft.content[qIndex].choices.splice(cIndex, 1);
        }
      })
    );
  };

  const handleSaveQuiz = async () => {
    if (!quiz || !quiz.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No quiz data to save.' });
      return;
    }
    // Note: lessonPlanId is available here if needed for save logic, e.g., associating quiz if not already linked.
    // For now, the save logic primarily uses quiz.id.
    console.log("Saving quiz for lessonPlanId (if available):", lessonPlanId); 
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ content: quiz.content as unknown as Json })
        .eq('id', quiz.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        toast({ title: 'Success!', description: 'Quiz saved successfully.' });
        const updatedQuizFromDB: Quiz = {
          ...data,
          content: data.content as unknown as QuizQuestion[],
          parameters: data.parameters as unknown as Quiz['parameters'], // Cast parameters if present and typed
        };
        onQuizSaved(updatedQuizFromDB); 
        setEditingQuestionIndex(null); 
      }
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Could not save quiz.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!quiz) {
    return <div className="text-center text-muted-foreground p-8">No quiz has been generated for this lesson yet.</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {quiz.content.map((q, qIndex) => (
        <div key={q.id || `q-${qIndex}`} className="p-4 border rounded-lg shadow-sm bg-card">
          {editingQuestionIndex === qIndex ? (
            <div className="space-y-3">
              <Label htmlFor={`question-${qIndex}`}>Question Text</Label>
              <Textarea
                id={`question-${qIndex}`}
                value={q.question}
                onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                rows={3}
              />
              <Label>Choices</Label>
              {q.choices.map((choice, cIndex) => (
                <div key={`choice-${qIndex}-${cIndex}`} className="flex items-center space-x-2">
                  <Input
                    value={choice}
                    onChange={(e) => handleChoiceChange(qIndex, cIndex, e.target.value)}
                    placeholder={`Choice ${cIndex + 1}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeChoice(qIndex, cIndex)} disabled={q.choices.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addChoice(qIndex)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Choice
              </Button>
              <Label htmlFor={`answer-${qIndex}`}>Correct Answer</Label>
               <RadioGroup
                id={`answer-${qIndex}`}
                value={q.answer}
                onValueChange={(value) => handleQuestionChange(qIndex, 'answer', value)}
                className="flex flex-wrap gap-2"
              >
                {q.choices.map((choice, cIndex) => (
                  <div key={`answer-choice-${qIndex}-${cIndex}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={choice} id={`answer-${qIndex}-${cIndex}`} />
                    <Label htmlFor={`answer-${qIndex}-${cIndex}`} className="font-normal truncate max-w-[150px]">{choice || `Choice ${cIndex+1}`}</Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingQuestionIndex(null)}>Cancel</Button>
                {/* Save button is now global at the bottom */}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <p className="font-semibold text-lg mb-2">
                  {qIndex + 1}. {q.question}
                </p>
                <Button variant="ghost" size="icon" onClick={() => setEditingQuestionIndex(qIndex)}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
              <RadioGroup value={q.answer} className="space-y-1 mb-2" disabled>
                {q.choices.map((choice, cIndex) => (
                  <div key={`view-choice-${qIndex}-${cIndex}`} className="flex items-center space-x-3">
                    <RadioGroupItem value={choice} id={`view-q-${qIndex}-choice-${cIndex}`} />
                    <Label
                      htmlFor={`view-q-${qIndex}-choice-${cIndex}`}
                      className={`font-normal ${choice === q.answer ? 'text-green-600 font-medium' : ''}`}
                    >
                      {choice}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>
      ))}
      <div className="sticky bottom-0 py-4 bg-background/90 backdrop-blur-sm -mx-4 px-4 sm:mx-0 sm:px-0 z-10 border-t">
        <Button onClick={handleSaveQuiz} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Quiz...
            </>
          ) : (
            'Save Quiz Changes'
          )}
        </Button>
      </div>
    </div>
  );
};
