import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST() {
  try {
    // Create Supabase client
    const supabase = await createClient()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // The cookies are already cleared by the Supabase client, 
    // since we passed the cookies handlers to it when creating the client
    
    // Revalidate the layout
    revalidatePath('/', 'layout')
    
    // Return success - client will handle the redirect
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in signout route:', error)
    return NextResponse.json(
      { error: 'Error signing out' },
      { status: 500 }
    )
  }
} 