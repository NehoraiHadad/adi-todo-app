'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import { cn } from '@/lib/utils';

interface SignOutButtonProps {
  variant?: string;
  className?: string;
}

export default function SignOutButton({ variant, className }: SignOutButtonProps) {
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

  const baseStyles = "text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50";
  const outlineStyles = variant === 'outline' ? 'border border-current rounded-md px-4 py-2' : '';

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={cn(baseStyles, outlineStyles, className)}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  );
} 