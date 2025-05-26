// src/components/student/JoinClassForm.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { useAuth } from '@/context/AuthContext'; // Not strictly needed if API handles auth

const JoinClassForm: React.FC = () => {
  const [classCode, setClassCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!classCode.trim()) {
      setMessage('Please enter a class code.');
      return;
    }
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/enrollments/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_code: classCode.trim().toUpperCase() }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to join class (status: ${response.status})`);
      }
      
      setMessage(responseData.message || 'Successfully joined class!');
      setClassCode(''); // Clear input
      // Optionally, trigger a refresh of student's class list if displayed nearby
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Join a New Class</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-1">
            Class Code
          </label>
          <Input
            id="classCode"
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder="Enter class code"
            required
            className="w-full"
            style={{ textTransform: 'uppercase' }} // Visually suggest uppercase
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? 'Joining Class...' : 'Join Class'}
        </Button>
      </form>

      {message && (
        <p className={`mt-3 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default JoinClassForm;
