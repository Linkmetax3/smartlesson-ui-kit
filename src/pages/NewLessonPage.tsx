import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Loader2, Check, ChevronsUpDown } from 'lucide-react';

import { LessonPreview } from '@/components/lesson/LessonPreview';
import { LessonContent, ASSESSMENT_TYPES as lessonAssessmentTypes, Differentiations, LessonActivity } from '@/types/lesson';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizTab } from '@/components/quiz/QuizTab';
import { Quiz, QuizQuestion } from '@/types/quiz';
import { useLocation, useNavigate } from 'react-router-dom';

const subjectList = [
  { value: "Mathematics", label: "Mathematics" },
  { value: "Physical Sciences", label: "Physical Sciences" },
  { value: "Life Sciences", label: "Life Sciences" },
  { value: "Afrikaans", label: "Afrikaans" },
  { value: "English", label: "English" },
  { value: "IsiXhosa", label: "IsiXhosa" },
  { value: "Social Sciences", label: "Social Sciences" },
  { value: "Geography", label: "Geography" },
  { value: "History", label: "History" },
  { value: "IT", label: "IT" },
  { value: "CAT", label: "CAT" },
  { value: "Life Orientation", label: "Life Orientation" },
];

const assessmentTypes = lessonAssessmentTypes; // Use from types/lesson.ts
const learnerLevels = ["struggling", "on-track", "advanced"] as const;

