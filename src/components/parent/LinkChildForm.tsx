// src/components/parent/LinkChildForm.tsx
'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext'; // To ensure user is authenticated client-side

// Define types for the request object (simplified)
interface ChildLinkRequest {
  id: string | number;
  child_id: string; // Assuming child's profile will be fetched/included by API later
  child_username?: string; // Placeholder, ideally API returns this
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
}

const LinkChildForm: React.FC = () => {
  const { user } = useAuth(); // For client-side auth check / user context
  const [childUsername, setChildUsername] = useState('');
  const [requests, setRequests] = useState<ChildLinkRequest[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRequests, setIsFetchingRequests] = useState(false);

  const fetchSentRequests = useCallback(async () => {
    if (!user) return; // Should not happen if component is on a protected page
    setIsFetchingRequests(true);
    setMessage('');
    try {
      // This endpoint needs to be created: GET /api/parent-child-links/parent
      const response = await fetch('/api/parent-child-links/parent'); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sent requests');
      }
      const data: Array<{ id: string | number; child_id: string; status: 'pending' | 'approved' | 'rejected' | string; created_at: string; child_profile?: { username?: string }; child?: { username?: string } }> = await response.json();
      // Assuming API returns child's username directly or nested profile
      // For now, structure matches ChildLinkRequest
      setRequests(data.map((req) => ({
        id: req.id,
        child_id: req.child_id,
        status: req.status,
        created_at: req.created_at,
        child_username: req.child_profile?.username || req.child?.username || req.child_id || 'N/A'
      })));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error fetching requests: ${error.message}`);
      } else {
        setMessage(`Error fetching requests: ${String(error)}`);
      }
      // Set requests to empty array on error to avoid rendering stale data
      setRequests([]);
    } finally {
      setIsFetchingRequests(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) { // Ensure user is available before fetching
      fetchSentRequests();
    }
  }, [user, fetchSentRequests]); // Refetch if user changes

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!childUsername.trim()) {
      setMessage('Please enter your child\'s username.');
      return;
    }
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/parent-child-links/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_username: childUsername }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to send link request (status: ${response.status})`);
      }
      
      setMessage(responseData.message || 'Link request sent successfully!');
      setChildUsername(''); // Clear input
      fetchSentRequests(); // Refresh the list
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

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Link with Your Child</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label htmlFor="childUsername" className="block text-sm font-medium text-gray-700 mb-1">
            Child's Username
          </label>
          <Input
            id="childUsername"
            type="text"
            value={childUsername}
            onChange={(e) => setChildUsername(e.target.value)}
            placeholder="Enter your child's username"
            required
            className="w-full"
          />
        </div>
        <Button type="submit" disabled={isLoading || !user} className="w-full sm:w-auto">
          {isLoading ? 'Sending Request...' : 'Send Link Request'}
        </Button>
      </form>

      {message && (
        <p className={`my-4 text-sm p-3 rounded-md ${message.startsWith('Error:') ? 'text-red-700 bg-red-100 border border-red-300' : 'text-green-700 bg-green-100 border border-green-300'}`}>
          {message}
        </p>
      )}

      <h3 className="text-lg font-semibold mb-3 text-gray-700">Sent Requests</h3>
      {isFetchingRequests ? (<p className="text-sm text-gray-500">Loading requests...</p>) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't sent any link requests yet.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => (
            <li key={req.id} className="p-3 border rounded-md bg-gray-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
              <div>
                <span className="font-medium text-gray-800">{req.child_username || req.child_id}</span>
                <span className="text-xs text-gray-500 block">
                  Requested on: {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>
              <span 
                className={`px-2 py-1 text-xs font-semibold rounded-full
                  ${req.status === 'pending' ? 'bg-yellow-200 text-yellow-800 ring-1 ring-yellow-300' : ''}
                  ${req.status === 'approved' ? 'bg-green-200 text-green-800 ring-1 ring-green-300' : ''}
                  ${req.status === 'rejected' ? 'bg-red-200 text-red-800 ring-1 ring-red-300' : ''}
                  ${!(req.status === 'pending' || req.status === 'approved' || req.status === 'rejected') ? 'bg-gray-200 text-gray-800 ring-1 ring-gray-300' : ''}
                `}
              >
                {req.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LinkChildForm;
