'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task } from '@/types';
import { tasksApi } from '@/services/api';
import { formatDueDate } from '@/utils/dates';
import { notifications, notificationMessages } from '@/components/ui/notifications';

// Icons for subjects
const subjectIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  'אנגלית': { icon: '🔤', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  'עברית': { icon: '📚', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'חשבון': { icon: '📏', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  'הלכה': { icon: '📕', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'תנ"ך': { icon: '📖', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  'מתמטיקה': { icon: '📐', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  'חנ"ג': { icon: '⚽', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  'תורה-עיון': { icon: '🕮', color: 'text-green-700', bgColor: 'bg-green-100' },
  'כישורי-חיים': { icon: '🧠', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  'מדעים': { icon: '🌱', color: 'text-green-700', bgColor: 'bg-green-100' },
  'אמנות': { icon: '🎨', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  'משנה': { icon: '📜', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  'פרשת-שבוע': { icon: '🕯️', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  'שישי-אישי': { icon: '🌟', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  'מחשבים': { icon: '💻', color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

// Get icon and colors for a subject
const getSubjectStyle = (subject: string | undefined) => {
  if (!subject) return { icon: '📝', color: 'text-gray-700', bgColor: 'bg-gray-100' };
  return subjectIcons[subject] || { icon: '📝', color: 'text-gray-700', bgColor: 'bg-gray-100' };
};

// Extract subject from title if formatted as [Subject] Title
const extractSubjectFromTitle = (title: string | undefined): { subject?: string, cleanTitle: string } => {
  if (!title) return { cleanTitle: '' };
  
  const match = title.match(/^\[(.*?)\]\s*(.*)/);
  if (match) {
    return {
      subject: match[1],
      cleanTitle: match[2].trim()
    };
  }
  
  return { cleanTitle: title };
};

interface TasksListProps {
  initialTasks: Task[];
  onAddTask?: () => void;
  userId?: string;
  refreshTasks?: () => void;
}

export const TasksList: React.FC<TasksListProps> = ({ 
  initialTasks, 
  onAddTask,
  userId,
  refreshTasks
}) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  const [tab, setTab] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  
  // Process tasks to extract subjects from titles if needed
  const processedTasks = tasks.map(task => {
    if (task.subject) return task;
    
    // Check if the subject is in the title
    const { subject, cleanTitle } = extractSubjectFromTitle(task.title);
    if (subject) {
      return {
        ...task,
        subject: subject,
        _originalTitle: task.title, // Store original title
        _displayTitle: cleanTitle  // Store clean title for display
      };
    }
    
    // Check if the subject is in the tags
    if (task.tags && task.tags.length > 0) {
      // Use the first tag as subject
      const subjectFromTags = task.tags.find(tag => subjectIcons[tag]);
      if (subjectFromTags) {
        return {
          ...task,
          subject: subjectFromTags
        };
      }
    }
    
    return task;
  });
  
  // Function to handle task completion toggle
  const handleToggleTask = async (task: Task) => {
    if (!userId || !task.id) return;
    
    try {
      setIsLoading(true);
      const isCompleted = task.is_completed ?? task.completed ?? false;
      const updatedTask = await tasksApi.toggleTaskCompletion(task.id, !isCompleted);
      
      // Update tasks state
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
      );
      
      // Show success toast with fun message for kids
      notifications.success(task.title || task.description || "השלמת את המשימה בהצלחה!", {
        title: isCompleted ? "המשימה חזרה לרשימה" : "כל הכבוד! 🎉"
      });
      
      // Refresh the tasks list if a callback was provided
      if (refreshTasks) {
        refreshTasks();
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      notifications.error("לא הצלחתי לעדכן את המשימה, נסי שוב", {
        title: "אופס! משהו השתבש"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!userId || !taskId) return;
    
    try {
      setIsLoading(true);
      await tasksApi.deleteTask(taskId);
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      notifications.info(notificationMessages.delete.success("המשימה"), {
        title: notificationMessages.delete.title
      });
      
      // Refresh the tasks list if a callback was provided
      if (refreshTasks) {
        refreshTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notifications.error(notificationMessages.error.delete("המשימה"), {
        title: "אופס! משהו השתבש"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter tasks based on active tab
  const filteredTasks = processedTasks.filter(task => {
    const isCompleted = task.is_completed ?? task.completed ?? false;
    if (tab === 'all') return true;
    if (tab === 'active') return !isCompleted;
    if (tab === 'completed') return isCompleted;
    return true;
  });
  
  // Get display title for a task
  const getDisplayTitle = (task: Task): string => {
    // If we have a processed display title
    if (task._displayTitle) return task._displayTitle;
    
    // Otherwise use title or description
    return task.title || task.description || '';
  };
  
  return (
    <Card className="mb-8 overflow-hidden border-2 border-indigo-200 max-w-full sm:max-w-3xl mx-auto rounded-xl shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <CardTitle className="text-xl sm:text-2xl text-indigo-700 flex items-center">
          <span className="text-2xl mr-2">✏️</span>
          המשימות שלי
        </CardTitle>
        <Button 
          onClick={onAddTask} 
          size="sm" 
          disabled={isLoading}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 py-6 sm:py-4 px-4 rounded-lg text-lg shadow-md"
        >
          <span className="text-xl mr-1">+</span> משימה חדשה
        </Button>
      </CardHeader>
      <CardContent className="bg-gradient-to-b from-indigo-50 to-purple-50 pt-0 px-2 sm:px-6 pb-4">
        <Tabs 
          defaultValue="active" 
          value={tab} 
          onValueChange={setTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4 bg-indigo-100 p-1 rounded-lg shadow-sm">
            <TabsTrigger value="all" className="py-3 sm:py-2 text-lg sm:text-base">הכל</TabsTrigger>
            <TabsTrigger value="active" className="py-3 sm:py-2 text-lg sm:text-base">פעילות</TabsTrigger>
            <TabsTrigger value="completed" className="py-3 sm:py-2 text-lg sm:text-base">הושלמו</TabsTrigger>
          </TabsList>
          
          <TabsContent value={tab} className="m-0">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              {isLoading && !filteredTasks.length ? (
                <div className="py-10 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
                  <p className="mt-2">טוענת משימות...</p>
                </div>
              ) : filteredTasks.length > 0 ? (
                <ul className="divide-y divide-indigo-100">
                  {filteredTasks.map(task => {
                    const isCompleted = task.is_completed ?? task.completed ?? false;
                    const subjectStyle = getSubjectStyle(task.subject);
                    return (
                      <li 
                        key={task.id} 
                        className={`py-4 px-3 sm:px-4 flex items-start justify-between gap-2 sm:gap-4 group ${
                          isCompleted ? 'bg-green-50' : ''
                        } hover:bg-indigo-50 transition-colors`}
                      >
                        <div className="flex items-start flex-1 min-w-0">
                          <div 
                            className={`h-7 w-7 sm:h-6 sm:w-6 flex-shrink-0 mt-1 ${
                              isCompleted ? 'bg-green-100' : 'bg-white'
                            } rounded-full flex items-center justify-center border-2 ${
                              isCompleted ? 'border-green-300' : 'border-indigo-300'
                            } cursor-pointer ${
                              !isCompleted ? 'group-hover:bg-indigo-100' : ''
                            } transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`}
                            onClick={() => handleToggleTask(task)}
                            role="checkbox"
                            aria-checked={isCompleted}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleToggleTask(task);
                              }
                            }}
                            aria-label={`סמני את המשימה "${getDisplayTitle(task)}" כ${isCompleted ? 'לא בוצעה' : 'בוצעה'}`}
                          >
                            {isCompleted && (
                              <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ms-3 flex-1 min-w-0">
                            <div className={`text-md sm:text-lg font-medium truncate ${
                              isCompleted ? 'line-through text-gray-500' : ''
                            }`}>
                              {getDisplayTitle(task)}
                            </div>
                            
                            {task.subject && (
                              <div className="flex items-center mt-2">
                                <div className={`p-1.5 rounded-md text-sm ${subjectStyle.bgColor} ${subjectStyle.color} flex items-center`}>
                                  <span className="mr-1 text-lg">{subjectStyle.icon}</span>
                                  <span>{task.subject}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {(task.due_date || task.assigned_date) && (
                            <Badge 
                              variant="outline" 
                              className={`block text-center rounded-full px-3 py-1 whitespace-nowrap ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {isCompleted 
                                ? 'הושלם! 🌟' 
                                : `עד ${formatDueDate(task)}`
                              }
                            </Badge>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity sm:mt-1 bg-red-50 rounded-full hover:bg-red-100" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            aria-label="מחקי משימה"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-16 px-4 text-center text-gray-500">
                  <div className="text-6xl mb-4 animate-float">🔍</div>
                  <p className="text-xl">אין משימות {tab === 'completed' ? 'שהושלמו' : tab === 'active' ? 'פעילות' : ''} כרגע</p>
                  <p className="mt-2 text-sm text-gray-400">הוסיפי משימה חדשה בכפתור למעלה</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 