import { useState, useEffect } from 'react';

/**
 * Custom hook for checking if the current user has admin status
 */
export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
} 