'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { UserRole } from '@/types'

interface AdultLoginFormProps {
  role: UserRole
}

export default function AdultLoginForm({ role }: AdultLoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const roleInfo = {
    [UserRole.PARENT]: {
      title: 'התחברות להורים',
      icon: '👨‍👩‍👧‍👦',
      description: 'הכניסו את פרטי ההתחברות שלכם'
    },
    [UserRole.TEACHER]: {
      title: 'התחברות למורים',
      icon: '👨‍🏫',
      description: 'הכניסו את פרטי ההתחברות שלכם'
    },
    [UserRole.ADMIN]: {
      title: 'התחברות מנהל מערכת',
      icon: '👑',
      description: 'הכניסו את פרטי ההתחברות שלכם'
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setErrorMessage('אימייל או סיסמה שגויים')
        return
      }

      // Verify user role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      if (!userRole || userRole.role !== role) {
        await supabase.auth.signOut()
        let roleText = 'משתמש'
        if (role === UserRole.PARENT) roleText = 'הורה'
        else if (role === UserRole.TEACHER) roleText = 'מורה'
        else if (role === UserRole.ADMIN) roleText = 'מנהל מערכת'
        
        setErrorMessage('המשתמש אינו רשום כ' + roleText)
        return
      }

      // Redirect to dashboard
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage('אירעה שגיאה בהתחברות')
    } finally {
      setIsLoading(false)
    }
  }

  const info = roleInfo[role as keyof typeof roleInfo]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{info.icon}</div>
        <h2 className="text-2xl font-bold">{info.title}</h2>
        <p className="text-gray-600 mt-2">{info.description}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-right block mb-2">
            אימייל
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            dir="ltr"
            className="text-left"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-right block mb-2">
            סיסמה
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            dir="ltr"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm text-center">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !email || !password}
      >
        {isLoading ? 'מתחבר...' : 'התחברות'}
      </Button>

      <div className="text-center text-sm text-gray-500">
        <a href="#" className="hover:underline">שכחתם סיסמה?</a>
      </div>
    </form>
  )
}