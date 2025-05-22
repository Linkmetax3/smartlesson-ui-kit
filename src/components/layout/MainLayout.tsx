
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import AppHeader from './AppHeader';

const MainLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col lg:flex-row w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full lg:w-[calc(100%-var(--sidebar-width))]"> {/* Adjust width based on sidebar */}
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
