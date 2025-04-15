import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfileContent from '@/components/profile/ProfileContent'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  // Get authenticated user - use getUser for security
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Redirect if not authenticated
  if (error || !user) {
    redirect('/login')
  }
  
  // Fetch user profile from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      {/* Pass data to client component */}
      <ProfileContent 
        initialProfile={profile || undefined} 
        userId={user.id} 
      />
    </div>
  )
} 