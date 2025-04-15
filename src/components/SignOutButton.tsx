'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/auth/actions';

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    
    try {
      const result = await signOut();
      
      if (!result?.error) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  );
} 