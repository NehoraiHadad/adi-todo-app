'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ChildLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Use the standard login API endpoint
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'האימייל או הסיסמה שגויים')
        return
      }

      // Success - refresh the page to update auth state
      window.location.href = '/'
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage('אירעה שגיאה בהתחברות')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎒</div>
        <h2 className="text-2xl font-bold">שלום תלמיד/ה!</h2>
        <p className="text-gray-600 mt-2">הכניסו את האימייל והסיסמה שלכם</p>
      </div>

      <div className="space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="אימייל"
          className="text-center text-lg py-6"
          required
          autoFocus
          dir="rtl"
        />
        
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה"
          className="text-center text-lg py-6"
          required
          dir="rtl"
        />
        <p className="text-xs text-gray-500 text-center">
          המורה יגיד לך את הסיסמה שלך
        </p>
      </div>

      {errorMessage && (
        <div className={`text-sm text-center p-3 rounded-md ${
          errorMessage.includes('נשלח') ? 'bg-green-100 text-green-700' : 'text-red-500'
        }`}>
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        className="w-full py-6 text-lg"
        disabled={isLoading || !email.trim() || !password.trim()}
      >
        {isLoading ? 'מתחבר...' : 'כניסה'}
      </Button>

      <div className="text-center text-sm text-gray-500">
        שכחתם את האימייל או הסיסמה? פנו למורה שלכם
      </div>
    </form>
  )
}