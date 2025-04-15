import { DayOfWeek } from '@/types';
import { ScheduleData, TimeSlot } from './types';
import ScheduleItem from './ScheduleItem';

interface ScheduleGridProps {
  selectedDay: DayOfWeek;
  schedule: ScheduleData;
  timeSlots: TimeSlot[];
  isEditing: boolean;
  isTimeEditing: boolean;
  onEdit: (slotIndex: number) => void;
  onTimeEdit: (slotIndex: number, changes: Partial<TimeSlot>) => void;
}

/**
 * Grid component that displays the schedule for a selected day
 */
export default function ScheduleGrid({ 
  selectedDay, 
  schedule, 
  timeSlots,
  isEditing,
  isTimeEditing,
  onEdit,
  onTimeEdit
}: ScheduleGridProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-indigo-100 mb-6 overflow-hidden">
      {timeSlots.map((timeSlot, slotIndex) => (
        <ScheduleItem
          key={slotIndex}
          time={`${timeSlot.startTime} - ${timeSlot.endTime}`}
          timeSlot={timeSlot}
          lesson={schedule[selectedDay][slotIndex]}
          slotIndex={slotIndex}
          isEditing={isEditing}
          isTimeEditing={isTimeEditing}
          onEdit={onEdit}
          onTimeEdit={onTimeEdit}
        />
      ))}
    </div>
  );
} 