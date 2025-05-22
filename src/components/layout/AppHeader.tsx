
import React from 'react';
// import AppLogo from './AppLogo'; // AppLogo is not used here
// import UserAvatar from './UserAvatar'; // Replaced by UserNav
import UserNav from './UserNav'; // Added UserNav
import SyncStatusIndicator from '../ui/SyncStatusIndicator';
import { SidebarTrigger } from "@/components/ui/sidebar";
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
          <div className="hidden lg:block">
            {/* Potentially a breadcrumb or page title here */}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <SyncStatusIndicator />
          <UserNav /> {/* Replaced UserAvatar with UserNav */}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
