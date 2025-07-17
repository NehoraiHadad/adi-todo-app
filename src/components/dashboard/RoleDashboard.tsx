'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ParentGuard, TeacherGuard, ChildGuard, AdminGuard } from '@/components/auth/PermissionGuard';
import { Card } from '@/components/ui/card';
import { UserRole } from '@/types';

/**
 * Role-based dashboard component that displays different content based on user role
 * Demonstrates the use of permission guards and role-based access control
 */
export const RoleDashboard: React.FC = () => {
  const { user, userRole, userWithRelationships, loading } = useAuth();
  const { permissions } = usePermissions();
  void permissions; // Explicitly ignore unused variable

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <div className="text-lg text-gray-600">אנא התחברו למערכת</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          שלום {userWithRelationships?.full_name || user.email}
        </h1>
        <p className="text-gray-600">
          {userRole === UserRole.CHILD && 'לוח בקרה לתלמיד'}
          {userRole === UserRole.PARENT && 'לוח בקרה להורה'}
          {userRole === UserRole.TEACHER && 'לוח בקרה למורה'}
          {userRole === UserRole.ADMIN && 'לוח בקרה למנהל'}
        </p>
      </div>

      {/* Role-specific content */}
      <div className="grid gap-6">
        
        {/* Child Dashboard */}
        <ChildGuard
          fallback={null}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">📚 אזור התלמיד</h2>
            <div className="grid gap-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span>המשימות שלי</span>
                <span className="bg-blue-200 px-2 py-1 rounded">5 פעילות</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span>המצב רוח שלי היום</span>
                <span className="text-2xl">😊</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span>מערכת השעות</span>
                <span className="text-sm text-gray-600">שיעור הבא: מתמטיקה</span>
              </div>
              {userWithRelationships?.parents && userWithRelationships.parents.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium mb-2">ההורים שלי:</div>
                  {userWithRelationships.parents.map((parent) => (
                    <div key={parent.id} className="text-sm text-gray-600">
                      {parent.display_name || parent.email}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </ChildGuard>

        {/* Parent Dashboard */}
        <ParentGuard
          fallback={null}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">👨‍👩‍👧‍👦 אזור ההורה</h2>
            <div className="space-y-4">
              {userWithRelationships?.children && userWithRelationships.children.length > 0 ? (
                <>
                  <div className="text-sm font-medium mb-2">הילדים שלי:</div>
                  {userWithRelationships.children.map((child) => (
                    <div key={child.id} className="p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{child.display_name || child.username}</div>
                          <div className="text-sm text-gray-600">
                            {child.grade && `כיתה: ${child.grade}`}
                            {child.class_id && ` | מחלקה: ${child.class_id}`}
                          </div>
                        </div>
                        <div className="space-x-2 space-x-reverse">
                          <button className="px-3 py-1 bg-green-200 text-green-800 rounded text-sm">
                            צפיה במשימות
                          </button>
                          <button className="px-3 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                            מערכת שעות
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600">אין ילדים רשומים עדיין</div>
                  <button className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    הוסף ילד
                  </button>
                </div>
              )}
            </div>
          </Card>
        </ParentGuard>

        {/* Teacher Dashboard */}
        <TeacherGuard
          fallback={null}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">👨‍🏫 אזור המורה</h2>
            <div className="space-y-4">
              {userWithRelationships?.classes && userWithRelationships.classes.length > 0 ? (
                <>
                  <div className="text-sm font-medium mb-2">הכיתות שלי:</div>
                  {userWithRelationships.classes.map((classItem) => (
                    <div key={classItem.id} className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{classItem.name}</div>
                          <div className="text-sm text-gray-600">
                            {classItem.grade && `רמה: ${classItem.grade}`}
                            {classItem.school_year && ` | שנת לימודים: ${classItem.school_year}`}
                          </div>
                        </div>
                        <div className="space-x-2 space-x-reverse">
                          <button className="px-3 py-1 bg-purple-200 text-purple-800 rounded text-sm">
                            רשימת תלמידים
                          </button>
                          <button className="px-3 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                            משימות כיתה
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600">אין כיתות משויכות עדיין</div>
                  <button className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                    צור כיתה חדשה
                  </button>
                </div>
              )}
            </div>
          </Card>
        </TeacherGuard>

        {/* Admin Dashboard */}
        <AdminGuard
          fallback={null}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">⚙️ אזור המנהל</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">32</div>
                <div className="text-sm text-gray-600">סך התלמידים</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">18</div>
                <div className="text-sm text-gray-600">סך ההורים</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">6</div>
                <div className="text-sm text-gray-600">סך המורים</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600">
                ניהול משתמשים
              </button>
              <button className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600">
                ניהול כיתות
              </button>
              <button className="w-full p-3 bg-purple-500 text-white rounded hover:bg-purple-600">
                הגדרות מערכת
              </button>
            </div>
          </Card>
        </AdminGuard>
      </div>

      {/* Debug Information (only for development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">מידע דיבוג (מצב פיתוח)</h3>
          <div className="text-sm space-y-1">
            <div>תפקיד: {userRole}</div>
            <div>מזהה משתמש: {user.id}</div>
            <div>מספר ילדים: {userWithRelationships?.children?.length || 0}</div>
            <div>מספר כיתות: {userWithRelationships?.classes?.length || 0}</div>
            <div>מספר הורים: {userWithRelationships?.parents?.length || 0}</div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RoleDashboard;