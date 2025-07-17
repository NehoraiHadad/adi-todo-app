'use client';

import { useState, useEffect } from 'react';
import { ClassScheduleOptions } from '@/types/schedule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ClassSelectorProps {
  selectedClassId?: string;
  onClassChange: (classId: string | null) => void;
  availableClasses: ClassScheduleOptions[];
  showPersonalOption?: boolean;
}

export function ClassSelector({ 
  selectedClassId, 
  onClassChange, 
  availableClasses,
  showPersonalOption = true 
}: ClassSelectorProps) {
  const [currentSelection, setCurrentSelection] = useState<string>(selectedClassId || 'personal');

  useEffect(() => {
    setCurrentSelection(selectedClassId || 'personal');
  }, [selectedClassId]);

  const handleSelectionChange = (value: string) => {
    setCurrentSelection(value);
    if (value === 'personal') {
      onClassChange(null);
    } else {
      onClassChange(value);
    }
  };

  const selectedClass = availableClasses.find(cls => cls.classId === currentSelection);

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          מערכת שעות:
        </span>
        
        <Select value={currentSelection} onValueChange={handleSelectionChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="בחר מערכת שעות" />
          </SelectTrigger>
          <SelectContent>
            {showPersonalOption && (
              <SelectItem value="personal">
                <div className="flex items-center gap-2">
                  <span>אישי</span>
                  <Badge variant="outline" className="text-xs">
                    אישי
                  </Badge>
                </div>
              </SelectItem>
            )}
            {availableClasses.map((cls) => (
              <SelectItem key={cls.classId} value={cls.classId}>
                <div className="flex items-center gap-2">
                  <span>{cls.className}</span>
                  <Badge 
                    variant={cls.canEdit ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {cls.canEdit ? "ניתן לעריכה" : "צפייה בלבד"}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentSelection !== 'personal' && selectedClass && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>כיתה:</span>
          <span className="font-medium">{selectedClass.className}</span>
          {selectedClass.canEdit && (
            <Badge variant="outline" className="text-xs text-green-600">
              ✓ הרשאות עריכה
            </Badge>
          )}
        </div>
      )}

      {availableClasses.length === 0 && !showPersonalOption && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          אין כיתות זמינות לצפייה
        </div>
      )}
    </div>
  );
}