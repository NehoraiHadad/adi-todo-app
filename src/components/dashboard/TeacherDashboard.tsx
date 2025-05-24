// src/components/dashboard/TeacherDashboard.tsx
'use client';

import React from 'react';
import ManageClasses from '@/components/teacher/ManageClasses'; // Import the new component

const TeacherDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">לוח מורים</h1>
        <p className="text-gray-600">ברוכים הבאים ללוח המורים. כאן תוכלו לנהל כיתות, תלמידים ומשימות.</p>
      </div>
      
      <section aria-labelledby="manage-classes-heading">
        <h2 id="manage-classes-heading" className="text-xl font-semibold text-gray-800 mb-3">
          ניהול כיתות
        </h2>
        <ManageClasses />
      </section>

      {/* Other teacher dashboard content can be added here */}
      {/* For example, a section to view students across classes, etc. */}
    </div>
  );
};

export default TeacherDashboard;
