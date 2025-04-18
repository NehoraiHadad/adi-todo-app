'use client';

import { useState } from 'react';
import { DayOfWeek } from '@/types';
import { Button } from '@/components/ui/button';
import {
  getCurrentHebrewDay,
  useAdminCheck
} from '@/components/schedule';
import { Spinner } from '@/components/ui/Spinner';
import useSWR from 'swr'; // Import SWR
import ScheduleView from './client/ScheduleView'; // Import View component
import ScheduleEditor from './client/ScheduleEditor'; // Import Editor component

/**
 * Fetcher function for SWR
 */
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
});

/**
 * Main Schedule page component - Refactored
 */
export default function SchedulePage() {
  // selectedDay state is only used to initialize children
  const [selectedDay] = useState<DayOfWeek>(getCurrentHebrewDay());

  // Fetch data using SWR
  const { data, error, isLoading, mutate } = useSWR('/api/schedule', fetcher);

  // Admin check and editing state remain
  const { isAdmin } = useAdminCheck();
  const [isEditing, setIsEditing] = useState(false);
  const [isTimeEditing, setIsTimeEditing] = useState(false);
  // TODO: Consider moving editing state management into ScheduleEditor/hooks

  // Refresh data handler now uses SWR's mutate
  const handleRefreshData = () => {
    mutate(); // Re-fetch data
    console.log('Manually refreshing schedule data via SWR mutate');
  };
  
  // Loading state from SWR
  if (isLoading) {
    return (
      <div className="container-app py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">טוען מערכת לימודים...</p>
      </div>
    );
  }

  // Error state from SWR
  if (error) {
    return (
      <div className="container-app py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-600">שגיאה בטעינת מערכת הלימודים: {error.message}</p>
        <Button onClick={handleRefreshData} className="mt-4">נסה שוב</Button>
      </div>
    );
  }

  // Ensure data is loaded before rendering children
  if (!data) {
      return null; // Or a different loading/empty state
  }

  // Extracted schedule and default timeslots from SWR data
  const { schedule, defaultTimeSlots } = data;

  // Callbacks to switch modes
  const handleEnterEditMode = () => {
      setIsTimeEditing(false);
      setIsEditing(true);
  }
  const handleEnterTimeEditMode = () => {
      setIsEditing(false);
      setIsTimeEditing(true);
  }
  const handleExitEditMode = () => {
      setIsEditing(false);
      setIsTimeEditing(false);
      // Optionally add mutate() here if cancelling might revert optimistic updates
  }

  return (
    <div className="container-app py-2 sm:py-6 print:py-0">
      {/* Header section can be simplified or moved */}
      <div className="flex justify-between items-center mb-2 sm:mb-6 print:hidden">
        <h1 className="text-lg sm:text-3xl font-bold text-indigo-600 text-right mb-0">
          <span className="hidden sm:inline">מערכת לימודים שבועית</span>
          <span className="sm:hidden">מערכת לימודים</span>
        </h1>
      </div>
      
      {/* Render View or Editor based on state */}
      { !isEditing && !isTimeEditing ? (
          <ScheduleView
            initialSchedule={schedule}
            _initialTimeSlots={defaultTimeSlots}
            initialSelectedDay={selectedDay}
            isAdmin={isAdmin}
            onEdit={handleEnterEditMode}
            onEditTimes={handleEnterTimeEditMode}
            onRefresh={handleRefreshData}
          />
      ) : (
          <ScheduleEditor
            initialSchedule={schedule}
            _initialTimeSlots={defaultTimeSlots}
            initialSelectedDay={selectedDay}
            isTimeEditingMode={isTimeEditing}
            onCancel={handleExitEditMode}
          />
      )}
      
      {/* Footer/Padding */}
      <div className="h-16 md:hidden print:hidden"></div>
    </div>
  );
} 