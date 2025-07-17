import { useState, useCallback } from 'react'

interface User {
  id: string
  email: string
  display_name: string
  username?: string
  role?: string
  user_role: string
  class_id?: string
  created_at: string
}

interface UserStats {
  children: number
  parents: number
  teachers: number
  admins: number
  total: number
}

export function useAdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({ children: 0, parents: 0, teachers: 0, admins: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showUsers, setShowUsers] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<{password: string, type: string} | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching users:', errorData);
        setMessage(`שגיאה בטעינת משתמשים: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Users fetched successfully:', data);
        setUsers(data.data.users || []);
        setStats(data.data.stats || { children: 0, parents: 0, teachers: 0, admins: 0, total: 0 });
        setMessage(null);
      } else {
        console.error('Failed to fetch users:', data);
        setMessage(`שגיאה: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('שגיאה בחיבור לשרת');
    }
  }, [])

  const handleCreateUser = useCallback(async (userData: {
    email: string;
    display_name: string;
    username: string;
    role: string;
    parent_email: string;
    class_id?: string;
  }) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ משתמש נוצר בהצלחה: ${userData.display_name}`)
        
        if (data.generated_password) {
          setGeneratedPassword({
            password: data.generated_password,
            type: userData.role === 'child' ? 'child_friendly' : 'secure'
          })
        }
        
        fetchUsers()
      } else {
        setMessage(`שגיאה: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setMessage('שגיאה ביצירת המשתמש')
    } finally {
      setIsLoading(false)
    }
  }, [fetchUsers])

  const handleEditUser = useCallback(async (updatedUser: { user_id: string; email: string; display_name: string; username: string; role: string; class_id?: string }) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/edit-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ משתמש עודכן בהצלחה: ${updatedUser.display_name}`)
        setEditingUser(null)
        fetchUsers()
      } else {
        setMessage(`שגיאה: ${data.error}`)
      }
    } catch (error) {
      console.error('Error editing user:', error)
      setMessage('שגיאה בעדכון המשתמש')
    } finally {
      setIsLoading(false)
    }
  }, [fetchUsers])

  const handleDeleteUser = useCallback(async (userId: string, displayName: string) => {
    if (!confirm(`האם ברצונך למחוק את המשתמש ${displayName}?\nפעולה זו לא ניתנת לביטול.`)) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('המשתמש נמחק בהצלחה');
        fetchUsers();
      } else {
        setMessage(`שגיאה במחיקה: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('שגיאה במחיקת המשתמש');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers])

  return {
    users,
    stats,
    isLoading,
    message,
    showUsers,
    generatedPassword,
    editingUser,
    fetchUsers,
    setShowUsers,
    setGeneratedPassword,
    setEditingUser,
    handleCreateUser,
    handleEditUser,
    handleDeleteUser
  }
}