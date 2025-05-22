
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Zod schema for profile form validation
const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  subjects: z.string().optional(), // Handled as string in form, converted to array for DB
  school_name: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const useProfileData = () => {
  const { user, isLoading: authLoading, session } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      subjects: '',
      school_name: '',
      location: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (user && !authLoading) {
      const fetchProfile = async () => {
        setIsLoadingData(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows means no profile found yet
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
          } else if (!error) { // No data and no error means profile doesn't exist
            setProfile(null); // Ensure profile is null if not found
             // Optionally prefill full_name from auth if profile is new
            if (user.user_metadata?.full_name) {
              form.reset({ ...form.getValues(), full_name: user.user_metadata.full_name });
            }
          }
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Failed to load profile",
            description: error.message || "Could not fetch your profile data.",
          });
          setProfile(null); // Ensure profile is null on error
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchProfile();
    } else if (!authLoading) { // No user, or auth still loading
        setIsLoadingData(false);
        setProfile(null);
    }
  }, [user, authLoading, form, toast]); // form.reset is stable, toast is stable

  const handleProfileUpdate = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    const subjectsArray = data.subjects ? data.subjects.split(',').map(s => s.trim()).filter(s => s) : [];

    const updateData: ProfileUpdate = {
      user_id: user.id, // Ensure user_id is part of the update DTO if it's a new profile (upsert scenario)
      full_name: data.full_name,
      subjects: subjectsArray,
      school_name: data.school_name || null,
      location: data.location || null,
      bio: data.bio || null,
      updated_at: new Date().toISOString(),
      // Role is typically not updated here by the user
    };
    
    // If profile exists, update. If not, insert (upsert logic).
    // Supabase `update` with `eq` will fail if row doesn't exist.
    // So, we check if profile existed to decide between insert and update, or use upsert.
    // For simplicity, let's assume an `upsert` or separate insert/update logic if needed.
    // Current `profiles` table RLS might need an INSERT policy if we want client-side inserts.
    // The `handle_new_user` trigger handles initial insert. Subsequent saves are updates.

    try {
        const { error } = await supabase
            .from('profiles')
            .update(updateData) // This assumes the profile row ALREADY EXISTS because of the trigger.
            .eq('user_id', user.id);

        if (error) throw error;

        toast({
            title: "Profile updated",
            description: "Your profile information has been saved successfully.",
        });

        // Refresh profile data and form after successful update
        const updatedProfileResult = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        if (updatedProfileResult.data) {
            setProfile(updatedProfileResult.data);
            form.reset({ 
                full_name: updatedProfileResult.data.full_name || '',
                subjects: (updatedProfileResult.data.subjects || []).join(', '),
                school_name: updatedProfileResult.data.school_name || '',
                location: updatedProfileResult.data.location || '',
                bio: updatedProfileResult.data.bio || '',
            });
        }
        // Update Supabase Auth user metadata if full_name changed
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

  return {
    profile,
    form,
    isLoading: authLoading || isLoadingData, // Combined loading state
    isSubmitting,
    handleProfileUpdate,
    user, // pass user for checks in page
    session // pass session for checks in page or if needed elsewhere
  };
};

