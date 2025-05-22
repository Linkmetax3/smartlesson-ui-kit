
import React from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage = () => {
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Settings</CardTitle>
          <CardDescription>Manage your application settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="text-lg font-medium">Appearance</h3>
              <p className="text-sm text-muted-foreground">
                Customize the look and feel of the application.
              </p>
            </div>
            <ThemeToggle />
          </div>
          {/* Add more settings sections here as needed */}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
