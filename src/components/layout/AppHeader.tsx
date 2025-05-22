import React from 'react';
import AppLogo from './AppLogo';
import UserAvatar from './UserAvatar';
import { SidebarTrigger } from "@/components/ui/sidebar"; // From shadcn/ui
import { Menu } from 'lucide-react';

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
           <SidebarTrigger className="lg:hidden mr-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </SidebarTrigger>
          {/* Logo is part of sidebar header, but for mobile header visibility or different desktop header design */}
          {/* For now, keeping it simple. The sidebar trigger is the main element here for mobile. */}
          {/* On desktop, the sidebar is always visible or collapsible independently */}
          <div className="hidden lg:block">
            {/* Potentially a breadcrumb or page title here */}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Add any header actions here: notifications, search, etc. */}
          <UserAvatar />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
