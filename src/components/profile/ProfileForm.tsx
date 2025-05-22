import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfileData, ProfileFormValues } from '@/hooks/useProfileData';
import { ChevronDown } from 'lucide-react';

const subjectOptions = [
  "Mathematics", "Physical Sciences", "Life Sciences", "Afrikaans", "English", 
  "IsiXhosa", "Social Sciences", "Geography", "History", "IT", "CAT", "Life Orientation"
];

export interface ProfileFormProps {
  className?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ className }) => {
  const { profile, form, handleProfileUpdate, isLoading, isSubmitting, user } = useProfileData();

  const onSubmit = (data: ProfileFormValues) => {
    handleProfileUpdate(data);
  };

  const selectedSubjects = form.watch('subjects') || [];
  const selectedSubjectsText = selectedSubjects.length > 0 
    ? selectedSubjects.join(', ') 
    : "Select subjects";
  
  const truncatedSelectedSubjectsText = selectedSubjects.length > 2 
    ? `${selectedSubjects.slice(0, 2).join(', ')}, ...` 
    : selectedSubjectsText;


  if (isLoading && !user) {
    return <div className="text-center py-10">Loading profile...</div>;
  }
  
  if (!isLoading && !user && !profile) {
     // This case might indicate the user is not logged in or profile doesn't exist yet for a new user.
     // The useProfileData hook attempts to load or initialize the form with user metadata.
     // If form is available, show it. Otherwise, prompt login or show loading.
     if (!form.formState.isDirty && !profile) {
        // This could be a brief state before form default values are set by useEffect in useProfileData
        // Or if user is truly not logged in and useAuth hasn't redirected.
        // For now, we rely on AuthGuard to handle non-authenticated users.
        // If form is available (useProfileData provides it), render form.
     }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subjects"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subjects Taught</FormLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="truncate pr-2">
                      {selectedSubjects.length === 0 ? "Select subjects" : 
                       selectedSubjects.length <= 2 ? selectedSubjects.join(', ') : 
                       `${selectedSubjects.slice(0,2).join(', ')} & ${selectedSubjects.length - 2} more`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                  <DropdownMenuLabel>Select Subjects</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {subjectOptions.map((subject) => (
                    <DropdownMenuCheckboxItem
                      key={subject}
                      checked={field.value?.includes(subject)}
                      onCheckedChange={(checked) => {
                        const currentSubjects = field.value || [];
                        if (checked) {
                          field.onChange([...currentSubjects, subject]);
                        } else {
                          field.onChange(currentSubjects.filter((s) => s !== subject));
                        }
                      }}
                    >
                      {subject}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <FormDescription>
                Select the subjects you teach.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="school_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your school's name" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="City, Country" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us a little bit about yourself" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || isLoading} className="w-full sm:w-auto">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;
