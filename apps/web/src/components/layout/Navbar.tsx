'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Menu, X, User, LogOut, Settings, ArrowLeftRight, HelpCircle, Home, BarChart3, Shield, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getUserAvatarUrl, getUserDisplayName, getUserInitial } from '@/lib/user-avatar';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { ExpertNotificationBell } from '@/components/dashboard/ExpertNotificationBell';

interface NavItem {
  href: string;
  label: string;
  ariaLabel: string;
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, isLoading, logout, isLogoutLoading } = useAuth();
  const { viewMode, switchToExpertMode, switchToUserMode } = useViewMode();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 관리자 권한 확인 함수
  const isAdmin = user?.roles?.includes('ADMIN');

  // 전문가 모드 여부 확인
  const isExpertMode = viewMode === 'expert';

  // 디버깅: 인증 상태 변경 감지
  useEffect(() => {
    console.log('[Navbar] Auth state changed:', {
      userEmail: user?.email,
      userName: user?.name,
      isAuthenticated,
      isLoading,
      timestamp: new Date().toISOString()
    });
  }, [user, isAuthenticated, isLoading]);

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
      // 약간의 지연을 두고 이벤트 리스너 등록하여 토글 버튼 클릭과 충돌 방지
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
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

            {/* 로딩 중일 때 스켈레톤 표시 */}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            )}

            {/* 비인증 사용자를 위한 로그인 버튼 */}
            {!isLoading && !isAuthenticated && (
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
            {!isLoading && isAuthenticated && user && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors hover:text-blue-600"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                  {/* 프로필 사진: 전문가 모드일 때만 블루 테두리 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    user.expert && viewMode === 'expert'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-500 shadow-md'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    {getUserAvatarUrl(user) ? (
                      <img
                        src={getUserAvatarUrl(user)}
                        alt={getUserDisplayName(user)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {getUserInitial(user)}
                      </span>
                    )}
                  </div>

                  {/* 이름: 전문가 모드일 때만 블루 컬러 */}
                  <span className={user.expert && viewMode === 'expert' ? 'text-blue-600 font-semibold' : 'text-gray-700'}>
                    {getUserDisplayName(user)}{isAdmin && ' (관리자)'}
                  </span>
                </button>

                {/* 사용자 드롭다운 메뉴 */}
                {showUserMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 ${
                      user.expert && viewMode === 'expert'
                        ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200'
                        : 'bg-white border-gray-200'
                    }`}
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="py-1">
                      {/* 사용자 정보 헤더 */}
                      <div className={`px-4 py-3 border-b ${
                        user.expert && viewMode === 'expert' ? 'border-blue-100 bg-blue-50/50' : 'border-gray-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          {/* 프로필 사진 (큰 사이즈) */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            user.expert && viewMode === 'expert'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-500 shadow-md'
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}>
                            {getUserAvatarUrl(user) ? (
                              <img
                                src={getUserAvatarUrl(user)}
                                alt={getUserDisplayName(user)}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-lg">
                                {getUserInitial(user)}
                              </span>
                            )}
                          </div>

                          {/* 이름과 정보 */}
                          <div className="flex-1">
                            <p className={`text-sm font-semibold flex items-center gap-2 ${
                              user.expert && viewMode === 'expert' ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {getUserDisplayName(user)}
                              {isAdmin && <span className="text-gray-600 font-normal">(관리자)</span>}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            {user.expert && viewMode === 'expert' && (
                              <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                전문가 회원
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 클라이언트 대시보드 - 클라이언트 모드이거나 관리자일 때 표시 */}
                      {(viewMode === 'user' || isAdmin) && (
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

                      {/* 전문가 대시보드 - 전문가 모드이면서 전문가 권한이 있거나 관리자일 때 표시 */}
                      {((viewMode === 'expert' && user?.roles?.includes('EXPERT')) || isAdmin) && (
                        <Link
                          href="/dashboard/expert"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <BarChart3 className="w-4 h-4 mr-3" />
                          전문가 대시보드
                        </Link>
                      )}

                      {/* 관리자 대시보드 메뉴 */}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <Shield className="w-4 h-4 mr-3" />
                          관리자 대시보드
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
                          className="w-full flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium"
                          role="menuitem"
                        >
                          <ArrowLeftRight className="w-4 h-4 mr-3" />
                          <span>
                            {viewMode === "expert" ? "클라이언트 모드로 전환" : "전문가 모드로 전환"}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('전문가 지원하기 버튼 클릭됨');
                            const stage = (user as any)?.expertApplicationStage;
                            if (stage === 'SUBMITTED' || stage === 'DOCUMENT_REVIEW' || stage === 'UNDER_REVIEW' || stage === 'APPROVAL_PENDING') {
                              router.push("/experts/application-status");
                            } else if (stage === 'ADDITIONAL_INFO_REQUESTED') {
                              router.push("/experts/become");
                            } else if (stage === 'APPROVED') {
                              router.push("/dashboard/expert");
                            } else if (stage === 'REJECTED') {
                              router.push("/experts/become?reapply=true");
                            } else {
                              router.push("/experts/become");
                            }
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-100 ${
                            (user as any)?.expertApplicationStage === 'SUBMITTED'
                              ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium'
                              : (user as any)?.expertApplicationStage === 'DOCUMENT_REVIEW'
                              ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-medium'
                              : (user as any)?.expertApplicationStage === 'UNDER_REVIEW'
                              ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 font-medium'
                              : (user as any)?.expertApplicationStage === 'APPROVAL_PENDING'
                              ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-medium'
                              : (user as any)?.expertApplicationStage === 'ADDITIONAL_INFO_REQUESTED'
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium'
                              : (user as any)?.expertApplicationStage === 'APPROVED'
                              ? 'text-green-700 font-medium'
                              : (user as any)?.expertApplicationStage === 'REJECTED'
                              ? 'text-red-700'
                              : 'text-gray-700'
                          }`}
                          role="menuitem"
                        >
                          {/* 아이콘 */}
                          <span className="mr-3">
                            {(() => {
                              const stage = (user as any)?.expertApplicationStage;
                              if (stage === 'SUBMITTED') {
                                return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
                              } else if (stage === 'DOCUMENT_REVIEW') {
                                return <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />;
                              } else if (stage === 'UNDER_REVIEW') {
                                return <Clock className="w-4 h-4 text-purple-600 animate-pulse" />;
                              } else if (stage === 'APPROVAL_PENDING') {
                                return <AlertCircle className="w-4 h-4 text-yellow-600 animate-pulse" />;
                              } else if (stage === 'ADDITIONAL_INFO_REQUESTED') {
                                return <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse" />;
                              } else if (stage === 'APPROVED') {
                                return <CheckCircle2 className="w-4 h-4 text-green-600" />;
                              } else if (stage === 'REJECTED') {
                                return <ArrowLeftRight className="w-4 h-4 text-red-600" />;
                              } else {
                                return <ArrowLeftRight className="w-4 h-4" />;
                              }
                            })()}
                          </span>

                          {/* 라벨 */}
                          <span className="flex-1 text-left">
                            {(() => {
                              const stage = (user as any)?.expertApplicationStage;
                              if (stage === 'SUBMITTED') return '접수 완료';
                              if (stage === 'DOCUMENT_REVIEW') return '서류 검토';
                              if (stage === 'UNDER_REVIEW') return '심사 진행';
                              if (stage === 'APPROVAL_PENDING') return '최종 승인 대기';
                              if (stage === 'ADDITIONAL_INFO_REQUESTED') return '추가 정보 요청됨';
                              if (stage === 'APPROVED') return '전문가 대시보드';
                              if (stage === 'REJECTED') return '전문가 재지원';
                              return '전문가 지원하기';
                            })()}
                          </span>

                          {/* 상태 뱃지 */}
                          {(user as any)?.expertApplicationStage === 'SUBMITTED' && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                              접수됨
                            </span>
                          )}
                          {(user as any)?.expertApplicationStage === 'DOCUMENT_REVIEW' && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-200 text-indigo-800">
                              검토중
                            </span>
                          )}
                          {(user as any)?.expertApplicationStage === 'UNDER_REVIEW' && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-200 text-purple-800">
                              심사중
                            </span>
                          )}
                          {(user as any)?.expertApplicationStage === 'APPROVAL_PENDING' && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                              승인대기
                            </span>
                          )}
                          {(user as any)?.expertApplicationStage === 'ADDITIONAL_INFO_REQUESTED' && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                              수정필요
                            </span>
                          )}
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

                {/* 알림 벨 - 프로필 메뉴 오른쪽 (역할별 다른 컴포넌트) */}
                {isExpertMode ? <ExpertNotificationBell /> : <NotificationBell />}
              </>
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

              {/* 로딩 중 스켈레톤 */}
              {isLoading && (
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 비인증 사용자를 위한 로그인 버튼 */}
              {!isLoading && !isAuthenticated && (
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
              {!isLoading && isAuthenticated && user && (
                <div className={`border-t pt-4 mt-4 ${
                  user.expert && viewMode === 'expert' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                }`}>
                  <div className="flex items-center px-3 py-2">
                    {/* 프로필 사진 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      user.expert && viewMode === 'expert'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-500 shadow-md'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {getUserAvatarUrl(user) ? (
                        <img
                          src={getUserAvatarUrl(user)}
                          alt={getUserDisplayName(user)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {getUserInitial(user)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold flex items-center gap-2 ${
                        user.expert && viewMode === 'expert' ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {getUserDisplayName(user)}
                        {isAdmin && <span className="text-gray-600 font-normal">(관리자)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.expert && viewMode === 'expert' && (
                        <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          전문가 회원
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {/* 클라이언트 대시보드 - 클라이언트 모드이거나 관리자일 때 표시 */}
                    {(viewMode === 'user' || isAdmin) && (
                      <Link
                        href="/dashboard"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Home className="w-4 h-4 inline mr-2" />
                        클라이언트 대시보드
                      </Link>
                    )}

                    {/* 전문가 대시보드 - 전문가 모드이면서 전문가 권한이 있거나 관리자일 때 표시 */}
                    {((viewMode === 'expert' && user?.roles?.includes('EXPERT')) || isAdmin) && (
                      <Link
                        href="/dashboard/expert"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        전문가 대시보드
                      </Link>
                    )}

                    {/* 관리자 대시보드 메뉴 */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4 inline mr-2" />
                        관리자 대시보드
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
                        className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium rounded-md"
                      >
                        <ArrowLeftRight className="w-4 h-4 inline mr-2" />
                        {viewMode === "expert" ? "클라이언트 모드로 전환" : "전문가 모드로 전환"}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const stage = (user as any)?.expertApplicationStage;
                          if (stage === 'SUBMITTED' || stage === 'DOCUMENT_REVIEW' || stage === 'UNDER_REVIEW' || stage === 'APPROVAL_PENDING') {
                            router.push("/experts/application-status");
                          } else if (stage === 'ADDITIONAL_INFO_REQUESTED') {
                            router.push("/experts/become");
                          } else if (stage === 'APPROVED') {
                            router.push("/dashboard/expert");
                          } else if (stage === 'REJECTED') {
                            router.push("/experts/become?reapply=true");
                          } else {
                            router.push("/experts/become");
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md ${
                          (user as any)?.expertApplicationStage === 'SUBMITTED'
                            ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium'
                            : (user as any)?.expertApplicationStage === 'DOCUMENT_REVIEW'
                            ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-medium'
                            : (user as any)?.expertApplicationStage === 'UNDER_REVIEW'
                            ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 font-medium'
                            : (user as any)?.expertApplicationStage === 'APPROVAL_PENDING'
                            ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-medium'
                            : (user as any)?.expertApplicationStage === 'ADDITIONAL_INFO_REQUESTED'
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium'
                            : (user as any)?.expertApplicationStage === 'APPROVED'
                            ? 'text-green-700 font-medium hover:bg-gray-50'
                            : (user as any)?.expertApplicationStage === 'REJECTED'
                            ? 'text-red-700 hover:bg-gray-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {(() => {
                          const stage = (user as any)?.expertApplicationStage;
                          if (stage === 'SUBMITTED') {
                            return <Clock className="w-4 h-4 inline mr-2 text-blue-600 animate-pulse" />;
                          } else if (stage === 'DOCUMENT_REVIEW') {
                            return <Clock className="w-4 h-4 inline mr-2 text-indigo-600 animate-pulse" />;
                          } else if (stage === 'UNDER_REVIEW') {
                            return <Clock className="w-4 h-4 inline mr-2 text-purple-600 animate-pulse" />;
                          } else if (stage === 'APPROVAL_PENDING') {
                            return <AlertCircle className="w-4 h-4 inline mr-2 text-yellow-600 animate-pulse" />;
                          } else if (stage === 'ADDITIONAL_INFO_REQUESTED') {
                            return <AlertCircle className="w-4 h-4 inline mr-2 text-amber-600 animate-pulse" />;
                          } else if (stage === 'APPROVED') {
                            return <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-600" />;
                          } else if (stage === 'REJECTED') {
                            return <ArrowLeftRight className="w-4 h-4 inline mr-2 text-red-600" />;
                          } else {
                            return <ArrowLeftRight className="w-4 h-4 inline mr-2" />;
                          }
                        })()}
                        {(() => {
                          const stage = (user as any)?.expertApplicationStage;
                          if (stage === 'SUBMITTED') return '접수 완료';
                          if (stage === 'DOCUMENT_REVIEW') return '서류 검토';
                          if (stage === 'UNDER_REVIEW') return '심사 진행';
                          if (stage === 'APPROVAL_PENDING') return '최종 승인 대기';
                          if (stage === 'ADDITIONAL_INFO_REQUESTED') return '추가 정보 요청됨';
                          if (stage === 'APPROVED') return '전문가 대시보드';
                          if (stage === 'REJECTED') return '전문가 재지원';
                          return '전문가 지원하기';
                        })()}
                        {(user as any)?.expertApplicationStage === 'SUBMITTED' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                            접수됨
                          </span>
                        )}
                        {(user as any)?.expertApplicationStage === 'DOCUMENT_REVIEW' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-200 text-indigo-800">
                            검토중
                          </span>
                        )}
                        {(user as any)?.expertApplicationStage === 'UNDER_REVIEW' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-200 text-purple-800">
                            심사중
                          </span>
                        )}
                        {(user as any)?.expertApplicationStage === 'APPROVAL_PENDING' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                            승인대기
                          </span>
                        )}
                        {(user as any)?.expertApplicationStage === 'ADDITIONAL_INFO_REQUESTED' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                            수정필요
                          </span>
                        )}
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