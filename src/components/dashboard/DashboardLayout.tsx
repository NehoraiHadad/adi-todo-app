'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface UserInfo {
  id: string
  email: string
  display_name: string
  role: string
}

interface DashboardLayoutProps {
  userInfo: UserInfo
  title: string
  subtitle: string
  description: string
  backgroundGradient: string
  icon: ReactNode
  statusItems: Array<{
    label: string
    color: string
  }>
  children: ReactNode
}

export default function DashboardLayout({
  userInfo: _userInfo,
  title,
  subtitle,
  description,
  backgroundGradient,
  icon,
  statusItems,
  children
}: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen ${backgroundGradient} p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                {icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                <p className="text-blue-600">{subtitle}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-700">
              {description}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                מחובר למערכת
              </span>
              {statusItems.map((item, index) => (
                <span key={index} className="flex items-center gap-1">
                  <div className={`w-2 h-2 ${item.color} rounded-full`}></div>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  color: string
}

export function StatCard({ title, value, subtitle, color }: StatCardProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 p-6 shadow-sm">
      <h3 className="font-semibold mb-2 text-gray-700">{title}</h3>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </Card>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: ReactNode
  color: string
  href: string
}

export function FeatureCard({ title, description, icon, color, href: _href }: FeatureCardProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all p-6 h-full cursor-pointer group shadow-sm">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2 text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Card>
  )
}

interface ActivityItemProps {
  icon: ReactNode
  title: string
  time: string
  iconColor: string
}

export function ActivityItem({ icon, title, time, iconColor }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={`w-8 h-8 ${iconColor} rounded-full flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  )
}