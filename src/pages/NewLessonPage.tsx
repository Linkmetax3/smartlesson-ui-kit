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
  FormDescription,
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
// import PouchDB from 'pouchdb-browser';

import { LessonPreview } from '@/components/lesson/LessonPreview';
import { LessonContent, ASSESSMENT_TYPES as lessonAssessmentTypes, Differentiations, LessonActivity } from '@/types/lesson';

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

const assessmentTypes = ["peer", "self", "teacher"] as const;
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

/*
let localDB: PouchDB.Database | null = null;
if (typeof window !== 'undefined') {
  localDB = new PouchDB('lesson_plans_local');
}
*/
let localDB: any = null; // Keep type for potential future use, but set to null

const NewLessonPage = () => {
  _s(); // This seems like a HMR artifact, should be removed by the build system if not needed.
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // For preview loading state
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [generatedLessonPlanId, setGeneratedLessonPlanId] = useState<string | null>(null);
  const [generatedLessonContent, setGeneratedLessonContent] = useState<LessonContent | null>(null);

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

  const onSubmit = async (values: LessonFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to generate a lesson plan." });
      return;
    }
    setIsSubmitting(true);
    setIsGenerating(true); // Start loading for preview
    setGeneratedLessonContent(null); // Clear previous preview
    setGeneratedLessonPlanId(null);

    try {
      const payload = {
        user_id: user.id,
        grade: values.grade,
        date: values.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        subject: values.subject,
        themeOfWeek: values.themeOfWeek || "",
        notes: values.notes || "",
        assessmentType: values.assessmentType,
        learnerLevel: values.learnerLevel,
      };

      const { data, error } = await supabase.functions.invoke('generate-lesson', {
        body: payload,
      });

      if (error) throw error;

      if (data && data.content) {
        toast({ title: "Success", description: "Lesson plan generated successfully!" });
        
        // Assuming data.content is the full lesson plan object and might contain an ID
        // And that generate-lesson populates all necessary fields for LessonContent type.
        // We need to ensure the structure from generate-lesson matches LessonContent
        // For now, let's assume data.content.id is the planId
        // And other fields match. If not, mapping or default values are needed.
        
        const planId = data.content.id || `generated_${Date.now()}`; // Fallback ID
        
        // Transform/ensure structure for LessonContent
        const lessonData: LessonContent = {
          id: planId,
          lessonTopic: data.content.lessonTopic || "N/A",
          themeOfWeek: data.content.themeOfWeek || values.themeOfWeek || "N/A",
          learningObjective: data.content.learningObjective || "N/A",
          materialsNeeded: data.content.materialsNeeded || [],
          introduction: data.content.introduction || "N/A",
          mainActivities: (data.content.mainActivities || []).map((act: any) => ({ // Type cast 'act' if possible
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
        
        /* // PouchDB logic commented out
        if (localDB) {
          try {
            await localDB.put({
              _id: data.content.id || `lesson_${new Date().toISOString()}_${user.id}`,
              user_id: user.id,
              parameters: payload,
              content: data.content,
              created_at: new Date().toISOString(),
            });
            toast({ title: "Saved Locally", description: "Lesson plan also saved to local storage." });
          } catch (pouchDbError: any) {
            console.error("PouchDB error:", pouchDbError);
            toast({ variant: "destructive", title: "Local Save Error", description: `Failed to save lesson plan locally: ${pouchDbError.message}` });
          }
        }
        */
        // Do not reset the form, so user can see their inputs alongside the preview
        // form.reset(); 
      } else {
        toast({ variant: "destructive", title: "Empty Response", description: "The lesson generation returned no content." });
        setGeneratedLessonContent(null);
        setGeneratedLessonPlanId(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Could not generate lesson plan. Please try again.",
      });
      setGeneratedLessonContent(null);
      setGeneratedLessonPlanId(null);
    } finally {
      setIsSubmitting(false);
      setIsGenerating(false); // Stop loading for preview
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Generate New Lesson</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                              new Date(field.value).toLocaleDateString('en-CA') // YYYY-MM-DD for placeholder consistency
                              : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePicker 
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // allow today and future
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
                  <FormControl><Textarea placeholder="e.g., Focus on collaborative learning, prepare visual aids for X." {...field} rows={4} /></FormControl>
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
                    Assessment Type
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
                          <FormControl><RadioGroupItem value={type} /></FormControl>
                          <FormLabel className="font-normal capitalize">{type}</FormLabel>
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
                          <FormControl><RadioGroupItem value={level} /></FormControl>
                          <FormLabel className="font-normal capitalize">{level.replace('-', ' ')}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="sticky bottom-0 py-4 bg-background/80 backdrop-blur-sm -mx-4 px-4 sm:mx-0 sm:px-0">
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.formState.isValid} 
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  'Generate Plan'
                )}
              </Button>
            </div>
          </form>
        </Form>

        <LessonPreview 
          initialPlanId={generatedLessonPlanId} 
          initialContent={generatedLessonContent}
          isLoading={isGenerating}
        />

      </div>
    </TooltipProvider>
  );
};
// _s definition was here, seems like HMR related
var _s = $RefreshSig$();
export default NewLessonPage;
