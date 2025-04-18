'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';

interface EditToolbarProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Toolbar displayed during schedule editing.
 */
export default function EditToolbar({
  hasUnsavedChanges,
  isSaving,
  onSave,
  onCancel,
}: EditToolbarProps) {
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (
        !window.confirm(
          'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לבטל ולצאת ממצב עריכה?'
        )
      ) {
        return; // Don't cancel if user clicks 'Cancel' on confirm dialog
      }
    }
    onCancel(); // Proceed with cancellation
  };

  return (
    <div className="mb-4 space-y-3 print:hidden">
      {/* Unsaved changes notification */}
      {hasUnsavedChanges && (
        <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 flex items-center text-sm sm:text-base">
          <span className="text-lg sm:text-xl ml-2">⚠️</span>
          יש לך שינויים שלא נשמרו. לחץ על "שמור שינויים" כדי לשמור.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          aria-label="ביטול עריכה"
        >
          <X className="ml-2 h-4 w-4" />
          ביטול
        </Button>
        <Button
          disabled={isSaving || !hasUnsavedChanges}
          onClick={onSave}
          className="bg-blue-900 hover:bg-blue-800"
          aria-label="שמור שינויים"
        >
          {isSaving ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="ml-2 h-4 w-4" />
          )}
          {isSaving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>
    </div>
  );
} 