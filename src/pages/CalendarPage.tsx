import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // for future drag and drop
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LessonContent } from '@/types/lesson';
import { Json } from '@/integrations/supabase/types';
import UnscheduledLessonCard from '@/components/calendar/UnscheduledLessonCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


// Import FullCalendar's base styles and theme (optional)
// These are often imported globally, but for now, let's keep them here.
// Make sure your bundler handles these CSS imports.
// Note: Depending on your setup, you might need to import these in a global CSS file (e.g., App.css or index.css)
// For Shadcn/ui projects, sometimes CSS is handled via Tailwind. FullCalendar has its own styling.
// import '@fullcalendar/common/main.css'; // Core + DayGrid + TimeGrid + List + MultiMonth + Interaction + Bootstrap5 + GoogleCalendar
// Instead, we can import specific plugin CSS if preferred:
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';


interface LessonPlanRecord {
  id: string;
  content: LessonContent;
  parameters: Json;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface CalendarEventRecord {
  id: string;
  plan_id: string;
  user_id: string;
  scheduled_for: string;
  title: string;
  created_at: string;
}

const fetchLessonPlans = async (userId: string | undefined): Promise<LessonPlanRecord[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('id, content, parameters, created_at, updated_at, user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching lesson plans for calendar:', error);
    throw new Error(error.message);
  }
  return (data || []).map(plan => ({
    ...plan,
    content: plan.content as unknown as LessonContent,
  })) as LessonPlanRecord[];
};

const fetchCalendarEvents = async (userId: string | undefined): Promise<CalendarEventRecord[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, plan_id, user_id, scheduled_for, title, created_at')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const CalendarPage = () => {
  const { user } = useAuth();

  const { data: lessonPlans, isLoading: isLoadingLessonPlans, error: errorLessonPlans } = useQuery<LessonPlanRecord[], Error>({
    queryKey: ['lessonPlansForCalendar', user?.id],
    queryFn: () => fetchLessonPlans(user?.id),
    enabled: !!user,
  });

  const { data: calendarEvents, isLoading: isLoadingCalendarEvents, error: errorCalendarEvents } = useQuery<CalendarEventRecord[], Error>({
    queryKey: ['calendarEvents', user?.id],
    queryFn: () => fetchCalendarEvents(user?.id),
    enabled: !!user,
  });

  const unscheduledLessonPlans = useMemo(() => {
    if (!lessonPlans || !calendarEvents) return [];
    const scheduledPlanIds = new Set(calendarEvents.map(event => event.plan_id));
    return lessonPlans.filter(plan => !scheduledPlanIds.has(plan.id));
  }, [lessonPlans, calendarEvents]);

  const fullCalendarEvents = useMemo(() => {
    if (!calendarEvents) return [];
    return calendarEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.scheduled_for,
      // You might want to add an 'end' time if your events have duration
      // extendedProps: { planId: event.plan_id } // For storing additional data
    }));
  }, [calendarEvents]);

  const isLoading = isLoadingLessonPlans || isLoadingCalendarEvents;
  const error = errorLessonPlans || errorCalendarEvents;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-var(--header-height,4rem)-2rem)] gap-4 p-1"> {/* Adjust height based on your header */}
      {/* Left Sidebar: Unscheduled Lessons */}
      <div className="lg:w-1/4 xl:w-1/5 h-full flex flex-col border rounded-lg p-2 bg-card">
        <h2 className="text-lg font-semibold mb-3 p-2">Unscheduled Lessons</h2>
        <ScrollArea className="flex-grow pr-2">
          {isLoading && (
            <>
              <Skeleton className="h-16 w-full mb-2" />
              <Skeleton className="h-16 w-full mb-2" />
              <Skeleton className="h-16 w-full mb-2" />
            </>
          )}
          {error && (
             <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load lesson data: {error.message}
              </AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && unscheduledLessonPlans.length === 0 && (
            <p className="text-sm text-muted-foreground p-2">No unscheduled lessons.</p>
          )}
          {!isLoading && !error && unscheduledLessonPlans.map(plan => (
            <UnscheduledLessonCard key={plan.id} lessonPlan={plan} />
          ))}
        </ScrollArea>
      </div>

      {/* Right Content: FullCalendar */}
      <div className="flex-grow h-full border rounded-lg p-1 bg-card overflow-hidden">
        {isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        {error && !isLoading && (
           <Alert variant="destructive" className="m-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error loading calendar</AlertTitle>
            <AlertDescription>
              Could not load calendar events: {error.message}
            </AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            weekends={true} // Show Mon-Sun by default, can be configured
            slotMinTime="08:00:00" // 8 AM
            slotMaxTime="17:00:00" // 5 PM
            allDaySlot={false} // Typically don't need all-day slot for this kind of scheduling
            events={fullCalendarEvents}
            height="100%" // Make calendar fill its container
            // droppable={true} // Enable for future drag-n-drop
            // eventDrop={(info) => console.log('Event dropped:', info.event)} // Placeholder for drop
            // dateClick={(info) => console.log('Date clicked:', info.dateStr)} // Placeholder for date click
            // eventClick={(info) => console.log('Event clicked:', info.event)} // Placeholder for event click
            businessHours={{ // Highlights business hours
              daysOfWeek: [ 1, 2, 3, 4, 5 ], // Monday - Friday
              startTime: '08:00',
              endTime: '17:00',
            }}
            nowIndicator={true}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
