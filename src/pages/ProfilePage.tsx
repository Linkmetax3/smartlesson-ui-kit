
import React from 'react';
import { FormProvider } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import ProfileForm from '@/components/profile/ProfileForm';

const ProfilePage = () => {
  const { 
    profile, 
    form, 
    isLoading, 
    isSubmitting, 
    handleProfileUpdate,
    user // from useProfileData, which gets it from useAuth
  } = useProfileData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, if there's no user (e.g. auth error, or user signed out somehow)
  // or if user exists but profile is null (e.g. fetch failed critically, or profile genuinely doesn't exist and wasn't created)
  if (!user) {
     return (
      <div className="container mx-auto py-10 px-4 text-center">
        <p>You must be logged in to view this page.</p>
        {/* Optionally, add a button to redirect to sign-in, or rely on AuthGuard */}
      </div>
    );
  }
  
  // If user exists, but profile is null (and not loading), this could mean the profile record was not found or not created by trigger.
  // The useProfileData hook attempts to prefill full_name if user exists but profile doesn't.
  // The RLS policies ensure they can only fetch their own profile. If it's null here, it wasn't found for auth.uid().
  // A new user might not have a profile yet if the trigger failed or if they haven't submitted the form for the first time
  // depending on how "creation" vs "update" is handled. The hook currently assumes an update.
  // If we want users to be able to *create* their profile if one doesn't exist via this form,
  // the handleProfileUpdate would need upsert logic and appropriate RLS INSERT policy.
  // For now, we assume the trigger creates the profile. If 'profile' is null, it means it couldn't be fetched.
  if (!profile && user) { 
    // This state could occur if fetchProfile failed in a way that setProfile(null)
    // or if the profile truly doesn't exist for this user ID.
    // The hook tries to load it. If it's still null, it's problematic.
    return (
     <div className="container mx-auto py-10 px-4 text-center">
       <p>Could not load your profile data. It might not exist yet or there was an error.</p>
       <p>If you are a new user, your profile might be created upon first save.</p>
       {/* We still render the form to allow creation/first save if that's the intended flow */}
       {/* Or show a more specific error/guidance */}
       {/* For now, let's provide the form, which will be prefilled with full_name if available */}
       <FormProvider {...form}>
          <ProfileForm
            onSubmit={handleProfileUpdate}
            isSubmitting={isSubmitting}
            initialProfileRole={profile?.role || user.user_metadata?.role || 'N/A'} // Attempt to get role
          />
        </FormProvider>
        <Button onClick={() => supabase.auth.signOut()} className="mt-4">Sign Out & Try Again</Button>
     </div>
   );
  }


  return (
    <div className="container mx-auto py-10 px-4">
      <FormProvider {...form}> {/* Provide form context to ProfileForm */}
        <ProfileForm
          onSubmit={handleProfileUpdate}
          isSubmitting={isSubmitting}
          initialProfileRole={profile?.role}
        />
      </FormProvider>
    </div>
  );
};

export default ProfilePage;

