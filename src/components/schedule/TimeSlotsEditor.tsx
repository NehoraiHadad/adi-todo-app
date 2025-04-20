import { DefaultTimeSlot } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeSlotsEditorProps {
  timeSlots: DefaultTimeSlot[];
  isEditing: boolean;
  isSaving: boolean;
  onUpdate: (index: number, updates: Partial<DefaultTimeSlot>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Component for editing default time slots
 */
export default function TimeSlotsEditor({
  timeSlots,
  isEditing,
  isSaving,
  onUpdate,
  onAdd,
  onRemove,
  onSave,
  onCancel,
}: TimeSlotsEditorProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  // If not in editing mode, just display the default list
  if (!isEditing) {
    return (
      <div className="p-2 sm:p-4">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center">שעות שיעורים</h2>
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4">
          <ul className="space-y-1 sm:space-y-2">
            {timeSlots.map((slot, index) => (
              <li key={index} className="flex justify-between items-center p-2 border-b last:border-b-0 text-sm sm:text-base">
                <span className="font-semibold">
                  שיעור {index + 1}:
                </span>
                <span className="text-gray-700 tabular-nums">
                  {slot.startTime} - {slot.endTime}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center">עריכת שעות שיעורים</h2>
      
      <motion.div 
        className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {timeSlots.map((slot, index) => (
            <motion.div 
              key={slot.id || index}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg"
              variants={itemVariants}
              layout
              exit="exit"
            >
              <div className="w-full sm:w-auto flex justify-between items-center sm:flex-shrink-0 font-semibold text-gray-700 mb-2 sm:mb-0 pb-1 sm:pb-0 border-b sm:border-b-0 border-gray-200">
                <span>שיעור {index + 1}:</span>
                <Button 
                  variant="destructive" 
                  size="icon"
                  className="h-7 w-7 sm:hidden"
                  onClick={() => onRemove(index)}
                  disabled={timeSlots.length <= 1}
                  title="הסר שיעור"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="flex-grow grid grid-cols-2 gap-2 w-full">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">שעת התחלה</label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => onUpdate(index, { startTime: e.target.value })}
                    dir="ltr"
                    className="text-center text-sm sm:text-base h-8 sm:h-10"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">שעת סיום</label>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => onUpdate(index, { endTime: e.target.value })}
                    dir="ltr"
                    className="text-center text-sm sm:text-base h-8 sm:h-10"
                  />
                </div>
              </div>
              
              <Button 
                variant="destructive" 
                size="icon" 
                className="flex-shrink-0 hidden sm:flex"
                onClick={() => onRemove(index)}
                disabled={timeSlots.length <= 1}
                title="הסר שיעור"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div className="mt-3 sm:mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={onAdd}
            className="w-full max-w-md text-sm sm:text-base py-1 sm:py-2"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> הוסף שיעור
          </Button>
        </div>
      </motion.div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4 sm:mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 text-sm sm:text-base py-1.5 sm:py-2 mb-2 sm:mb-0"
          size="sm"
        >
          <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> בטל שינויים
        </Button>
        
        <Button
          variant="default"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-green-600 hover:bg-green-700 text-sm sm:text-base py-1.5 sm:py-2"
          size="sm"
        >
          {isSaving ? (
            <>
              <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              שומר...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> שמור שינויים
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 