'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Plus, Trash2, Search, UserPlus, UserMinus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Profile {
  id: string
  display_name: string
  email: string
  role: string
  username: string
}

interface ClassStudent {
  id: string
  class_id: string
  student_id: string
  enrolled_at: string
  is_active: boolean
  student_profile?: Profile
}

interface Class {
  id: string
  name: string
  grade: string
  school_year: string
  teacher_id: string | null
  is_active: boolean
  created_at: string
  teacher_profile?: Profile
  class_students?: ClassStudent[]
}

interface TeacherClassRelationship {
  id: string
  teacher_id: string
  class_id: string
  is_primary: boolean
  teacher_profile?: Profile
  class_info?: Class
}

// interface ClassStudent {
//   id: string
//   class_id: string
//   student_id: string
//   enrolled_at: string
//   is_active: boolean
//   student_profile?: Profile
// }

export default function ClassManager() {
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Profile[]>([])
  const [teacherRelationships, setTeacherRelationships] = useState<TeacherClassRelationship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'classes' | 'assignments' | 'students' | 'assign-students'>('classes')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form states
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [newClass, setNewClass] = useState({
    name: '',
    grade: '',
    school_year: '2024-2025'
  })

  const [isAssigning, setIsAssigning] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    teacher_id: '',
    class_id: '',
    is_primary: true
  })

  const [isAssigningStudent, setIsAssigningStudent] = useState(false)
  const [newStudentAssignment, setNewStudentAssignment] = useState({
    student_id: '',
    class_id: ''
  })
  
  const [students, setStudents] = useState<Profile[]>([])

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch classes using the new API
      const classesResponse = await fetch('/api/admin/classes')
      const classesResult = await classesResponse.json()
      
      if (!classesResult.success) throw new Error(classesResult.error)

      // Fetch teachers (get users from user_roles with teacher role, then get their profiles)
      const { data: teacherRoles, error: teacherRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher')

      if (teacherRolesError) throw teacherRolesError

      const teacherUserIds = teacherRoles?.map(r => r.user_id) || []
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherUserIds)
        .order('display_name')

      if (teachersError) throw teachersError

      // Fetch students (get users from user_roles with child role, then get their profiles)
      const { data: studentRoles, error: studentRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'child')

      if (studentRolesError) throw studentRolesError

      const studentUserIds = studentRoles?.map(r => r.user_id) || []
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentUserIds)
        .order('display_name')

      if (studentsError) throw studentsError

      // Fetch teacher-class relationships first
      const { data: relationshipsData, error: relError } = await supabase
        .from('teacher_class_relationships')
        .select('*')

      if (relError) throw relError

      // Enrich relationships with teacher and class data
      let enrichedRelationships: TeacherClassRelationship[] = []
      
      if (relationshipsData && relationshipsData.length > 0) {
        const teacherIds = [...new Set(relationshipsData.map(r => r.teacher_id))]
        const classIds = [...new Set(relationshipsData.map(r => r.class_id))]
        
        // Get teacher profiles
        const { data: teacherProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', teacherIds)
        
        // Get class info
        const { data: classInfo } = await supabase
          .from('classes')
          .select('*')
          .in('id', classIds)
        
        // Combine the data
        enrichedRelationships = relationshipsData.map(rel => ({
          ...rel,
          teacher_profile: teacherProfiles?.find(t => t.id === rel.teacher_id),
          class_info: classInfo?.find(c => c.id === rel.class_id)
        }))
      }

      setClasses(classesResult.classes || [])
      setTeachers(teachersData || [])
      setStudents(studentsData || [])
      setTeacherRelationships(enrichedRelationships || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createClass = useCallback(async () => {
    if (!newClass.name || !newClass.grade) {
      alert('יש למלא שם כיתה ורמה')
      return
    }

    try {
      setIsCreatingClass(true)
      
      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClass.name,
          grade: newClass.grade,
          school_year: newClass.school_year
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      // Reset form
      setNewClass({
        name: '',
        grade: '',
        school_year: '2024-2025'
      })

      // Refresh data
      fetchData()
      alert('כיתה נוצרה בהצלחה!')
    } catch (error: unknown) {
      console.error('Error creating class:', error)
      alert('שגיאה ביצירת הכיתה')
    } finally {
      setIsCreatingClass(false)
    }
  }, [newClass, fetchData])

  const assignTeacherToClass = useCallback(async () => {
    if (!newAssignment.teacher_id || !newAssignment.class_id) {
      alert('יש לבחור מורה וכיתה')
      return
    }

    try {
      setIsAssigning(true)
      
      const { error } = await supabase
        .from('teacher_class_relationships')
        .insert([{
          teacher_id: newAssignment.teacher_id,
          class_id: newAssignment.class_id,
          is_primary: newAssignment.is_primary
        }])

      if (error) throw error

      // Reset form
      setNewAssignment({
        teacher_id: '',
        class_id: '',
        is_primary: true
      })

      // Refresh data
      fetchData()
      alert('מורה שוייך לכיתה בהצלחה!')
    } catch (error: unknown) {
      console.error('Error assigning teacher:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        alert('המורה כבר משויך לכיתה זו')
      } else {
        alert('שגיאה בשיוך המורה')
      }
    } finally {
      setIsAssigning(false)
    }
  }, [newAssignment, fetchData, supabase])

  const toggleClassStatus = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/classes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          is_active: !currentStatus
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      fetchData()
    } catch (error) {
      console.error('Error updating class:', error)
      alert('שגיאה בעדכון הכיתה')
    }
  }, [fetchData])

  const deleteClass = useCallback(async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק כיתה זו?')) return

    try {
      const response = await fetch(`/api/admin/classes?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      fetchData()
      alert('הכיתה נמחקה בהצלחה')
    } catch (error) {
      console.error('Error deleting class:', error)
      alert('שגיאה במחיקת הכיתה')
    }
  }, [fetchData])

  const removeTeacherFromClass = useCallback(async (relationshipId: string) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר שיוך זה?')) return

    try {
      const { error } = await supabase
        .from('teacher_class_relationships')
        .delete()
        .eq('id', relationshipId)

      if (error) throw error
      fetchData()
      alert('המורה הוסר מהכיתה בהצלחה')
    } catch (error) {
      console.error('Error removing teacher:', error)
      alert('שגיאה בהסרת המורה')
    }
  }, [supabase, fetchData])

  const assignStudentToClass = useCallback(async () => {
    if (!newStudentAssignment.student_id || !newStudentAssignment.class_id) {
      alert('יש לבחור תלמיד וכיתה')
      return
    }

    try {
      setIsAssigningStudent(true)
      
      const response = await fetch('/api/admin/class-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: newStudentAssignment.student_id,
          class_id: newStudentAssignment.class_id
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      // Reset form
      setNewStudentAssignment({
        student_id: '',
        class_id: ''
      })

      // Refresh data
      fetchData()
      alert('תלמיד שויך לכיתה בהצלחה!')
    } catch (error: unknown) {
      console.error('Error assigning student:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        alert(`שגיאה בשיוך התלמיד: ${(error as Error).message}`)
      } else {
        alert('שגיאה בשיוך התלמיד')
      }
    } finally {
      setIsAssigningStudent(false)
    }
  }, [newStudentAssignment, fetchData])

  const removeStudentFromClass = useCallback(async (studentId: string, classId: string) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר תלמיד זה מהכיתה?')) return

    try {
      const response = await fetch(`/api/admin/class-students?student_id=${studentId}&class_id=${classId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      fetchData()
      alert('התלמיד הוסר מהכיתה בהצלחה')
    } catch (error) {
      console.error('Error removing student:', error)
      alert('שגיאה בהסרת התלמיד')
    }
  }, [fetchData])

  const filteredClasses = classes.filter(cls => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      cls.name.toLowerCase().includes(searchLower) ||
      cls.grade.toLowerCase().includes(searchLower) ||
      cls.teacher_profile?.display_name.toLowerCase().includes(searchLower)
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
        <GraduationCap className="w-8 h-8 text-green-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ניהול כיתות ומורים</h2>
          <p className="text-gray-600">ניהול כיתות, שיוך מורים וניהול תלמידים</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'classes'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ניהול כיתות
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          שיוכי מורים
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          תלמידים בכיתות
        </button>
        <button
          onClick={() => setActiveTab('assign-students')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'assign-students'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          שיוך תלמידים
        </button>
      </div>

      {activeTab === 'classes' && (
        <>
          {/* Create New Class */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                יצירת כיתה חדשה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">שם הכיתה</label>
                  <Input
                    placeholder="למשל: כיתה א'1"
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">רמה</label>
                  <Input
                    placeholder="למשל: א, ב, ג"
                    value={newClass.grade}
                    onChange={(e) => setNewClass({...newClass, grade: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">שנת לימודים</label>
                  <Input
                    value={newClass.school_year}
                    onChange={(e) => setNewClass({...newClass, school_year: e.target.value})}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={createClass}
                    disabled={isCreatingClass || !newClass.name || !newClass.grade}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isCreatingClass ? 'יוצר...' : 'צור כיתה'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="חיפוש כיתות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="text-sm text-gray-600">
              סה"כ {filteredClasses.length} כיתות
            </div>
          </div>

          {/* Classes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant={cls.is_active ? 'default' : 'secondary'}>
                      {cls.is_active ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>רמה:</strong> {cls.grade}</div>
                    <div><strong>שנת לימודים:</strong> {cls.school_year}</div>
                    <div>
                      <strong>מורה ראשי:</strong> {' '}
                      {cls.teacher_profile?.display_name || 'לא משויך'}
                    </div>
                    <div className="text-xs text-gray-500">
                      נוצר: {new Date(cls.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleClassStatus(cls.id, cls.is_active)}
                    >
                      {cls.is_active ? 'השבת' : 'הפעל'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteClass(cls.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'assignments' && (
        <>
          {/* Assign Teacher to Class */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                שיוך מורה לכיתה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">בחר מורה</label>
                  <select
                    value={newAssignment.teacher_id}
                    onChange={(e) => setNewAssignment({...newAssignment, teacher_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- בחר מורה --</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.display_name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">בחר כיתה</label>
                  <select
                    value={newAssignment.class_id}
                    onChange={(e) => setNewAssignment({...newAssignment, class_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- בחר כיתה --</option>
                    {classes.filter(c => c.is_active).map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (רמה {cls.grade})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">סוג שיוך</label>
                  <select
                    value={newAssignment.is_primary ? 'true' : 'false'}
                    onChange={(e) => setNewAssignment({...newAssignment, is_primary: e.target.value === 'true'})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="true">מורה ראשי</option>
                    <option value="false">מורה נוסף</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={assignTeacherToClass}
                    disabled={isAssigning || !newAssignment.teacher_id || !newAssignment.class_id}
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isAssigning ? 'משייך...' : 'שייך מורה'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Assignments List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">שיוכי מורים קיימים</h3>
            {teacherRelationships.length === 0 ? (
              <Card className="text-center p-8">
                <CardContent>
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">אין שיוכים</h3>
                  <p className="text-gray-400">שייך מורים לכיתות כדי לראות אותם כאן</p>
                </CardContent>
              </Card>
            ) : (
              teacherRelationships.map((rel) => (
                <Card key={rel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-800">
                            {rel.teacher_profile?.display_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rel.teacher_profile?.email}
                          </div>
                          <Badge variant="secondary" className="mt-1">מורה</Badge>
                        </div>
                        
                        <div className="text-2xl text-gray-400">→</div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-800">
                            {rel.class_info?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            רמה {rel.class_info?.grade}
                          </div>
                          <Badge variant={rel.is_primary ? 'default' : 'outline'} className="mt-1">
                            {rel.is_primary ? 'מורה ראשי' : 'מורה נוסף'}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTeacherFromClass(rel.id)}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        הסר שיוך
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'students' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">תלמידים בכיתות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.filter(cls => cls.is_active).map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant="secondary">
                      {cls.class_students?.filter(s => s.is_active).length || 0} תלמידים
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">
                      רמה: {cls.grade}
                    </div>
                    {cls.class_students?.filter(s => s.is_active).length > 0 ? (
                      <div className="space-y-1">
                        {cls.class_students
                          .filter(s => s.is_active)
                          .slice(0, 3)
                          .map((student) => (
                            <div key={student.id} className="flex items-center justify-between text-sm">
                              <span>{student.student_profile?.display_name}</span>
                              <span className="text-gray-500 text-xs">
                                {new Date(student.enrolled_at).toLocaleDateString('he-IL')}
                              </span>
                            </div>
                          ))}
                        {cls.class_students.filter(s => s.is_active).length > 3 && (
                          <div className="text-xs text-gray-500">
                            ועוד {cls.class_students.filter(s => s.is_active).length - 3} תלמידים...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        אין תלמידים רשומים
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'assign-students' && (
        <>
          {/* Assign Student to Class */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                שיוך תלמיד לכיתה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">בחר תלמיד</label>
                  <select
                    value={newStudentAssignment.student_id}
                    onChange={(e) => setNewStudentAssignment({...newStudentAssignment, student_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- בחר תלמיד --</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.display_name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">בחר כיתה</label>
                  <select
                    value={newStudentAssignment.class_id}
                    onChange={(e) => setNewStudentAssignment({...newStudentAssignment, class_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- בחר כיתה --</option>
                    {classes.filter(c => c.is_active).map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (רמה {cls.grade})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={assignStudentToClass}
                    disabled={isAssigningStudent || !newStudentAssignment.student_id || !newStudentAssignment.class_id}
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isAssigningStudent ? 'משייך...' : 'שייך תלמיד'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Student Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">תלמידים רשומים בכיתות</h3>
            {classes.filter(cls => cls.is_active && cls.class_students && cls.class_students.length > 0).map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant="secondary">
                      {cls.class_students?.filter(s => s.is_active).length || 0} תלמידים
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">רמה: {cls.grade}</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cls.class_students?.filter(s => s.is_active).map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium text-gray-800">
                              {student.student_profile?.display_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.student_profile?.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              נרשם: {new Date(student.enrolled_at).toLocaleDateString('he-IL')}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeStudentFromClass(student.student_id, cls.id)}
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          הסר מכיתה
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {!classes.some(cls => cls.is_active && cls.class_students && cls.class_students.length > 0) && (
              <Card className="text-center p-8">
                <CardContent>
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">אין תלמידים רשומים</h3>
                  <p className="text-gray-400">שייך תלמידים לכיתות כדי לראות אותם כאן</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}