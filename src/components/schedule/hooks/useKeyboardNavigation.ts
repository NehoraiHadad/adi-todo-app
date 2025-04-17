import { useEffect } from 'react';
import { DayOfWeek } from '@/types';

/**
 * Custom hook for keyboard navigation and shortcuts
 */
export function useKeyboardNavigation(
  selectedDay: DayOfWeek,
  setSelectedDay: (day: DayOfWeek) => void,
  isAdmin: boolean,
  isEditing: boolean,
  isTimeEditing: boolean,
  setIsEditing: (value: boolean) => void,
  setIsTimeEditing: (value: boolean) => void,
  hasUnsavedChanges: boolean,
  timeChanges: boolean,
  handleSaveChanges: () => void
) {
  // Add keyboard navigation for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if the user is typing in an input element
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        e.ctrlKey || e.altKey || e.metaKey
      ) {
        return;
      }
      
      // Left and right arrows to navigate days
      if (e.key === 'ArrowLeft') {
        const days = Object.values(DayOfWeek);
        const currentIndex = days.indexOf(selectedDay);
        const nextIndex = (currentIndex + 1) % days.length;
        setSelectedDay(days[nextIndex]);
      } else if (e.key === 'ArrowRight') {
        const days = Object.values(DayOfWeek);
        const currentIndex = days.indexOf(selectedDay);
        const prevIndex = (currentIndex - 1 + days.length) % days.length;
        setSelectedDay(days[prevIndex]);
      }
      
      // E key to toggle editing mode
      if (e.key === 'e' && isAdmin && !isEditing && !isTimeEditing) {
        setIsEditing(true);
      }
      
      // T key to toggle time editing mode
      if (e.key === 't' && isAdmin && !isEditing && !isTimeEditing) {
        setIsTimeEditing(true);
      }
      
      // Escape key to exit editing mode
      if (e.key === 'Escape' && (isEditing || isTimeEditing)) {
        if (hasUnsavedChanges || timeChanges) {
          if (window.confirm('יש לך שינויים שלא נשמרו. האם ברצונך לשמור אותם לפני היציאה ממצב עריכה?')) {
            handleSaveChanges();
          }
        }
        setIsEditing(false);
        setIsTimeEditing(false);
      }
      
      // S key to save changes when in editing mode
      if (e.key === 's' && (isEditing || isTimeEditing) && (hasUnsavedChanges || timeChanges)) {
        e.preventDefault(); // Prevent browser's save action
        handleSaveChanges();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedDay,
    setSelectedDay,
    isAdmin,
    isEditing,
    isTimeEditing,
    setIsEditing,
    setIsTimeEditing,
    hasUnsavedChanges,
    timeChanges,
    handleSaveChanges
  ]);
} 