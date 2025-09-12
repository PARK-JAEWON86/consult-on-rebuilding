"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  MessageCircle, 
  Users, 
  FileText, 
  Settings, 
  Bell, 
  Star, 
  CreditCard,
  Calendar,
  Phone,
  Video,
  Key,
  HelpCircle,
  ArrowLeftRight
} from "lucide-react";
import { NavigationItem } from "@/types/layout";

interface NavigationProps {
  userRole?: 'expert' | 'client' | 'admin';
  onNavigate?: (href: string) => void;
}

export default function Navigation({ userRole = 'client', onNavigate }: NavigationProps) {
  const pathname = usePathname();

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: '홈',
      href: '/',
      icon: Home,
    },
    {
      id: 'experts',
      label: '전문가 찾기',
      href: '/experts',
      icon: Users,
    },
    {
      id: 'chat',
      label: 'AI 채팅',
      href: '/chat',
      icon: MessageCircle,
    },
    {
      id: 'reservations',
      label: '예약 관리',
      href: '/reservations',
      icon: Calendar,
    },
    {
      id: 'sessions',
      label: '상담 세션',
      href: '/sessions',
      icon: Video,
    },
    {
      id: 'reviews',
      label: '리뷰',
      href: '/reviews',
      icon: Star,
    },
    {
      id: 'credits',
      label: '크레딧',
      href: '/credits',
      icon: CreditCard,
    },
  ];

  // 전문가용 추가 메뉴
  const expertItems: NavigationItem[] = [
    {
      id: 'expert-dashboard',
      label: '전문가 대시보드',
      href: '/expert/dashboard',
      icon: FileText,
    },
    {
      id: 'expert-schedule',
      label: '일정 관리',
      href: '/expert/schedule',
      icon: Calendar,
    },
    {
      id: 'expert-profile',
      label: '프로필 관리',
      href: '/expert/profile',
      icon: Settings,
    },
  ];

  // 관리자용 추가 메뉴
  const adminItems: NavigationItem[] = [
    {
      id: 'admin-dashboard',
      label: '관리자 대시보드',
      href: '/admin/dashboard',
      icon: Settings,
    },
    {
      id: 'admin-users',
      label: '사용자 관리',
      href: '/admin/users',
      icon: Users,
    },
    {
      id: 'admin-experts',
      label: '전문가 관리',
      href: '/admin/experts',
      icon: Star,
    },
  ];

  const getItemsForRole = () => {
    const baseItems = [...navigationItems];
    
    if (userRole === 'expert') {
      baseItems.push(...expertItems);
    } else if (userRole === 'admin') {
      baseItems.push(...adminItems);
    }
    
    return baseItems;
  };

  const items = getItemsForRole();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleClick = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    }
  };

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => handleClick(item.href)}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
