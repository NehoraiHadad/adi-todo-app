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
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      
      // Perform simple client-side validation
      if (!email || !password) {
        throw new Error('יש למלא את כל השדות')
      }
      
      if (password.length < 6) {
        throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים')
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('כתובת האימייל אינה תקינה')
      }
      
      // Send registration request
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
        <label htmlFor="email" className="block text-sm font-medium mb-1 text-right">
          אימייל
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2 border rounded-md text-right"
          placeholder="הכניסו כתובת אימייל"
          dir="ltr"
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