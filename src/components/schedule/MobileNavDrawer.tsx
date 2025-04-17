import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayOfWeek } from '@/types';

interface MobileNavDrawerProps {
  _selectedDay: DayOfWeek;
  isAdmin: boolean;
  isEditing: boolean;
  isTimeEditing: boolean;
  hasUnsavedChanges: boolean;
  onRefresh: () => void;
  onEdit: () => void;
  onEditTimes: () => void;
  onSave: () => void;
  _onDayChange: (day: DayOfWeek) => void;
  onPrint: () => void;
}

/**
 * Mobile navigation drawer component that slides up from the bottom
 * Provides easy access to common operations on smaller screens
 */
export default function MobileNavDrawer({
  _selectedDay,
  isAdmin,
  isEditing,
  isTimeEditing,
  hasUnsavedChanges,
  onRefresh,
  onEdit,
  onEditTimes,
  onSave,
  _onDayChange,
  onPrint
}: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleDrawer = () => setIsOpen(!isOpen);
  
  // Close drawer after action
  const handleAction = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };
  
  return (
    <>
      {/* Menu button with three dots */}
      <motion.button
        className="fixed bottom-6 right-6 w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full shadow-lg flex items-center justify-center text-white z-50 md:hidden"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        onClick={toggleDrawer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        aria-label="תפריט פעולות"
      >
        <span className="text-base">⋮</span>
      </motion.button>
      
      {/* Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Menu drawer with all needed options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-0 right-0 w-52 mb-20 mr-2 bg-white rounded-lg shadow-lg z-50 md:hidden overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="py-1">
              {/* Different actions based on current state */}
              {!isEditing && !isTimeEditing ? (
                <>
                  <button
                    className="w-full py-2 px-3 text-blue-700 hover:bg-blue-50 flex items-center text-sm"
                    onClick={() => handleAction(onRefresh)}
                  >
                    <span className="text-base mr-2">🔄</span>
                    <span>רענן נתונים</span>
                  </button>
                  
                  {isAdmin && (
                    <>
                      <button
                        className="w-full py-2 px-3 text-indigo-700 hover:bg-indigo-50 flex items-center text-sm"
                        onClick={() => handleAction(onEdit)}
                      >
                        <span className="text-base mr-2">✏️</span>
                        <span>ערוך מערכת</span>
                      </button>
                      
                      <button
                        className="w-full py-2 px-3 text-amber-700 hover:bg-amber-50 flex items-center text-sm"
                        onClick={() => handleAction(onEditTimes)}
                      >
                        <span className="text-base mr-2">⏱️</span>
                        <span>ערוך זמנים</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    className="w-full py-2 px-3 text-gray-700 hover:bg-gray-50 flex items-center text-sm border-t border-gray-100"
                    onClick={() => handleAction(onPrint)}
                  >
                    <span className="text-base mr-2">🖨️</span>
                    <span>הדפס מערכת</span>
                  </button>
                </>
              ) : (
                <>
                  {hasUnsavedChanges && (
                    <button
                      className="w-full py-2 px-3 text-green-700 hover:bg-green-50 flex items-center text-sm"
                      onClick={() => handleAction(onSave)}
                    >
                      <span className="text-base mr-2">💾</span>
                      <span>שמור שינויים</span>
                    </button>
                  )}
                  
                  <button
                    className="w-full py-2 px-3 text-indigo-700 hover:bg-indigo-50 flex items-center text-sm"
                    onClick={() => handleAction(() => {
                      if (isEditing) onEdit();
                      if (isTimeEditing) onEditTimes();
                    })}
                  >
                    <span className="text-base mr-2">🔙</span>
                    <span>סיים עריכה</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 