'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task } from '@/types';
import { tasksApi } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";

interface TasksListProps {
  initialTasks: Task[];
  userId?: string;
}

export const TasksList: React.FC<TasksListProps> = ({ initialTasks, userId }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  const [tab, setTab] = useState('active');
  const { toast } = useToast();
  
  // Function to handle task completion toggle
  const handleToggleTask = async (task: Task) => {
    if (!userId) return;
    
    try {
      const updatedTask = await tasksApi.toggleTaskCompletion(task.id, !task.is_completed);
      
      // Update tasks state
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
      );
      
      // Show success toast
      toast({
        title: task.is_completed ? "משימה לא הושלמה" : "משימה הושלמה!",
        description: task.title,
        variant: task.is_completed ? "default" : "success",
      });
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את סטטוס המשימה",
        variant: "destructive",
      });
    }
  };
  
  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    if (tab === 'all') return true;
    if (tab === 'active') return !task.is_completed;
    if (tab === 'completed') return task.is_completed;
    return true;
  });
  
  // Format due date for display
  const formatDueDate = (task: Task) => {
    if (!task.due_date) return '';
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const dueDate = new Date(task.due_date);
    
    if (dueDate.toDateString() === today.toDateString()) {
      return 'היום';
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'מחר';
    } else {
      // Format the date in Hebrew style
      return dueDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
    }
  };
  
  return (
    <Card className="mb-8 overflow-hidden border-2 border-indigo-200">
      <CardHeader className="bg-indigo-50 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-2xl text-indigo-700">המשימות שלי</CardTitle>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
          <span className="text-xl mr-1">+</span> משימה חדשה
        </Button>
      </CardHeader>
      <CardContent className="bg-indigo-50 pt-0">
        <Tabs 
          defaultValue="active" 
          value={tab} 
          onValueChange={setTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4 bg-indigo-100">
            <TabsTrigger value="all">הכל</TabsTrigger>
            <TabsTrigger value="active">פעילות</TabsTrigger>
            <TabsTrigger value="completed">הושלמו</TabsTrigger>
          </TabsList>
          
          <TabsContent value={tab} className="m-0">
            <div className="bg-white rounded-md overflow-hidden">
              {filteredTasks.length > 0 ? (
                <ul className="divide-y divide-indigo-100">
                  {filteredTasks.map(task => (
                    <li 
                      key={task.id} 
                      className={`py-3 px-4 flex items-center justify-between group ${
                        task.is_completed ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <div 
                          className={`h-6 w-6 ${
                            task.is_completed ? 'bg-green-100' : 'bg-white'
                          } rounded-full flex items-center justify-center border-2 ${
                            task.is_completed ? 'border-green-300' : 'border-indigo-300'
                          } cursor-pointer ${
                            !task.is_completed ? 'group-hover:bg-indigo-100' : ''
                          } transition-colors`}
                          onClick={() => handleToggleTask(task)}
                        >
                          {task.is_completed && (
                            <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`ms-3 text-lg ${
                          task.is_completed ? 'line-through text-gray-500' : ''
                        }`}>
                          {task.title}
                        </span>
                      </div>
                      
                      {task.due_date && (
                        <Badge 
                          variant="outline" 
                          className={`${
                            task.is_completed 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {task.is_completed 
                            ? 'הושלם! 🌟' 
                            : `עד ${formatDueDate(task)}`
                          }
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>אין משימות {tab === 'completed' ? 'שהושלמו' : 'פעילות'} כרגע</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 