const lessonFormSchema = z.object({
  grade: z.string().min(1, "Grade is required."),
  date: z.date({ required_error: "Date is required." }),
  subject: z.string().min(1, "Subject is required."),
  themeOfWeek: z.string().optional(),
  notes: z.string().optional(),
  assessmentType: z.enum(assessmentTypes, { required_error: "Assessment type is required." }),
  learnerLevel: z.enum(learnerLevels, { required_error: "Learner level is required." }),
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;

// let localDB: any = null; // Keep type for potential future use, but set to null // This line was already commented, removing for clarity

const NewLessonPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [generatedLessonPlanId, setGeneratedLessonPlanId] = useState<string | null>(null);
  const [generatedLessonContent, setGeneratedLessonContent] = useState<LessonContent | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [activeTab, setActiveTab] = useState("lesson-plan");

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      grade: '',
      subject: '',
      themeOfWeek: '',
      notes: '',
      assessmentType: undefined,
      learnerLevel: undefined,
    },
  });

  // Effect to fetch existing lesson if planId is in URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const planIdFromUrl = queryParams.get('planId');

    if (planIdFromUrl && user) {
      const fetchLessonAndQuiz = async () => {
        setIsGeneratingPreview(true);
        try {
          // Fetch lesson plan
          const { data: lessonData, error: lessonError } = await supabase
            .from('lesson_plans')
            .select('id, content, parameters')
            .eq('id', planIdFromUrl)
            .eq('user_id', user.id)
            .single();

          if (lessonError) throw lessonError;
          if (lessonData) {
            // Ensure content has an id property as LessonContent expects
             const lessonContentWithId: LessonContent = {
              ...(lessonData.content as Omit<LessonContent, 'id'>),
              id: lessonData.id,
            };
            setGeneratedLessonPlanId(lessonData.id);
            setGeneratedLessonContent(lessonContentWithId);
            
            // Populate form with existing data if available in parameters or content
            const params = lessonData.parameters as any;
            const content = lessonData.content as LessonContent;
            form.reset({
              grade: params?.grade || content?.grade || '',
              date: params?.date ? new Date(params.date) : (content?.date ? new Date(content.date) : new Date()),
              subject: params?.subject || content?.subject || '',
              themeOfWeek: params?.themeOfWeek || content?.themeOfWeek || '',
              notes: params?.notes || '',
              assessmentType: params?.assessmentType || content?.assessmentType || undefined,
              learnerLevel: params?.learnerLevel || content?.learnerLevel || undefined,
            });

            // Fetch associated quiz
            const { data: quizData, error: quizError } = await supabase
              .from('quizzes')
              .select('*')
              .eq('plan_id', planIdFromUrl)
              .maybeSingle();

            if (quizError) console.warn("Error fetching quiz:", quizError.message);
            if (quizData) {
              setGeneratedQuiz(quizData as Quiz);
              setActiveTab("quiz");
            } else {
              setActiveTab("lesson-plan");
            }
          }
        } catch (error: any) {
          console.error("Error fetching existing lesson/quiz:", error);
          toast({ variant: "destructive", title: "Load Failed", description: "Could not load existing lesson data." });
          navigate("/lessons/new");
        } finally {
          setIsGeneratingPreview(false);
        }
      };
      fetchLessonAndQuiz();
    } else if (planIdFromUrl && !user) {
      // if planId is in URL but user is not logged in yet, wait for user.
      // This effect will re-run when user state changes.
    } else {
      setGeneratedLessonPlanId(null);
      setGeneratedLessonContent(null);
      setGeneratedQuiz(null);
      form.reset(form.formState.defaultValues);
      setActiveTab("lesson-plan");
    }
  }, [location.search, user, form, toast, navigate]);

  const onSubmit = async (values: LessonFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to generate a lesson plan." });
      return;
    }
    setIsSubmittingForm(true);
    setIsGeneratingPreview(true); 
    setGeneratedLessonContent(null); 
    setGeneratedLessonPlanId(null);
    setGeneratedQuiz(null);
    setActiveTab("lesson-plan");

    try {
      const payload = {
        user_id: user.id,
        grade: values.grade,
        date: values.date.toISOString().split('T')[0],
        subject: values.subject,
        themeOfWeek: values.themeOfWeek || "",
        notes: values.notes || "",
        assessmentType: values.assessmentType,
        learnerLevel: values.learnerLevel,
      };

      console.log("Invoking generate-lesson with payload:", payload);
      const { data, error } = await supabase.functions.invoke('generate-lesson', {
        body: payload,
      });
      console.log("generate-lesson response data:", data);
      console.log("generate-lesson response error:", error);


      if (error) throw error;

      if (data && data.content && data.content.id) { 
        toast({ title: "Success", description: "Lesson plan generated successfully! You can now edit it below." });
        
        const planId = data.content.id; 
        
        const lessonData: LessonContent = {
          id: planId,
          lessonTopic: data.content.lessonTopic || "N/A",
          themeOfWeek: data.content.themeOfWeek || values.themeOfWeek || "N/A",
          learningObjective: data.content.learningObjective || "N/A",
          materialsNeeded: Array.isArray(data.content.materialsNeeded) ? data.content.materialsNeeded : [],
          introduction: data.content.introduction || "N/A",
          mainActivities: (Array.isArray(data.content.mainActivities) ? data.content.mainActivities : []).map((act: any) => ({
             title: act.title || "Activity",
             description: act.description || "No description",
          })) as LessonActivity[],
          differentiations: {
            strugglingLearners: data.content.differentiations?.strugglingLearners || "",
            onTrackLearners: data.content.differentiations?.onTrackLearners || "",
            advancedLearners: data.content.differentiations?.advancedLearners || "",
            accommodations: data.content.differentiations?.accommodations || "",
          } as Differentiations,
          extensionActivity: data.content.extensionActivity || "",
          conclusion: data.content.conclusion || "",
          evaluation: data.content.evaluation || "",
          assessmentType: data.content.assessmentType || values.assessmentType,
          teacherReflection: data.content.teacherReflection || "",
          grade: values.grade,
          date: values.date.toISOString().split('T')[0],
          learnerLevel: values.learnerLevel,
          user_id: user.id,
        };

        setGeneratedLessonPlanId(planId);
        setGeneratedLessonContent(lessonData);
        
      } else {
        console.error("generate-lesson returned no content or id:", data);
        toast({ variant: "destructive", title: "Empty or Invalid Response", description: "The lesson generation returned no content or plan ID." });
        setGeneratedLessonContent(null);
        setGeneratedLessonPlanId(null);
      }
    } catch (error: any) {
      console.error("Error during lesson generation:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Could not generate lesson plan. Please try again.",
      });
      setGeneratedLessonContent(null);
      setGeneratedLessonPlanId(null);
    } finally {
      setIsSubmittingForm(false);
      setIsGeneratingPreview(false); 
    }
  };

  const handleQuizGenerated = (quizAPIData: { quizId: string; content: QuizQuestion[]; planId: string }) => {
    const newQuiz: Quiz = {
      id: quizAPIData.quizId,
      plan_id: quizAPIData.planId,
      content: quizAPIData.content,
    };
    setGeneratedQuiz(newQuiz);
    setActiveTab("quiz");
    toast({ title: "Quiz Ready!", description: "Your quiz is ready to be reviewed and edited."});
  };

  const handleQuizSaved = (updatedQuiz: Quiz) => {
    setGeneratedQuiz(updatedQuiz);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {generatedLessonPlanId && new URLSearchParams(location.search).get('planId') ? 'Edit Lesson Plan' : 'Generate New Lesson Plan'}
        </h1>
        {!(generatedLessonPlanId && new URLSearchParams(location.search).get('planId')) && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mb-12">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Grade
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p>Enter the grade level for this lesson (e.g., '10', 'Grade 5').</p></TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl><Input placeholder="e.g., 10 or Grade 5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center">
                      Date
                       <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p>Select the date for the lesson.</p></TooltipContent>
                      </Tooltip>
                    </FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? 
                                new Date(field.value).toLocaleDateString('en-CA') // YYYY-MM-DD format
                                : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DatePicker 
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Allow today
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center">
                      Subject
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p>Choose the subject for this lesson.</p></TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={subjectPopoverOpen}
                            className={`w-full justify-between ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value
                              ? subjectList.find(
                                  (subject) => subject.value === field.value
                                )?.label
                              : "Select subject"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search subject..." />
                          <CommandList>
                            <CommandEmpty>No subject found.</CommandEmpty>
                            <CommandGroup>
                              {subjectList.map((subject) => (
                                <CommandItem
                                  value={subject.label}
                                  key={subject.value}
                                  onSelect={() => {
                                    form.setValue("subject", subject.value);
                                    setSubjectPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      subject.value === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {subject.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="themeOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Theme of the Week (Optional)
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p>Enter an overarching theme for the week, if applicable.</p></TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl><Input placeholder="e.g., Environmental Conservation" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Additional Notes (Optional)
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p>Any specific notes, objectives, or considerations for this lesson.</p></TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl><Textarea placeholder="e.g., Focus on collaborative learning, prepare visual aids for X." {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessmentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center">
                      Primary Assessment Type
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p>Select the primary type of assessment for this lesson.</p></TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                      >
                        {assessmentTypes.map((type) => (
                          <FormItem key={type} className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value={type} id={`form-${type}`} /></FormControl>
                            <FormLabel htmlFor={`form-${type}`} className="font-normal capitalize">{type}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="learnerLevel"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center">
                      Target Learner Level
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p>Select the general proficiency level of the learners this lesson is aimed at.</p></TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                      >
                        {learnerLevels.map((level) => (
                          <FormItem key={level} className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value={level} id={`form-${level}`} /></FormControl>
                            <FormLabel htmlFor={`form-${level}`} className="font-normal capitalize">{level.replace('-', ' ')}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sticky bottom-0 py-4 bg-background/90 backdrop-blur-sm -mx-4 px-4 sm:mx-0 sm:px-0 z-10">
                <Button 
                  type="submit" 
                  disabled={isSubmittingForm || !form.formState.isDirty || !form.formState.isValid}
                  className="w-full sm:w-auto"
                >
                  {isSubmittingForm ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Lesson Plan...</>
                  ) : (
                    'Generate New Lesson Plan'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
        {(generatedLessonPlanId || isGeneratingPreview) && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lesson-plan">Lesson Plan</TabsTrigger>
              <TabsTrigger value="quiz" disabled={!generatedQuiz && !isGeneratingPreview}>Quiz</TabsTrigger>
            </TabsList>
            <TabsContent value="lesson-plan">
              <LessonPreview 
                initialPlanId={generatedLessonPlanId} 
                initialContent={generatedLessonContent}
                isLoading={isGeneratingPreview && !generatedLessonContent} 
                onQuizGenerated={handleQuizGenerated}
              />
            </TabsContent>
            <TabsContent value="quiz">
              {isGeneratingPreview && !generatedQuiz ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading Quiz...</p>
                </div>
              ) : (
                <QuizTab quizData={generatedQuiz} onQuizSaved={handleQuizSaved} />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </TooltipProvider>
  );
};
export default NewLessonPage;
