'use client';

import { Task } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from './TaskForm';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  onSuccess?: (task: Task) => void;
  title?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSuccess,
  title,
}) => {
  const handleSuccess = (task: Task) => {
    if (onSuccess) {
      onSuccess(task);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 bg-indigo-50">
          <DialogTitle className="text-xl text-indigo-700">
            {title || (task ? 'עריכת משימה' : 'משימה חדשה')}
          </DialogTitle>
        </DialogHeader>
        <div className="p-0">
          <TaskForm
            task={task}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 