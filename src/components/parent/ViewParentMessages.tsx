// src/components/parent/ViewParentMessages.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ParentMessage } from '@/types'; // Assuming ParentMessage type is up-to-date (includes sender_id)

interface ViewParentMessagesProps {
  selectedChildId: string | null;
  currentParentId: string | null; // To identify messages sent by the current parent
  refreshKey?: number; // Optional key to trigger re-fetch
}

const ViewParentMessages: React.FC<ViewParentMessagesProps> = ({ selectedChildId, currentParentId, refreshKey }) => {
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [messageStatus, setMessageStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async (childId: string) => {
    setIsLoading(true);
    setMessageStatus(null);
    setMessages([]);
    try {
      const response = await fetch(`/api/parent/children/${childId}/messages`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      const data: ParentMessage[] = await response.json();
      setMessages(data);
      if (data.length === 0) {
        setMessageStatus('No messages in this conversation yet.');
      }
    } catch (error: any) {
      setMessageStatus(`Error fetching messages: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId && currentParentId) {
      fetchMessages(selectedChildId);
    } else {
      setMessages([]);
      setMessageStatus(selectedChildId ? 'Loading parent information...' : 'Select a child to view messages.');
    }
  }, [selectedChildId, currentParentId, fetchMessages, refreshKey]);

  if (!selectedChildId) {
    return <p className="text-sm text-gray-500 mt-1">{messageStatus || 'Select a child to view messages.'}</p>;
  }

  if (isLoading) {
    return <p className="text-center p-4">Loading messages...</p>;
  }

  return (
    <div className="mt-4 p-4 border rounded-lg shadow-sm bg-white max-h-96 overflow-y-auto">
      <h4 className="text-md font-semibold mb-3 text-gray-700">Conversation</h4>
      {messageStatus && messages.length === 0 && (
        <p className={`text-sm ${messageStatus.startsWith('Error') ? 'text-red-600' : 'text-gray-600'}`}>{messageStatus}</p>
      )}
      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-2 rounded-lg max-w-[80%] ${
                msg.sender_id === currentParentId 
                  ? 'bg-blue-100 ml-auto text-right' 
                  : 'bg-gray-100 mr-auto text-left'
              }`}
            >
              <p className="text-xs text-gray-500 mb-0.5">
                {msg.sender_id === currentParentId ? 'You' : msg.sender_name}
                {' on '}
                {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
              {/* TODO: Add is_read status if needed, though for parent view might not be primary */}
            </div>
          ))}
        </div>
      ) : (
        !messageStatus && <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
      )}
    </div>
  );
};

export default ViewParentMessages;
