
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import AuthGuard from "./components/auth/AuthGuard";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Public Pages
import LandingPage from "./pages/LandingPage"; // New Landing Page
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Protected Pages
import DashboardPage from "./pages/DashboardPage"; // Renamed from Index
import ProfilePage from "./pages/ProfilePage";
import LessonsPage from "./pages/LessonsPage";
import NewLessonPage from "./pages/NewLessonPage";
import QuizzesPage from "./pages/QuizzesPage";
import ResourcesPage from "./pages/ResourcesPage";
import CalendarPage from "./pages/CalendarPage";
import NotificationsPage from "./pages/NotificationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

// Helper component to handle root navigation based on auth state
const RootRedirector = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // You might want a more sophisticated loading screen
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<RootRedirector />} /> {/* Handles / and redirects if logged in */}
            <Route path="/landing" element={<LandingPage />} /> {/* Direct access to landing if needed, though / handles it */}
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes wrapped by MainLayout and AuthGuard */}
            <Route 
              element={
                <AuthGuard>
                  <MainLayout />
                </AuthGuard>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} /> {/* New Dashboard route */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/lessons" element={<LessonsPage />} />
              <Route path="/lessons/new" element={<NewLessonPage />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              
              <Route path="/courses" element={<Navigate to="/lessons" replace />} />
              {/* Catch-all for protected routes, make sure it's within AuthGuard scope */}
              <Route path="*" element={<NotFound />} />
            </Route>
            {/* A general catch-all if unmatched by protected routes might be needed if some non-protected routes are missed */}
            {/* <Route path="*" element={<NotFound />} /> uncomment if a global fallback is desired outside protected layout */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

