import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Check, ChevronsUpDown, XIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  // ... Add other subjects as needed
];


const profileFormSchema = z.object({
  full_name: z.string().min(1, 'Full name is required.'),
  subjects: z.array(z.string()).optional().default([]),
  school_name: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  // role is not part of the form submission from user side, it's displayed
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  onSubmit: (data: ProfileFormValues) => void;
  isSubmitting: boolean;
  initialProfileRole?: string;
}

const ProfileForm = ({ onSubmit, isSubmitting, initialProfileRole }: ProfileFormProps) => {
  const methods = useFormContext<ProfileFormValues>();
  const { control, watch, setValue, formState: { errors } } = methods;

  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const watchedSubjects = watch("subjects", []);

  const handleSubjectSelect = (subjectValue: string) => {
    const currentSubjects = watchedSubjects || [];
    if (!currentSubjects.includes(subjectValue)) {
      setValue("subjects", [...currentSubjects, subjectValue], { shouldValidate: true, shouldDirty: true });
    }
    setSubjectSearch(''); // Clear search input
    // setSubjectPopoverOpen(false); // Optionally close popover on select
  };

  const handleSubjectRemove = (subjectValue: string) => {
    const currentSubjects = watchedSubjects || [];
    setValue("subjects", currentSubjects.filter(s => s !== subjectValue), { shouldValidate: true, shouldDirty: true });
  };

  const filteredSubjects = subjectList.filter(subject =>
    subject.label.toLowerCase().includes(subjectSearch.toLowerCase()) &&
    !watchedSubjects.includes(subject.value)
  );

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          {...methods.register('full_name')}
          className="mt-1"
        />
        {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>}
      </div>

      <div>
        <Label>Role</Label>
        <Input
          value={initialProfileRole || 'N/A'}
          readOnly
          className="mt-1 bg-gray-100"
        />
      </div>
      
      <div>
        <Label htmlFor="subjects">Subjects Taught</Label>
        <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={subjectPopoverOpen}
              className="w-full justify-between mt-1 h-auto min-h-10" // Allow button to grow
            >
              <div className="flex flex-wrap gap-1 items-center">
                {watchedSubjects.length > 0 ? (
                  watchedSubjects.map(subjectValue => {
                    const subjectLabel = subjectList.find(s => s.value === subjectValue)?.label || subjectValue;
                    return (
                      <Badge key={subjectValue} variant="secondary" className="flex items-center gap-1">
                        {subjectLabel}
                        <button
                          type="button"
                          aria-label={`Remove ${subjectLabel}`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent popover trigger
                            handleSubjectRemove(subjectValue);
                          }}
                          className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground">Select subjects...</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput 
                placeholder="Search subject..." 
                value={subjectSearch}
                onValueChange={setSubjectSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {subjectList.length === watchedSubjects.length ? "All subjects selected." : "No subject found."}
                </CommandEmpty>
                <CommandGroup>
                  {filteredSubjects.map((subject) => (
                    <CommandItem
                      key={subject.value}
                      value={subject.label} // Use label for display and search matching by cmdk
                      onSelect={() => { // onSelect here means when user clicks or hits enter
                        handleSubjectSelect(subject.value);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          watchedSubjects.includes(subject.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {subject.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.subjects && <p className="text-sm text-red-600 mt-1">{errors.subjects.message}</p>}
      </div>

      <div>
        <Label htmlFor="school_name">School Name (Optional)</Label>
        <Input
          id="school_name"
          {...methods.register('school_name')}
          className="mt-1"
        />
        {errors.school_name && <p className="text-sm text-red-600 mt-1">{errors.school_name.message}</p>}
      </div>

      <div>
        <Label htmlFor="location">Location (Optional)</Label>
        <Input
          id="location"
          {...methods.register('location')}
          className="mt-1"
        />
        {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>}
      </div>

      <div>
        <Label htmlFor="bio">Bio (Optional)</Label>
        <Textarea
          id="bio"
          {...methods.register('bio')}
          className="mt-1"
          rows={4}
        />
        {errors.bio && <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
};

export default ProfileForm;
