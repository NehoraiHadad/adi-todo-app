// src/components/parent/ViewChildTasks.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types'; // Assuming Task type is defined here

interface ViewChildTasksProps {
  childId: string | null;
}

const ViewChildTasks: React.FC<ViewChildTasksProps> = ({ childId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChildTasks = useCallback(async (id: string) => {
    setIsLoading(true);
    setMessage(null);
    setTasks([]); // Clear previous tasks
    try {
      const response = await fetch(`/api/parent/children/${id}/tasks`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch child tasks');
      }
      const data: Task[] = await response.json();
      setTasks(data);
      if (data.length === 0) {
        setMessage('No tasks found for this child.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Error: ${String(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (childId) {
      fetchChildTasks(childId);
    } else {
      setTasks([]); // Clear tasks if no child is selected
      setMessage('Select a child to view their tasks.');
    }
  }, [childId, fetchChildTasks]);

  if (!childId) {
    return <p className="text-sm text-gray-500 mt-4">{message || 'Select a child above to see their tasks.'}</p>;
  }

  if (isLoading) {
    return <p className="text-center p-4">Loading tasks for child...</p>;
  }

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold mb-3 text-gray-700">Child's Tasks</h4>
      {message && tasks.length === 0 && ( // Show message only if there are no tasks and there's a specific message (e.g. error or "no tasks")
          <p className={`text-sm ${message.startsWith('Error:') ? 'text-red-600' : 'text-gray-600'}`}>{message}</p>
      )}

      {tasks.length > 0 && (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className={`p-3 border rounded-md ${task.is_completed ? 'bg-green-50 line-through' : 'bg-white'}`}>
              <h5 className={`font-medium ${task.is_completed ? 'text-gray-500' : 'text-gray-800'}`}>{task.title || 'Untitled Task'}</h5>
              {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
              {task.due_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                  {task.due_time && ` at ${task.due_time}`}
                </p>
              )}
              <p className="text-xs mt-1">
                Status: <span className={`font-semibold ${task.is_completed ? 'text-green-700' : 'text-yellow-700'}`}>
                  {task.is_completed ? 'Completed' : 'Pending'}
                </span>
                {task.is_completed && task.completed_at && (
                    <span className="text-gray-500 text-xs"> on {new Date(task.completed_at).toLocaleDateString()}</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ViewChildTasks;
