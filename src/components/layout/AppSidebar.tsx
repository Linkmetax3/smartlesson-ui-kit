
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Settings, 
  User, 
  FilePlus, 
  ClipboardList, 
  Archive, 
  // CalendarDays, // Removed CalendarDays import
  Bell, 
  BarChart3 
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import AppLogo from './AppLogo';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Lessons", href: "/lessons", icon: BookOpen },
  { title: "New Lesson", href: "/lessons/new", icon: FilePlus },
  { title: "Quizzes", href: "/quizzes", icon: ClipboardList },
  { title: "Resources", href: "/resources", icon: Archive },
];

const toolsNavItems = [
  // { title: "Calendar", href: "/calendar", icon: CalendarDays }, // Removed Calendar link
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];

const accountNavItems = [
  { title: "Profile", href: "/profile", icon: User },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  const renderNavItems = (items: typeof mainNavItems | typeof toolsNavItems | typeof accountNavItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton 
            asChild 
            variant={location.pathname === item.href ? 'default' : 'ghost'}
            className={cn(
              "w-full justify-start",
              location.pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            tooltip={item.title}
          >
            <Link to={item.href}>
              <item.icon className="mr-2 h-5 w-5" />
              <span className="truncate">{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar className="border-r flex flex-col" collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <div className="hidden lg:block group-data-[collapsible=icon]:hidden">
          <AppLogo />
        </div>
         <div className="lg:hidden group-data-[collapsible=icon]:block group-data-[collapsible=icon]:mx-auto">
          <Link to="/dashboard" className="text-2xl font-bold font-inter text-primary">SL</Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavItems(mainNavItems)}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavItems(toolsNavItems)}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavItems(accountNavItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} SmartLesson</p>
      </SidebarFooter>
    </Sidebar>
  );
}
