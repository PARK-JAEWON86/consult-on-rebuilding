'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface NavItem {
  href?: string;
  label: string;
  ariaLabel: string;
  isButton?: boolean;
  onClick?: () => void;
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLogoutLoading } = useAuth();
  const router = useRouter();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const authenticatedNavItems: NavItem[] = [
    {
      href: '/experts',
      label: '전문가 찾기',
      ariaLabel: '전문가 찾기'
    },
    {
      href: '/me/reservations',
      label: '내 예약',
      ariaLabel: '내 예약 확인'
    },
    {
      href: '/credits',
      label: '크레딧',
      ariaLabel: '크레딧 충전'
    },
    {
      label: isLogoutLoading ? '로그아웃 중...' : '로그아웃',
      ariaLabel: '로그아웃',
      isButton: true,
      onClick: handleLogout
    }
  ];

  const unauthenticatedNavItems: NavItem[] = [
    {
      href: '/experts',
      label: '전문가 찾기',
      ariaLabel: '전문가 찾기'
    },
    {
      href: '/auth/login',
      label: '로그인',
      ariaLabel: '로그인',
      isButton: true
    }
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : unauthenticatedNavItems;

  return (
    <>
      {/* 데스크톱 네비게이션 */}
      <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="주 메뉴">
        {/* 사용자 정보 (로그인 상태일 때) */}
        {isAuthenticated && user && (
          <div className="text-sm text-gray-600">
            안녕하세요, <span className="font-medium">{user.name || user.email}</span>님
          </div>
        )}
        
        {navItems.map((item, index) => {
          if (item.onClick) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                disabled={isLogoutLoading}
                className={
                  item.isButton
                    ? "bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-900 transition-colors"
                }
                aria-label={item.ariaLabel}
              >
                {item.label}
              </button>
            );
          }
          
          return (
            <Link 
              key={item.href}
              href={item.href! as any}
              className={
                item.isButton
                  ? "bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors"
                  : "text-gray-600 hover:text-gray-900 transition-colors"
              }
              aria-label={item.ariaLabel}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 모바일 메뉴 버튼 */}
      <button 
        className="md:hidden p-2"
        onClick={toggleMobileMenu}
        aria-label="모바일 메뉴 열기"
        aria-expanded={isMobileMenuOpen}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          aria-hidden="true"
        >
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* 모바일 드롭다운 메뉴 */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
          <nav className="flex flex-col py-4" role="navigation" aria-label="모바일 메뉴">
            {/* 모바일 사용자 정보 (로그인 상태일 때) */}
            {isAuthenticated && user && (
              <div className="px-4 py-2 text-sm text-gray-600 border-b">
                안녕하세요, <span className="font-medium">{user.name || user.email}</span>님
              </div>
            )}
            
            {navItems.map((item, index) => {
              if (item.onClick) {
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick!();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLogoutLoading}
                    className={
                      item.isButton
                        ? "mx-4 mb-2 bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        : "px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors text-left"
                    }
                    aria-label={item.ariaLabel}
                  >
                    {item.label}
                  </button>
                );
              }
              
              return (
                <Link 
                  key={item.href}
                  href={item.href! as any}
                  className={
                    item.isButton
                      ? "mx-4 mb-2 bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 transition-colors text-center"
                      : "px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  }
                  aria-label={item.ariaLabel}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
