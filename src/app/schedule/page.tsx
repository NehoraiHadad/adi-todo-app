'use client';

import { useState } from 'react';
import { DayOfWeek } from '@/types';

// Import components and custom hooks
import {
  DayTabs,
  ScheduleGrid,
  SubjectModal,
  Subject,
  getCurrentHebrewDay,
  MobileNavDrawer,
  // Import custom hooks
  useScheduleData,
  useSaveSchedule,
  useScheduleEditing,
  useKeyboardNavigation,
  useUnsavedChangesWarning,
  useMobileTouchFix,
  useAdminCheck
} from '@/components/schedule';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Main Schedule page component
 */
export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentHebrewDay());
  
  // Load data and hooks
  const { isAdmin } = useAdminCheck();
  
  const {
    schedule,
    setSchedule,
    customTimeSlots,
    setCustomTimeSlots,
    isLoading,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    timeChanges,
    setTimeChanges,
    loadScheduleData
  } = useScheduleData();
  
  const {
    isSaving,
    saveScheduleWithData
  } = useSaveSchedule(schedule, customTimeSlots, setHasUnsavedChanges, setTimeChanges);
  
  const {
    isEditing,
    setIsEditing,
    isTimeEditing,
    setIsTimeEditing,
    editIndex,
    handleEdit,
    handleSubjectSelect: baseHandleSubjectSelect,
    handleCancelEdit,
    handleTimeEdit,
    handleResetTimes
  } = useScheduleEditing(
    schedule, 
    setSchedule, 
    customTimeSlots, 
    setCustomTimeSlots,
    setHasUnsavedChanges,
    setTimeChanges
  );
  
  // Adapter for handleSubjectSelect to work with current selected day
  const handleSubjectSelect = (subject: Subject | null) => {
    baseHandleSubjectSelect(subject, selectedDay);
  };
  
  // Day change handler
  const handleDayChange = (day: DayOfWeek) => {
    setSelectedDay(day);
    console.log(`Switched view to ${day} day without reloading data`);
  };
  
  // Save changes handler
  const handleSaveChanges = () => {
    saveScheduleWithData(selectedDay);
  };
  
  // Initialize hooks
  useKeyboardNavigation(
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
  );
  
  useUnsavedChangesWarning(hasUnsavedChanges, timeChanges);
  useMobileTouchFix();
  
  if (isLoading) {
    return (
      <div className="container-app py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">טוען מערכת לימודים...</p>
      </div>
    );
  }
  
  return (
    <div className="container-app py-2 sm:py-6 print:py-0">
      {/* Header with editing button - hidden in print mode */}
      <div className="flex justify-between items-center mb-2 sm:mb-6 print:hidden">
        <h1 className="text-lg sm:text-3xl font-bold text-indigo-600 text-right mb-0">
          <span className="hidden sm:inline">מערכת לימודים שבועית</span>
          <span className="sm:hidden">מערכת לימודים</span>
        </h1>
        <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
          {/* Edit/Time editing mode buttons */}
          {isEditing || isTimeEditing ? (
            <>
              {isSaving && (
                <div className="hidden sm:flex items-center text-gray-600 mr-2 text-sm">
                  <Spinner className="mr-2" size="sm" />
                  <span>שומר שינויים...</span>
                </div>
              )}
              {/* Mobile-only spinner for saving */}
              {isSaving && (
                <div className="sm:hidden flex items-center text-gray-600 mr-1 text-xs">
                  <Spinner className="mr-1" size="sm" />
                </div>
              )}
              {(hasUnsavedChanges || timeChanges) && (
                <button
                  className="btn bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 flex items-center text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg shadow-md"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  aria-label="שמור שינויים"
                  title="ניתן גם ללחוץ על S לשמירה"
                >
                  <span className="text-base sm:text-lg mr-1 sm:mr-2">💾</span>
                  <span className="whitespace-nowrap sm:inline hidden">שמור שינויים</span>
                  <span className="whitespace-nowrap sm:hidden">שמור</span>
                </button>
              )}
              <button
                className="btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 items-center text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg shadow-md"
                onClick={() => {
                  // Ask for confirmation if there are unsaved changes
                  if (hasUnsavedChanges || timeChanges) {
                    if (window.confirm('יש לך שינויים שלא נשמרו. האם ברצונך לשמור אותם לפני היציאה ממצב עריכה?')) {
                      handleSaveChanges();
                    }
                  }
                  setIsEditing(false);
                  setIsTimeEditing(false);
                }}
                aria-label="סיום עריכה"
                title="ניתן גם ללחוץ על Escape ליציאה ממצב עריכה"
              >
                <span className="text-base sm:text-lg mr-1 sm:mr-2">🔒</span>
                <span className="whitespace-nowrap sm:inline hidden">סיום עריכה</span>
                <span className="whitespace-nowrap sm:hidden">סיום</span>
              </button>
            </>
          ) : (
            // View mode buttons - only on larger screens
            <>
              <button
                className="btn bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 items-center text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md hidden sm:flex"
                onClick={() => loadScheduleData(true)}
                title="רענן את המערכת רק כאשר יש שינויים בשרת או אם המערכת לא נטענה כראוי"
                aria-label="רענון נתונים"
              >
                <span className="text-lg sm:text-xl mr-1 sm:mr-2">🔄</span>
                <span className="whitespace-nowrap">רענון נתונים</span>
              </button>
              {isAdmin ? (
                <>
                  <button
                    className="btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 items-center text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md hidden sm:flex"
                    onClick={() => setIsEditing(true)}
                    aria-label="ערוך מערכת לימודים"
                    title="ניתן גם ללחוץ על מקש E להתחלת עריכה"
                  >
                    <span className="text-lg sm:text-xl mr-1 sm:mr-2">🔓</span>
                    <span className="whitespace-nowrap">ערוך מערכת</span>
                  </button>
                  <button
                    className="hidden sm:flex btn bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 items-center text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md"
                    onClick={() => setIsTimeEditing(true)}
                    aria-label="ערוך זמני שיעורים"
                  >
                    <span className="text-lg sm:text-xl mr-1 sm:mr-2">⏱️</span>
                    <span className="whitespace-nowrap">ערוך זמנים</span>
                  </button>
                </>
              ) : (
                <div className="text-gray-500 italic px-2 text-sm hidden sm:block">
                  רק למורים או להורים יש הרשאות עריכה
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Print mode header */}
      <div className="hidden print:block mb-4 text-center">
        <h1 className="text-2xl font-bold text-black">מערכת לימודים שבועית - {selectedDay}</h1>
        <p className="text-sm text-gray-600">הודפס בתאריך {new Date().toLocaleDateString('he-IL')}</p>
      </div>
      
      {/* Unsaved changes notification */}
      {(hasUnsavedChanges || timeChanges) && (isEditing || isTimeEditing) && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800 flex items-center text-sm sm:text-base print:hidden">
          <span className="text-lg sm:text-xl mr-1 sm:mr-2">📝</span>
          יש לך שינויים שלא נשמרו. לחץ על "שמור שינויים" כדי לשמור את השינויים שביצעת.
        </div>
      )}
      
      {/* Time editing controls */}
      {isTimeEditing && (
        <div className="mb-4 flex justify-end print:hidden">
          <button
            className="btn bg-red-500 hover:bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md flex items-center text-sm sm:text-base"
            onClick={handleResetTimes}
          >
            <span className="text-lg sm:text-xl mr-1 sm:mr-2">🔄</span>
            אפס זמנים לברירת מחדל
          </button>
        </div>
      )}
      
      {/* Day tabs - hidden in print mode */}
      <div className="print:hidden">
        <DayTabs 
          selectedDay={selectedDay} 
          onDayChange={handleDayChange} 
        />
      </div>
      
      {/* Schedule grid */}
      <ScheduleGrid
        selectedDay={selectedDay}
        schedule={schedule}
        timeSlots={customTimeSlots}
        isEditing={isEditing}
        isTimeEditing={isTimeEditing}
        onEdit={handleEdit}
        onTimeEdit={handleTimeEdit}
        _isAdmin={isAdmin}
        _setIsEditing={setIsEditing}
      />
      
      {/* Subject selection modal */}
      {isEditing && editIndex !== null && (
        <SubjectModal
          onSelect={handleSubjectSelect}
          onCancel={handleCancelEdit}
        />
      )}
      
      {/* Mobile feature tooltip - only visible on smaller screens */}
      <div className="md:hidden text-xs text-gray-500 text-center mt-2 mb-4 print:hidden">
        <p>לחץ על שיעור כדי להציג פרטים נוספים</p>
      </div>
      
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        _selectedDay={selectedDay}
        isAdmin={isAdmin}
        isEditing={isEditing}
        isTimeEditing={isTimeEditing}
        hasUnsavedChanges={hasUnsavedChanges || timeChanges}
        onRefresh={() => loadScheduleData(true)}
        onEdit={() => {
          if (isEditing) {
            setIsEditing(false);
          } else {
            setIsEditing(true);
            setIsTimeEditing(false);
          }
        }}
        onEditTimes={() => {
          if (isTimeEditing) {
            setIsTimeEditing(false);
          } else {
            setIsTimeEditing(true);
            setIsEditing(false);
          }
        }}
        onSave={handleSaveChanges}
        _onDayChange={handleDayChange}
        onPrint={() => window.print()}
      />
      
      {/* Smaller mobile bottom padding to accommodate new floating button position */}
      <div className="h-16 md:hidden print:hidden"></div>
    </div>
  );
} 