import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, ChevronDown } from 'lucide-react';
import { ProfileFormValues } from '@/hooks/useProfileData';
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface ProfileFormProps {
  onSubmit: (data: ProfileFormValues) => Promise<void>;
  isSubmitting: boolean;
  initialProfileRole?: string | null;
}

const subjectOptions = [
  "Mathematics", "Physical Sciences", "Life Sciences", "Afrikaans", 
  "English", "IsiXhosa", "Social Sciences", "Geography", 
  "History", "IT", "CAT", "Life Orientation"
];

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, isSubmitting, initialProfileRole }) => {
  const form = useFormContext<ProfileFormValues>();

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">Your Profile</CardTitle>
        <CardDescription>Manage your personal information and preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="fullName">Full Name</FormLabel>
                    <FormControl>
                      <Input id="fullName" {...field} aria-invalid={!!form.formState.errors.full_name} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel htmlFor="role">Role</FormLabel>
                <FormControl>
                  <Input id="role" value={initialProfileRole || 'N/A'} readOnly className="bg-gray-100 dark:bg-gray-800" aria-label="Your role (read-only)" />
                </FormControl>
                <FormDescription>Your role is assigned by an administrator.</FormDescription>
              </FormItem>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Subjects You Teach</FormLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {field.value && field.value.length > 0 
                            ? `${field.value.length} selected` 
                            : "Select subjects"}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                        <DropdownMenuLabel>Available Subjects</DropdownMenuLabel>
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
                    <FormDescription>Select the subjects you teach.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="schoolName">School Name</FormLabel>
                    <FormControl>
                      <Input id="schoolName" {...field} placeholder="e.g., Springfield High" aria-invalid={!!form.formState.errors.school_name} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="location">Location</FormLabel>
                    <FormControl>
                      <Input id="location" {...field} placeholder="e.g., Springfield, IL" aria-invalid={!!form.formState.errors.location} />
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
                    <FormLabel htmlFor="bio">Bio</FormLabel>
                    <FormControl>
                      <Textarea id="bio" {...field} placeholder="Tell us a little about yourself..." rows={4} aria-invalid={!!form.formState.errors.bio} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="px-0 pt-6">
              <Button type="submit" disabled={isSubmitting || !form.formState.isDirty} className="ml-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
