// src/components/dashboard/StudentDashboard.tsx
'use client';

import React from 'react';
import ManageLinkRequests from '@/components/student/ManageLinkRequests';
import JoinClassForm from '@/components/student/JoinClassForm';
import MyClassesList from '@/components/student/MyClassesList'; // Import the new component

const StudentDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">לוח תלמיד/ה</h1>
        <p className="text-gray-600">ברוכים הבאים! כאן תוכלו לנהל את המידע שלכם ולראות בקשות קישור מההורים.</p>
      </div>
      
      <section aria-labelledby="my-classes-heading">
        <h2 id="my-classes-heading" className="text-xl font-semibold text-gray-800 mb-3">
          הכיתות שלי
        </h2>
        <MyClassesList />
      </section>

      <section aria-labelledby="join-class-heading">
        <h2 id="join-class-heading" className="text-xl font-semibold text-gray-800 mb-3">
          הצטרפות לכיתה חדשה
        </h2>
        <JoinClassForm />
      </section>

      <section aria-labelledby="manage-link-requests-heading">
        <h2 id="manage-link-requests-heading" className="text-xl font-semibold text-gray-800 mb-3">
          בקשות קישור מהורים
        </h2>
        <ManageLinkRequests />
      </section>
      
      {/* 
        If generic items/tasks from DashboardContent.tsx are also for students,
        they could be included here.
      */}
    </div>
  );
};

export default StudentDashboard;
