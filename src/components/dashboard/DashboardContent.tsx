'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createItem, deleteItem } from '@/app/dashboard/actions'
import ManageLinkRequests from '@/components/student/ManageLinkRequests'; // Import the new component

type Item = {
  id: string
  title: string
  description: string
  created_at: string
}

type Profile = {
  id: string
  display_name: string | null
  email_notifications: boolean
}

type DashboardContentProps = {
  items: Item[]
  profile: Profile | null
  userId: string
}

export default function DashboardContent({ items }: DashboardContentProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle item creation using server action
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      
      const result = await createItem(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        setTitle('')
        setDescription('')
        router.refresh() // Refresh the page to show the new item
      }
    } catch (_error) {
      console.error('אירעה שגיאה לא צפויה', _error)
      setError('An unexpected error occurred' )
    } finally {
      setLoading(false)
    }
  }

  // Handle item deletion using server action
  const handleDeleteItem = async (itemId: string) => {
    setLoading(true)
    
    try {
      const result = await deleteItem(itemId)
      
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh() // Refresh the page to show the updated list
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError('Failed to delete item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div>
            <label htmlFor="title" className="block mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Item'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Items</h2>
        {items.length === 0 ? (
          <p className="text-gray-500">No items yet. Create your first one!</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border p-4 rounded">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 text-sm hover:text-red-700"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 