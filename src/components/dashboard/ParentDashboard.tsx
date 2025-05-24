// src/components/dashboard/ParentDashboard.tsx
'use client';

import React, { useState } from 'react'; // Added useState
import LinkChildForm from '@/components/parent/LinkChildForm';
import SelectChildView from '@/components/parent/SelectChildView'; // Import SelectChildView
import ViewChildTasks from '@/components/parent/ViewChildTasks';   // Import ViewChildTasks

const ParentDashboard: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  return (
    <div className="space-y-8"> {/* Increased spacing */}
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
          <ViewChildTasks childId={selectedChildId} />
        ) : (
          <p className="text-sm text-gray-500 mt-4">בחר/י ילד/ה מהרשימה למעלה כדי לראות את המשימות שלו/ה.</p>
        )}
      </section>

      {/* 
        TODO: Add section for sending/viewing messages with selected child.
        This will require:
        - A ParentMessageForm component.
        - A ViewParentMessages component.
        - API endpoints for sending messages (likely POST /api/parent-messages, ensuring sender_id is captured)
          and fetching messages (e.g., GET /api/parent-messages?child_id=[childId]&parent_id=[parentId]).
        - Updates to parent_messages table RLS and possibly schema (sender_id column).
      */}
      {/* Other parent dashboard content can be added here */}
    </div>
  );
};

export default ParentDashboard;
