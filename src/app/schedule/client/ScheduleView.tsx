'use client';

import { DayOfWeek } from '@/types';
import { ScheduleData, DefaultTimeSlot } from '@/types/schedule';
import { ScheduleGrid, DayTabs } from '@/components/schedule';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Clock, RefreshCw, Settings, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface ScheduleViewProps {
  initialSchedule: ScheduleData; // Expect the full ScheduleData object
  _initialTimeSlots: DefaultTimeSlot[];
  initialSelectedDay: DayOfWeek;
  isAdmin: boolean;
  onEdit: () => void; // Function to switch to edit mode
  onEditTimes: () => void; // Function to switch to time edit mode
  onRefresh: () => void; // Add onRefresh prop
  permissions?: any; // Add permissions prop
  scheduleType?: any; // Add scheduleType prop
  classId?: string; // Add classId prop
}

/**
 * View component for displaying schedule - only for view mode (not edit mode)
 */
export default function ScheduleView({
  initialSchedule,
  _initialTimeSlots,
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
      {/* Admin-only controls */}
      {isAdmin && (
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <Button 
            variant="ghost" 
            title="רענון נתונים"
            onClick={onRefresh}
            className="text-gray-500 hover:text-indigo-600"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={onEditTimes}
            className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            <Clock className="h-4 w-4 mr-1" />
          </Button>
          
          <Button 
            variant="default" 
            onClick={onEdit}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Edit className="h-4 w-4 mr-1" />
          </Button>
          
          <Link href="/schedule/time-slots">
            <Button 
              variant="outline"
              className="text-green-700 border-green-200 hover:bg-green-50"
            >
              <Settings className="h-4 w-4 mr-1" />
            </Button>
          </Link>
          
          <Link href="/schedule/subjects">
            <Button 
              variant="outline"
              className="text-purple-700 border-purple-200 hover:bg-purple-50"
              title="ניהול מקצועות"
            >
              <BookOpen className="h-4 w-4 mr-1" />
            </Button>
          </Link>
        </div>
      )}
      
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