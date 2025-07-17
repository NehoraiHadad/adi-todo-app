'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'

export default function AdminSetupSimple() {
  const [email, setEmail] = useState('adi@school.com')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('adi_admin')
  const [displayName, setDisplayName] = useState('עדי - מנהלת המערכת')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [hasAdminUsers, setHasAdminUsers] = useState<boolean>(false)
  const supabase = createClient()

  // Check if admin users already exist
  useEffect(() => {
    const checkAdminUsers = async () => {
      try {
        const response = await fetch('/api/admin/check-setup')
        const data = await response.json()
        setHasAdminUsers(data.hasAdminUsers)
        
        if (data.hasAdminUsers) {
          setMode('login') // Switch to login mode if admin exists
        }
      } catch (error) {
        console.error('Error checking admin users:', error)
      }
    }

    checkAdminUsers()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent signup if admin users already exist
    if (hasAdminUsers) {
      setMessage('מנהל מערכת כבר קיים. אנא התחבר או פנה למנהל הקיים.')
      return
    }
    
    setIsLoading(true)
    setMessage(null)

    try {
      console.log('Starting signup process...')
      
      // Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username: username
          }
        }
      })

      console.log('Signup result:', { authData, authError })

      if (authError) {
        setMessage(`שגיאה ביצירת החשבון: ${authError.message}`)
        return
      }

      if (authData.user) {
        // Wait a bit for the user to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: username,
            display_name: displayName,
            email: email,
            role: 'admin'
          })

        console.log('Profile creation result:', { profileError })

        // Create admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin'
          })

        console.log('Role creation result:', { roleError })

        setMessage('חשבון נוצר בהצלחה! עכשיו תוכלי להתחבר')
        setMode('login')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setMessage('שגיאה ביצירת החשבון')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      console.log('Starting login process...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('Login result:', { data, error })

      if (error) {
        setMessage(`שגיאה בהתחברות: ${error.message}`)
        return
      }

      if (data.user) {
        // Check if user has admin role
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single()

        console.log('Role check result:', { userRole, roleError })

        if (!userRole || userRole.role !== 'admin') {
          await supabase.auth.signOut()
          setMessage('המשתמש אינו מנהל מערכת')
          return
        }

        setMessage('התחברות הצליחה! מפנה למערכת...')
        
        // Redirect to home page (which will show admin dashboard)
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      }
    } catch (error) {
      console.error('Login error:', error)
      setMessage('שגיאה בהתחברות')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👑</div>
          <h1 className="text-2xl font-bold">מנהלת המערכת</h1>
          <p className="text-gray-600 mt-2">
            {mode === 'signup' && !hasAdminUsers ? 'יצירת חשבון מנהל ראשוני' : 'התחברות מנהל'}
          </p>
        </div>

        <form onSubmit={mode === 'signup' ? handleSignup : handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode === 'signup' && !hasAdminUsers && (
            <>
              <div>
                <Label htmlFor="username">שם משתמש</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="displayName">שם תצוגה</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="לפחות 6 תווים"
            />
          </div>

          {message && (
            <div className={`text-sm text-center p-3 rounded-md ${
              message.includes('שגיאה') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'מעבד...' : (mode === 'signup' && !hasAdminUsers ? 'צור חשבון מנהל ראשוני' : 'התחבר כמנהל')}
          </Button>

          {!hasAdminUsers && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup')
                  setMessage(null)
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                {mode === 'signup' ? 'כבר יש לך חשבון? התחבר' : 'צריך ליצור חשבון? הירשם'}
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-gray-500 hover:underline">
            חזרה לדף התחברות רגיל
          </a>
        </div>
      </Card>
    </div>
  )
}