'use client'

import Link from 'next/link'
import { LucideIcon, UserCheck, FileText, Users, AlertCircle } from 'lucide-react'

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
  color: 'blue' | 'green' | 'yellow' | 'red'
}

interface QuickActionsProps {
  pendingApplications: number
  reportedContent: number
}

export default function QuickActions({
  pendingApplications,
  reportedContent,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: '전문가 지원 검토',
      href: '/admin/applications',
      icon: UserCheck,
      badge: pendingApplications,
      color: 'blue',
    },
    {
      label: '신고된 콘텐츠',
      href: '/admin/content',
      icon: AlertCircle,
      badge: reportedContent,
      color: 'red',
    },
    {
      label: '사용자 관리',
      href: '/admin/users',
      icon: Users,
      color: 'green',
    },
    {
      label: '분석 대시보드',
      href: '/admin/analytics',
      icon: FileText,
      color: 'yellow',
    },
  ]

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
    red: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`
              relative flex items-center gap-3 p-4 rounded-lg border transition-all
              ${colorClasses[action.color]}
            `}
          >
            <action.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{action.label}</span>

            {action.badge !== undefined && action.badge > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {action.badge > 99 ? '99+' : action.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
