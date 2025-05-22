
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
  subjects: z.array(z.string()).optional(), // Changed from z.string() to z.array(z.string())
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
      subjects: [], // Changed from '' to []
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

          if (error && error.code !== 'PGRST116') { 
            throw error;
          }
          if (data) {
            setProfile(data);
            form.reset({
              full_name: data.full_name || '',
              subjects: data.subjects || [], // Changed from .join(', ') to direct array or empty array
              school_name: data.school_name || '',
              location: data.location || '',
              bio: data.bio || '',
            });
          } else if (!error) { 
            setProfile(null); 
            if (user.user_metadata?.full_name) {
              form.reset({ ...form.getValues(), full_name: user.user_metadata.full_name, subjects: [] });
            } else {
              form.reset({ ...form.getValues(), subjects: [] }); // Ensure subjects is an array
            }
          }
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Failed to load profile",
            description: error.message || "Could not fetch your profile data.",
          });
          setProfile(null); 
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchProfile();
    } else if (!authLoading) { 
        setIsLoadingData(false);
        setProfile(null);
    }
  }, [user, authLoading, form, toast]);

  const handleProfileUpdate = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    // subjects data is now an array directly from the form
    const updateData: ProfileUpdate = {
      user_id: user.id, 
      full_name: data.full_name,
      subjects: data.subjects || [], // Use the array directly, ensure it's an array
      school_name: data.school_name || null,
      location: data.location || null,
      bio: data.bio || null,
      updated_at: new Date().toISOString(),
    };
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updateData) 
            .eq('user_id', user.id);

        if (error) throw error;

        toast({
            title: "Profile updated",
            description: "Your profile information has been saved successfully.",
        });

        const updatedProfileResult = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        if (updatedProfileResult.data) {
            setProfile(updatedProfileResult.data);
            form.reset({ 
                full_name: updatedProfileResult.data.full_name || '',
                subjects: updatedProfileResult.data.subjects || [], // Reset with array
                school_name: updatedProfileResult.data.school_name || '',
                location: updatedProfileResult.data.location || '',
                bio: updatedProfileResult.data.bio || '',
            });
        }
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
    isLoading: authLoading || isLoadingData, 
    isSubmitting,
    handleProfileUpdate,
    user, 
    session 
  };
};
