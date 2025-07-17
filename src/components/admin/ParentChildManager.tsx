'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Trash2, Search, UserCheck, UserX } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Profile {
  id: string
  display_name: string
  email: string
  role: string
  username: string
}

interface ParentChildRelationship {
  id: string
  parent_id: string
  child_id: string
  relationship_type: string
  is_active: boolean
  created_at: string
  parent_profile?: Profile
  child_profile?: Profile
}

export default function ParentChildManager() {
  const [relationships, setRelationships] = useState<ParentChildRelationship[]>([])
  const [parents, setParents] = useState<Profile[]>([])
  const [children, setChildren] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state for creating new relationship
  const [newRelationship, setNewRelationship] = useState({
    parent_id: '',
    child_id: '',
    relationship_type: 'parent'
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch all relationships first
      const { data: relationshipsData, error: relError } = await supabase
        .from('parent_child_relationships')
        .select('*')
        .order('created_at', { ascending: false })

      if (relError) throw relError

      // Fetch parent and child profiles separately and combine
      let enrichedRelationships: ParentChildRelationship[] = []
      
      if (relationshipsData && relationshipsData.length > 0) {
        const parentIds = [...new Set(relationshipsData.map(r => r.parent_id))]
        const childIds = [...new Set(relationshipsData.map(r => r.child_id))]
        
        // Get parent profiles
        const { data: parentProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', parentIds)
        
        // Get child profiles  
        const { data: childProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', childIds)
        
        // Combine the data
        enrichedRelationships = relationshipsData.map(rel => ({
          ...rel,
          parent_profile: parentProfiles?.find(p => p.id === rel.parent_id),
          child_profile: childProfiles?.find(c => c.id === rel.child_id)
        }))
      }

      // Fetch parents (get users from user_roles with parent role, then get their profiles)
      const { data: parentRoles, error: parentRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'parent')

      if (parentRolesError) throw parentRolesError

      const parentUserIds = parentRoles?.map(r => r.user_id) || []
      const { data: parentsData, error: parentsError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', parentUserIds)
        .order('display_name')

      if (parentsError) throw parentsError

      // Fetch children (get users from user_roles with child role, then get their profiles)
      const { data: childRoles, error: childRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'child')

      if (childRolesError) throw childRolesError

      const childUserIds = childRoles?.map(r => r.user_id) || []
      const { data: childrenData, error: childrenError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', childUserIds)
        .order('display_name')

      if (childrenError) throw childrenError

      setRelationships(enrichedRelationships || [])
      setParents(parentsData || [])
      setChildren(childrenData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createRelationship = useCallback(async () => {
    if (!newRelationship.parent_id || !newRelationship.child_id) {
      alert('יש לבחור הורה וילד')
      return
    }

    try {
      setIsCreating(true)
      
      const { error } = await supabase
        .from('parent_child_relationships')
        .insert([{
          parent_id: newRelationship.parent_id,
          child_id: newRelationship.child_id,
          relationship_type: newRelationship.relationship_type,
          is_active: true
        }])

      if (error) throw error

      // Reset form
      setNewRelationship({
        parent_id: '',
        child_id: '',
        relationship_type: 'parent'
      })

      // Refresh data
      fetchData()
      alert('קשר הורה-ילד נוצר בהצלחה!')
    } catch (error: unknown) {
      console.error('Error creating relationship:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        alert('קשר זה כבר קיים במערכת')
      } else {
        alert('שגיאה ביצירת הקשר')
      }
    } finally {
      setIsCreating(false)
    }
  }, [newRelationship, fetchData, supabase])

  const toggleRelationshipStatus = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('parent_child_relationships')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error updating relationship:', error)
      alert('שגיאה בעדכון הקשר')
    }
  }, [supabase, fetchData])

  const deleteRelationship = useCallback(async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק קשר זה?')) return

    try {
      const { error } = await supabase
        .from('parent_child_relationships')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh data
      fetchData()
      alert('הקשר נמחק בהצלחה')
    } catch (error) {
      console.error('Error deleting relationship:', error)
      alert('שגיאה במחיקת הקשר')
    }
  }, [supabase, fetchData])

  const filteredRelationships = relationships.filter(rel => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      rel.parent_profile?.display_name.toLowerCase().includes(searchLower) ||
      rel.child_profile?.display_name.toLowerCase().includes(searchLower) ||
      rel.parent_profile?.email?.toLowerCase().includes(searchLower) ||
      rel.child_profile?.email?.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">טוען נתונים...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ניהול קשרי הורים-ילדים</h2>
          <p className="text-gray-600">ניהול וצפייה בקשרים בין הורים לילדים במערכת</p>
        </div>
      </div>

      {/* Create New Relationship */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            יצירת קשר חדש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">בחר הורה</label>
              <select
                value={newRelationship.parent_id}
                onChange={(e) => setNewRelationship({...newRelationship, parent_id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">-- בחר הורה --</option>
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.display_name} ({parent.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">בחר ילד</label>
              <select
                value={newRelationship.child_id}
                onChange={(e) => setNewRelationship({...newRelationship, child_id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">-- בחר ילד --</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.display_name} ({child.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">סוג קשר</label>
              <select
                value={newRelationship.relationship_type}
                onChange={(e) => setNewRelationship({...newRelationship, relationship_type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="parent">הורה</option>
                <option value="guardian">אפוטרופוס</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={createRelationship}
                disabled={isCreating || !newRelationship.parent_id || !newRelationship.child_id}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreating ? 'יוצר...' : 'צור קשר'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="חיפוש לפי שם או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        <div className="text-sm text-gray-600">
          סה"כ {filteredRelationships.length} קשרים
        </div>
      </div>

      {/* Relationships List */}
      <div className="space-y-4">
        {filteredRelationships.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                {searchTerm ? 'לא נמצאו תוצאות' : 'אין קשרים רשומים'}
              </h3>
              <p className="text-gray-400">
                {searchTerm ? 'נסה לשנות את מונחי החיפוש' : 'צור קשר ראשון בין הורה לילד'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRelationships.map((relationship) => (
            <Card key={relationship.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-800">
                        {relationship.parent_profile?.display_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {relationship.parent_profile?.email}
                      </div>
                      <Badge variant="secondary" className="mt-1">הורה</Badge>
                    </div>
                    
                    <div className="text-2xl text-gray-400">↔</div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-800">
                        {relationship.child_profile?.display_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {relationship.child_profile?.email}
                      </div>
                      <Badge variant="secondary" className="mt-1">ילד</Badge>
                    </div>
                    
                    <div className="text-center">
                      <Badge variant={relationship.relationship_type === 'parent' ? 'default' : 'outline'}>
                        {relationship.relationship_type === 'parent' ? 'הורה' : 'אפוטרופוס'}
                      </Badge>
                      <div className="mt-1">
                        <Badge variant={relationship.is_active ? 'default' : 'destructive'}>
                          {relationship.is_active ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRelationshipStatus(relationship.id, relationship.is_active)}
                      className={relationship.is_active ? 'text-red-600' : 'text-green-600'}
                    >
                      {relationship.is_active ? (
                        <><UserX className="w-4 h-4 mr-1" /> השבת</>
                      ) : (
                        <><UserCheck className="w-4 h-4 mr-1" /> הפעל</>
                      )}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteRelationship(relationship.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mt-4">
                  נוצר: {new Date(relationship.created_at).toLocaleDateString('he-IL')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}