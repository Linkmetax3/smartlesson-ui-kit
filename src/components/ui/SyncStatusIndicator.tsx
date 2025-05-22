
import React from 'react';
import { Wifi } from 'lucide-react'; // Or another suitable icon like CheckCircle

const SyncStatusIndicator = () => {
  // In a real app, this would reflect actual sync status
  const isOnline = true; // Placeholder
  const statusText = isOnline ? 'Synced' : 'Offline';
  const dotColor = isOnline ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground" aria-label={`Sync status: ${statusText}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
      <span>{statusText}</span>
      {/* Optional: Icon if needed */}
      {/* <Wifi size={16} /> */}
    </div>
  );
};

export default SyncStatusIndicator;
