import { useEffect } from 'react';

/**
 * Custom hook for handling unsaved changes warning
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  timeChanges: boolean
) {
  // Ask user for confirmation before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || timeChanges) {
        const message = 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?';
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, timeChanges]);
} 