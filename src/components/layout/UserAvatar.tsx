
import React from 'react';
import { User } from 'lucide-react'; // Using User icon as a placeholder

const UserAvatar = () => {
  return (
    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
      <User size={24} />
    </div>
  );
};

export default UserAvatar;
