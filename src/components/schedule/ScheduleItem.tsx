import { Subject, TimeSlot } from './types';

interface ScheduleItemProps {
  time: string;
  timeSlot: TimeSlot;
  lesson: Subject | null;
  slotIndex: number;
  isEditing: boolean;
  isTimeEditing: boolean;
  onEdit: (slotIndex: number) => void;
  onTimeEdit: (slotIndex: number, changes: Partial<TimeSlot>) => void;
}

/**
 * Individual schedule item component that displays a lesson or an empty slot
 */
export default function ScheduleItem({ 
  time, 
  timeSlot,
  lesson, 
  slotIndex,
  isEditing, 
  isTimeEditing,
  onEdit,
  onTimeEdit
}: ScheduleItemProps) {
  return (
    <div className="grid grid-cols-12 border-b border-gray-200 last:border-b-0">
      {/* Time column */}
      <div className="col-span-3 lg:col-span-2 flex items-center justify-center p-4 bg-gray-50 border-r border-gray-200 relative">
        {isTimeEditing ? (
          <div className="flex flex-col w-full space-y-2">
            <div className="flex items-center">
              <label className="text-xs text-gray-500 ml-1">התחלה:</label>
              <input
                type="time"
                className="w-full px-2 py-1 text-sm border rounded"
                value={timeSlot.startTime}
                onChange={(e) => onTimeEdit(slotIndex, { startTime: e.target.value })}
              />
            </div>
            <div className="flex items-center">
              <label className="text-xs text-gray-500 ml-1">סיום:</label>
              <input
                type="time"
                className="w-full px-2 py-1 text-sm border rounded"
                value={timeSlot.endTime}
                onChange={(e) => onTimeEdit(slotIndex, { endTime: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <span className="text-gray-600 font-medium text-sm md:text-base ltr-content">{time}</span>
        )}
      </div>
      
      {/* Subject column */}
      <div className="col-span-9 lg:col-span-10 p-4">
        {lesson ? (
          <div className={`flex items-center p-3 rounded-lg ${lesson.color}`}>
            <span className="text-2xl ml-3">{lesson.icon}</span>
            <span className={`${lesson.textColor} font-bold`}>{lesson.name}</span>
            
            {isEditing && (
              <button
                className="ml-auto bg-white bg-opacity-50 hover:bg-opacity-70 transition-colors rounded-full p-1.5"
                onClick={() => onEdit(slotIndex)}
                aria-label="ערוך שיעור"
              >
                <span className="text-gray-600 text-lg">✏️</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {isEditing ? (
              <button
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center"
                onClick={() => onEdit(slotIndex)}
              >
                <span className="text-gray-600 text-lg ml-2">➕</span>
                <span className="text-gray-600">הוסף שיעור</span>
              </button>
            ) : (
              <span className="text-gray-400 text-sm">אין שיעור</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 