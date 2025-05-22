import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];


const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  subjects: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(s => s) : []), // Handle as string, convert to array
  school_name: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  // role is not editable by user in this form
});

type ProfileFormValues = Omit<z.infer<typeof profileSchema>, 'subjects'> & { subjects?: string };


const ProfilePage = () => {
  const { user, isLoading: authLoading, session } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema.omit({ subjects: true }).extend({ subjects: z.string().optional()})),
    defaultValues: {
      full_name: '',
      subjects: '',
      school_name: '',
      location: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setIsLoadingData(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows
             throw error;
          }
          if (data) {
            setProfile(data);
            form.reset({
              full_name: data.full_name || '',
              subjects: (data.subjects || []).join(', '), // Convert array to comma-separated string for form
              school_name: data.school_name || '',
              location: data.location || '',
              bio: data.bio || '',
            });
          }
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Failed to load profile",
            description: error.message || "Could not fetch your profile data.",
          });
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchProfile();
    } else if (!authLoading) {
        setIsLoadingData(false); // No user, no data to load
    }
  }, [user, form, toast, authLoading]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    // Transform subjects string back to array for DB
    const subjectsArray = data.subjects ? data.subjects.split(',').map(s => s.trim()).filter(s => s) : [];

    const updateData: ProfileUpdate = {
      full_name: data.full_name,
      subjects: subjectsArray,
      school_name: data.school_name || null, // Send null if empty string for optional fields
      location: data.location || null,
      bio: data.bio || null,
      updated_at: new Date().toISOString(), // Manually set updated_at if not handled by DB trigger on profiles
    };
    
    // The handle_updated_at trigger should set updated_at, but it's good practice for frontend to send it too if it's part of the type.
    // Our trigger is specific to ON UPDATE. If we were to use upsert, this might be needed.
    // For now, we rely on the trigger for updates.

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
      // Re-fetch or update local state if needed, or rely on useEffect reset if defaultValues change
      // For simplicity, form.formState.isDirty will become false after successful reset/submission
      const updatedProfile = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      if (updatedProfile.data) {
        setProfile(updatedProfile.data);
         form.reset({ // Reset form with new data to clear dirty state
            full_name: updatedProfile.data.full_name || '',
            subjects: (updatedProfile.data.subjects || []).join(', '),
            school_name: updatedProfile.data.school_name || '',
            location: updatedProfile.data.location || '',
            bio: updatedProfile.data.bio || '',
          });
      }
       // Manually trigger user update in auth context if full_name changed, as it might be in user metadata
      if (session && data.full_name !== session.user.user_metadata.full_name) {
        await supabase.auth.updateUser({ data: { full_name: data.full_name } });
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Could not save your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
     return (
      <div className="container mx-auto py-10 px-4 text-center">
        <p>Could not load profile. Please try signing in again.</p>
         <Button onClick={() => supabase.auth.signOut()} className="mt-4">Sign Out</Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-10 px-4">
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
                    <Input id="role" value={profile?.role || 'N/A'} readOnly className="bg-gray-100 dark:bg-gray-800" aria-label="Your role (read-only)" />
                  </FormControl>
                  <FormDescription>Your role is assigned by an administrator.</FormDescription>
                </FormItem>
              </div>

              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="subjects">Subjects You Teach</FormLabel>
                    <FormControl>
                      <Input id="subjects" {...field} placeholder="e.g., Mathematics, History, Physics" aria-invalid={!!form.formState.errors.subjects} />
                    </FormControl>
                    <FormDescription>Enter subjects separated by commas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid md:grid-cols-2 gap-6">
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
              </div>

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
    </div>
  );
};

export default ProfilePage;
