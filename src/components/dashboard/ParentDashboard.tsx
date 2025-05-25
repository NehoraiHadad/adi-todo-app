// src/components/dashboard/ParentDashboard.tsx
'use client';

import React, { useState } from 'react';
import LinkChildForm from '@/components/parent/LinkChildForm';
import SelectChildView from '@/components/parent/SelectChildView';
import ViewChildTasks from '@/components/parent/ViewChildTasks';
import ParentMessageForm from '@/components/parent/ParentMessageForm'; // Import
import ViewParentMessages from '@/components/parent/ViewParentMessages'; // Import
import { useAuth } from '@/context/AuthContext'; // Import

const ParentDashboard: React.FC = () => {
  const { user: parentUser } = useAuth(); // Get current parent user
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [messageListRefreshKey, setMessageListRefreshKey] = useState<number>(0); // For refreshing message list

  const handleMessageSent = () => {
    setMessageListRefreshKey(prevKey => prevKey + 1); // Increment key to trigger refresh
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">לוח הורים</h1>
        <p className="text-gray-600">ברוכים הבאים ללוח ההורים. כאן תוכלו לראות מידע על ילדכם ולשלוח הודעות.</p>
      </div>
      
      <section aria-labelledby="link-child-heading">
        <h2 id="link-child-heading" className="text-xl font-semibold text-gray-800 mb-3">
          ניהול קישורים לילדים
        </h2>
        <LinkChildForm />
      </section>

      <section aria-labelledby="view-child-data-heading" className="mt-8">
        <h2 id="view-child-data-heading" className="text-xl font-semibold text-gray-800 mb-3">
          מעקב אחר התקדמות הילד/ה
        </h2>
        <SelectChildView onChildSelected={setSelectedChildId} />
        
        {selectedChildId ? (
          <div className="mt-6 space-y-6">
            <ViewChildTasks childId={selectedChildId} />
            
            {/* Messaging Section */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                הודעות לילד/ה: {selectedChildId ? (
                  (document.querySelector(`button[onClick*="${selectedChildId}"]`)?.textContent || 'Selected Child')
                ) : ''}
              </h3>
              <ViewParentMessages 
                selectedChildId={selectedChildId} 
                currentParentId={parentUser?.id || null}
                refreshKey={messageListRefreshKey} 
              />
              <ParentMessageForm 
                selectedChildId={selectedChildId} 
                onMessageSent={handleMessageSent} 
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-4">בחר/י ילד/ה מהרשימה למעלה כדי לראות את המשימות שלו/ה ולהתכתב.</p>
        )}
      </section>
    </div>
  );
};

export default ParentDashboard;
