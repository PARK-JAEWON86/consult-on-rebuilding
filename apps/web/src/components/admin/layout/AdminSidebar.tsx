'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UserCheck,
  Users,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navigation: NavItem[] = [
  { label: '대시보드', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: '전문가 지원', href: '/admin/applications', icon: <UserCheck className="w-5 h-5" /> },
  { label: '사용자 관리', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: '분석', href: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: '컨텐츠', href: '/admin/content', icon: <FileText className="w-5 h-5" /> },
  { label: '설정', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-lg font-bold">Admin</span>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
                          (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
