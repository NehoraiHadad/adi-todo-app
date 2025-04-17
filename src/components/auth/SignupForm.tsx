'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    
    try {
      // Get form data
      const username = formData.get('username') as string
      const password = formData.get('password') as string
      
      // Perform simple client-side validation
      if (!username || !password) {
        throw new Error('יש למלא את כל השדות')
      }
      
      if (password.length < 6) {
        throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים')
      }
      
      // Create a valid email from username for Supabase using the same method as in signIn
      const generateValidEmail = (username: string): string => {
        // First create a base64 encoding of the original username to preserve uniqueness
        // This ensures even Hebrew or non-Latin usernames get a unique identifier
        const uniqueId = btoa(encodeURIComponent(username.trim()))
          .replace(/[+/=]/g, '')
          .substring(0, 10);
        
        // Clean the username to ensure it works as an email (fallback for display)
        const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
        
        // Ensure minimum length for the display part
        const displayPart = sanitizedUsername.length < 3 
          ? sanitizedUsername + '123' 
          : sanitizedUsername;
        
        // Combine both parts to ensure uniqueness while maintaining readability
        return `${displayPart}-${uniqueId}@gmail.com`;
      };
      
      const email = generateValidEmail(username);
      
      // Send registration request
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'אירעה שגיאה בהרשמה')
      }
      
      // Redirect to login page or dashboard
      window.location.href = '/login'
      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form action={handleSubmit} className="space-y-4 rtl">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1 text-right">
          שם משתמש
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full px-3 py-2 border rounded-md text-right"
          placeholder="בחרו שם משתמש"
          dir="rtl"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1 text-right">
          סיסמה
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="w-full px-3 py-2 border rounded-md text-right"
          placeholder="בחרו סיסמה (לפחות 6 תווים)"
          dir="rtl"
          minLength={6}
        />
      </div>
      
      {error && (
        <div className="text-red-500 text-sm text-right">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'נרשם...' : 'הרשמה'}
      </button>
      
      <div className="text-center text-sm mt-4">
        יש לכם כבר חשבון?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          התחברו
        </Link>
      </div>
    </form>
  )
} 