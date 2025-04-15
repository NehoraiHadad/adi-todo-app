import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SignupForm from '@/components/auth/SignupForm'

export default async function SignupPage() {
  const supabase = await createClient()
  
  // Check if user is already logged in
  const { data, error } = await supabase.auth.getUser()
  
  // If logged in, redirect to dashboard
  if (data.user && !error) {
    redirect('/dashboard')
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-center">הרשמה</h1>
          <SignupForm />
        </div>
      </div>
    </div>
  )
} 