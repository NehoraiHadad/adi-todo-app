// src/components/teacher/ManageClasses.tsx
'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Task } from '@/types'; // TaskType might be unused now, TBD
import TeacherMessageForm from '@/components/teacher/TeacherMessageForm';

interface ClassRecord {
  id: string | number;
  name: string;
  class_code: string;
  created_at: string;
}

// Define a type for the student objects fetched for a class
interface StudentEnrollmentInfo {
  enrollment_id: string | number;
  student_id: string;
  student_username?: string;
  student_display_name?: string;
  enrolled_at: string;
}

const ManageClasses: React.FC = () => {
  const { user } = useAuth();
  const [newClassName, setNewClassName] = useState('');
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [message, setMessage] = useState('');
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingFetch, setIsLoadingFetch] = useState(false);
  
  const [studentsInClass, setStudentsInClass] = useState<{ [classId: string]: StudentEnrollmentInfo[] }>({});
  const [viewingStudentsForClassId, setViewingStudentsForClassId] = useState<string | number | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  const [addingTaskToClassId, setAddingTaskToClassId] = useState<string | number | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  const [classTasks, setClassTasks] = useState<{ [classId: string]: Task[] }>({});
  const [viewingTasksForClassId, setViewingTasksForClassId] = useState<string | number | null>(null);
  const [isLoadingClassTasks, setIsLoadingClassTasks] = useState(false);
  
  const [selectedStudentForMessageId, setSelectedStudentForMessageId] = useState<string | null>(null);

  const fetchTeacherClasses = useCallback(async () => {
    if (!user) return;
    setIsLoadingFetch(true);
    setMessage('');
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch classes');
      }
      setClasses(data as ClassRecord[]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error fetching classes: ${error.message}`);
      } else {
        setMessage(`Error fetching classes: ${String(error)}`);
      }
      setClasses([]);
    } finally {
      setIsLoadingFetch(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeacherClasses();
  }, [fetchTeacherClasses]);

  const handleCreateClass = async (event: FormEvent) => {
    event.preventDefault();
    if (!newClassName.trim()) {
      setMessage('Please enter a class name.');
      return;
    }
    setIsLoadingCreate(true);
    setMessage('');
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to create class (status: ${response.status})`);
      }
      setMessage(responseData.message || 'Class created successfully!');
      setNewClassName('');
      fetchTeacherClasses();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error creating class: ${error.message}`);
      } else {
        setMessage(`Error creating class: ${String(error)}`);
      }
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const handleViewStudents = async (classId: string | number) => {
    if (viewingStudentsForClassId === classId) {
      setViewingStudentsForClassId(null);
      setSelectedStudentForMessageId(null); // Clear student message selection
      return;
    }
    setViewingStudentsForClassId(classId);
    setAddingTaskToClassId(null);
    setViewingTasksForClassId(null);
    setSelectedStudentForMessageId(null);

    if (studentsInClass[classId]) return;

    setIsLoadingStudents(true);
    setMessage('');
    try {
      const response = await fetch(`/api/classes/${classId}/students`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch students for class ${classId}`);
      }
      setStudentsInClass(prev => ({ ...prev, [classId]: data as StudentEnrollmentInfo[] }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error fetching students: ${error.message}`);
      } else {
        setMessage(`Error fetching students: ${String(error)}`);
      }
      setViewingStudentsForClassId(null);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleShowAddTaskForm = (classId: string | number) => {
    if (addingTaskToClassId === classId) {
      setAddingTaskToClassId(null);
    } else {
      setAddingTaskToClassId(classId);
      setViewingStudentsForClassId(null);
      setViewingTasksForClassId(null);
      setSelectedStudentForMessageId(null);
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskDueTime('');
      setMessage('');
    }
  };

  const handleCreateClassTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!addingTaskToClassId || !taskTitle.trim()) {
      setMessage('Error: Title is required for a class task.');
      return;
    }
    setIsCreatingTask(true);
    setMessage('');
    try {
      const response = await fetch('/api/tasks/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: addingTaskToClassId,
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          due_date: taskDueDate || null,
          due_time: taskDueTime || null,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create class task');
      }
      setMessage('Class task created successfully!');
      setAddingTaskToClassId(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error creating task: ${error.message}`);
      } else {
        setMessage(`Error creating task: ${String(error)}`);
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleViewClassTasks = async (classId: string | number) => {
    if (viewingTasksForClassId === classId) {
      setViewingTasksForClassId(null);
      return;
    }
    setViewingTasksForClassId(classId);
    setAddingTaskToClassId(null);
    setViewingStudentsForClassId(null);
    setSelectedStudentForMessageId(null);

    if (classTasks[classId]) return;

    setIsLoadingClassTasks(true);
    setMessage('');
    try {
      const response = await fetch(`/api/classes/${classId}/tasks`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch tasks for class ${classId}`);
      }
      setClassTasks(prev => ({ ...prev, [classId]: data as Task[] }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error fetching class tasks: ${error.message}`);
      } else {
        setMessage(`Error fetching class tasks: ${String(error)}`);
      }
      setViewingTasksForClassId(null);
    } finally {
      setIsLoadingClassTasks(false);
    }
  };
  // Make sure all functions are defined before this line, and properly closed.
  // No stray characters or unclosed elements.

  return ( // This was indicated as line 206 in the error log
    <div className="p-4 border rounded-lg shadow-sm bg-white space-y-6">
      <section aria-labelledby="create-class-heading">
        <h2 id="create-class-heading" className="text-xl font-semibold mb-3 text-gray-700">Create New Class</h2>
        <form onSubmit={handleCreateClass} className="space-y-3">
          <div>
            <label htmlFor="newClassName" className="block text-sm font-medium text-gray-700 mb-1">
              Class Name
            </label>
            <Input
              id="newClassName"
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter new class name"
              required
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={isLoadingCreate} className="w-full sm:w-auto">
            {isLoadingCreate ? 'Creating Class...' : 'Create Class'}
          </Button>
        </form>
      </section>

      {message && (
        <p className={`my-3 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      <section aria-labelledby="my-classes-heading">
        <h2 id="my-classes-heading" className="text-xl font-semibold mb-3 text-gray-700">My Classes</h2>
        {isLoadingFetch ? (
          <p>Loading classes...</p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-gray-500">You haven't created any classes yet.</p>
        ) : (
          <ul className="space-y-3">
            {classes.map((cls) => {
              // Pre-calculate complex condition for showing message form
              const isStudentSelectedForMessageInThisClass = 
                selectedStudentForMessageId &&
                viewingStudentsForClassId === cls.id && 
                studentsInClass[cls.id]?.some(s => s.student_id === selectedStudentForMessageId);

              return (
                <li key={cls.id} className="p-3 border rounded-md bg-gray-50">
                  <h3 className="font-medium text-gray-800">{cls.name}</h3>
                  <p className="text-sm text-gray-600">
                    Class Code: <strong className="font-mono bg-gray-200 px-1 py-0.5 rounded">{cls.class_code}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Created on: {new Date(cls.created_at).toLocaleDateString()}
                  </p>
                  <div className="mt-2 space-x-2 rtl:space-x-reverse"> {/* Container for buttons */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-sm"
                      onClick={() => handleViewStudents(cls.id)}
                      disabled={isLoadingStudents && viewingStudentsForClassId === cls.id}
                    >
                      {viewingStudentsForClassId === cls.id ? (isLoadingStudents ? 'Loading...' : 'Hide Students') : 'View Students'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-sm" 
                      onClick={() => handleShowAddTaskForm(cls.id)}
                    >
                      {addingTaskToClassId === cls.id ? 'Cancel Task' : 'Add Task'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-sm" 
                      onClick={() => handleViewClassTasks(cls.id)}
                      disabled={isLoadingClassTasks && viewingTasksForClassId === cls.id}
                    >
                      {viewingTasksForClassId === cls.id ? (isLoadingClassTasks ? 'Loading Tasks...' : 'Hide Tasks') : 'View Class Tasks'}
                    </Button>
                  </div>

                  {viewingStudentsForClassId === cls.id && !isLoadingStudents && studentsInClass[cls.id] && (
                    <div className="mt-2 p-2 border rounded bg-gray-100">
                      <h4 className="text-md font-semibold mb-1 text-gray-700">Enrolled Students:</h4>
                      {studentsInClass[cls.id].length === 0 ? (
                        <p className="text-sm text-gray-500">No students enrolled in this class yet.</p>
                      ) : (
                        <ul className="list-disc pl-5 space-y-1">
                          {studentsInClass[cls.id].map((student: StudentEnrollmentInfo) => ( // Used defined type
                            <li key={student.student_id || student.enrollment_id} className="text-sm text-gray-600">
                              {student.student_display_name || student.student_username || 'Unknown Student'}
                              <span className="text-xs text-gray-400 ml-2">
                                (Enrolled: {new Date(student.enrolled_at).toLocaleDateString()})
                              </span>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-xs text-blue-600 hover:text-blue-800 pl-2 ml-2"
                                onClick={() => {
                                  setSelectedStudentForMessageId(student.student_id === selectedStudentForMessageId ? null : student.student_id);
                                }}
                              >
                                {selectedStudentForMessageId === student.student_id ? 'Cancel Message' : 'Send Message'}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {/* Conditionally render message form for a specific student if selected */}
                      {isStudentSelectedForMessageInThisClass && (
                        <div className="my-2 p-2 border-t border-gray-200"> 
                          <TeacherMessageForm
                            selectedStudentId={selectedStudentForMessageId} // This should be student.student_id from the map
                            onMessageSent={() => {
                              console.log('Message sent to student:', selectedStudentForMessageId);
                              setSelectedStudentForMessageId(null); 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {viewingStudentsForClassId === cls.id && isLoadingStudents && (
                      <p className="text-sm text-gray-500 mt-2">Loading students...</p>
                  )}

                  {addingTaskToClassId === cls.id && (
                    <div className="mt-4 p-3 border rounded bg-gray-50">
                      <h4 className="text-md font-semibold mb-2 text-gray-700">Add New Task to "{cls.name}"</h4>
                      <form onSubmit={handleCreateClassTask} className="space-y-3">
                        <div>
                          <label htmlFor={`taskTitle-${cls.id}`} className="block text-sm font-medium text-gray-600">Title*</label>
                          <Input id={`taskTitle-${cls.id}`} type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                        </div>
                        <div>
                          <label htmlFor={`taskDescription-${cls.id}`} className="block text-sm font-medium text-gray-600">Description</label>
                          <Textarea id={`taskDescription-${cls.id}`} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`taskDueDate-${cls.id}`} className="block text-sm font-medium text-gray-600">Due Date</label>
                            <Input id={`taskDueDate-${cls.id}`} type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                          </div>
                          <div>
                            <label htmlFor={`taskDueTime-${cls.id}`} className="block text-sm font-medium text-gray-600">Due Time</label>
                            <Input id={`taskDueTime-${cls.id}`} type="time" value={taskDueTime} onChange={(e) => setTaskDueTime(e.target.value)} />
                          </div>
                        </div>
                        <Button type="submit" disabled={isCreatingTask} size="sm">
                          {isCreatingTask ? 'Adding Task...' : 'Add Task to Class'}
                        </Button>
                      </form>
                    </div>
                  )}

                  {viewingTasksForClassId === cls.id && !isLoadingClassTasks && classTasks[cls.id] && (
                    <div className="mt-4 p-3 border rounded bg-gray-50">
                      <h4 className="text-md font-semibold mb-2 text-gray-700">Tasks for "{cls.name}":</h4>
                      {classTasks[cls.id].length === 0 ? (
                        <p className="text-sm text-gray-500">No tasks created for this class yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {classTasks[cls.id].map((task: Task) => (
                            <li key={task.id} className="p-2 border rounded-sm bg-white">
                              <p className="font-medium text-gray-800">{task.title}</p>
                              {task.description && <p className="text-xs text-gray-600 mt-0.5">{task.description}</p>}
                              {task.due_date && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                  {task.due_time && ` at ${task.due_time}`}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {viewingTasksForClassId === cls.id && isLoadingClassTasks && (
                      <p className="text-sm text-gray-500 mt-2">Loading class tasks...</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ManageClasses;
