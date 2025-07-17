'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import SignOutButton from '@/components/SignOutButton';
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Profile {
  id: string;
  display_name: string | null;
  email_notifications: boolean;
  created_at: string;
  email?: string;
  username?: string;
}

type ProfileContentProps = {
  initialProfile?: Profile;
  userId: string;
}

export default function ProfileContent({ initialProfile }: ProfileContentProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(initialProfile?.email || user?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('נא להזין כתובת דוא&quot;ל תקינה');
      return;
    }
    
    try {
      setSavingEmail(true);
      
      // Update email through the API
      const response = await fetch('/api/auth/profile/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.profile) {
        setProfile(result.profile);
        toast.success('כתובת האימייל עודכנה בהצלחה');
        setEditingEmail(false);
      } else {
        toast.error('לא ניתן לעדכן אימייל, פרופיל לא נמצא');
      }
    } catch (error: unknown) {
      console.error('Failed to update email:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בעדכון כתובת הדוא&quot;ל';
      toast.error(errorMessage);
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    toast.success('הסיסמה שונתה בהצלחה!');
  };

  return (
    <>
      <ChangePasswordDialog 
        isOpen={changePasswordOpen} 
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">הפרופיל שלי</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {profile ? (
          <>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">שם משתמש</h3>
              <p className="text-gray-700 border p-2 rounded-md">
                {profile.display_name || profile.username || 'לא הוגדר'}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">כתובת דוא"ל</h3>
              {editingEmail ? (
                <form onSubmit={handleUpdateEmail} className="space-y-2">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="email">כתובת דוא"ל חדשה</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="youremail@example.com"
                      required
                      className="rtl:text-right"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingEmail(false)}
                      disabled={savingEmail}
                    >
                      ביטול
                    </Button>
                    <Button type="submit" disabled={savingEmail}>
                      {savingEmail ? 'שומר...' : 'שמור'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-gray-700 border p-2 rounded-md w-full">
                    {profile?.email || 'לא הוגדר'}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mr-2" 
                    onClick={() => setEditingEmail(true)}
                  >
                    ערוך
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">מזהה משתמש</h3>
              <p className="text-gray-700 border p-2 rounded-md font-mono text-sm">
                {profile.id}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">תאריך הצטרפות</h3>
              <p className="text-gray-700 border p-2 rounded-md">
                {new Date(profile.created_at).toLocaleDateString('he-IL')}
              </p>
            </div>
            
            <div className="pt-4 flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setChangePasswordOpen(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                שינוי סיסמה
              </Button>
              <SignOutButton variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" />
            </div>
          </>
        ) : (
          <div className="text-center text-red-500">
            לא נמצא פרופיל. אנא צור קשר עם התמיכה.
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
} 