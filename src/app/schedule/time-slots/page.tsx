import { Metadata } from 'next';
import TimeSlotSettings from './TimeSlotSettings';
import { fetchDefaultTimeSlots } from '@/server/schedule/queries';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'הגדרות שעות שיעורים | מערכת שעות',
  description: 'ניהול שעות ברירת המחדל של השיעורים במערכת השעות',
};

/**
 * Asynchronously loads the time slots for the settings page
 */
async function TimeSlotSettingsLoader() {
  // Fetch time slots from the server
  const timeSlots = await fetchDefaultTimeSlots();
  
  return <TimeSlotSettings initialTimeSlots={timeSlots} />;
}

/**
 * Page for managing time slot settings
 */
export default function TimeSlotsPage() {
  return (
    <main className="container max-w-4xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8">
        הגדרות שעות שיעורים
      </h1>
      
      <Suspense fallback={
        <div className="flex flex-col justify-center items-center min-h-[200px] sm:min-h-[300px]">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-indigo-600 mb-2" />
          <span className="text-base sm:text-lg">טוען נתונים...</span>
        </div>
      }>
        <TimeSlotSettingsLoader />
      </Suspense>
    </main>
  );
} 