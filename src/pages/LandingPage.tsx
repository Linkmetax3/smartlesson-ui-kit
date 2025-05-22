
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button'; // Using shadcn Button
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold font-inter text-primary">
            SmartLesson
          </Link>
          <nav className="space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20 text-center">
          <div className="container mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold font-inter mb-6">
              Welcome to <span className="text-primary">SmartLesson</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-roboto mb-10 max-w-3xl mx-auto">
              Revolutionize your teaching with AI-powered lesson planning, resource discovery, and student engagement tools.
            </p>
            <Button size="lg" className="px-8 py-3 text-lg" asChild>
              <Link to="/signup">
                Join SmartLesson Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 font-inter">
              Everything you need to teach smarter
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>AI Lesson Plan Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Instantly create engaging and comprehensive lesson plans tailored to your students' needs. Save hours of prep time.
                  </CardDescription>
                  <Button variant="link" className="p-0 h-auto mt-4" asChild>
                    <Link to="/signup">Explore Generation <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Smart Resource Discovery</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Find the perfect videos, articles, and interactive content aligned with your curriculum, powered by AI.
                  </CardDescription>
                   <Button variant="link" className="p-0 h-auto mt-4" asChild>
                    <Link to="/signup">Discover Resources <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Automated Quiz Creation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Generate diverse quizzes and assessments in minutes to check for understanding and track student progress.
                  </CardDescription>
                   <Button variant="link" className="p-0 h-auto mt-4" asChild>
                    <Link to="/signup">Create Quizzes <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center border-t">
        <p className="text-muted-foreground">&copy; {new Date().getFullYear()} SmartLesson. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

