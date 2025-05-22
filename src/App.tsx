
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import AuthGuard from "./components/auth/AuthGuard";
import { AuthProvider } from "./contexts/AuthContext";

// Public Pages
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Protected Pages
import ProfilePage from "./pages/ProfilePage";
import LessonsPage from "./pages/LessonsPage";
import NewLessonPage from "./pages/NewLessonPage";
import QuizzesPage from "./pages/QuizzesPage";
import ResourcesPage from "./pages/ResourcesPage";
import CalendarPage from "./pages/CalendarPage";
import NotificationsPage from "./pages/NotificationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

// Settings Page
const SettingsPage = () => <div className="text-center"><h1 className="text-3xl font-bold">Settings Page</h1><p>User settings will be managed here.</p></div>;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter> {/* BrowserRouter now wraps AuthProvider */}
        <AuthProvider>
          <Toaster />
          <Sonner /> {/* Ensure this is the Sonner component intended */}
          <Routes>
            {/* Public routes */}
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
              <Route path="/" element={<Index />} />
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
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

