'use client';

import { useState } from 'react';
import { Subject } from '@/types/schedule';
import useSWR, { mutate } from 'swr';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAdminCheck } from '@/components/schedule';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SubjectForm, SubjectPreview, fetcher, submitSubject, deleteSubjectById } from './components';

/**
 * Main Subjects Management Page
 */
export default function SubjectsManagementPage() {
  const { isAdmin, isLoading: isAdminLoading } = useAdminCheck();
  const { data: subjects, error, isLoading } = useSWR('/api/subjects', fetcher);
  const { toast } = useToast();
  
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Handle admin check
  if (isAdminLoading) {
    return (
      <div className="container-app py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">בודק הרשאות...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-app py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-600 text-xl font-bold">אין לך הרשאה לצפות בדף זה</p>
        <Link href="/schedule" className="mt-4 btn bg-indigo-600 text-white hover:bg-indigo-700">
          חזרה למערכת השעות
        </Link>
      </div>
    );
  }

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="container-app py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">טוען רשימת מקצועות...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-app py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-600">שגיאה בטעינת מקצועות: {error.message}</p>
        <Button onClick={() => mutate('/api/subjects')} className="mt-4">נסה שוב</Button>
      </div>
    );
  }

  // Submit handler for the subject form
  const handleSubmitSubject = async (subject: Subject) => {
    try {
      await submitSubject(subject);
      
      // Refresh the subjects list
      mutate('/api/subjects');
      
      // Reset form state
      setEditingSubject(null);
      setIsCreating(false);
      
      // Show success message
      const isNew = !subject.id || subject.id.length < 5;
      toast({
        title: isNew ? 'מקצוע נוסף בהצלחה' : 'מקצוע עודכן בהצלחה',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה בשמירת המקצוע',
        variant: 'destructive',
      });
    }
  };

  // Delete handler
  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteSubjectById(id);
      
      // Refresh the subjects list
      mutate('/api/subjects');
      
      // Reset confirmation state
      setConfirmDelete(null);
      
      // Show success message
      toast({
        title: 'מקצוע נמחק בהצלחה',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה במחיקת המקצוע',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container-app py-4">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/schedule" className="flex items-center text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>חזרה למערכת השעות</span>
        </Link>
        <h1 className="text-2xl font-bold text-indigo-600 text-right">ניהול מקצועות</h1>
      </div>
      
      {/* Form for editing or creating */}
      {(editingSubject || isCreating) && (
        <div className="mb-8">
          <SubjectForm
            subject={editingSubject || undefined}
            onSubmit={handleSubmitSubject}
            onCancel={() => {
              setEditingSubject(null);
              setIsCreating(false);
            }}
          />
        </div>
      )}
      
      {/* Add new subject button */}
      {!isCreating && !editingSubject && (
        <div className="mb-6 flex justify-center">
          <Button onClick={() => setIsCreating(true)} className="bg-green-600 hover:bg-green-700">
            + הוסף מקצוע חדש
          </Button>
        </div>
      )}
      
      {/* Subjects list */}
      <div className="grid gap-4 lg:grid-cols-2">
        {subjects?.map((subject: Subject) => (
          <div key={subject.id} className="border rounded-lg p-3 bg-white shadow-sm">
            <SubjectPreview subject={subject} />
            
            <div className="flex justify-end mt-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSubject(subject)}
              >
                עריכה
              </Button>
              
              {confirmDelete === subject.id ? (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.id)}
                  >
                    אישור מחיקה
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(null)}
                  >
                    ביטול
                  </Button>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDelete(subject.id)}
                >
                  מחיקה
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {subjects?.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          אין מקצועות להצגה. לחץ על "הוסף מקצוע חדש" כדי להתחיל.
        </div>
      )}
    </div>
  );
} 