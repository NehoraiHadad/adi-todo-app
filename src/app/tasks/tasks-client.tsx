'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Keep for potential future client-side redirects
import { Task } from '@/types';
import { TasksList } from '@/components/tasks/TasksList';
import { TaskModal } from '@/components/tasks/TaskModal';
import { tasksApi } from '@/services/api';
import { createClient } from '@/utils/supabase/client'; // Client client for user check
import { notifications } from '@/components/ui/notifications';

interface TasksClientProps {
  initialTasks: Task[];
  userId: string | null; // Receive userId from server component
  serverError?: string | null; // Pass potential server-side fetch errors
}

export default function TasksClient({ initialTasks, userId: initialUserId, serverError }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  // isLoading now reflects *refresh* loading, not initial load
  const [isLoading, setIsLoading] = useState(false); 
  // Initialize error state with potential server error
  const [error, setError] = useState<string | null>(serverError || null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  // We still need the user ID for client-side actions like refreshing
  const [userId, setUserId] = useState<string | null>(initialUserId);
  
  const router = useRouter();
  const supabase = createClient();

  // Effect to check user on client-side for robustness and potential redirects
  // This shouldn't run often if server-side handles initial auth correctly
  useEffect(() => {
    if (!userId) {
      const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
        } else {
          // If somehow userId was null initially but user exists client-side,
          // update it. This is a fallback.
          setUserId(user.id);
        }
      };
      checkUser();
    }
  }, [userId, router, supabase.auth]);

  // Fetch tasks from the API (for refreshing)
  const fetchTasks = useCallback(async () => {
    // Use the state userId for refresh consistency
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors before fetching
      const fetchedTasks = await tasksApi.getTasks(true);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Error refreshing tasks:', err);
      const errorMessage = err instanceof Error ? err.message : 'אירעה שגיאה לא ידועה';
      setError(`אירעה שגיאה ברענון המשימות: ${errorMessage}`);
      notifications.error('לא הצלחנו לרענן את המשימות שלך, נסי שוב מאוחר יותר.', {
        title: 'שגיאה ברענון'
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // Dependency includes the state userId
  
  // Handle adding a new task
  const handleAddTask = () => {
    setCurrentTask(undefined);
    setShowTaskModal(true);
  };
  
  // Handle task created/updated
  const handleTaskSuccess = (task: Task) => {
    fetchTasks(); // Refresh the tasks list
    
    notifications.success(task.title || task.description || '', {
      title: currentTask ? 'המשימה עודכנה!' : 'המשימה נוצרה!'
    });
    
    setShowTaskModal(false);
    setCurrentTask(undefined);
  };
  
  return (
    <div className="container-app py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-600 flex items-center">
          <span className="text-3xl mr-2">✏️</span>
          המשימות שלי
        </h1>
        {/* Add Task button could be part of TasksList or here */}
      </div>
      
      {/* Display server error if present and no tasks loaded initially */}
      {error && !tasks.length && !isLoading ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-bold text-red-700 mb-2">אופס! משהו השתבש</h3>
          <p className="text-red-600 mb-4">{error}</p>
        <button
            onClick={fetchTasks} // Allow retry
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            נסי לרענן
        </button>
          </div>
      ) : (
        // Render tasks list - pass down necessary handlers
        <TasksList
          initialTasks={tasks} // Pass current tasks state
          userId={userId || undefined}
          onAddTask={handleAddTask}
          refreshTasks={fetchTasks}
          // Let TasksList handle its own internal loading/empty states based on props
        />
      )}

      {/* Loading indicator specifically for refresh actions */}
      {isLoading && (
         <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
           <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
         </div>
      )}
      
      {/* Task Modal for adding/editing tasks */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        task={currentTask}
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
} 