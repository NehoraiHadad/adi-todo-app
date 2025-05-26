// src/components/teacher/TeacherMessageForm.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface TeacherMessageFormProps {
  selectedStudentId: string | null;
  onMessageSent?: () => void;
}

const TeacherMessageForm: React.FC<TeacherMessageFormProps> = ({ selectedStudentId, onMessageSent }) => {
  const [content, setContent] = useState('');
  const [messageStatus, setMessageStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedStudentId) {
      setMessageStatus('Error: No student selected to send a message to.');
      return;
    }
    if (!content.trim()) {
      setMessageStatus('Error: Message content cannot be empty.');
      return;
    }

    setIsLoading(true);
    setMessageStatus(null);

    try {
      const response = await fetch('/api/parent-messages', { // Uses the existing endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: selectedStudentId, content: content.trim() }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to send message (status: ${response.status})`);
      }
      
      setMessageStatus('Message sent successfully!');
      setContent(''); 
      if (onMessageSent) {
        onMessageSent(); 
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessageStatus(`Error: ${error.message}`);
      } else {
        setMessageStatus(`Error: ${String(error)}`);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessageStatus(null), 5000);
    }
  };

  if (!selectedStudentId) {
    // This component might be rendered only when a student is selected,
    // so this message might be optional or handled by the parent component.
    // For now, it's a fallback.
    return <p className="text-sm text-gray-500 mt-1">Select a student to send them a message.</p>;
  }

  return (
    <div className="mt-4 p-4 border rounded-lg shadow-sm bg-white">
      <h4 className="text-md font-semibold mb-2 text-gray-700">Send Message to Student</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="teacherMessageContent" className="sr-only">Message Content</label>
          <Textarea
            id="teacherMessageContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here..."
            required
            rows={3}
            className="w-full"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !content.trim()} className="w-full sm:w-auto">
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
      {messageStatus && (
        <p className={`mt-2 text-xs ${messageStatus.startsWith('Error:') ? 'text-red-500' : 'text-green-500'}`}>
          {messageStatus}
        </p>
      )}
    </div>
  );
};

export default TeacherMessageForm;
