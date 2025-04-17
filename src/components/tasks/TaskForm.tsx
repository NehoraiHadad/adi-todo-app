'use client';

import { useState } from 'react';
import { Task, TaskType } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tasksApi } from '@/services/api';
import { notifications, notificationMessages } from '@/components/ui/notifications';

// Subjects list for the dropdown
const subjects = [
  'אנגלית',
  'עברית',
  'חשבון',
  'הלכה',
  'תנ"ך',
  'מתמטיקה',
  'חנ"ג',
  'תורה-עיון',
  'כישורי-חיים',
  'מדעים',
  'אמנות',
  'משנה',
  'פרשת-שבוע',
  'שישי-אישי',
  'מחשבים',
];

interface TaskFormProps {
  task?: Task;
  onSuccess?: (task: Task) => void;
  onCancel?: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>(task?.subject || '');
  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      type: TaskType.PERSONAL,
      is_completed: false,
      tags: [],
    }
  );
  
  const isEditing = !!task;
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      notifications.error("צריך לתת שם למשימה", {
        title: "אופס!"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a copy of the form data for saving
      const taskToSave: Partial<Task> = { ...formData };
      
      // Include the subject in the title or description if selected
      if (selectedSubject) {
        taskToSave.title = `[${selectedSubject}] ${taskToSave.title || ''}`;
        
        // Add subject as a tag if the tags array exists
        if (!taskToSave.tags) {
          taskToSave.tags = [];
        }
        if (Array.isArray(taskToSave.tags) && !taskToSave.tags.includes(selectedSubject)) {
          taskToSave.tags.push(selectedSubject);
        }
      }
      
      // Remove the subject field since it doesn't exist in the database
      delete taskToSave.subject;
      
      let savedTask: Task;
      
      if (isEditing && task?.id) {
        // Update existing task
        savedTask = await tasksApi.updateTask(task.id, taskToSave);
        notifications.success(notificationMessages.update.success("המשימה"), {
          title: notificationMessages.update.title
        });
      } else {
        // Create new task
        savedTask = await tasksApi.createTask(taskToSave);
        notifications.success(notificationMessages.create.success("המשימה"), {
          title: notificationMessages.create.title
        });
      }
      
      // Restore the subject information for the UI before returning
      if (selectedSubject) {
        savedTask.subject = selectedSubject;
      }
      
      if (onSuccess) {
        onSuccess(savedTask);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      notifications.error(isEditing ? 
        notificationMessages.error.update("המשימה") : 
        notificationMessages.error.create("המשימה"), {
        title: "משהו השתבש"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'subject') {
      setSelectedSubject(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  return (
    <Card className="border-2 border-indigo-200">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">שם המשימה</Label>
            <Input
              id="title"
              name="title"
              placeholder="כתבי את שם המשימה..."
              value={formData.title || ''}
              onChange={handleChange}
              required
              className="border-indigo-200"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">פירוט (לא חובה)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="הוסיפי פרטים נוספים למשימה..."
              value={formData.description || ''}
              onChange={handleChange}
              className="min-h-[80px] border-indigo-200"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">מקצוע</Label>
              <Select 
                value={selectedSubject} 
                onValueChange={(value) => handleSelectChange('subject', value)}
              >
                <SelectTrigger id="subject" className="border-indigo-200 w-full">
                  <SelectValue placeholder="בחרי מקצוע..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date">תאריך יעד</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                value={formData.due_date || formData.assigned_date || new Date().toISOString().split('T')[0]}
                onChange={handleChange}
                className="border-indigo-200"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">סוג משימה</Label>
            <Select 
              value={formData.type || TaskType.PERSONAL} 
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger id="type" className="border-indigo-200">
                <SelectValue placeholder="בחרי סוג משימה..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskType.PERSONAL}>משימה אישית</SelectItem>
                <SelectItem value={TaskType.CLASS}>משימה כיתתית</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="border-indigo-300 text-indigo-600"
              >
                ביטול
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {isLoading ? (
                <>
                  <div className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></div>
                  {isEditing ? 'מעדכנת...' : 'שומרת...'}
                </>
              ) : (
                isEditing ? 'עדכני משימה' : 'צרי משימה חדשה'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 