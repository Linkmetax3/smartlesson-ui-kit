
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'; // Assuming these are from shadcn/ui

interface PlaceholderCardProps {
  title: string;
  description?: string;
}

const PlaceholderCard: React.FC<PlaceholderCardProps> = ({ title, description }) => {
  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Coming Soon... This page is under construction.</p>
      </CardContent>
    </Card>
  );
};

export default PlaceholderCard;
