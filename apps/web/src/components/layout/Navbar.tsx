'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Menu, X, User, LogOut, Settings, Bell, ArrowLeftRight, HelpCircle, MessageCircle, Home, BarChart3 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface NavItem {
  href: string;
  label: string;
  ariaLabel: string;
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout, isLogoutLoading } = useAuth();
  const { viewMode, switchToExpertMode, switchToUserMode } = useViewMode();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 관리자 권한 확인 함수
  const isAdmin = user?.roles?.includes('ADMIN');

  // 디버깅 로그 제거됨 - 무한 루프 방지

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

  // 기존 viewMode 로직은 Context로 이동되었습니다

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const authenticatedNavItems: NavItem[] = [
    {
      href: '/experts',
      label: '전문가 찾기',
      ariaLabel: '전문가 찾기'
    },
    {
      href: '/community',
      label: '커뮤니티',
      ariaLabel: '커뮤니티'
    }
  ];

  const unauthenticatedNavItems: NavItem[] = [
    {
      href: '/experts',
      label: '전문가 찾기',
      ariaLabel: '전문가 찾기'
    },
    {
      href: '/community',
      label: '커뮤니티',
      ariaLabel: '커뮤니티'
    }
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : unauthenticatedNavItems;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Consult On</span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                aria-label={item.ariaLabel}
              >
                {item.label}
              </Link>
            ))}

            {/* 비인증 사용자를 위한 로그인 버튼 */}
            {!isAuthenticated && (
              <Button
                onClick={() => router.push('/auth/login')}
                variant="primary"
                size="sm"
                className="ml-2"
              >
                로그인
              </Button>
            )}

            {/* 인증된 사용자 메뉴 */}
            {isAuthenticated && user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                      <span>{user.name || '사용자'}{isAdmin && ' (관리자)'}</span>
                </button>

                {/* 사용자 드롭다운 메뉴 */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name || '사용자'}{isAdmin && ' (관리자)'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      
                      {/* 대시보드 메뉴 - 현재 모드에 따라 표시 */}
                      {viewMode === "expert" && user?.roles?.includes('EXPERT') ? (
                        <Link
                          href="/dashboard/expert"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <BarChart3 className="w-4 h-4 mr-3" />
                          전문가 대시보드
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <Home className="w-4 h-4 mr-3" />
                          클라이언트 대시보드
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1" />

                      {/* 전문가 계정이면 모드 전환, 일반 사용자면 전문가 지원 */}
                      {user?.roles?.includes('EXPERT') ? (
                        <button
                          onClick={() => {
                            if (viewMode === "expert") {
                              switchToUserMode();
                            } else {
                              switchToExpertMode();
                            }
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <ArrowLeftRight className="w-4 h-4 mr-3" />
                          <span>
                            {viewMode === "expert" ? "클라이언트 모드로 전환" : "전문가 모드로 전환"}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            router.push("/experts/become");
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <ArrowLeftRight className="w-4 h-4 mr-3" />
                          <span>전문가 지원하기</span>
                        </button>
                      )}

                      <Link
                        href={(viewMode === "expert" ? "/dashboard/expert/profile" : "/dashboard/profile") as any}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <User className="w-4 h-4 mr-3" />
                        프로필
                      </Link>
                      
                      
                      <Link
                        href={(viewMode === "expert" ? "/dashboard/expert/settings" : "/dashboard/settings") as any}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        설정
                      </Link>


                      <button
                        onClick={() => {
                          router.push("/community");
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <HelpCircle className="w-4 h-4 mr-3" />
                        <span>도움말 및 지원</span>
                      </button>
                      
                      <div className="border-t border-gray-100 my-1" />
                      
                      <button
                        onClick={handleLogout}
                        disabled={isLogoutLoading}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isLogoutLoading ? '로그아웃 중...' : '로그아웃'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-blue-600 p-2"
              aria-label="메뉴 열기"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  aria-label={item.ariaLabel}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* 비인증 사용자를 위한 로그인 버튼 */}
              {!isAuthenticated && (
                <div className="px-3 py-2">
                  <Button
                    onClick={() => {
                      router.push('/auth/login');
                      setIsMobileMenuOpen(false);
                    }}
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    로그인
                  </Button>
                </div>
              )}

              {/* 모바일에서 인증된 사용자 정보 */}
              {isAuthenticated && user && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name || '사용자'}{isAdmin && ' (관리자)'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {/* 대시보드 메뉴 - 현재 모드에 따라 표시 */}
                    {viewMode === "expert" && user?.roles?.includes('EXPERT') ? (
                      <Link
                        href="/dashboard/expert"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        전문가 대시보드
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Home className="w-4 h-4 inline mr-2" />
                        클라이언트 대시보드
                      </Link>
                    )}

                    <div className="border-t border-gray-200 my-2" />

                    {/* 전문가 계정이면 모드 전환, 일반 사용자면 전문가 지원 */}
                    {user?.roles?.includes('EXPERT') ? (
                      <button
                        onClick={() => {
                          if (viewMode === "expert") {
                            switchToUserMode();
                          } else {
                            switchToExpertMode();
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <ArrowLeftRight className="w-4 h-4 inline mr-2" />
                        {viewMode === "expert" ? "클라이언트 모드로 전환" : "전문가 모드로 전환"}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          router.push("/experts/become");
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <ArrowLeftRight className="w-4 h-4 inline mr-2" />
                        전문가 지원하기
                      </button>
                    )}

                    <Link
                      href={(viewMode === "expert" ? "/dashboard/expert/profile" : "/dashboard/profile") as any}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      프로필
                    </Link>
                    
                    
                    <Link
                      href={(viewMode === "expert" ? "/dashboard/expert/settings" : "/dashboard/settings") as any}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      설정
                    </Link>


                    <button
                      onClick={() => {
                        router.push("/community");
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      <HelpCircle className="w-4 h-4 inline mr-2" />
                      도움말 및 지원
                    </button>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      disabled={isLogoutLoading}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      {isLogoutLoading ? '로그아웃 중...' : '로그아웃'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}