
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Settings, ChevronDown, ChevronUp } from 'lucide-react'; // Added Chevron icons for collapsibility
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
} from "@/components/ui/sidebar"; // Assuming these are available from shadcn/ui
import AppLogo from './AppLogo';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Courses", href: "/courses", icon: BookOpen },
];

const secondaryNavItems = [
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="border-r flex flex-col">
      <SidebarHeader className="p-4 border-b">
        {/* In collapsed state, we might want a smaller logo or just an icon */}
        {/* This part is tricky with current shadcn/ui sidebar, might need custom logic for collapsed logo */}
        <div className="hidden lg:block">
          <AppLogo />
        </div>
         <div className="lg:hidden"> {/* Minimal logo for small/collapsed view */}
          <Link to="/" className="text-2xl font-bold font-inter text-primary">SL</Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-4">
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    variant={location.pathname === item.href ? 'default' : 'ghost'}
                    className={cn(
                      "w-full justify-start",
                      location.pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Link to={item.href}>
                      <item.icon className="mr-2 h-5 w-5" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    variant={location.pathname === item.href ? 'default' : 'ghost'}
                    className={cn(
                      "w-full justify-start",
                      location.pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Link to={item.href}>
                      <item.icon className="mr-2 h-5 w-5" />
                       <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2025 SmartLesson</p>
      </SidebarFooter>
    </Sidebar>
  );
}
