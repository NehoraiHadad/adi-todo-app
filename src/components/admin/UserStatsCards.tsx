'use client'

import { Card } from '@/components/ui/card'

interface UserStats {
  children: number
  parents: number
  teachers: number
  admins: number
  total: number
}

interface UserStatsCardsProps {
  stats: UserStats
}

export default function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card className="p-6">
        <h3 className="font-semibold text-gray-600">סך הכל משתמשים</h3>
        <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-gray-600">תלמידים</h3>
        <p className="text-2xl font-bold text-green-600">{stats.children}</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-gray-600">הורים</h3>
        <p className="text-2xl font-bold text-orange-600">{stats.parents}</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-gray-600">מורים</h3>
        <p className="text-2xl font-bold text-purple-600">{stats.teachers}</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-gray-600">מנהלים</h3>
        <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
      </Card>
    </div>
  )
}