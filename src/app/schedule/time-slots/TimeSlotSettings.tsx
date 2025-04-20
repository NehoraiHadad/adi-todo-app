'use client';

import { useTimeSlotsEditor } from '@/hooks/useTimeSlotsEditor';
import TimeSlotsEditor from '@/components/schedule/TimeSlotsEditor';
import { DefaultTimeSlot } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TimeSlotSettingsProps {
  initialTimeSlots: DefaultTimeSlot[];
}

/**
 * Client component for managing time slot settings
 */
export default function TimeSlotSettings({ initialTimeSlots }: TimeSlotSettingsProps) {
  const {
    timeSlots,
    isEditing,
    isSaving,
    startEditing,
    cancelEditing,
    updateTimeSlot,
    addTimeSlot,
    removeTimeSlot,
    saveChanges,
  } = useTimeSlotsEditor(initialTimeSlots);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="shadow-md border-gray-200">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            שעות ברירת מחדל לשיעורים
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1.5">
            כאן ניתן להגדיר את שעות ברירת המחדל של השיעורים במערכת השעות.
            שעות אלו ישמשו כבסיס לכל יום במערכת השעות, אלא אם יוגדרו ספציפית אחרת.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 sm:p-0">
          <TimeSlotsEditor
            timeSlots={timeSlots}
            isEditing={isEditing}
            isSaving={isSaving}
            onUpdate={updateTimeSlot}
            onAdd={addTimeSlot}
            onRemove={removeTimeSlot}
            onSave={saveChanges}
            onCancel={cancelEditing}
          />
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between border-t pt-3 pb-3 px-4 sm:pt-4 sm:pb-4 gap-2 sm:gap-0">
          <Link href="/schedule" className="w-full sm:w-auto mb-2 sm:mb-0">
            <Button variant="outline" className="flex items-center w-full sm:w-auto text-sm sm:text-base" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
              חזרה למערכת שעות
            </Button>
          </Link>
          
          {!isEditing && (
            <Button 
              onClick={startEditing}
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto text-sm sm:text-base"
              size="sm"
            >
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
              ערוך שעות
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="text-center text-xs sm:text-sm text-gray-500 px-2">
        <p>עדכון שעות השיעורים ישפיע על התצוגה של כל מערכת השעות.</p>
        <p>כדאי לעדכן את השעות לפני תחילת שנת הלימודים.</p>
      </div>
    </div>
  );
} 