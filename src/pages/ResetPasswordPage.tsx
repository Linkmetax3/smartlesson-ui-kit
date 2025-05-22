
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setMessageSent(false);
    try {
      // The redirect URL should be configured in your Supabase project settings.
      // It should point to a page in your app that handles the password update,
      // often by listening to the 'PASSWORD_RECOVERY' auth event or by handling a specific route.
      // For example: `${window.location.origin}/update-password`
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/update-password`, // Ensure this route exists and handles password updates
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Check your email",
        description: "If an account exists for this email, a password reset link has been sent.",
      });
      setMessageSent(true);
      form.reset();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending reset link",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            {messageSent 
              ? "A password reset link has been sent to your email if an account exists."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!messageSent ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <Input id="email" type="email" placeholder="you@example.com" {...field} aria-invalid={!!form.formState.errors.email} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Reset Link
                </Button>
              </form>
            </Form>
          ) : (
             <Button onClick={() => setMessageSent(false)} className="w-full" variant="outline">
              Send another link
            </Button>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>Remember your password? <Link to="/signin" className="font-medium text-primary hover:underline">Sign In</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
