'use client';

import { DayOfWeek } from '@/types';
import { ScheduleData, DefaultTimeSlot } from '@/types/schedule';
import { ScheduleGrid, DayTabs } from '@/components/schedule';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Clock, RefreshCw } from 'lucide-react';

interface ScheduleViewProps {
  initialSchedule: ScheduleData; // Expect the full ScheduleData object
  _initialTimeSlots: DefaultTimeSlot[]; // Renamed from initialTimeSlots
  initialSelectedDay: DayOfWeek;
  isAdmin: boolean;
  onEdit: () => void; // Function to switch to edit mode
  onEditTimes: () => void; // Function to switch to time edit mode
  onRefresh: () => void; // Add onRefresh prop
}

/**
 * Read-only view of the schedule.
 */
export default function ScheduleView({
  initialSchedule,
  _initialTimeSlots, // Renamed from initialTimeSlots
  initialSelectedDay,
  isAdmin,
  onEdit,
  onEditTimes,
  onRefresh // Destructure onRefresh prop
}: ScheduleViewProps) {
  // Selected day state is managed here for view mode
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialSelectedDay);

  const handleDayChange = (day: DayOfWeek) => {
    setSelectedDay(day);
  };

  return (
    <div>
       {/* Header section with Edit buttons - specific to View mode */}
       <div className="flex justify-end gap-2 mb-4 print:hidden">
            {/* Add Refresh Button */}
            <Button 
                onClick={onRefresh}
                variant="outline" 
                size="icon" // Use icon size for consistency
                aria-label="רענן נתונים"
            >
                <RefreshCw className="h-4 w-4" /> 
            </Button>
            {isAdmin && (
                <Button 
                    onClick={onEdit}
                    aria-label="ערוך מערכת"
                    variant="outline" // Change to outline for consistency
                    size="icon" // Use icon size
                >
                    <Edit className="h-4 w-4" /> 
                    {/* Removed text: ערוך מערכת */}
                </Button>
            )}
            {isAdmin && (
                <Button 
                    onClick={onEditTimes}
                    variant="outline" // Change to outline for consistency
                    size="icon" // Use icon size
                    aria-label="ערוך זמנים"
                 >
                    <Clock className="h-4 w-4" /> 
                    {/* Removed text: ערוך זמנים */}
                 </Button>
            )}
        </div>

      {/* Day tabs remain */}
      <div className="print:hidden">
        <DayTabs 
          selectedDay={selectedDay} 
          onDayChange={handleDayChange} 
        />
      </div>

      {/* Pass the relevant day's ScheduleSlot array to the grid */}
      <ScheduleGrid
        scheduleSlots={initialSchedule[selectedDay] || []} // Pass slots for the selected day
        isEditing={false} 
        isTimeEditing={false} 
        onEdit={() => {}} 
        onTimeEdit={() => {}} 
        _isAdmin={isAdmin} 
      />
    </div>
  );
} 