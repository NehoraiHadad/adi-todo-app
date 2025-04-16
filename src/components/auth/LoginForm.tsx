'use client'

import { useState } from 'react'
import { signIn } from '@/app/auth/actions'
import Link from 'next/link'

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await signIn(formData)
      if (result?.error) {
        setErrorMessage(result.error)
      }
    } catch (_error) {
      setErrorMessage('אירעה שגיאה לא צפויה')
      console.error('אירעה שגיאה לא צפויה', _error)
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
          placeholder="הקלידו את שם המשתמש שלכם"
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
          autoComplete="current-password"
          required
          className="w-full px-3 py-2 border rounded-md text-right"
          placeholder="הקלידו את הסיסמה שלכם"
          dir="rtl"
        />
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm text-right">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'מתחבר...' : 'התחברות'}
      </button>

      <div className="text-center text-sm mt-4">
        אין לכם חשבון עדיין?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline">
          הירשמו
        </Link>
      </div>
    </form>
  )
} 