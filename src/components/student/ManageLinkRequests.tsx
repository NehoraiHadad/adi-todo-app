// src/components/student/ManageLinkRequests.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext'; // To ensure user is authenticated

interface PendingLinkRequest {
  id: string | number;
  parent_id?: string; // If parent profile is not fully joined/flattened
  parent?: { // Assuming the API returns a nested parent profile object
    id: string;
    username?: string;
    display_name?: string;
  };
  status: 'pending' | string;
  created_at: string;
}

const ManageLinkRequests: React.FC = () => {
  const { user } = useAuth(); // For client-side auth check
  const [pendingRequests, setPendingRequests] = useState<PendingLinkRequest[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // General loading for actions
  const [isFetchingRequests, setIsFetchingRequests] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    setIsFetchingRequests(true);
    setMessage('');
    try {
      const response = await fetch('/api/parent-child-links/child');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pending requests');
      }
      const data = await response.json();
      setPendingRequests(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error fetching requests: ${error.message}`);
      } else {
        setMessage(`Error fetching requests: ${String(error)}`);
      }
      setPendingRequests([]); // Clear requests on error
    } finally {
      setIsFetchingRequests(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleRespond = async (linkId: string | number, action: 'approved' | 'rejected') => {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/parent-child-links/respond', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId, action }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to ${action} request`);
      }
      setMessage(responseData.message || `Request ${action} successfully.`);
      // Refresh list: filter out the processed request
      setPendingRequests(prev => prev.filter(req => req.id !== linkId));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Error: ${String(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingRequests) {
    return <p className="text-center p-4">Loading pending requests...</p>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Manage Parent Link Requests</h2>
      
      {message && (
        <p className={`mb-4 text-sm ${message.startsWith('Error:') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      {pendingRequests.length === 0 && !isFetchingRequests ? (
        <p className="text-sm text-gray-500">You have no pending link requests.</p>
      ) : (
        <ul className="space-y-3">
          {pendingRequests.map((req) => (
            <li key={req.id} className="p-3 border rounded-md bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <p className="font-medium text-gray-800">
                    Request from: {req.parent?.display_name || req.parent?.username || req.parent_id || 'Unknown Parent'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Received on: {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 space-x-2 rtl:space-x-reverse">
                  <Button
                    onClick={() => handleRespond(req.id, 'approved')}
                    variant="default"
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => handleRespond(req.id, 'rejected')}
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageLinkRequests;
