// src/components/student/MyClassesList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext'; // To ensure user is authenticated

interface EnrolledClassInfo {
  enrollment_id: string | number;
  enrollment_status: string;
  enrolled_at: string;
  class_id: string | number;
  class_name: string;
  class_code: string;
  teacher_id?: string;
  teacher_name?: string;
}

const MyClassesList: React.FC = () => {
  const { user } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClassInfo[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchEnrolledClasses = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/enrollments/student'); // GET request
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch enrolled classes');
      }
      setEnrolledClasses(data);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setEnrolledClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEnrolledClasses();
  }, [fetchEnrolledClasses]);

  if (isLoading) {
    return <p className="text-center p-4">Loading your classes...</p>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">My Enrolled Classes</h3>
      {message && (
        <p className={`mb-3 text-sm text-red-600`}>{message}</p>
      )}
      {enrolledClasses.length === 0 && !isLoading ? (
        <p className="text-sm text-gray-500">You are not currently enrolled in any classes.</p>
      ) : (
        <ul className="space-y-3">
          {enrolledClasses.map((cls) => (
            <li key={cls.enrollment_id} className="p-3 border rounded-md bg-gray-50">
              <h4 className="font-medium text-gray-800">{cls.class_name}</h4>
              <p className="text-sm text-gray-600">
                Code: <span className="font-mono bg-gray-200 px-1 py-0.5 rounded">{cls.class_code}</span>
              </p>
              {cls.teacher_name && cls.teacher_name !== 'N/A' && (
                <p className="text-sm text-gray-600">
                  Teacher: {cls.teacher_name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Enrolled on: {new Date(cls.enrolled_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyClassesList;
