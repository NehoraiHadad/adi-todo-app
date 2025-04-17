import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Task } from '@/types';
import TasksClient from './tasks-client'; // Import the new client component

export default async function TasksPage() {
  const supabase = await createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  // If no user, redirect to login (handled server-side now)
  if (!user) {
    redirect('/login');
  }

  let tasks: Task[] = [];
  let serverError: string | null = null;

  // Fetch tasks for the logged-in user
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      // Add any other necessary filters or ordering here, matching the old API call if needed
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw error; // Throw error to be caught below
    }
    tasks = data || [];
  } catch (error) {
    console.error('Error fetching tasks server-side:', error);
    serverError = error instanceof Error ? error.message : 'אירעה שגיאה בטעינת המשימות מהשרת.';
    // You might want to log this error more formally
  }

  // Render the client component, passing the fetched data (or error)
  return (
    <TasksClient 
      initialTasks={tasks} 
      userId={user.id} 
      serverError={serverError} 
    />
  );
}
