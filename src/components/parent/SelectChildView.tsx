// src/components/parent/SelectChildView.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface LinkedChild {
  id: string; // This is the link ID from parent_child_links
  child_id: string;
  child_profile?: { // From the join in /api/parent-child-links/parent
    id: string;
    username?: string;
    display_name?: string;
  };
  status: string;
  // Add other relevant fields from your API response if needed
}

interface SelectChildViewProps {
  onChildSelected: (childId: string | null) => void; // Callback when a child is selected or deselected
}

const SelectChildView: React.FC<SelectChildViewProps> = ({ onChildSelected }) => {
  const { user } = useAuth();
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLinkedChildren = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/parent-child-links/parent');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch linked children');
      }
      const data: LinkedChild[] = await response.json();
      const approvedChildren = data.filter(link => link.status === 'approved');
      setLinkedChildren(approvedChildren);
      if (approvedChildren.length === 0) {
        setMessage('You have no approved links with children yet. Please add a child and wait for their approval.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Error: ${String(error)}`);
      }
      setLinkedChildren([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLinkedChildren();
  }, [fetchLinkedChildren]);

  const handleSelectChild = (childId: string) => {
    if (selectedChildId === childId) {
      setSelectedChildId(null); // Deselect if clicking the same child
      onChildSelected(null);
    } else {
      setSelectedChildId(childId);
      onChildSelected(childId);
    }
  };

  if (isLoading) {
    return <p className="text-center p-4">Loading linked children...</p>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Select Child to View Details</h3>
      {message && linkedChildren.length === 0 && ( // Show message only if no children and there's a message
        <p className={`mb-3 text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-gray-600'}`}>{message}</p>
      )}
      
      {linkedChildren.length > 0 ? (
        <div className="space-y-2">
          {linkedChildren.map((link) => (
            <Button
              key={link.child_id}
              variant={selectedChildId === link.child_id ? 'secondary' : 'outline'}
              onClick={() => handleSelectChild(link.child_id)}
              className="w-full justify-start text-left"
            >
              {link.child_profile?.display_name || link.child_profile?.username || link.child_id}
            </Button>
          ))}
        </div>
      ) : (
        !message && <p className="text-sm text-gray-500">No children linked and approved yet.</p> 
      )}

      {selectedChildId && (
        <p className="mt-4 text-sm text-blue-600 font-medium">
          Viewing details for: {
            linkedChildren.find(c => c.child_id === selectedChildId)?.child_profile?.display_name ||
            linkedChildren.find(c => c.child_id === selectedChildId)?.child_profile?.username ||
            selectedChildId
          }
        </p>
      )}
    </div>
  );
};

export default SelectChildView;
