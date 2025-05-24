// src/components/teacher/ManageClasses.tsx
'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext'; // To ensure user is authenticated

interface ClassRecord {
  id: string | number;
  name: string;
  class_code: string;
  created_at: string;
}

const ManageClasses: React.FC = () => {
  const { user } = useAuth(); // For client-side auth check
  const [newClassName, setNewClassName] = useState('');
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [message, setMessage] = useState('');
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingFetch, setIsLoadingFetch] = useState(false);
  const [studentsInClass, setStudentsInClass] = useState<{ [classId: string]: any[] }>({});
  const [viewingStudentsForClassId, setViewingStudentsForClassId] = useState<string | number | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const fetchTeacherClasses = useCallback(async () => {
    if (!user) return;
    setIsLoadingFetch(true);
    setMessage('');
    try {
      const response = await fetch('/api/classes'); // GET request
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch classes');
      }
      setClasses(data);
    } catch (error: any) {
      setMessage(`Error fetching classes: ${error.message}`);
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
      const response = await fetch('/api/classes', { // POST request
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to create class (status: ${response.status})`);
      }
      
      setMessage(responseData.message || 'Class created successfully!');
      setNewClassName(''); // Clear input
      fetchTeacherClasses(); // Refresh the list
    } catch (error: any) {
      setMessage(`Error creating class: ${error.message}`);
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const handleViewStudents = async (classId: string | number) => {
    if (viewingStudentsForClassId === classId) {
      setViewingStudentsForClassId(null); // Toggle off if already viewing
      return;
    }

    setViewingStudentsForClassId(classId);
    if (studentsInClass[classId]) {
      return; // Already fetched
    }

    setIsLoadingStudents(true);
    setMessage(''); // Clear previous messages
    try {
      const response = await fetch(`/api/classes/${classId}/students`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch students for class ${classId}`);
      }
      setStudentsInClass(prev => ({ ...prev, [classId]: data }));
    } catch (error: any) {
      setMessage(`Error fetching students: ${error.message}`);
      setViewingStudentsForClassId(null); // Clear view on error
    } finally {
      setIsLoadingStudents(false);
    }
  };

  return (
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
            {classes.map((cls) => (
              <li key={cls.id} className="p-3 border rounded-md bg-gray-50">
                <h3 className="font-medium text-gray-800">{cls.name}</h3>
                <p className="text-sm text-gray-600">
                  Class Code: <strong className="font-mono bg-gray-200 px-1 py-0.5 rounded">{cls.class_code}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Created on: {new Date(cls.created_at).toLocaleDateString()}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-sm"
                  onClick={() => handleViewStudents(cls.id)}
                  disabled={isLoadingStudents && viewingStudentsForClassId === cls.id}
                >
                  {viewingStudentsForClassId === cls.id ? (isLoadingStudents ? 'Loading...' : 'Hide Students') : 'View Students'}
                </Button>

                {viewingStudentsForClassId === cls.id && !isLoadingStudents && studentsInClass[cls.id] && (
                  <div className="mt-2 p-2 border rounded bg-gray-100">
                    <h4 className="text-md font-semibold mb-1 text-gray-700">Enrolled Students:</h4>
                    {studentsInClass[cls.id].length === 0 ? (
                      <p className="text-sm text-gray-500">No students enrolled in this class yet.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {studentsInClass[cls.id].map((student: any) => (
                          <li key={student.student_id || student.enrollment_id} className="text-sm text-gray-600">
                            {student.student_display_name || student.student_username || 'Unknown Student'}
                            <span className="text-xs text-gray-400 ml-2">
                              (Enrolled: {new Date(student.enrolled_at).toLocaleDateString()})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {viewingStudentsForClassId === cls.id && isLoadingStudents && (
                    <p className="text-sm text-gray-500 mt-2">Loading students...</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ManageClasses;
