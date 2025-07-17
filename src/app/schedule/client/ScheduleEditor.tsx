'use client';

import { useState, useEffect, useCallback } from 'react';
import { DayOfWeek } from '@/types';
import { Subject, ScheduleSlot, ScheduleData, DefaultTimeSlot } from '@/types/schedule';
import { ScheduleGrid, DayTabs, SubjectModal } from '@/components/schedule';
import EditToolbar from './EditToolbar';
import { useSaveScheduleMutation } from '@/hooks/useSaveScheduleMutation';

interface ScheduleEditorProps {
  initialSchedule: ScheduleData;
  _initialTimeSlots: DefaultTimeSlot[];
  initialSelectedDay: DayOfWeek;
  isTimeEditingMode: boolean;
  onCancel: () => void;
  permissions?: any; // Add permissions prop
  scheduleType?: any; // Add scheduleType prop
  classId?: string; // Add classId prop
}

/**
 * Component for editing the schedule (subjects or times).
 */
export default function ScheduleEditor({
  initialSchedule,
  _initialTimeSlots,
  initialSelectedDay,
  isTimeEditingMode,
  onCancel,
}: ScheduleEditorProps) {
  // --- State Management ---
  const [schedule, setSchedule] = useState<ScheduleData>(initialSchedule);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialSelectedDay);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { trigger: saveSchedule, isSaving, error: saveError } = useSaveScheduleMutation();

  useEffect(() => {
    setSchedule(initialSchedule);
    setSelectedDay(initialSelectedDay);
    setHasUnsavedChanges(false);
    setEditIndex(null);
  }, [initialSchedule, initialSelectedDay, isTimeEditingMode]);

  // --- Event Handlers ---
  const handleDayChange = (day: DayOfWeek) => {
    setSelectedDay(day);
  };

  const handleEdit = (slotIndex: number) => {
    setEditIndex(slotIndex);
  };

  const handleSubjectSelect = (subject: Subject | null) => {
    if (editIndex !== null) {
      const updatedSchedule = { ...schedule };
      const daySchedule = [...(updatedSchedule[selectedDay] || [])];
      
      if (daySchedule[editIndex]) {
        daySchedule[editIndex] = { ...daySchedule[editIndex], subject: subject };
        updatedSchedule[selectedDay] = daySchedule;

        setSchedule(updatedSchedule);
        setEditIndex(null);
        setHasUnsavedChanges(true);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
  };

  const handleTimeEdit = (slotIndex: number, changes: Partial<Pick<ScheduleSlot, 'startTime' | 'endTime'>>) => {
    console.log('Time edit triggered:', slotIndex, changes);
    const updatedSchedule = { ...schedule };
    const daySchedule = [...(updatedSchedule[selectedDay] || [])];

    if (daySchedule[slotIndex]) {
      daySchedule[slotIndex] = { ...daySchedule[slotIndex], ...changes };
      updatedSchedule[selectedDay] = daySchedule;

      setSchedule(updatedSchedule);
      setHasUnsavedChanges(true);
    }
  };

  // --- Save Logic ---
  const handleSave = useCallback(async () => {
    try {
      console.warn('Save handler needs updating to send correct data structure for mutation/API.');
      const dataToSend = schedule;
      
      await saveSchedule(dataToSend);

      setHasUnsavedChanges(false);
      console.log('Schedule save triggered (client-side). Server processing needs update.');
      onCancel();

    } catch (error: unknown) {
      console.error('Error saving schedule (caught in component):', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`שגיאה בשמירת המערכת: ${errorMessage}`);
    }
  }, [schedule, saveSchedule, onCancel]);

  return (
    <div>
      <EditToolbar
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={onCancel}
      />
      
      {saveError && (
         <div className="p-3 mb-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
            שגיאה בשמירה: {saveError.message}
         </div>
      )}

      <div className="print:hidden">
        <DayTabs 
          selectedDay={selectedDay} 
          onDayChange={handleDayChange} 
        />
      </div>

      <ScheduleGrid
        scheduleSlots={schedule[selectedDay] || []}
        isEditing={!isTimeEditingMode}
        isTimeEditing={isTimeEditingMode}
        onEdit={handleEdit}
        onTimeEdit={handleTimeEdit}
        _isAdmin={true}
      />

      {!isTimeEditingMode && editIndex !== null && (
        <SubjectModal
          onSelect={handleSubjectSelect}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
} 