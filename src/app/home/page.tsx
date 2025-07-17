import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from 'react';

import { createClient } from '@/utils/supabase/server';
import { TasksList } from '@/components/tasks/TasksList';
import { MoodSelector } from '@/components/mood/MoodSelector';
import { ChildMessagesDisplay } from '@/components/messages/ChildMessagesDisplay';
import { TodaySchedule } from '@/components/schedule/TodaySchedule';
import { Task } from '@/types';
import { ScheduleSlot } from '@/types/schedule';
import { fetchProcessedScheduleData } from '@/server/schedule/queries';
import { getCurrentHebrewDay } from '@/components/schedule/utils';
import { Toaster } from '@/components/ui/toaster';

// Loading fallback component
const LoadingFallback = () => (
  <div className="p-4 text-center">
    <div className="animate-pulse">טוען...</div>
  </div>
);

// Client components wrapper with Suspense
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

export default async function HomePage() {
  // Fetch the current user's information
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user profile from database to get display name
  let displayName = "אורח";
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    if (profile && profile.display_name) {
      displayName = profile.display_name;
    } else if (user.user_metadata?.display_name) {
      displayName = user.user_metadata.display_name;
    } else if (user.email) {
      displayName = user.email.split('@')[0];
    }
  }
  
  // Fetch data for components
  let slotsForToday: ScheduleSlot[] = [];
  let tasks: Task[] = [];
  
  if (user) {
    // Fetch the processed schedule data for all days
    try {
      const fullScheduleData = await fetchProcessedScheduleData();
      const currentDayEnum = getCurrentHebrewDay(); // Get current DayOfWeek enum
      slotsForToday = fullScheduleData[currentDayEnum] || []; // Get slots for today
    } catch (scheduleError) {
      console.error("Error fetching processed schedule data:", scheduleError);
      slotsForToday = []; // Default to empty on error
    }
    
    // Fetch active tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!tasksError) {
      tasks = tasksData;
    }
  }
  
  return (
    <main className="container-app py-6">
      {/* Personal welcome section */}
      <Card className="bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-none mb-6 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold">שלום, {displayName}! יום נפלא!</h1>
          <p className="text-xl font-medium mt-2">היום תצליחי לעשות משהו נפלא!</p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Mood Selection Card */}
        <SuspenseWrapper>
          <MoodSelector userId={user?.id} />
        </SuspenseWrapper>
        
        {/* Message from Parents Card */}
        <SuspenseWrapper>
          <ChildMessagesDisplay 
            userId={user?.id || ''} 
            userName={displayName}
            maxMessages={1}
            autoRefresh={true}
            autoRefreshInterval={30000}
            showRefreshButton={false}
          />
        </SuspenseWrapper>
        
        {/* Today's Schedule Card - Pass slotsForToday prop */}
        <SuspenseWrapper>
          <TodaySchedule slotsForToday={slotsForToday} />
        </SuspenseWrapper>
      </div>
      
      {/* Daily Tasks Section */}
      <SuspenseWrapper>
        <TasksList initialTasks={tasks} userId={user?.id} />
      </SuspenseWrapper>
      
      {/* Navigation - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg py-2 px-4 md:hidden border-t-2 border-indigo-100 z-50">
        <div className="flex justify-around">
          <Link href="/home" className="flex flex-col items-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
            <span className="text-xs">בית</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
            <span className="text-xs">הודעות</span>
          </Link>
          <Link href="/tasks" className="flex flex-col items-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M5.625 3.75a2.625 2.625 0 100 5.25h12.75a2.625 2.625 0 000-5.25H5.625zM3.75 11.25a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75zM3 15.75a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3.75 18.75a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75z" />
            </svg>
            <span className="text-xs">משימות</span>
          </Link>
          <Link href="/schedule" className="flex flex-col items-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">מערכת שעות</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">פרופיל</span>
          </Link>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
}