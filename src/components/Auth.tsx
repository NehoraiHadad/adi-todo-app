import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const AuthComponent: React.FC = () => {
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email.trim()) {
        throw new Error('Email cannot be empty');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('כתובת האימייל אינה תקינה')
      }
      
      if (view === 'sign_up') {
        const { error: signUpError } = await signUp(email, password);
        
        if (signUpError) {
          console.error('Signup error:', signUpError);
          
          // Check for specific error types
          if (signUpError.message && signUpError.message.includes('User already registered')) {
            // User already exists - ask to sign in instead
            throw new Error('משתמש קיים במערכת. נסו להתחבר במקום.');
          } else if (signUpError.message && signUpError.message.includes('rate limit')) {
            throw new Error('נסיונות רישום רבים מדי. נסו שוב מאוחר יותר.');
          } else {
            throw new Error('ההרשמה נכשלה. אנא נסו שוב מאוחר יותר.');
          }
        }
        
        // Redirect to home or confirmation page
        router.push('/');
      } else {
        const { error: signInError } = await signIn(email, password);
        
        if (signInError) {
          console.error('Login error:', signInError);
          throw new Error('אימייל או סיסמה שגויים');
        }
        
        // Redirect to home
        router.push('/');
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto rtl:text-right">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {view === 'sign_in' ? 'התחברות' : 'הרשמה'}
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm">
          {view === 'sign_in'
            ? 'ברוכים הבאים חזרה! אנא התחברו לחשבונכם'
            : 'צרו חשבון חדש להתחלת השימוש באפליקציה'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="block">אימייל</Label>
            <Input
              id="email"
              type="email"
              placeholder="הזינו את כתובת האימייל שלכם"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              className="ltr:text-left w-full"
              autoComplete="email"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="block">סיסמה</Label>
            <Input
              id="password"
              type="password"
              placeholder="הזינו את הסיסמה שלכם"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="rtl:text-right w-full"
              minLength={6}
              autoComplete={view === 'sign_in' ? 'current-password' : 'new-password'}
            />
            <p className="text-xs text-gray-500">
              סיסמה חייבת להכיל לפחות 6 תווים
            </p>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                מעבד...
              </span>
            ) : (
              view === 'sign_in' ? 'התחברות' : 'הרשמה'
            )}
          </Button>
          
          <div className="text-center text-sm">
            {view === 'sign_in' ? (
              <p>
                אין לכם חשבון עדיין?{' '}
                <button
                  type="button"
                  onClick={() => setView('sign_up')}
                  className="text-blue-600 hover:underline"
                >
                  הירשמו כאן
                </button>
              </p>
            ) : (
              <p>
                כבר יש לכם חשבון?{' '}
                <button
                  type="button"
                  onClick={() => setView('sign_in')}
                  className="text-blue-600 hover:underline"
                >
                  התחברו כאן
                </button>
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuthComponent; 